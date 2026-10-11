"""RevenueIQ REST API + static UI server."""
import csv
import io
import threading
import traceback
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import db, timeline
from .playbooks import REASONS

app = FastAPI(title="RevenueIQ", version="1.0")
FRONTEND = db.ROOT / "frontend"

STATUSES = ["Suggested", "To Do", "In Progress", "Waiting on Customer", "Done"]
OUTCOMES = ["Saved", "Downgraded", "Churned", "No response"]
EXPANSION_OUTCOMES = ["Expanded", "Not now", "No response"]
PRIORITIES = ["Urgent", "High", "Medium", "Low"]


def conn():
    c = db.connect()
    db.init_schema(c)
    return c


def today():
    return date.today()


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def data_date(c):
    return date.fromisoformat(db.get_meta(c, "today", today().isoformat()))


def ref_date(c):
    """Analytics windows end at the later of the data date and the real date."""
    return max(data_date(c), today())


def log_activity(c, card_id, actor_id, kind, text):
    c.execute("INSERT INTO card_activity(card_id, created_at, actor_id, kind, text) VALUES(?,?,?,?,?)",
              (card_id, now_iso(), actor_id, kind, text))


# ------------------------------------------------------------------ jobs
JOB = {"running": False, "kind": None, "log": [], "error": None, "finished_at": None, "started_at": None}
JOB_LOCK = threading.Lock()


def _run_job(kind, fn):
    def log(msg):
        JOB["log"].append(msg)
        print(msg, flush=True)
    try:
        fn(log=log)
    except Exception as exc:  # surfaced to the UI
        JOB["error"] = str(exc)
        log("ERROR: " + str(exc))
        traceback.print_exc()
    finally:
        JOB["running"] = False
        JOB["finished_at"] = now_iso()


def start_job(kind, fn):
    with JOB_LOCK:
        if JOB["running"]:
            raise HTTPException(409, "Another job is already running.")
        JOB.update({"running": True, "kind": kind, "log": [], "error": None,
                    "finished_at": None, "started_at": now_iso()})
    threading.Thread(target=_run_job, args=(kind, fn), daemon=True).start()
    return {"started": True, "kind": kind}


@app.get("/api/jobs/current")
def job_status():
    return JOB


def _pipeline():
    from . import pipeline  # heavy (pandas + scikit-learn): imported on first use only
    return pipeline


def _insights():
    from . import insights
    return insights


def keep_dates_current():
    """Shift demo data to today's date (skipped while a job is rewriting the data)."""
    if JOB["running"]:
        return 0
    try:
        moved = timeline.roll_forward()
        if moved:
            print(f"Demo data moved forward {moved} day(s) to today.", flush=True)
        return moved
    except Exception:  # never break a request because of this
        traceback.print_exc()
        return 0


def _date_watcher():
    while True:
        threading.Event().wait(900)  # every 15 minutes
        keep_dates_current()


@app.on_event("startup")
def first_run_setup():
    """On a fresh install, build demo data in the background so the UI opens instantly.
    Otherwise bring the existing demo data up to today's date."""
    if not db.is_ready():
        start_job("setup", lambda log: _pipeline().run_all(log=log))
    else:
        keep_dates_current()
    threading.Thread(target=_date_watcher, daemon=True).start()


@app.post("/api/model/retrain")
def retrain():
    return start_job("retrain", lambda log: _pipeline().retrain(log=log))


@app.post("/api/model/rescore")
def rescore():
    return start_job("rescore", lambda log: _pipeline().rescore(log=log))


@app.post("/api/admin/reset")
def reset():
    return start_job("reset", lambda log: _pipeline().run_all(log=log))


# ------------------------------------------------------------------ meta / team
@app.get("/api/meta")
def meta():
    keep_dates_current()
    c = conn()
    try:
        run = db.row(c, "SELECT version, algorithm, created_at FROM model_runs WHERE is_active=1")
        return {"data_date": db.get_meta(c, "today"), "program_start": db.get_meta(c, "program_start"),
                "today": today().isoformat(), "model": run, "ready": db.is_ready(),
                "reasons": REASONS, "statuses": STATUSES, "outcomes": OUTCOMES,
                "expansion_outcomes": EXPANSION_OUTCOMES, "priorities": PRIORITIES}
    finally:
        c.close()


