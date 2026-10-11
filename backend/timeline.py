"""Keeps the demo data current: shifts every stored date forward to today.

The demo world is generated relative to the day it was built. When the app is
opened later, all dates (history, renewals, due dates, cards, notes, signals)
move forward by the same number of days, so everything keeps the same age
relative to "today" and nothing looks stale or wrongly overdue.
"""
import threading
from datetime import date, timedelta

from . import db

# (table, columns) holding dates or ISO datetimes. Model training times are real
# events and are intentionally not shifted.
DATE_COLUMNS = [
    ("accounts", ["signup_date", "renewal_date", "churn_date"]),
    ("usage_weekly", ["week_start"]),
    ("tickets", ["created_at"]),
    ("payments", ["date"]),
    ("nps", ["date"]),
    ("scores", ["scored_at"]),
    ("cards", ["due_date", "created_at", "updated_at", "completed_at"]),
    ("card_activity", ["created_at"]),
    ("control_observations", ["flagged_at"]),
    ("treated_observations", ["flagged_at"]),
    ("signal_reviews", ["reviewed_at"]),
]

_lock = threading.Lock()


def _shift_expr(col, days):
    # Date-only values stay date-only; datetimes keep their time of day.
    return (f"CASE WHEN {col} IS NULL THEN NULL "
            f"WHEN length({col}) <= 10 THEN date({col}, '{days:+d} days') "
            f"ELSE strftime('%Y-%m-%dT%H:%M:%S', {col}, '{days:+d} days') END")


def shift_all(conn, days):
    """Move every stored date by `days` (positive = forward)."""
    if not days:
        return
    for table, cols in DATE_COLUMNS:
        sets = ", ".join(f"{c} = {_shift_expr(c, days)}" for c in cols)
        conn.execute(f"UPDATE {table} SET {sets}")
    # Reviewed-signal keys embed the signal date ("type:account:YYYY-MM-DD").
    rows = conn.execute("SELECT signal_key, reviewed_at, actor_id FROM signal_reviews").fetchall()
    if rows:
        conn.execute("DELETE FROM signal_reviews")
        for key, reviewed_at, actor in rows:
            kind, aid, when = key.split(":", 2)
            try:
                when = (date.fromisoformat(when[:10]) + timedelta(days=days)).isoformat()
            except ValueError:
                pass
            conn.execute("INSERT OR REPLACE INTO signal_reviews VALUES(?,?,?)", (f"{kind}:{aid}:{when}", reviewed_at, actor))
    for key in ("today", "program_start"):
        v = db.get_meta(conn, key)
        if v:
            db.set_meta(conn, key, (date.fromisoformat(v) + timedelta(days=days)).isoformat())


def roll_forward(conn=None):
    """Shift the demo data so its 'today' equals the real date. Returns days moved."""
    with _lock:
        own = conn is None
        if own:
            if not db.DB_PATH.exists():
                return 0
            conn = db.connect()
        try:
            v = db.get_meta(conn, "today")
            if not v:
                return 0
            days = (date.today() - date.fromisoformat(v)).days
            if days <= 0:
                return 0
            with conn:  # one transaction: all-or-nothing
                shift_all(conn, days)
            return days
        finally:
            if own:
                conn.close()
