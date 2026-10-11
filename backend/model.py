"""Churn model training, calibration, scoring, explanations, LTV and auto-cards."""
import json
from datetime import date, datetime, timedelta

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from . import db
from .features import FEATURES, FEATURE_LABELS, HORIZON_DAYS, build_features, load_data
from .playbooks import FEATURE_REASON, REASONS, load_playbooks

GROSS_MARGIN = 0.80
MAX_LIFETIME_MONTHS = 60
TIER_HIGH = 0.20
TIER_MEDIUM = 0.08
MAX_NEW_CARDS = 40          # per scoring run
MAX_OPEN_SUGGESTED = 50     # never flood the Suggested column
CARD_COOLDOWN_DAYS = 21


# ----------------------------------------------------------------- helpers
def _logit(p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p)).reshape(-1, 1)


def _today(conn):
    return pd.Timestamp(db.get_meta(conn, "today", date.today().isoformat()))


def _ranking_metrics(df, prob_col):
    """Precision@50 and lift/recall in the top 10%, averaged per snapshot."""
    p50, lifts, recalls = [], [], []
    for _, g in df.groupby("snapshot"):
        g = g.sort_values(prob_col, ascending=False)
        base = g["label"].mean()
        top10 = g.head(max(1, int(len(g) * 0.10)))
        p50.append(g.head(50)["label"].mean())
        if base > 0:
            lifts.append(top10["label"].mean() / base)
            recalls.append(top10["label"].sum() / g["label"].sum())
    return float(np.mean(p50)), float(np.mean(lifts) if lifts else 0), float(np.mean(recalls) if recalls else 0)


def _metrics(y, p, df=None):
    m = {"roc_auc": float(roc_auc_score(y, p)), "pr_auc": float(average_precision_score(y, p)),
         "brier": float(brier_score_loss(y, p))}
    if df is not None:
        d = df[["snapshot", "label"]].copy()
        d["p"] = p
        m["precision_at_50"], m["lift_top10"], m["recall_top10"] = _ranking_metrics(d, "p")
    return m