@app.get("/api/team")
def team():
    c = conn()
    try:
        return db.rows(c, "SELECT * FROM team ORDER BY id")
    finally:
        c.close()


# ------------------------------------------------------------------ dashboard
@app.get("/api/summary")
def summary(user_id: Optional[int] = None):
    c = conn()
    try:
        t = today().isoformat()
        ref = ref_date(c)
        d90 = (ref - timedelta(days=90)).isoformat()
        k = db.row(c, """SELECT COUNT(*) accounts, SUM(a.mrr) mrr, SUM(s.mrr_at_risk) mrr_at_risk,
                         SUM(CASE WHEN s.risk_tier='High' THEN 1 ELSE 0 END) high,
                         SUM(CASE WHEN s.risk_tier='Medium' THEN 1 ELSE 0 END) medium
                         FROM accounts a LEFT JOIN scores s ON s.account_id=a.id WHERE a.status='active'""")
        tiers = db.rows(c, """SELECT s.risk_tier tier, COUNT(*) n, SUM(a.mrr)*12 arr, SUM(s.mrr_at_risk)*12 arr_at_risk
                              FROM scores s JOIN accounts a ON a.id=s.account_id GROUP BY s.risk_tier""")
        by_reason = db.rows(c, """SELECT top_reason code, COUNT(*) n, SUM(mrr_at_risk)*12 arr_at_risk
                                  FROM scores WHERE risk_tier IN ('High','Medium')
                                  GROUP BY top_reason ORDER BY arr_at_risk DESC""")
        for r in by_reason:
            r["label"] = REASONS.get(r["code"], r["code"])
        cards = db.row(c, """SELECT SUM(CASE WHEN status NOT IN ('Done') THEN 1 ELSE 0 END) open,
                             SUM(CASE WHEN status='Suggested' THEN 1 ELSE 0 END) suggested,
                             SUM(CASE WHEN status NOT IN ('Done','Suggested') AND due_date < ? THEN 1 ELSE 0 END) overdue
                             FROM cards""", (t,))
        saved = db.row(c, """SELECT SUM(CASE WHEN outcome='Saved' THEN 1 ELSE 0 END) saved,
                             SUM(CASE WHEN outcome='Saved' THEN mrr_at_creation ELSE 0 END)*12 arr_saved,
                             SUM(CASE WHEN outcome IN ('Saved','Downgraded','Churned','No response') THEN 1 ELSE 0 END) closed
                             FROM cards WHERE status='Done' AND reason_code!='EXPANSION' AND completed_at >= ?""", (d90,))
        churn_trend = []
        for i in range(11, -1, -1):
            first = ref.replace(day=1)
            for _ in range(i):
                first = (first - timedelta(days=1)).replace(day=1)
            nxt = (first + timedelta(days=32)).replace(day=1)
            r = db.row(c, """SELECT COUNT(*) n, COALESCE(SUM(mrr),0) mrr,
                             SUM(CASE WHEN churn_type='Involuntary' THEN mrr ELSE 0 END) invol
                             FROM accounts WHERE churn_date >= ? AND churn_date < ?""",
                       (first.isoformat(), nxt.isoformat()))
            churn_trend.append({"month": first.strftime("%b '%y"), "accounts": r["n"],
                                "mrr": r["mrr"] or 0, "involuntary": r["invol"] or 0})
        top = db.rows(c, """SELECT a.id, a.name, a.segment, a.mrr, a.renewal_date, s.churn_prob, s.risk_tier,
                            s.revenue_at_risk, s.top_reason, a.is_control,
                            (SELECT status FROM cards WHERE account_id=a.id AND status!='Done' LIMIT 1) card_status,
                    (SELECT outcome || '|' || substr(completed_at, 1, 10) FROM cards WHERE account_id=a.id AND status='Done'
                     AND outcome!='Dismissed' ORDER BY completed_at DESC LIMIT 1) last_closed
                            FROM scores s JOIN accounts a ON a.id=s.account_id
                            ORDER BY s.revenue_at_risk DESC LIMIT 10""")
        for r in top:
            r["reason_label"] = REASONS.get(r["top_reason"], r["top_reason"])
        mine = []
        if user_id:
            mine = db.rows(c, """SELECT c.id, c.title, c.status, c.priority, c.due_date, a.name account_name, a.id account_id
                                 FROM cards c JOIN accounts a ON a.id=c.account_id
                                 WHERE c.owner_id=? AND c.status NOT IN ('Done')
                                 ORDER BY CASE c.priority WHEN 'Urgent' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
                                 c.due_date LIMIT 8""", (user_id,))
        closed = saved["closed"] or 0
        return {
            "accounts": k["accounts"], "arr": (k["mrr"] or 0) * 12, "arr_at_risk": (k["mrr_at_risk"] or 0) * 12,
            "high_risk": k["high"] or 0, "medium_risk": k["medium"] or 0,
            "open_cards": cards["open"] or 0, "suggested_cards": cards["suggested"] or 0,
            "overdue_cards": cards["overdue"] or 0, "saved_90d": saved["saved"] or 0,
            "arr_saved_90d": saved["arr_saved"] or 0,
            "save_rate_90d": (saved["saved"] or 0) / closed if closed else None,
            "tiers": tiers, "by_reason": by_reason, "churn_trend": churn_trend, "top_accounts": top, "my_cards": mine,
        }
    finally:
        c.close()


