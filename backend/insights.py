"""Signals, renewals, expansion and revenue analytics built on the scored data."""
import json
import math
from datetime import date, timedelta

import numpy as np
import pandas as pd

from . import db
from .playbooks import REASONS

PLAN_PRICE = {"Starter": 15, "Growth": 29, "Business": 45, "Enterprise": 55}
NEXT_PLAN = {"Starter": "Growth", "Growth": "Business", "Business": "Enterprise"}
SIGNAL_TYPES = {
    "payment": {"label": "Payment failed", "reason": "PAYMENT_ISSUE"},
    "renewal": {"label": "Renewal at risk", "reason": "RENEWAL_RISK"},
    "risk_jump": {"label": "Risk jumped", "reason": None},
    "usage_drop": {"label": "Usage drop", "reason": "USAGE_DECLINE"},
    "champion": {"label": "Champion quiet", "reason": "CHAMPION_LOST"},
    "support": {"label": "Support escalation", "reason": "SUPPORT_FRICTION"},
    "nps": {"label": "Detractor NPS", "reason": "LOW_SATISFACTION"},
    "expansion": {"label": "Expansion signal", "reason": "EXPANSION"},
}
SEV_RANK = {"critical": 0, "warning": 1, "info": 2}


def _data_date(conn):
    return date.fromisoformat(db.get_meta(conn, "today", date.today().isoformat()))


def _fmt_money(v):
    v = float(v or 0)
    if v >= 1e6:
        return f"${v / 1e6:.2f}M"
    if v >= 1e4:
        return f"${v / 1e3:.0f}k"
    if v >= 1e3:
        return f"${v / 1e3:.1f}k"
    return f"${v:,.0f}"


def _active_accounts(conn):
    df = pd.read_sql_query("""
        SELECT a.id, a.name, a.segment, a.plan, a.mrr, a.seats, a.billing_cycle, a.renewal_date, a.owner_id,
               a.champion_name, a.is_control, t.name owner_name, t.color owner_color,
               s.churn_prob, s.prev_prob, s.risk_tier, s.top_reason, s.revenue_at_risk, s.features_json,
               (SELECT id FROM cards WHERE account_id=a.id AND status!='Done' LIMIT 1) open_card_id,
               (SELECT status FROM cards WHERE account_id=a.id AND status!='Done' LIMIT 1) open_card_status,
               (SELECT reason_code FROM cards WHERE account_id=a.id AND status!='Done' LIMIT 1) open_card_reason
        FROM accounts a LEFT JOIN scores s ON s.account_id=a.id LEFT JOIN team t ON t.id=a.owner_id
        WHERE a.status='active'""", conn)
    return df.set_index("id")


def _acc_payload(r):
    return {"id": int(r.name), "name": r["name"], "segment": r["segment"], "arr": float(r["mrr"] or 0) * 12,
            "risk": None if pd.isna(r["churn_prob"]) else float(r["churn_prob"]), "tier": r["risk_tier"],
            "owner_name": r["owner_name"], "owner_color": r["owner_color"],
            "open_card_id": None if pd.isna(r["open_card_id"]) else int(r["open_card_id"]),
            "open_card_status": r["open_card_status"] if isinstance(r["open_card_status"], str) else None,
            "is_control": int(r["is_control"] or 0)}