# ----------------------------------------------------------------- training
def train(conn, log=print):
    data = load_data(conn)
    today = _today(conn)
    first_week = data["usage"]["week_start"].min()
    snaps, s = [], today - pd.Timedelta(days=HORIZON_DAYS + 3)
    while s >= first_week + pd.Timedelta(weeks=13):
        snaps.append(s)
        s -= pd.Timedelta(days=28)
    snaps = sorted(snaps)
    if len(snaps) < 8:
        raise RuntimeError("Not enough history to train (need at least 8 monthly snapshots).")

    log(f"Building features for {len(snaps)} monthly snapshots...")
    frames = [build_features(data, s, with_label=True) for s in snaps]
    test_s, cal_s, train_s = set(snaps[-3:]), set(snaps[-6:-3]), set(snaps[:-6])
    full = pd.concat(frames)
    tr = full[full["snapshot"].isin(train_s)]
    ca = full[full["snapshot"].isin(cal_s)]
    te = full[full["snapshot"].isin(test_s)]
    Xtr, ytr = tr[FEATURES], tr["label"]

    log(f"Training on {len(tr):,} rows ({ytr.mean():.1%} churn rate)...")
    candidates = {
        "Logistic Regression": Pipeline([
            ("scale", StandardScaler()),
            ("lr", LogisticRegression(max_iter=3000, C=0.5, class_weight="balanced")),
        ]),
        "Gradient Boosting": HistGradientBoostingClassifier(
            max_iter=300, learning_rate=0.05, max_leaf_nodes=24, min_samples_leaf=40,
            l2_regularization=1.0, class_weight="balanced", random_state=0),
    }
    comparison, fitted = [], {}
    for name, mdl in candidates.items():
        mdl.fit(Xtr, ytr)
        fitted[name] = mdl
        raw_ca = mdl.predict_proba(ca[FEATURES])[:, 1]
        raw_te = mdl.predict_proba(te[FEATURES])[:, 1]
        cal = LogisticRegression(C=1e6, max_iter=1000).fit(_logit(raw_ca), ca["label"])
        p_te = cal.predict_proba(_logit(raw_te))[:, 1]
        m = _metrics(te["label"], p_te, te)
        m["val_pr_auc"] = float(average_precision_score(ca["label"], raw_ca))
        comparison.append({"model": name, **m})
        log(f"  {name}: validation PR-AUC {m['val_pr_auc']:.3f}, test ROC-AUC {m['roc_auc']:.3f}")

    best = max(comparison, key=lambda c: c["val_pr_auc"])["model"]
    model = fitted[best]
    calibrator = LogisticRegression(C=1e6, max_iter=1000).fit(
        _logit(model.predict_proba(ca[FEATURES])[:, 1]), ca["label"])
    p_te = calibrator.predict_proba(_logit(model.predict_proba(te[FEATURES])[:, 1]))[:, 1]
    metrics = _metrics(te["label"], p_te, te)
    metrics.update({
        "base_rate": float(te["label"].mean()), "train_rows": int(len(tr)), "calib_rows": int(len(ca)),
        "test_rows": int(len(te)), "snapshots": len(snaps), "horizon_days": HORIZON_DAYS,
        "train_period": f"{min(train_s).date()} to {max(train_s).date()}",
        "test_period": f"{min(test_s).date()} to {max(test_s).date()}",
    })

    log("Calculating feature importance...")
    pi = permutation_importance(model, te[FEATURES], te["label"], scoring="average_precision",
                                n_repeats=3, random_state=0)
    imp = sorted(({"feature": f, "label": FEATURE_LABELS[f], "importance": max(0.0, float(v))}
                  for f, v in zip(FEATURES, pi.importances_mean)), key=lambda d: -d["importance"])
    total = sum(d["importance"] for d in imp) or 1
    for d in imp:
        d["share"] = d["importance"] / total

    calib = []
    bins = pd.qcut(pd.Series(p_te), q=10, duplicates="drop")
    for _, g in pd.DataFrame({"p": p_te, "y": te["label"].values, "b": bins}).groupby("b", observed=True):
        calib.append({"predicted": float(g["p"].mean()), "actual": float(g["y"].mean()), "count": int(len(g))})

    healthy = tr[tr["label"] == 0][FEATURES].median()
    n_runs = conn.execute("SELECT COUNT(*) FROM model_runs").fetchone()[0]
    version = f"v{n_runs + 1}.{datetime.now().strftime('%Y%m%d-%H%M')}"
    joblib.dump({"model": model, "calibrator": calibrator, "reference": healthy.to_dict(),
                 "features": FEATURES, "version": version, "algorithm": best}, db.MODEL_PATH)

    conn.execute("UPDATE model_runs SET is_active=0")
    conn.execute(
        "INSERT INTO model_runs(created_at, version, algorithm, metrics_json, importance_json, "
        "calibration_json, comparison_json, is_active) VALUES(?,?,?,?,?,?,?,1)",
        (datetime.now().isoformat(timespec="seconds"), version, best, json.dumps(metrics),
         json.dumps(imp), json.dumps(calib), json.dumps(comparison)))
    conn.commit()
    log(f"Model {version} ({best}) saved. Test PR-AUC {metrics['pr_auc']:.3f}, lift@10% {metrics['lift_top10']:.1f}x")
    return metrics


# ----------------------------------------------------------------- explanations
def _fmt_pct(x):
    return f"{x * 100:+.0f}%"


def reason_text(code, f):
    if code == "USAGE_DECLINE":
        parts = []
        if f["active_users_trend"] < -0.05:
            parts.append(f"active users {_fmt_pct(f['active_users_trend'])} vs previous 8 weeks")
        if f["sessions_trend"] < -0.05:
            parts.append(f"sessions per user {_fmt_pct(f['sessions_trend'])}")
        if f["zero_activity_weeks"] > 0:
            parts.append(f"{int(f['zero_activity_weeks'])} week(s) with no activity")
        return ("Usage dropping: " + ", ".join(parts)) if parts else "Usage trending down"
    if code == "LOW_ADOPTION":
        return (f"Only {f['seat_utilization'] * 100:.0f}% of {int(f['seats'])} paid seats active; "
                f"{f['features_used']:.1f}/10 core features used")
    if code == "CHAMPION_LOST":
        return f"Main champion inactive for {int(f['champion_inactive_weeks'])} of the last 4 weeks"
    if code == "PAYMENT_ISSUE":
        t = f"{int(f['failed_payments_90d'])} failed payment(s) in the last 90 days"
        return t + (" - still unresolved" if f["unresolved_payment"] else "")
    if code == "SUPPORT_FRICTION":
        return (f"{int(f['tickets_90d'])} tickets in 90 days ({int(f['high_sev_tickets_90d'])} high severity, "
                f"{f['neg_ticket_ratio'] * 100:.0f}% negative, avg {f['avg_resolution_hours']:.0f}h to resolve)")
    if code == "DOWNGRADE_SIGNAL":
        return f"MRR changed {_fmt_pct(f['mrr_change_90d'])} in the last 90 days"
    if code == "RENEWAL_RISK":
        d = int(f["days_to_renewal"])
        return f"Annual contract renews in {d} day{'s' if d != 1 else ''}"
    if code == "LOW_SATISFACTION":
        return f"Latest NPS score is {int(f['last_nps'])}/10"
    if code == "NEW_CUSTOMER":
        return f"Customer for only {int(f['tenure_days'])} days - still onboarding"
    return REASONS.get(code, code)