# ------------------------------------------------------------------ accounts
SORTS = {"name": "a.name", "mrr": "a.mrr", "risk": "s.churn_prob", "rar": "s.revenue_at_risk",
         "ltv": "s.ltv", "renewal": "a.renewal_date", "segment": "a.segment"}


def _account_filters(search, tier, segment, owner_id, reason, status):
    where, params = ["1=1"], []
    if status in ("active", "churned"):
        where.append("a.status=?")
        params.append(status)
    if search:
        where.append("(a.name LIKE ? OR a.champion_name LIKE ?)")
        params += [f"%{search}%", f"%{search}%"]
    if tier:
        where.append("s.risk_tier=?")
        params.append(tier)
    if segment:
        where.append("a.segment=?")
        params.append(segment)
    if owner_id:
        where.append("a.owner_id=?")
        params.append(owner_id)
    if reason:
        where.append("s.top_reason=?")
        params.append(reason)
    return " AND ".join(where), params


@app.get("/api/accounts")
def accounts(search: str = "", tier: str = "", segment: str = "", owner_id: Optional[int] = None,
             reason: str = "", status: str = "active", sort: str = "rar", order: str = "desc",
             page: int = 1, page_size: int = Query(25, le=200)):
    c = conn()
    try:
        where, params = _account_filters(search, tier, segment, owner_id, reason, status)
        col = SORTS.get(sort, "s.revenue_at_risk")
        direction = "ASC" if order == "asc" else "DESC"
        base = f"FROM accounts a LEFT JOIN scores s ON s.account_id=a.id LEFT JOIN team t ON t.id=a.owner_id WHERE {where}"
        total = c.execute(f"SELECT COUNT(*) {base}", params).fetchone()[0]
        items = db.rows(c, f"""SELECT a.id, a.name, a.segment, a.plan, a.mrr, a.seats, a.renewal_date, a.status,
                    a.churn_date, a.is_control, t.name owner_name, t.color owner_color, s.churn_prob, s.risk_tier,
                    s.ltv, s.revenue_at_risk, s.top_reason,
                    (SELECT status FROM cards WHERE account_id=a.id AND status!='Done' LIMIT 1) card_status,
                    (SELECT outcome || '|' || substr(completed_at, 1, 10) FROM cards WHERE account_id=a.id AND status='Done'
                     AND outcome!='Dismissed' ORDER BY completed_at DESC LIMIT 1) last_closed
                    {base} ORDER BY {col} IS NULL, {col} {direction}, a.id LIMIT ? OFFSET ?""",
                        params + [page_size, (max(page, 1) - 1) * page_size])
        for r in items:
            r["reason_label"] = REASONS.get(r["top_reason"]) if r["top_reason"] else None
        return {"total": total, "page": page, "page_size": page_size, "items": items}
    finally:
        c.close()


