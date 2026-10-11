"""Point-in-time feature engineering.

Every feature for snapshot date S uses only data dated strictly before S, so
training rows never see the future (no label leakage).
"""
import numpy as np
import pandas as pd

HORIZON_DAYS = 60

FEATURES = [
    "tenure_days", "seats", "mrr", "segment_code", "is_annual", "days_to_renewal",
    "seat_utilization", "active_users_trend", "sessions_per_user", "sessions_trend",
    "features_used", "features_trend", "zero_activity_weeks", "champion_inactive_weeks",
    "mrr_change_90d", "tickets_90d", "high_sev_tickets_90d", "neg_ticket_ratio",
    "avg_resolution_hours", "failed_payments_90d", "unresolved_payment", "last_nps",
]

FEATURE_LABELS = {
    "tenure_days": "Customer tenure (days)",
    "seats": "Paid seats",
    "mrr": "MRR",
    "segment_code": "Segment",
    "is_annual": "Annual contract",
    "days_to_renewal": "Days to renewal",
    "seat_utilization": "Seat utilisation",
    "active_users_trend": "Active-user trend",
    "sessions_per_user": "Sessions per user",
    "sessions_trend": "Session trend",
    "features_used": "Core features used",
    "features_trend": "Feature-usage trend",
    "zero_activity_weeks": "Zero-activity weeks",
    "champion_inactive_weeks": "Champion inactive weeks",
    "mrr_change_90d": "MRR change (90d)",
    "tickets_90d": "Support tickets (90d)",
    "high_sev_tickets_90d": "High-severity tickets (90d)",
    "neg_ticket_ratio": "Negative ticket share",
    "avg_resolution_hours": "Avg resolution hours",
    "failed_payments_90d": "Failed payments (90d)",
    "unresolved_payment": "Unresolved payment",
    "last_nps": "Latest NPS",
}

SEGMENT_CODE = {"SMB": 0, "Mid-Market": 1, "Enterprise": 2}


def load_data(conn):
    acc = pd.read_sql_query("SELECT * FROM accounts", conn)
    for c in ["signup_date", "churn_date", "renewal_date"]:
        acc[c] = pd.to_datetime(acc[c])
    usage = pd.read_sql_query("SELECT * FROM usage_weekly", conn, parse_dates=["week_start"])
    tickets = pd.read_sql_query("SELECT account_id, created_at, severity, sentiment, resolution_hours FROM tickets",
                                conn, parse_dates=["created_at"])
    payments = pd.read_sql_query("SELECT account_id, date, status FROM payments", conn, parse_dates=["date"])
    nps = pd.read_sql_query("SELECT * FROM nps", conn, parse_dates=["date"])
    return {"accounts": acc.set_index("id"), "usage": usage, "tickets": tickets,
            "payments": payments, "nps": nps}