# +1: a higher value means more risk, -1: a lower value means more risk.
FEATURE_DIRECTION = {
    "seat_utilization": -1, "features_used": -1, "sessions_per_user": -1, "active_users_trend": -1,
    "sessions_trend": -1, "features_trend": -1, "zero_activity_weeks": 1, "champion_inactive_weeks": 1,
    "failed_payments_90d": 1, "unresolved_payment": 1, "tickets_90d": 1, "high_sev_tickets_90d": 1,
    "neg_ticket_ratio": 1, "avg_resolution_hours": 1, "mrr_change_90d": -1, "days_to_renewal": -1,
    "is_annual": 1, "last_nps": -1, "tenure_days": -1,
}

# A reason is only shown when the account's raw signals really support it, so a
# model quirk can never claim e.g. "NPS 10/10" or "customer for 600 days" as risk.
REASON_GATES = {
    "LOW_ADOPTION": lambda f: f["seat_utilization"] < 0.6 or f["features_used"] < 6,
    "USAGE_DECLINE": lambda f: (f["active_users_trend"] < -0.05 or f["sessions_trend"] < -0.05
                                or f["zero_activity_weeks"] > 0 or f["features_trend"] < -0.3),
    "CHAMPION_LOST": lambda f: f["champion_inactive_weeks"] >= 1,
    "PAYMENT_ISSUE": lambda f: f["failed_payments_90d"] > 0 or f["unresolved_payment"] > 0,
    "SUPPORT_FRICTION": lambda f: f["tickets_90d"] >= 3 or f["high_sev_tickets_90d"] >= 1,
    "DOWNGRADE_SIGNAL": lambda f: f["mrr_change_90d"] < -0.02,
    "RENEWAL_RISK": lambda f: f["is_annual"] == 1 and f["days_to_renewal"] <= 90,
    "LOW_SATISFACTION": lambda f: f["has_nps"] == 1 and f["last_nps"] <= 6,
    "NEW_CUSTOMER": lambda f: f["tenure_days"] <= 120,
}


def _explain(model, X, reference):
    """Occlusion explanation: how much the raw risk falls when one feature is
    reset to a typical healthy value. Only features sitting on the risky side of
    that healthy value count; contributions are grouped into reason codes."""
    base = model.predict_proba(X[FEATURES])[:, 1]
    contrib = {}
    for f in FEATURES:
        code = FEATURE_REASON.get(f)
        if code is None:
            continue
        Xr = X[FEATURES].copy()
        Xr[f] = reference[f]
        delta = base - model.predict_proba(Xr)[:, 1]
        risky_side = (FEATURE_DIRECTION.get(f, 1) * (X[f] - reference[f])) > 0
        contrib[code] = contrib.get(code, 0) + np.where(risky_side, np.maximum(delta, 0), 0)
    out = pd.DataFrame(contrib, index=X.index)
    for code, gate in REASON_GATES.items():
        if code in out:
            out[code] = np.where(X.apply(gate, axis=1), out[code], 0)
    return out


# ----------------------------------------------------------------- scoring
def _segment_lifetime(conn, today):
    out = {}
    year_ago = (today - pd.Timedelta(days=365)).date().isoformat()
    for seg in ["SMB", "Mid-Market", "Enterprise"]:
        churned = conn.execute("SELECT COUNT(*) FROM accounts WHERE segment=? AND churn_date>=?",
                               (seg, year_ago)).fetchone()[0]
        active = conn.execute("SELECT COUNT(*) FROM accounts WHERE segment=? AND status='active'",
                              (seg,)).fetchone()[0]
        monthly = churned / max(1, active + churned / 2) / 12
        out[seg] = min(MAX_LIFETIME_MONTHS, 1 / monthly) if monthly > 0 else MAX_LIFETIME_MONTHS
    return out


def _priority(prob, unresolved, days_to_renewal, is_annual):
    """Priority = how urgently to act (risk level and deadline). Revenue at risk
    decides the order within a priority, so the two do not double count."""
    renewing = is_annual and days_to_renewal <= 30
    if unresolved or prob >= 0.30 or (renewing and prob >= TIER_HIGH):
        return "Urgent"
    if prob >= TIER_HIGH or (renewing and prob >= TIER_MEDIUM):
        return "High"
    if prob >= TIER_MEDIUM:
        return "Medium"
    return "Low"