@app.get("/api/accounts/{aid}")
def account(aid: int):
    c = conn()
    try:
        a = db.row(c, """SELECT a.*, t.name owner_name, t.color owner_color FROM accounts a
                         LEFT JOIN team t ON t.id=a.owner_id WHERE a.id=?""", (aid,))
        if not a:
            raise HTTPException(404, "Account not found")
        s = db.row(c, "SELECT * FROM scores WHERE account_id=?", (aid,))
        if s:
            s["reasons"] = db.jloads(s.pop("reasons_json"), [])
            s["recommendation"] = db.jloads(s.pop("recommendation_json"))
            s["features"] = db.jloads(s.pop("features_json"), {})
        usage = db.rows(c, """SELECT week_start, seats, mrr, active_users, sessions, features_used, champion_active
                              FROM usage_weekly WHERE account_id=? ORDER BY week_start DESC LIMIT 26""", (aid,))[::-1]
        tickets = db.rows(c, "SELECT * FROM tickets WHERE account_id=? ORDER BY created_at DESC LIMIT 12", (aid,))
        payments = db.rows(c, "SELECT * FROM payments WHERE account_id=? ORDER BY date DESC, id DESC LIMIT 10", (aid,))
        nps = db.rows(c, "SELECT * FROM nps WHERE account_id=? ORDER BY date DESC LIMIT 6", (aid,))
        cards = db.rows(c, """SELECT c.*, t.name owner_name FROM cards c LEFT JOIN team t ON t.id=c.owner_id
                              WHERE c.account_id=? ORDER BY c.created_at DESC""", (aid,))
        return {"account": a, "score": s, "usage": usage, "tickets": tickets, "payments": payments,
                "nps": nps, "cards": cards}
    finally:
        c.close()


@app.get("/api/export/accounts.csv")
def export_accounts(search: str = "", tier: str = "", segment: str = "", owner_id: Optional[int] = None,
                    reason: str = "", status: str = "active"):
    c = conn()
    try:
        where, params = _account_filters(search, tier, segment, owner_id, reason, status)
        items = db.rows(c, f"""SELECT a.id, a.name, a.segment, a.plan, a.seats, a.mrr, a.renewal_date, t.name owner,
                    s.churn_prob, s.risk_tier, s.ltv, s.revenue_at_risk, s.top_reason
                    FROM accounts a LEFT JOIN scores s ON s.account_id=a.id LEFT JOIN team t ON t.id=a.owner_id
                    WHERE {where} ORDER BY s.revenue_at_risk DESC""", params)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["Account ID", "Account", "Segment", "Plan", "Seats", "MRR", "ARR", "Renewal", "Owner",
                    "Churn risk %", "Risk tier", "LTV", "Revenue at risk", "Top reason"])
        for r in items:
            w.writerow([r["id"], r["name"], r["segment"], r["plan"], r["seats"], round(r["mrr"] or 0, 2),
                        round((r["mrr"] or 0) * 12, 2), r["renewal_date"], r["owner"],
                        round((r["churn_prob"] or 0) * 100, 1), r["risk_tier"], round(r["ltv"] or 0, 2),
                        round(r["revenue_at_risk"] or 0, 2), REASONS.get(r["top_reason"], "")])
        buf.seek(0)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=revenueiq_accounts.csv"})
    finally:
        c.close()


# ------------------------------------------------------------------ cards
CARD_SELECT = """SELECT c.*, a.name account_name, a.segment, a.mrr account_mrr, a.renewal_date, a.status account_status,
    s.churn_prob live_risk, s.risk_tier live_tier, s.revenue_at_risk live_rar,
    t.name owner_name, t.color owner_color
    FROM cards c JOIN accounts a ON a.id=c.account_id LEFT JOIN scores s ON s.account_id=c.account_id
    LEFT JOIN team t ON t.id=c.owner_id"""


@app.get("/api/cards")
def cards(owner_id: Optional[int] = None, search: str = "", done_days: int = 30, priority: str = ""):
    c = conn()
    try:
        where, params = ["(c.status!='Done' OR c.completed_at >= ?)"], []
        cutoff = (ref_date(c) - timedelta(days=done_days)).isoformat() if done_days > 0 else "0000"
        params.append(cutoff)
        where.append("COALESCE(c.outcome,'')!='Dismissed'")
        if owner_id:
            where.append("c.owner_id=?")
            params.append(owner_id)
        if search:
            where.append("(a.name LIKE ? OR c.title LIKE ?)")
            params += [f"%{search}%", f"%{search}%"]
        if priority:
            where.append("c.priority=?")
            params.append(priority)
        items = db.rows(c, f"{CARD_SELECT} WHERE {' AND '.join(where)} ORDER BY c.position, c.id", params)
        for r in items:
            r["reason_label"] = REASONS.get(r["reason_code"], r["reason_code"])
        return items
    finally:
        c.close()


