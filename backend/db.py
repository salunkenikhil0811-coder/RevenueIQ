"""SQLite storage layer for RevenueIQ."""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "revenueiq.db"
MODEL_PATH = DATA_DIR / "model.joblib"

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT, color TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY, name TEXT, industry TEXT, region TEXT, segment TEXT,
    plan TEXT, billing_cycle TEXT, payment_method TEXT, seats INTEGER, mrr REAL,
    signup_date TEXT, renewal_date TEXT, owner_id INTEGER, champion_name TEXT,
    champion_email TEXT, status TEXT, churn_date TEXT, churn_type TEXT,
    is_control INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS usage_weekly (
    account_id INTEGER, week_start TEXT, seats INTEGER, mrr REAL,
    active_users INTEGER, sessions INTEGER, features_used INTEGER,
    champion_active INTEGER
);
CREATE INDEX IF NOT EXISTS ix_usage_acc ON usage_weekly(account_id, week_start);

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY, account_id INTEGER, created_at TEXT, severity TEXT,
    category TEXT, subject TEXT, sentiment TEXT, resolution_hours REAL
);
CREATE INDEX IF NOT EXISTS ix_tickets_acc ON tickets(account_id);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY, account_id INTEGER, date TEXT, amount REAL, status TEXT
);
CREATE INDEX IF NOT EXISTS ix_payments_acc ON payments(account_id);

CREATE TABLE IF NOT EXISTS nps (account_id INTEGER, date TEXT, score INTEGER);
CREATE INDEX IF NOT EXISTS ix_nps_acc ON nps(account_id);

CREATE TABLE IF NOT EXISTS scores (
    account_id INTEGER PRIMARY KEY, scored_at TEXT, churn_prob REAL, risk_tier TEXT,
    ltv REAL, revenue_at_risk REAL, mrr_at_risk REAL, top_reason TEXT,
    reasons_json TEXT, recommendation_json TEXT, features_json TEXT, model_version TEXT, prev_prob REAL
);

CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY, account_id INTEGER, title TEXT, action_type TEXT,
    reason_code TEXT, description TEXT, status TEXT, priority TEXT, owner_id INTEGER,
    due_date TEXT, created_at TEXT, updated_at TEXT, completed_at TEXT,
    outcome TEXT, action_taken TEXT, risk_at_creation REAL, rar_at_creation REAL,
    mrr_at_creation REAL, source TEXT, position REAL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_cards_acc ON cards(account_id);
CREATE INDEX IF NOT EXISTS ix_cards_status ON cards(status);

CREATE TABLE IF NOT EXISTS card_activity (
    id INTEGER PRIMARY KEY, card_id INTEGER, created_at TEXT, actor_id INTEGER,
    kind TEXT, text TEXT
);
CREATE INDEX IF NOT EXISTS ix_activity_card ON card_activity(card_id);

CREATE TABLE IF NOT EXISTS control_observations (
    id INTEGER PRIMARY KEY, account_id INTEGER, flagged_at TEXT, reason_code TEXT
);

CREATE TABLE IF NOT EXISTS treated_observations (
    id INTEGER PRIMARY KEY, account_id INTEGER, flagged_at TEXT, reason_code TEXT, card_id INTEGER
);

CREATE TABLE IF NOT EXISTS playbooks (
    reason_code TEXT PRIMARY KEY, label TEXT, action_type TEXT, action_title TEXT,
    description TEXT, steps TEXT, sla_days INTEGER, enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS signal_reviews (
    signal_key TEXT PRIMARY KEY, reviewed_at TEXT, actor_id INTEGER
);

CREATE TABLE IF NOT EXISTS model_runs (
    id INTEGER PRIMARY KEY, created_at TEXT, version TEXT, algorithm TEXT,
    metrics_json TEXT, importance_json TEXT, calibration_json TEXT,
    comparison_json TEXT, is_active INTEGER DEFAULT 0
);
"""


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    # Upgrade databases created by older versions.
    cols = {r[1] for r in conn.execute("PRAGMA table_info(scores)")}
    if "prev_prob" not in cols:
        conn.execute("ALTER TABLE scores ADD COLUMN prev_prob REAL")
    conn.execute(
        "INSERT OR IGNORE INTO playbooks(reason_code, label, action_type, action_title, description, steps, sla_days, enabled) "
        "VALUES('EXPANSION', 'Expansion opportunity', 'expansion', 'Expansion conversation', "
        "'Strong usage and full seats signal room to grow. Help the customer get more value with more seats or a higher plan.', "
        "'Review seat usage and feature adoption\nPrepare a value summary with usage highlights\n"
        "Book a growth conversation with the decision maker\nSend a tailored seat or plan proposal', 10, 1)")
    conn.commit()


def is_ready():
    """True when demo data, a trained model and scores all exist."""
    if not DB_PATH.exists() or not MODEL_PATH.exists():
        return False
    try:
        conn = connect()
        try:
            return conn.execute("SELECT COUNT(*) FROM scores").fetchone()[0] > 0
        finally:
            conn.close()
    except sqlite3.Error:
        return False


def get_meta(conn, key, default=None):
    row = conn.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
    return row["value"] if row else default


def set_meta(conn, key, value):
    conn.execute(
        "INSERT INTO meta(key, value) VALUES(?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (key, str(value)),
    )


def rows(conn, sql, params=()):
    return [dict(r) for r in conn.execute(sql, params).fetchall()]


def row(conn, sql, params=()):
    r = conn.execute(sql, params).fetchone()
    return dict(r) if r else None


def jloads(s, default=None):
    if not s:
        return default
    try:
        return json.loads(s)
    except (TypeError, ValueError):
        return default