# ------------------------------------------------------------------ signals
def signals(conn, include_reviewed=False):
    today = _data_date(conn)
    acc = _active_accounts(conn)
    if acc.empty:
        return {"items": [], "counts": {}, "movers_up": [], "movers_down": [], "types": SIGNAL_TYPES}
    ids = tuple(int(i) for i in acc.index)
    reviewed = {r[0] for r in conn.execute("SELECT signal_key FROM signal_reviews")}
    items = []

    def add(aid, kind, severity, title, detail, when):
        key = f"{kind}:{aid}:{when}"
        if key in reviewed and not include_reviewed:
            return
        r = acc.loc[aid]
        items.append({"key": key, "type": kind, "type_label": SIGNAL_TYPES[kind]["label"], "severity": severity,
                      "title": title, "detail": detail, "date": when, "reviewed": key in reviewed,
                      "reason_code": SIGNAL_TYPES[kind]["reason"] or (r["top_reason"] if isinstance(r["top_reason"], str) else "USAGE_DECLINE"),
                      "account": _acc_payload(r)})

    # failed payments not yet recovered
    pays = pd.read_sql_query(f"SELECT account_id, date, amount, status FROM payments WHERE account_id IN {ids} "
                             "AND date >= ?", conn, params=((today - timedelta(days=60)).isoformat(),))
    for aid, g in pays.groupby("account_id"):
        fails = g[g["status"] == "failed"]
        if fails.empty:
            continue
        last_fail = fails.sort_values("date").iloc[-1]
        recovered = g[(g["status"] == "recovered") & (g["date"] >= last_fail["date"])]
        if recovered.empty:
            add(aid, "payment", "critical", "Payment failed and not recovered",
                f"A {_fmt_money(last_fail['amount'])} payment failed on {last_fail['date']}. Involuntary churn risk until it is fixed.",
                last_fail["date"])

    # usage + champion signals from the last 8 weeks
    use = pd.read_sql_query(f"SELECT account_id, week_start, active_users, seats, champion_active FROM usage_weekly "
                            f"WHERE account_id IN {ids} AND week_start >= ? ORDER BY week_start", conn,
                            params=((today - timedelta(weeks=9)).isoformat(),))
    for aid, g in use.groupby("account_id"):
        g = g.sort_values("week_start")
        if len(g) >= 6:
            recent, prior = g["active_users"].iloc[-2:].mean(), g["active_users"].iloc[-8:-2].mean()
            if prior >= 3 and recent <= prior * 0.7:
                drop = 1 - recent / prior
                add(aid, "usage_drop", "critical" if drop >= 0.5 else "warning", "Weekly active users dropped sharply",
                    f"Active users down {drop * 100:.0f}% (from about {prior:.0f} to {recent:.0f} per week) over the last two weeks.",
                    g["week_start"].iloc[-2])
        champ = g["champion_active"].tolist()
        n = 0
        for v in reversed(champ):
            if v == 0:
                n += 1
            else:
                break
        if 1 <= n <= 6 and n < len(champ):
            add(aid, "champion", "warning", "Main champion has gone quiet",
                f"{acc.at[aid, 'champion_name']} has not been active for {n} week{'s' if n > 1 else ''}.",
                g["week_start"].iloc[-n])
        last = g.iloc[-1]
        if last["seats"] > 0 and last["active_users"] / last["seats"] >= 0.95 and acc.at[aid, "risk_tier"] != "High":
            add(aid, "expansion", "info", "Seats are almost full",
                f"{int(last['active_users'])} of {int(last['seats'])} paid seats active last week. A good moment to talk about growth.",
                last["week_start"])

    # support escalations (last 14 days)
    tix = pd.read_sql_query(f"SELECT account_id, created_at, severity, sentiment, subject FROM tickets WHERE account_id IN {ids} "
                            "AND created_at >= ?", conn, params=((today - timedelta(days=14)).isoformat(),))
    for aid, g in tix.groupby("account_id"):
        high = g[g["severity"] == "High"]
        if len(high) >= 1 and (len(high) >= 2 or (g["sentiment"] == "Negative").any()):
            top = high.sort_values("created_at").iloc[-1]
            add(aid, "support", "warning", "Support escalation",
                f"{len(high)} high-severity ticket{'s' if len(high) > 1 else ''} in 14 days, latest: \"{top['subject']}\".",
                top["created_at"])

    # detractor NPS (last 30 days)
    nps = pd.read_sql_query(f"SELECT account_id, date, score FROM nps WHERE account_id IN {ids} AND date >= ? AND score <= 6",
                            conn, params=((today - timedelta(days=30)).isoformat(),))
    for _, r in nps.iterrows():
        add(int(r["account_id"]), "nps", "warning", "Detractor NPS response",
            f"Scored {int(r['score'])}/10 on {r['date']}. Unhappy customers churn far more often.", r["date"])

    # renewals at risk + risk jumps
    for aid, r in acc.iterrows():
        p = r["churn_prob"]
        if pd.isna(p):
            continue
        if r["billing_cycle"] == "Annual" and isinstance(r["renewal_date"], str):
            days = (date.fromisoformat(r["renewal_date"]) - today).days
            if 0 <= days <= 45 and r["risk_tier"] in ("High", "Medium"):
                add(aid, "renewal", "critical" if r["risk_tier"] == "High" else "warning", "Renewal coming up with risk",
                    f"Renews on {r['renewal_date']} ({days} days) with {_fmt_money(r['mrr'] * 12)} ARR and {p * 100:.0f}% churn risk.",
                    r["renewal_date"])
        pp = r["prev_prob"]
        if not pd.isna(pp) and p - pp >= 0.07 and p >= 0.08:
            add(aid, "risk_jump", "critical" if p >= 0.2 else "warning", "Churn risk jumped",
                f"Risk rose from {pp * 100:.0f}% to {p * 100:.0f}% in 30 days. Top reason: {REASONS.get(r['top_reason'], 'n/a')}.",
                today.isoformat())

    items.sort(key=lambda s: (SEV_RANK[s["severity"]], -s["account"]["arr"]))
    counts = {k: 0 for k in SIGNAL_TYPES}
    sev = {"critical": 0, "warning": 0, "info": 0}
    for s in items:
        counts[s["type"]] += 1
        sev[s["severity"]] += 1

    movers = acc.dropna(subset=["churn_prob", "prev_prob"]).copy()
    movers["delta"] = movers["churn_prob"] - movers["prev_prob"]
    def mv(df):
        return [{**_acc_payload(r), "prev": float(r["prev_prob"]), "delta": float(r["delta"]),
                 "reason_label": REASONS.get(r["top_reason"], "")} for _, r in df.iterrows()]
    return {"items": items, "counts": counts, "severity": sev, "types": SIGNAL_TYPES, "reviewed_count": len(reviewed),
            "movers_up": mv(movers.sort_values("delta", ascending=False).head(8)),
            "movers_down": mv(movers.sort_values("delta").head(8))}