def _card(c, cid):
    card = db.row(c, f"{CARD_SELECT} WHERE c.id=?", (cid,))
    if not card:
        raise HTTPException(404, "Card not found")
    card["reason_label"] = REASONS.get(card["reason_code"], card["reason_code"])
    return card


@app.get("/api/cards/{cid}")
def card(cid: int):
    c = conn()
    try:
        card = _card(c, cid)
        card["activity"] = db.rows(c, """SELECT ca.*, t.name actor_name, t.color actor_color FROM card_activity ca
                                         LEFT JOIN team t ON t.id=ca.actor_id WHERE ca.card_id=? ORDER BY ca.id""", (cid,))
        pb = db.row(c, "SELECT * FROM playbooks WHERE reason_code=?", (card["reason_code"],))
        card["steps"] = [s for s in (pb["steps"] if pb else "").split("\n") if s.strip()]
        s = db.row(c, "SELECT reasons_json FROM scores WHERE account_id=?", (card["account_id"],))
        card["reasons"] = db.jloads(s["reasons_json"], []) if s else []
        return card
    finally:
        c.close()


class CardCreate(BaseModel):
    account_id: int
    actor_id: Optional[int] = None
    reason_code: Optional[str] = None
    title: Optional[str] = None
    owner_id: Optional[int] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    value: Optional[float] = None
    note: Optional[str] = None


@app.post("/api/cards")
def create_card(body: CardCreate):
    c = conn()
    try:
        a = db.row(c, "SELECT * FROM accounts WHERE id=?", (body.account_id,))
        if not a:
            raise HTTPException(404, "Account not found")
        if a["status"] != "active":
            raise HTTPException(400, "This account has already churned.")
        if c.execute("SELECT 1 FROM cards WHERE account_id=? AND status!='Done'", (body.account_id,)).fetchone():
            raise HTTPException(409, "This account already has an open action card.")
        s = db.row(c, "SELECT * FROM scores WHERE account_id=?", (body.account_id,))
        rec = db.jloads(s["recommendation_json"]) if s else None
        code = body.reason_code or (rec["reason_code"] if rec else "USAGE_DECLINE")
        pb = db.row(c, "SELECT * FROM playbooks WHERE reason_code=?", (code,))
        if not pb:
            raise HTTPException(400, "Unknown reason code")
        priority = body.priority if body.priority in PRIORITIES else (rec["priority"] if rec else "Medium")
        due = body.due_date or (today() + timedelta(days=pb["sla_days"])).isoformat()
        cur = c.execute(
            "INSERT INTO cards(account_id, title, action_type, reason_code, description, status, priority, owner_id, "
            "due_date, created_at, updated_at, risk_at_creation, rar_at_creation, mrr_at_creation, source, position) "
            "VALUES(?,?,?,?,?,'To Do',?,?,?,?,?,?,?,?,?,?)",
            (a["id"], body.title or pb["action_title"], pb["action_type"], code, pb["description"], priority,
             body.owner_id or a["owner_id"], due, now_iso(), now_iso(), s["churn_prob"] if s else None,
             body.value if body.value is not None else (s["revenue_at_risk"] if s else None), a["mrr"],
             "expansion" if code == "EXPANSION" else "manual", -(s["revenue_at_risk"] if s else 0)))
        cid = cur.lastrowid
        log_activity(c, cid, body.actor_id, "created", body.note or ("Expansion opportunity created" if code == "EXPANSION" else "Card created manually"))
        if not a["is_control"] and code != "EXPANSION":
            c.execute("INSERT INTO treated_observations(account_id, flagged_at, reason_code, card_id) VALUES(?,?,?,?)",
                      (a["id"], today().isoformat(), code, cid))
        c.commit()
        return _card(c, cid)
    finally:
        c.close()


class CardUpdate(BaseModel):
    actor_id: Optional[int] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    title: Optional[str] = None
    position: Optional[float] = None