def score(conn, log=print):
    art = joblib.load(db.MODEL_PATH)
    model, calibrator, ref = art["model"], art["calibrator"], art["reference"]
    data = load_data(conn)
    today = _today(conn)
    X = build_features(data, today)
    acc = data["accounts"]
    X = X[acc.loc[X.index, "status"] == "active"]
    log(f"Scoring {len(X):,} active accounts...")

    raw = model.predict_proba(X[FEATURES])[:, 1]
    prob = np.clip(calibrator.predict_proba(_logit(raw))[:, 1], 0.002, 0.99)
    # Risk 30 days ago (same model, older snapshot) powers the "risk movers" signals.
    Xp = build_features(data, today - pd.Timedelta(days=30))
    prev = pd.Series(np.nan, index=X.index)
    common = X.index.intersection(Xp.index)
    if len(common):
        rp = model.predict_proba(Xp.loc[common, FEATURES])[:, 1]
        prev.loc[common] = np.clip(calibrator.predict_proba(_logit(rp))[:, 1], 0.002, 0.99)
    contrib = _explain(model, X, ref)
    lifetimes = _segment_lifetime(conn, today)
    playbooks = load_playbooks(conn)

    df = pd.DataFrame({"prob": prob}, index=X.index)
    df["segment"] = acc.loc[X.index, "segment"]
    df["mrr"] = X["mrr"]
    df["ltv"] = df["mrr"] * GROSS_MARGIN * df["segment"].map(lifetimes)
    df["rar"] = df["prob"] * df["ltv"]
    df["tier"] = np.where(df["prob"] >= TIER_HIGH, "High", np.where(df["prob"] >= TIER_MEDIUM, "Medium", "Low"))

    scored_at = today.date().isoformat()
    records = []
    for aid in X.index:
        f = X.loc[aid]
        c = contrib.loc[aid]
        pos = c[c > 0].sort_values(ascending=False)
        total = pos.sum() or 1
        reasons = [{"code": code, "label": REASONS[code], "weight": float(v / total),
                    "text": reason_text(code, f)} for code, v in pos.head(4).items() if v / total >= 0.05]
        if f["unresolved_payment"] and not any(r["code"] == "PAYMENT_ISSUE" for r in reasons):
            reasons.insert(0, {"code": "PAYMENT_ISSUE", "label": REASONS["PAYMENT_ISSUE"], "weight": 0.0,
                               "text": reason_text("PAYMENT_ISSUE", f)})
        if not reasons:
            reasons = [{"code": "USAGE_DECLINE", "label": REASONS["USAGE_DECLINE"], "weight": 1.0,
                        "text": "Several small signals add up - no single driver stands out. A health check is the best next step."}]
        order = [r["code"] for r in reasons]
        if f["unresolved_payment"]:
            order = ["PAYMENT_ISSUE"] + [o for o in order if o != "PAYMENT_ISSUE"]
        rec = None
        alts = []
        for code in order:
            pb = playbooks.get(code)
            if not pb or not pb["enabled"]:
                continue
            item = {"reason_code": code, "label": pb["label"], "action_title": pb["action_title"],
                    "action_type": pb["action_type"], "description": pb["description"],
                    "steps": [s for s in pb["steps"].split("\n") if s.strip()], "sla_days": pb["sla_days"]}
            if rec is None:
                rec = item
            else:
                alts.append({"reason_code": code, "action_title": pb["action_title"]})
        if rec:
            rec["alternatives"] = alts
            rec["priority"] = _priority(df.at[aid, "prob"], bool(f["unresolved_payment"]), f["days_to_renewal"],
                                        bool(f["is_annual"]))
        feats = {k: (float(f[k]) if k in f else None) for k in FEATURES + ["active_users_4w"]}
        records.append((int(aid), scored_at, float(df.at[aid, "prob"]), df.at[aid, "tier"],
                        float(df.at[aid, "ltv"]), float(df.at[aid, "rar"]),
                        float(df.at[aid, "prob"] * df.at[aid, "mrr"]), order[0],
                        json.dumps(reasons), json.dumps(rec), json.dumps(feats), art["version"],
                        None if pd.isna(prev.at[aid]) else float(prev.at[aid])))

    conn.execute("DELETE FROM scores")
    conn.executemany("INSERT INTO scores(account_id, scored_at, churn_prob, risk_tier, ltv, revenue_at_risk, mrr_at_risk, "
                     "top_reason, reasons_json, recommendation_json, features_json, model_version, prev_prob) "
                     "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", records)
    conn.commit()
    created = create_auto_cards(conn, today)
    tiers = df["tier"].value_counts().to_dict()
    log(f"Scored {len(records):,} accounts (High {tiers.get('High', 0)}, Medium {tiers.get('Medium', 0)}, "
        f"Low {tiers.get('Low', 0)}). {created} new action cards created.")
    return {"scored": len(records), "tiers": tiers, "cards_created": created}