# ------------------------------------------------------------------ renewals
def renewals(conn, days=120, owner_id=None):
    today = _data_date(conn)
    acc = _active_accounts(conn)
    acc = acc[(acc["billing_cycle"] == "Annual") & acc["renewal_date"].notna()].copy()
    acc["days"] = acc["renewal_date"].map(lambda d: (date.fromisoformat(d) - today).days)
    acc = acc[(acc["days"] >= 0) & (acc["days"] <= days)]
    if owner_id:
        acc = acc[acc["owner_id"] == owner_id]
    acc["arr"] = acc["mrr"] * 12
    acc["risk"] = acc["churn_prob"].fillna(0)
    acc["at_risk"] = acc["arr"] * acc["risk"]
    rows = []
    for aid, r in acc.sort_values("days").iterrows():
        rows.append({**_acc_payload(r), "renewal_date": r["renewal_date"], "days": int(r["days"]),
                     "at_risk": float(r["at_risk"]), "reason_code": r["top_reason"],
                     "reason_label": REASONS.get(r["top_reason"], ""), "plan": r["plan"], "seats": int(r["seats"])})
    buckets = []
    for lo, hi, label in [(0, 30, "Next 30 days"), (31, 60, "31-60 days"), (61, 90, "61-90 days"), (91, 120, "91-120 days")]:
        if lo > days:
            break
        b = acc[(acc["days"] >= lo) & (acc["days"] <= hi)]
        buckets.append({"label": label, "count": int(len(b)), "arr": float(b["arr"].sum()),
                        "at_risk": float(b["at_risk"].sum()), "expected": float((b["arr"] - b["at_risk"]).sum())})
    risky = acc[acc["risk_tier"].isin(["High", "Medium"])]
    return {
        "days": days, "rows": rows, "buckets": buckets,
        "summary": {"count": int(len(acc)), "arr": float(acc["arr"].sum()), "at_risk": float(acc["at_risk"].sum()),
                    "expected": float((acc["arr"] - acc["at_risk"]).sum()),
                    "risky_count": int(len(risky)),
                    "no_plan": int((risky["open_card_id"].isna() & (risky["is_control"] == 0)).sum()),
                    "no_plan_arr": float(risky[risky["open_card_id"].isna() & (risky["is_control"] == 0)]["arr"].sum())},
    }