@app.patch("/api/cards/{cid}")
def update_card(cid: int, body: CardUpdate):
    c = conn()
    try:
        card = _card(c, cid)
        if card["status"] == "Done":
            raise HTTPException(400, "Completed cards are locked. Reopen the card to change it.")
        sets, params = [], []
        if body.status and body.status != card["status"]:
            if body.status == "Done":
                raise HTTPException(400, "Use complete to close a card with an outcome.")
            if body.status not in STATUSES:
                raise HTTPException(400, "Invalid status")
            sets.append("status=?")
            params.append(body.status)
            log_activity(c, cid, body.actor_id, "moved", f"Moved from {card['status']} to {body.status}")
        if body.owner_id and body.owner_id != card["owner_id"]:
            t = db.row(c, "SELECT name FROM team WHERE id=?", (body.owner_id,))
            if not t:
                raise HTTPException(400, "Unknown owner")
            sets.append("owner_id=?")
            params.append(body.owner_id)
            log_activity(c, cid, body.actor_id, "assigned", f"Assigned to {t['name']}")
        if body.due_date and body.due_date != card["due_date"]:
            date.fromisoformat(body.due_date)
            sets.append("due_date=?")
            params.append(body.due_date)
            log_activity(c, cid, body.actor_id, "updated", f"Due date set to {body.due_date}")
        if body.priority and body.priority != card["priority"]:
            if body.priority not in PRIORITIES:
                raise HTTPException(400, "Invalid priority")
            sets.append("priority=?")
            params.append(body.priority)
            log_activity(c, cid, body.actor_id, "updated", f"Priority changed to {body.priority}")
        if body.title and body.title.strip() != card["title"]:
            sets.append("title=?")
            params.append(body.title.strip())
            log_activity(c, cid, body.actor_id, "updated", "Title updated")
        if body.position is not None:
            sets.append("position=?")
            params.append(body.position)
        if sets:
            sets.append("updated_at=?")
            params.append(now_iso())
            c.execute(f"UPDATE cards SET {', '.join(sets)} WHERE id=?", params + [cid])
            c.commit()
        return _card(c, cid)
    finally:
        c.close()


class CardComplete(BaseModel):
    actor_id: Optional[int] = None
    outcome: str
    action_taken: str
    note: Optional[str] = None


@app.post("/api/cards/{cid}/complete")
def complete_card(cid: int, body: CardComplete):
    if not body.action_taken.strip():
        raise HTTPException(400, "Describe the action you took.")
    c = conn()
    try:
        card = _card(c, cid)
        allowed = EXPANSION_OUTCOMES if card["reason_code"] == "EXPANSION" else OUTCOMES
        if body.outcome not in allowed:
            raise HTTPException(400, "Choose an outcome: " + ", ".join(allowed))
        if card["status"] == "Done":
            raise HTTPException(400, "Card is already completed.")
        c.execute("UPDATE cards SET status='Done', outcome=?, action_taken=?, completed_at=?, updated_at=? WHERE id=?",
                  (body.outcome, body.action_taken.strip(), now_iso(), now_iso(), cid))
        if body.note and body.note.strip():
            log_activity(c, cid, body.actor_id, "comment", body.note.strip())
        log_activity(c, cid, body.actor_id, "completed", f"Completed - outcome: {body.outcome}")
        c.commit()
        return _card(c, cid)
    finally:
        c.close()


class Actor(BaseModel):
    actor_id: Optional[int] = None


@app.post("/api/cards/{cid}/reopen")
def reopen_card(cid: int, body: Actor):
    c = conn()
    try:
        card = _card(c, cid)
        if card["status"] != "Done":
            raise HTTPException(400, "Card is not completed.")
        if c.execute("SELECT 1 FROM cards WHERE account_id=? AND status!='Done' AND id!=?",
                     (card["account_id"], cid)).fetchone():
            raise HTTPException(409, "This account already has another open card.")
        c.execute("UPDATE cards SET status='To Do', outcome=NULL, action_taken=NULL, completed_at=NULL, updated_at=? "
                  "WHERE id=?", (now_iso(), cid))
        log_activity(c, cid, body.actor_id, "moved", "Card reopened")
        c.commit()
        return _card(c, cid)
    finally:
        c.close()


@app.post("/api/cards/{cid}/dismiss")
def dismiss_card(cid: int, body: Actor):
    c = conn()
    try:
        card = _card(c, cid)
        if card["status"] == "Done":
            raise HTTPException(400, "Card is already completed.")
        c.execute("UPDATE cards SET status='Done', outcome='Dismissed', completed_at=?, updated_at=? WHERE id=?",
                  (now_iso(), now_iso(), cid))
        c.execute("DELETE FROM treated_observations WHERE card_id=?", (cid,))
        log_activity(c, cid, body.actor_id, "dismissed", "Suggestion dismissed")
        c.commit()
        return {"ok": True}
    finally:
        c.close()


class Comment(BaseModel):
    actor_id: Optional[int] = None
    text: str