def create_auto_cards(conn, today):
    today_d = max(today.date(), date.today())
    now = today_d.isoformat()

    # Suggestions the team never picked up go stale when the account's risk falls back to Low.
    stale = db.rows(conn, """SELECT c.id, s.churn_prob FROM cards c JOIN scores s ON s.account_id = c.account_id
                             WHERE c.status='Suggested' AND s.risk_tier='Low'""")
    for st in stale:
        conn.execute("UPDATE cards SET status='Done', outcome='Dismissed', completed_at=?, updated_at=? WHERE id=?",
                     (now, now, st["id"]))
        conn.execute("DELETE FROM treated_observations WHERE card_id=?", (st["id"],))
        conn.execute("INSERT INTO card_activity(card_id, created_at, actor_id, kind, text) VALUES(?,?,NULL,'dismissed',?)",
                     (st["id"], now, f"Auto-dismissed - churn risk dropped to {st['churn_prob'] * 100:.0f}%"))

    open_suggested = conn.execute("SELECT COUNT(*) FROM cards WHERE status='Suggested'").fetchone()[0]
    budget = max(0, min(MAX_NEW_CARDS, MAX_OPEN_SUGGESTED - open_suggested))
    open_acc = {r[0] for r in conn.execute("SELECT DISTINCT account_id FROM cards WHERE status!='Done'")}
    cooldown = (today_d - timedelta(days=CARD_COOLDOWN_DAYS)).isoformat()
    recent = {r[0] for r in conn.execute("SELECT DISTINCT account_id FROM cards WHERE completed_at>=?", (cooldown,))}
    recent_high = {r[0] for r in conn.execute("SELECT DISTINCT account_id FROM cards WHERE completed_at>=?",
                                              ((today_d - timedelta(days=7)).isoformat(),))}
    recent_ctrl = {r[0] for r in conn.execute("SELECT DISTINCT account_id FROM control_observations WHERE flagged_at>=?",
                                              ((today_d - timedelta(days=56)).isoformat(),))}
    cands = db.rows(conn, """
        SELECT s.*, a.owner_id, a.is_control, a.mrr FROM scores s JOIN accounts a ON a.id = s.account_id
        WHERE s.risk_tier IN ('High','Medium') ORDER BY s.revenue_at_risk DESC""")
    created = 0
    for c in cands:
        aid = c["account_id"]
        if aid in open_acc:
            continue
        if aid in recent and (c["risk_tier"] != "High" or aid in recent_high):
            continue
        rec = db.jloads(c["recommendation_json"])
        if not rec:
            continue
        if c["is_control"]:
            if aid not in recent_ctrl:
                conn.execute("INSERT INTO control_observations(account_id, flagged_at, reason_code) VALUES(?,?,?)",
                             (aid, now, rec["reason_code"]))
            continue
        if created >= budget:
            continue
        sla = rec["sla_days"] if rec["priority"] != "Urgent" else min(rec["sla_days"], 2)
        cur = conn.execute(
            "INSERT INTO cards(account_id, title, action_type, reason_code, description, status, priority, owner_id, "
            "due_date, created_at, updated_at, risk_at_creation, rar_at_creation, mrr_at_creation, source, position) "
            "VALUES(?,?,?,?,?,'Suggested',?,?,?,?,?,?,?,?,'auto',?)",
            (aid, rec["action_title"], rec["action_type"], rec["reason_code"], rec["description"], rec["priority"],
             c["owner_id"], (today_d + timedelta(days=sla)).isoformat(), now, now, c["churn_prob"],
             c["revenue_at_risk"], c["mrr"], -c["revenue_at_risk"]))
        cid = cur.lastrowid
        conn.execute("INSERT INTO card_activity(card_id, created_at, actor_id, kind, text) VALUES(?,?,NULL,'created',?)",
                     (cid, now, f"Card created by RevenueIQ - churn risk {c['churn_prob'] * 100:.0f}%, "
                                f"top reason: {REASONS.get(rec['reason_code'], rec['reason_code'])}"))
        conn.execute("INSERT INTO treated_observations(account_id, flagged_at, reason_code, card_id) VALUES(?,?,?,?)",
                     (aid, now, rec["reason_code"], cid))
        created += 1
    conn.commit()
    return created