# ------------------------------------------------------------------ expansion
def expansion(conn):
    acc = _active_accounts(conn)
    acc = acc[acc["features_json"].notna()]
    out = []
    for aid, r in acc.iterrows():
        f = json.loads(r["features_json"])
        util = f.get("seat_utilization") or 0
        trend = f.get("active_users_trend") or 0
        nps_v = f.get("last_nps") if f.get("last_nps") is not None else 7
        feats = f.get("features_used") or 0
        if r["risk_tier"] == "High":
            continue
        plan_up = feats >= 7.5 and r["plan"] in NEXT_PLAN
        if util < 0.8 and not plan_up:
            continue
        score = (45 * min(util, 1.0) + 20 * min(max((trend + 0.2) / 0.4, 0), 1) + 15 * (nps_v / 10) + 20 * min(feats / 10, 1))
        seats = int(r["seats"] or 1)
        price = (r["mrr"] or 0) / max(seats, 1)
        if util >= 0.85 or not plan_up:
            wanted = max(math.ceil(seats * 0.10), math.ceil((f.get("active_users_4w") or seats) * 1.15 - seats))
            add_seats = max(1, min(wanted, math.ceil(seats * 0.25)))
            play, potential = "Seat expansion", add_seats * price * 12
            why = f"{util * 100:.0f}% of {seats} seats in use, users {'+' if trend >= 0 else ''}{trend * 100:.0f}% vs last 2 months"
            detail = f"Suggest about {add_seats} more seats"
        else:
            nxt = NEXT_PLAN[r["plan"]]
            potential = (r["mrr"] or 0) * (PLAN_PRICE[nxt] / PLAN_PRICE[r["plan"]] - 1) * 12
            play, why = "Plan upgrade", f"Uses {feats:.1f}/10 core features, a power user of the {r['plan']} plan"
            detail = f"Upgrade from {r['plan']} to {nxt}"
        out.append({**_acc_payload(r), "score": round(score), "play": play, "potential": float(potential), "why": why,
                    "detail": detail, "util": float(util), "trend": float(trend), "nps": float(nps_v), "features": float(feats),
                    "plan": r["plan"], "seats": seats,
                    "open_card_reason": r["open_card_reason"] if isinstance(r["open_card_reason"], str) else None})
    out.sort(key=lambda o: -(o["potential"] * o["score"] / 100))
    won = db.row(conn, "SELECT COUNT(*) n, COALESCE(SUM(rar_at_creation),0) arr FROM cards WHERE reason_code='EXPANSION' AND outcome='Expanded'")
    open_exp = db.row(conn, "SELECT COUNT(*) n, COALESCE(SUM(rar_at_creation),0) arr FROM cards WHERE reason_code='EXPANSION' AND status!='Done'")
    return {"items": out[:60], "summary": {
        "count": len(out), "pipeline": float(sum(o["potential"] for o in out)),
        "weighted": float(sum(o["potential"] * o["score"] / 100 for o in out)),
        "avg_util": float(np.mean([o["util"] for o in out])) if out else 0,
        "seat_plays": sum(1 for o in out if o["play"] == "Seat expansion"),
        "plan_plays": sum(1 for o in out if o["play"] == "Plan upgrade"),
        "won_count": won["n"], "won_arr": won["arr"], "open_count": open_exp["n"], "open_arr": open_exp["arr"]}}