def build_features(data, snapshot, with_label=False):
    S = pd.Timestamp(snapshot)
    acc = data["accounts"]
    eligible = acc[(acc["signup_date"] <= S - pd.Timedelta(days=28)) &
                   (acc["churn_date"].isna() | (acc["churn_date"] > S))]
    ids = eligible.index
    out = pd.DataFrame(index=ids)
    out.index.name = "account_id"

    u = data["usage"]
    u = u[(u["week_start"] < S) & (u["week_start"] >= S - pd.Timedelta(weeks=13)) & u["account_id"].isin(ids)]
    last4 = u[u["week_start"] >= S - pd.Timedelta(weeks=4)]
    prior = u[(u["week_start"] < S - pd.Timedelta(weeks=4)) & (u["week_start"] >= S - pd.Timedelta(weeks=12))]
    last8 = u[u["week_start"] >= S - pd.Timedelta(weeks=8)]

    latest = u.sort_values("week_start").groupby("account_id").last()
    earliest = u.sort_values("week_start").groupby("account_id").first()
    g4, gp = last4.groupby("account_id"), prior.groupby("account_id")

    out["seats"] = latest["seats"]
    out["mrr"] = latest["mrr"]
    au4 = g4["active_users"].mean()
    aup = gp["active_users"].mean()
    out["active_users_4w"] = au4
    out["seat_utilization"] = (au4 / latest["seats"]).clip(0, 1.5)
    out["active_users_trend"] = ((au4 - aup) / aup.clip(lower=1)).clip(-1, 2)
    spu4 = g4["sessions"].sum() / g4["active_users"].sum().clip(lower=1)
    spup = gp["sessions"].sum() / gp["active_users"].sum().clip(lower=1)
    out["sessions_per_user"] = spu4
    out["sessions_trend"] = ((spu4 - spup) / spup.clip(lower=0.5)).clip(-1, 2)
    f4, fp = g4["features_used"].mean(), gp["features_used"].mean()
    out["features_used"] = f4
    out["features_trend"] = f4 - fp
    out["zero_activity_weeks"] = last8.assign(z=(last8["active_users"] == 0).astype(int)).groupby("account_id")["z"].sum()
    out["champion_inactive_weeks"] = last4.assign(c=1 - last4["champion_active"]).groupby("account_id")["c"].sum()
    out["mrr_change_90d"] = ((latest["mrr"] - earliest["mrr"]) / earliest["mrr"].clip(lower=1)).clip(-1, 2)

    t = data["tickets"]
    t = t[(t["created_at"] < S) & (t["created_at"] >= S - pd.Timedelta(days=90)) & t["account_id"].isin(ids)]
    gt = t.groupby("account_id")
    out["tickets_90d"] = gt.size()
    out["high_sev_tickets_90d"] = t[t["severity"] == "High"].groupby("account_id").size()
    out["neg_ticket_ratio"] = t.assign(n=(t["sentiment"] == "Negative").astype(float)).groupby("account_id")["n"].mean()
    out["avg_resolution_hours"] = gt["resolution_hours"].mean()

    p = data["payments"]
    p = p[(p["date"] < S) & p["account_id"].isin(ids)]
    p90 = p[p["date"] >= S - pd.Timedelta(days=90)]
    out["failed_payments_90d"] = p90[p90["status"] == "failed"].groupby("account_id").size()
    last_fail = p[p["status"] == "failed"].groupby("account_id")["date"].max()
    last_rec = p[p["status"] == "recovered"].groupby("account_id")["date"].max()
    lf = last_fail.reindex(ids)
    lr = last_rec.reindex(ids)
    unresolved = lf.notna() & (lr.isna() | (lr < lf)) & (lf >= S - pd.Timedelta(days=60))
    out["unresolved_payment"] = unresolved.astype(int)

    n = data["nps"]
    n = n[(n["date"] < S) & n["account_id"].isin(ids)].sort_values("date")
    out["last_nps"] = n.groupby("account_id")["score"].last()
    out["has_nps"] = out["last_nps"].notna().astype(int)

    tenure = (S - eligible["signup_date"]).dt.days
    out["tenure_days"] = tenure
    annual = (eligible["billing_cycle"] == "Annual").astype(int)
    out["is_annual"] = annual
    out["days_to_renewal"] = np.where(annual == 1, 365 - tenure % 365, 30 - tenure % 30)
    out["segment_code"] = eligible["segment"].map(SEGMENT_CODE)

    zero_fill = ["zero_activity_weeks", "champion_inactive_weeks", "tickets_90d", "high_sev_tickets_90d",
                 "neg_ticket_ratio", "avg_resolution_hours", "failed_payments_90d", "features_trend",
                 "active_users_trend", "sessions_trend", "mrr_change_90d"]
    out[zero_fill] = out[zero_fill].fillna(0)
    out["last_nps"] = out["last_nps"].fillna(7)
    out = out.dropna(subset=["seats"])  # accounts with no usage rows yet
    out = out.fillna(0)

    if with_label:
        cd = eligible.loc[out.index, "churn_date"]
        out["label"] = (cd.notna() & (cd <= S + pd.Timedelta(days=HORIZON_DAYS))).astype(int)
    out["snapshot"] = S
    return out