@app.post("/api/cards/{cid}/comments")
def comment(cid: int, body: Comment):
    if not body.text.strip():
        raise HTTPException(400, "Comment is empty")
    c = conn()
    try:
        _card(c, cid)
        log_activity(c, cid, body.actor_id, "comment", body.text.strip()[:2000])
        c.execute("UPDATE cards SET updated_at=? WHERE id=?", (now_iso(), cid))
        c.commit()
        return {"ok": True}
    finally:
        c.close()


# ------------------------------------------------------------------ impact
@app.get("/api/impact")
def impact():
    c = conn()
    try:
        ref = ref_date(c)
        done = "status='Done' AND reason_code!='EXPANSION' AND outcome IN ('Saved','Downgraded','Churned','No response')"
        outcomes = db.rows(c, f"SELECT outcome, COUNT(*) n, SUM(mrr_at_creation)*12 arr FROM cards WHERE {done} GROUP BY outcome")
        by_action = db.rows(c, f"""SELECT reason_code, title, COUNT(*) completed,
                    SUM(CASE WHEN outcome='Saved' THEN 1 ELSE 0 END) saved,
                    SUM(CASE WHEN outcome='Churned' THEN 1 ELSE 0 END) churned,
                    SUM(CASE WHEN outcome='Saved' THEN mrr_at_creation ELSE 0 END)*12 arr_saved
                    FROM cards WHERE {done} GROUP BY reason_code ORDER BY completed DESC""")
        for r in by_action:
            r["label"] = REASONS.get(r["reason_code"], r["reason_code"])
            r["save_rate"] = r["saved"] / r["completed"] if r["completed"] else 0
        monthly = []
        first = ref.replace(day=1)
        months = []
        for _ in range(7):
            months.append(first)
            first = (first - timedelta(days=1)).replace(day=1)
        for m in reversed(months):
            nxt = (m + timedelta(days=32)).replace(day=1)
            rr = db.rows(c, f"SELECT outcome, COUNT(*) n FROM cards WHERE {done} AND completed_at>=? AND completed_at<? GROUP BY outcome",
                         (m.isoformat(), nxt.isoformat()))
            monthly.append({"month": m.strftime("%b '%y"), **{o: 0 for o in OUTCOMES}, **{x["outcome"]: x["n"] for x in rr}})
        team = db.rows(c, f"""SELECT t.id, t.name, t.color, t.role,
                    (SELECT COUNT(*) FROM cards WHERE owner_id=t.id AND {done}) completed,
                    (SELECT COUNT(*) FROM cards WHERE owner_id=t.id AND outcome='Saved') saved,
                    (SELECT COALESCE(SUM(mrr_at_creation),0)*12 FROM cards WHERE owner_id=t.id AND outcome='Saved') arr_saved,
                    (SELECT COUNT(*) FROM cards WHERE owner_id=t.id AND status NOT IN ('Done')) open,
                    (SELECT COUNT(*) FROM cards WHERE owner_id=t.id AND status NOT IN ('Done','Suggested') AND due_date < ?) overdue
                    FROM team t ORDER BY arr_saved DESC""", (today().isoformat(),))
        for r in team:
            r["save_rate"] = r["saved"] / r["completed"] if r["completed"] else 0

        cutoff = (ref - timedelta(days=60)).isoformat()
        def group(table):
            g = db.row(c, f"""SELECT COUNT(*) n, AVG(a.mrr)*12 avg_arr,
                AVG(CASE WHEN a.churn_date IS NOT NULL AND julianday(a.churn_date) - julianday(o.flagged_at) BETWEEN 0 AND 60
                    THEN 1.0 ELSE 0 END) churn_rate
                FROM {table} o JOIN accounts a ON a.id=o.account_id WHERE o.flagged_at <= ?""", (cutoff,))
            return {"n": g["n"] or 0, "churn_rate": g["churn_rate"] or 0, "avg_arr": g["avg_arr"] or 0}
        treated, control = group("treated_observations"), group("control_observations")
        uplift = control["churn_rate"] - treated["churn_rate"]
        return {
            "outcomes": outcomes, "by_action": by_action, "monthly": monthly, "team": team,
            "experiment": {
                "treated": treated, "control": control, "absolute_reduction": uplift,
                "relative_reduction": uplift / control["churn_rate"] if control["churn_rate"] else 0,
                "accounts_saved_est": uplift * treated["n"],
                "arr_protected_est": max(0, uplift) * treated["n"] * treated["avg_arr"],
                "program_start": db.get_meta(c, "program_start"),
                "enough_data": treated["n"] >= 30 and control["n"] >= 15,
            },
        }
    finally:
        c.close()