# ------------------------------------------------------------------ revenue analytics
def revenue(conn):
    today = _data_date(conn)
    usage = pd.read_sql_query("SELECT account_id, week_start, mrr FROM usage_weekly", conn, parse_dates=["week_start"])
    acc = pd.read_sql_query("SELECT id, segment, plan, region, industry, signup_date, churn_date, churn_type, mrr, status FROM accounts", conn)
    usage["month"] = usage["week_start"].dt.to_period("M")
    end_month = pd.Period(today, "M") - 1  # last complete month
    months = pd.period_range(end=end_month, periods=13, freq="M")
    snap = (usage.sort_values("week_start").groupby(["account_id", "month"])["mrr"].last().unstack())
    snap = snap.reindex(columns=months)

    movement = []
    for i in range(1, len(months)):
        prev, cur = snap[months[i - 1]], snap[months[i]]
        new = cur[prev.isna() & cur.notna()].sum()
        churn = prev[prev.notna() & cur.isna()].sum()
        both = prev.notna() & cur.notna()
        diff = (cur - prev)[both]
        movement.append({"month": months[i].strftime("%b '%y"), "new": float(new) * 12, "expansion": float(diff[diff > 0].sum()) * 12,
                         "contraction": float(-diff[diff < 0].sum()) * 12, "churn": float(churn) * 12,
                         "ending_arr": float(cur.sum()) * 12})
    for m in movement:
        m["net"] = m["new"] + m["expansion"] - m["contraction"] - m["churn"]

    start, end = snap[months[0]], snap[months[-1]]
    base = start[start.notna()]
    end_b = end.reindex(base.index).fillna(0)
    nrr = float(end_b.sum() / base.sum()) if base.sum() else 0
    grr = float(np.minimum(end_b, base).sum() / base.sum()) if base.sum() else 0

    # logo retention cohorts by signup month
    acc["signup"] = pd.to_datetime(acc["signup_date"])
    acc["churn"] = pd.to_datetime(acc["churn_date"])
    first_week = usage["week_start"].min()
    cohorts = []
    cur_p = pd.Period(today, "M")
    for cm in pd.period_range(end=end_month, periods=12, freq="M"):
        members = acc[(acc["signup"].dt.to_period("M") == cm) & (acc["signup"] >= first_week)]
        if members.empty:
            continue
        row = {"cohort": cm.strftime("%b '%y"), "size": int(len(members)), "values": []}
        for k in range(0, 12):
            check = (cm + k)
            if check >= cur_p:
                break
            cutoff = check.end_time
            alive = members[members["churn"].isna() | (members["churn"] > cutoff)]
            row["values"].append(round(len(alive) / len(members), 4))
        cohorts.append(row)

    year_ago = pd.Timestamp(today - timedelta(days=365))
    def churn_by(col):
        res = []
        for v, g in acc.groupby(col):
            churned = g[g["churn"] >= year_ago]
            base_n = int((g["status"] == "active").sum() + len(churned))
            if base_n == 0:
                continue
            res.append({"label": str(v), "rate": len(churned) / base_n, "churned": int(len(churned)), "base": base_n,
                        "lost_arr": float(churned["mrr"].sum() * 12),
                        "involuntary": int((churned["churn_type"] == "Involuntary").sum())})
        return sorted(res, key=lambda d: -d["rate"])
    churned_year = acc[acc["churn"] >= year_ago]
    active_n = int((acc["status"] == "active").sum())
    act = acc[acc["status"] == "active"]
    total_arr = float(act["mrr"].sum() * 12) or 1.0
    mix = [{"label": seg, "arr": float(g["mrr"].sum() * 12), "share": float(g["mrr"].sum() * 12) / total_arr, "accounts": int(len(g))}
           for seg, g in act.groupby("segment")]
    mix.sort(key=lambda m: -m["arr"])
    top10_share = float(act["mrr"].nlargest(10).sum() * 12) / total_arr
    logo_churn = len(churned_year) / max(1, active_n + len(churned_year))
    last12 = movement[-12:]
    return {
        "kpis": {"arr": movement[-1]["ending_arr"] if movement else 0, "nrr": nrr, "grr": grr,
                 "net_new_12m": float(sum(m["net"] for m in last12)),
                 "new_12m": float(sum(m["new"] for m in last12)), "expansion_12m": float(sum(m["expansion"] for m in last12)),
                 "churn_12m": float(sum(m["churn"] for m in last12)), "contraction_12m": float(sum(m["contraction"] for m in last12)),
                 "logo_churn": logo_churn, "involuntary_share": float((churned_year["churn_type"] == "Involuntary").mean()) if len(churned_year) else 0,
                 "period": f"{months[0].strftime('%b %Y')} - {months[-1].strftime('%b %Y')}"},
        "movement": movement, "cohorts": cohorts,
        "mix": {"segments": mix, "top10_share": top10_share, "accounts": active_n,
                "avg_arr": total_arr / max(1, active_n)},
        "churn_by": {"segment": churn_by("segment"), "plan": churn_by("plan"), "region": churn_by("region"), "industry": churn_by("industry")},
    }