# ------------------------------------------------------------------ model
@app.get("/api/model")
def model_info():
    c = conn()
    try:
        run = db.row(c, "SELECT * FROM model_runs WHERE is_active=1")
        if run:
            for k in ["metrics", "importance", "calibration", "comparison"]:
                run[k] = db.jloads(run.pop(k + "_json"), [])
        history = db.rows(c, "SELECT id, created_at, version, algorithm, metrics_json, is_active FROM model_runs ORDER BY id DESC LIMIT 10")
        for h in history:
            m = db.jloads(h.pop("metrics_json"), {})
            h["roc_auc"], h["pr_auc"], h["lift_top10"] = m.get("roc_auc"), m.get("pr_auc"), m.get("lift_top10")
        dist = db.rows(c, """SELECT CAST(MIN(churn_prob*20, 19) AS INTEGER) bucket, COUNT(*) n FROM scores GROUP BY bucket ORDER BY bucket""")
        return {"active": run, "history": history, "distribution": dist}
    finally:
        c.close()


# ------------------------------------------------------------------ playbooks
@app.get("/api/playbooks")
def playbooks():
    c = conn()
    try:
        items = db.rows(c, "SELECT * FROM playbooks ORDER BY rowid")
        counts = {r["top_reason"]: r["n"] for r in db.rows(c, "SELECT top_reason, COUNT(*) n FROM scores WHERE risk_tier IN ('High','Medium') GROUP BY top_reason")}
        for p in items:
            p["at_risk_accounts"] = counts.get(p["reason_code"], 0)
        return items
    finally:
        c.close()


class PlaybookUpdate(BaseModel):
    action_title: str
    description: str
    steps: str
    sla_days: int
    enabled: bool


@app.put("/api/playbooks/{code}")
def update_playbook(code: str, body: PlaybookUpdate):
    if not body.action_title.strip():
        raise HTTPException(400, "Action title is required")
    if not 1 <= body.sla_days <= 60:
        raise HTTPException(400, "SLA must be between 1 and 60 days")
    c = conn()
    try:
        if not c.execute("SELECT 1 FROM playbooks WHERE reason_code=?", (code,)).fetchone():
            raise HTTPException(404, "Playbook not found")
        c.execute("UPDATE playbooks SET action_title=?, description=?, steps=?, sla_days=?, enabled=? WHERE reason_code=?",
                  (body.action_title.strip(), body.description.strip(), body.steps.strip(), body.sla_days,
                   int(body.enabled), code))
        c.commit()
        return db.row(c, "SELECT * FROM playbooks WHERE reason_code=?", (code,))
    finally:
        c.close()


# ------------------------------------------------------------------ insights
@app.get("/api/signals")
def get_signals(include_reviewed: bool = False):
    c = conn()
    try:
        return _insights().signals(c, include_reviewed)
    finally:
        c.close()


class Review(BaseModel):
    key: str
    actor_id: Optional[int] = None
    undo: bool = False


@app.post("/api/signals/review")
def review_signal(body: Review):
    c = conn()
    try:
        if body.undo:
            c.execute("DELETE FROM signal_reviews WHERE signal_key=?", (body.key,))
        else:
            c.execute("INSERT OR REPLACE INTO signal_reviews VALUES(?,?,?)", (body.key, now_iso(), body.actor_id))
        c.commit()
        return {"ok": True}
    finally:
        c.close()


@app.get("/api/renewals")
def get_renewals(days: int = Query(120, ge=7, le=365), owner_id: Optional[int] = None):
    c = conn()
    try:
        return _insights().renewals(c, days, owner_id)
    finally:
        c.close()


@app.get("/api/expansion")
def get_expansion():
    c = conn()
    try:
        return _insights().expansion(c)
    finally:
        c.close()


@app.get("/api/revenue")
def get_revenue():
    c = conn()
    try:
        return _insights().revenue(c)
    finally:
        c.close()


# ------------------------------------------------------------------ static UI
app.mount("/static", StaticFiles(directory=FRONTEND), name="static")


@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html", headers={"Cache-Control": "no-store"})
