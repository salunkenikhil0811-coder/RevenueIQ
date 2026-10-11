"""Synthetic SaaS data generator.

Simulates ~2 years of weekly history for a B2B SaaS company: accounts, seats,
product usage, support tickets, payments, NPS and churn. Churn is driven by a
hidden hazard model (engagement, champion loss, support friction, failed
payments, contract renewals), so the ML model has real signal to learn.

It also simulates a retention programme that started ~7 months ago: risky
accounts were flagged, 10% were held out as a control group, and the rest got
an action whose effect on churn is real inside the simulation. That gives the
Impact page an honest treated-vs-control comparison.
"""
import math
import random
from datetime import date, timedelta

from . import db
from .playbooks import seed_playbooks, load_playbooks

N_ACCOUNTS = 1500
N_WEEKS = 104
PROGRAM_WEEKS = 30  # retention programme started this many weeks before today

TEAM = [
    (1, "Priya Sharma", "priya@revenueiq.local", "Senior CSM", "#6366f1"),
    (2, "Marcus Chen", "marcus@revenueiq.local", "CSM", "#0ea5e9"),
    (3, "Sofia Alvarez", "sofia@revenueiq.local", "CSM", "#10b981"),
    (4, "James Okafor", "james@revenueiq.local", "Senior CSM", "#f59e0b"),
    (5, "Emma Larsson", "emma@revenueiq.local", "Retention Lead", "#ec4899"),
]

PREFIX = ["Blue", "Nova", "Apex", "Summit", "Iron", "Bright", "Cedar", "Pixel", "Quantum",
          "Silver", "Harbor", "Lumen", "Atlas", "Vertex", "Echo", "Orbit", "Pine", "Crimson",
          "Swift", "North", "Granite", "Coral", "Falcon", "Maple", "Zenith", "Aurora", "Delta",
          "Polar", "Velvet", "Cobalt", "Ember", "Sierra", "Onyx", "Willow", "Titan", "Lunar",
          "Sapphire", "Redwood", "Horizon", "Nimbus", "Beacon", "Prism", "Stellar", "Kestrel",
          "Meridian", "Oak", "Rapid", "Solar", "Tidal", "Urban"]
SUFFIX = ["Labs", "Systems", "Logistics", "Health", "Media", "Analytics", "Foods", "Partners",
          "Retail", "Dynamics", "Studios", "Capital", "Works", "Robotics", "Energy", "Networks",
          "Cloud", "Group", "Solutions", "Ventures", "Biotech", "Freight", "Insurance", "Legal",
          "Learning", "Motors", "Apparel", "Realty", "Security", "Travel", "Software", "Pharma",
          "Consulting", "Payments", "Interactive"]
INDUSTRIES = ["Software", "Healthcare", "Retail", "Finance", "Logistics", "Education",
              "Manufacturing", "Media", "Real Estate", "Professional Services"]
REGIONS = [("North America", 0.45), ("Europe", 0.30), ("APAC", 0.17), ("LATAM", 0.08)]
FIRST = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie", "Avery",
         "Quinn", "Rohan", "Aisha", "Wei", "Lena", "Diego", "Noah", "Mia", "Ibrahim", "Yuki",
         "Olivia", "Arjun", "Fatima", "Lucas", "Chloe", "Mateo", "Hana", "Ethan", "Zara"]
LAST = ["Patel", "Smith", "Kim", "Garcia", "Muller", "Rossi", "Nguyen", "Johnson", "Silva",
        "Brown", "Kowalski", "Tanaka", "Ali", "Dubois", "Novak", "Haddad", "Reyes", "Singh",
        "Andersen", "Costa", "Walker", "Ivanova", "Mensah", "Fischer"]
TICKET_SUBJECTS = {
    "Bug": ["Dashboard not loading", "Report shows wrong totals", "Export button errors",
            "Notifications stopped working"],
    "Performance": ["App very slow this week", "Timeouts on large projects", "Search is lagging"],
    "Integration": ["Salesforce sync failing", "Slack integration disconnected", "API returns 500"],
    "Billing": ["Question about invoice", "Card was charged twice", "Need to update billing contact"],
    "Access": ["Cannot log in with SSO", "User locked out", "Need admin rights reset"],
    "How-to": ["How do I set up permissions?", "How to build a custom report", "Bulk import help"],
    "Feature request": ["Request: Gantt view", "Request: better mobile app", "Request: audit log"],
}

SEGMENTS = {
    # weight, seat range (lognormal mu, sigma, min, max), annual share, card share, base hazard
    "SMB": (0.55, (2.3, 0.6, 3, 40), 0.25, 0.90, 0.0055),
    "Mid-Market": (0.32, (4.0, 0.5, 25, 250), 0.55, 0.45, 0.0030),
    "Enterprise": (0.13, (5.7, 0.55, 150, 1500), 0.90, 0.10, 0.0015),
}
PLANS = {"SMB": [("Starter", 15), ("Growth", 29)],
         "Mid-Market": [("Growth", 29), ("Business", 45)],
         "Enterprise": [("Business", 45), ("Enterprise", 55)]}


def _poisson(r, lam):
    if lam <= 0:
        return 0
    L, k, p = math.exp(-lam), 0, 1.0
    while True:
        p *= r.random()
        if p <= L:
            return k
        k += 1


def _weighted(r, items):
    x, acc = r.random(), 0.0
    for v, w in items:
        acc += w
        if x <= acc:
            return v
    return items[-1][0]


def generate(conn, seed=42, n_accounts=N_ACCOUNTS, today=None):
    r = random.Random(seed)
    today = today or date.today()
    today_week = today - timedelta(days=today.weekday())
    start = today_week - timedelta(weeks=N_WEEKS)
    program_w = N_WEEKS - PROGRAM_WEEKS

    db.init_schema(conn)
    for t in ["accounts", "usage_weekly", "tickets", "payments", "nps", "scores", "cards",
              "card_activity", "control_observations", "treated_observations", "team",
              "playbooks", "model_runs", "meta"]:
        conn.execute(f"DELETE FROM {t}")
    conn.executemany("INSERT INTO team VALUES(?,?,?,?,?)", TEAM)
    seed_playbooks(conn)
    playbooks = load_playbooks(conn)

    names = [f"{p} {s}" for p in PREFIX for s in SUFFIX]
    r.shuffle(names)

    usage_rows, ticket_rows, payment_rows, nps_rows = [], [], [], []
    account_rows, flags = [], []

    for aid in range(1, n_accounts + 1):
        seg = _weighted(r, [(k, v[0]) for k, v in SEGMENTS.items()])
        _, (mu, sd, smin, smax), annual_share, card_share, base_h = SEGMENTS[seg]
        seats = int(min(smax, max(smin, round(math.exp(r.gauss(mu, sd))))))
        plan, price = r.choice(PLANS[seg])
        cycle = "Annual" if r.random() < annual_share else "Monthly"
        method = "Card" if r.random() < card_share else "Invoice"
        q = r.gauss(0, 1)
        is_control = 1 if r.random() < 0.10 else 0
        owner = r.choice([1, 4]) if seg == "Enterprise" and r.random() < 0.7 else r.randint(1, 5)

        if r.random() < 0.35:
            signup_w = -r.randint(4, 150)
        else:
            signup_w = r.randint(0, N_WEEKS - 4)
        signup_date = start + timedelta(weeks=signup_w, days=r.randint(0, 6))

        e = min(0.95, max(0.15, 0.55 + 0.12 * q + r.gauss(0, 0.08)))
        e_hist = []
        champ, champ_lost_age = True, None
        hi_tix, last_nps = 0.0, None
        pending_fail = None
        downgrade_until = -1
        interv_until, interv_effect, interv_type = -1, 1.0, None
        last_flag_w = -999
        status, churn_date, churn_type = "active", None, None
        downgrades = []

        for w in range(max(0, signup_w), N_WEEKS):
            age = w - signup_w
            wk = start + timedelta(weeks=w)

            # --- engagement dynamics
            target = 0.55 + 0.12 * q
            drift = 0.0025 * q - 0.0008 + 0.02 * (target - e)
            if not champ and champ_lost_age is not None and age - champ_lost_age < 14:
                drift -= 0.011
            if hi_tix > 2:
                drift -= 0.004
            e = min(0.98, max(0.03, e + drift + r.gauss(0, 0.025)))
            ramp = 0.55 + 0.45 * min(1.0, age / 8) if age < 8 else 1.0
            e_eff = e * ramp
            e_hist.append(e_eff)

            # --- champion
            if champ and r.random() < 0.004 + 0.003 * max(0, -q):
                champ, champ_lost_age = False, age
            elif not champ and r.random() < 0.04:
                champ, champ_lost_age = True, None

            # --- usage
            active = max(0, round(seats * e_eff * r.uniform(0.85, 1.08)))
            if e_eff < 0.2 and r.random() < 0.25:
                active = 0
            sessions = int(active * (2 + 8 * e_eff) * r.uniform(0.8, 1.2))
            feats = int(min(10, max(0, round(1 + 9 * e_eff + r.gauss(0, 0.8)))))
            mrr = seats * price
            usage_rows.append((aid, wk.isoformat(), seats, mrr, active, sessions, feats, int(champ)))

            # --- support tickets
            hi_tix *= 0.85
            lam = (0.05 + 0.35 * (1 - e_eff)) * (1 + math.log10(seats + 1) / 1.5)
            n_t = _poisson(r, lam) + (3 if r.random() < 0.01 else 0)
            for _ in range(n_t):
                cat = _weighted(r, [("Bug", 0.22), ("Performance", 0.12), ("Integration", 0.12),
                                    ("Billing", 0.1), ("Access", 0.12), ("How-to", 0.2),
                                    ("Feature request", 0.12)])
                x = r.random()
                sev = "High" if x < 0.08 + 0.3 * (1 - e_eff) else ("Medium" if x < 0.55 else "Low")
                y = r.random()
                sent = "Negative" if y < 0.15 + 0.5 * (1 - e_eff) else ("Neutral" if y < 0.75 else "Positive")
                hours = round(math.exp(r.gauss(2.8 + (0.9 if sev == "High" else 0), 0.7)), 1)
                if interv_type == "SUPPORT_FRICTION" and w <= interv_until:
                    hours = round(hours * 0.5, 1)
                ticket_rows.append((aid, (wk + timedelta(days=r.randint(0, 6))).isoformat(), sev, cat,
                                    r.choice(TICKET_SUBJECTS[cat]), sent, hours))
                hi_tix += (1.0 if sev == "High" else 0) + (0.6 if sent == "Negative" else 0) + (0.5 if hours > 72 else 0)

            # --- NPS
            if age > 0 and age % 13 == 0 and r.random() < 0.45:
                last_nps = int(min(10, max(0, round(4 + 6 * e_eff + r.gauss(0, 1.5)))))
                nps_rows.append((aid, (wk + timedelta(days=2)).isoformat(), last_nps))

            # --- billing, seat changes
            bill_week = (age > 0 and age % 4 == 0) if cycle == "Monthly" else (age % 52 == 0)
            if bill_week:
                amount = mrr if cycle == "Monthly" else mrr * 12
                fail_p = (0.05 if method == "Card" else 0.012) * (1.5 if q < -0.5 else 1)
                pdate = (wk + timedelta(days=1)).isoformat()
                if pending_fail is None and r.random() < fail_p:
                    payment_rows.append((aid, pdate, amount, "failed"))
                    pending_fail = 0
                else:
                    payment_rows.append((aid, pdate, amount, "paid"))
                if age >= 4 and age % 4 == 0:
                    if e_eff > 0.72 and r.random() < 0.10:
                        seats = max(seats + 1, int(seats * r.uniform(1.05, 1.25)))
                    elif e_eff < 0.38 and r.random() < 0.15:
                        seats = max(1, int(seats * r.uniform(0.7, 0.9)))
                        downgrade_until = w + 12
                        downgrades.append(w)

            # --- hazard
            h = base_h * math.exp(3.0 * (0.55 - e_eff))
            if not champ:
                h *= 1.8
            h *= 1 + 0.35 * min(hi_tix, 4)
            if last_nps is not None and last_nps <= 6:
                h *= 1.35
            if age < 12:
                h *= 1.3
            if w <= downgrade_until:
                h *= 1.3
            raw_h = min(h, 0.25)

            # --- retention programme flags (before applying effect this week)
            if w >= program_w and w - last_flag_w >= 10:
                risk8 = 1 - (1 - raw_h) ** 8
                if (risk8 > 0.07 or pending_fail is not None) and r.random() < 0.30:
                    if pending_fail is not None:
                        reason = "PAYMENT_ISSUE"
                    elif not champ:
                        reason = "CHAMPION_LOST"
                    elif hi_tix >= 1.5:
                        reason = "SUPPORT_FRICTION"
                    elif age < 12:
                        reason = "NEW_CUSTOMER"
                    elif w <= downgrade_until:
                        reason = "DOWNGRADE_SIGNAL"
                    elif len(e_hist) > 8 and e_eff < e_hist[-9] - 0.08:
                        reason = "USAGE_DECLINE"
                    elif last_nps is not None and last_nps <= 6:
                        reason = "LOW_SATISFACTION"
                    elif cycle == "Annual" and (52 - age % 52) <= 10:
                        reason = "RENEWAL_RISK"
                    else:
                        reason = "LOW_ADOPTION"
                    last_flag_w = w
                    no_response = (not is_control) and r.random() < 0.10
                    flags.append({"aid": aid, "w": w, "reason": reason, "control": is_control,
                                  "no_response": no_response, "rar_mrr": mrr, "risk": risk8})
                    if not is_control and not no_response:
                        interv_until = w + 12
                        interv_effect = r.uniform(0.35, 0.65)
                        interv_type = reason
                        if reason == "CHAMPION_LOST" and r.random() < 0.35:
                            champ, champ_lost_age = True, None
                        if reason in ("LOW_ADOPTION", "USAGE_DECLINE", "NEW_CUSTOMER"):
                            e = min(0.98, e + r.uniform(0.04, 0.10))
                        if reason == "SUPPORT_FRICTION":
                            hi_tix *= 0.4

            if w <= interv_until:
                h *= interv_effect
            h = min(h, 0.25)

            # --- churn decision
            churned = False
            if pending_fail is not None:
                pending_fail += 1
                rec_p = 0.8 if (interv_type == "PAYMENT_ISSUE" and w <= interv_until) else 0.45
                if r.random() < rec_p:
                    payment_rows.append((aid, (wk + timedelta(days=r.randint(1, 6))).isoformat(),
                                         mrr if cycle == "Monthly" else mrr * 12, "recovered"))
                    pending_fail = None
                elif pending_fail >= 6 or (pending_fail >= 3 and r.random() < 0.35):
                    churned, churn_type = True, "Involuntary"
            if not churned:
                if cycle == "Monthly":
                    churned = r.random() < h
                elif age > 0 and age % 52 == 51:
                    churned = r.random() < (1 - (1 - h) ** 52) * 0.85
                if churned:
                    churn_type = "Voluntary"
            if churned:
                status = "churned"
                churn_date = wk + timedelta(days=r.randint(1, 6))
                if churn_date >= today:
                    churn_date = today - timedelta(days=1)
                break

        # current renewal date
        renewal = None
        if status == "active":
            if cycle == "Annual":
                renewal = signup_date
                while renewal <= today:
                    renewal = renewal.replace(year=renewal.year + 1) if not (renewal.month == 2 and renewal.day == 29) else renewal + timedelta(days=365)
            else:
                renewal = signup_date
                while renewal <= today:
                    renewal += timedelta(days=30)
        champ_name = f"{r.choice(FIRST)} {r.choice(LAST)}"
        account_rows.append((
            aid, names[aid - 1], r.choice(INDUSTRIES), _weighted(r, REGIONS), seg, plan, cycle,
            method, seats, seats * price, signup_date.isoformat(),
            renewal.isoformat() if renewal else None, owner, champ_name,
            champ_name.lower().replace(" ", ".") + "@" + names[aid - 1].lower().replace(" ", "") + ".com",
            status, churn_date.isoformat() if churn_date else None, churn_type, is_control,
        ))
        for f in reversed(flags):
            if f["aid"] != aid:
                break
            f["churn_date"] = churn_date
            f["downgrades"] = downgrades

    conn.executemany("INSERT INTO accounts VALUES(" + ",".join("?" * 19) + ")", account_rows)
    conn.executemany("INSERT INTO usage_weekly VALUES(?,?,?,?,?,?,?,?)", usage_rows)
    conn.executemany("INSERT INTO tickets(account_id, created_at, severity, category, subject, sentiment, resolution_hours) VALUES(?,?,?,?,?,?,?)", ticket_rows)
    conn.executemany("INSERT INTO payments(account_id, date, amount, status) VALUES(?,?,?,?)", payment_rows)
    conn.executemany("INSERT INTO nps VALUES(?,?,?)", nps_rows)

    owners = {a[0]: a[12] for a in account_rows}
    _write_history_cards(conn, r, flags, owners, playbooks, start, today)

    db.set_meta(conn, "today", today.isoformat())
    db.set_meta(conn, "program_start", (start + timedelta(weeks=program_w)).isoformat())
    db.set_meta(conn, "seed", seed)
    conn.commit()
    return {"accounts": len(account_rows), "usage_rows": len(usage_rows),
            "tickets": len(ticket_rows), "flags": len(flags)}


def _write_history_cards(conn, r, flags, owners, playbooks, start, today):
    """Turn simulated programme flags into kanban cards with outcomes."""
    open_statuses = ["To Do", "In Progress", "Waiting on Customer"]
    for f in flags:
        flagged = start + timedelta(weeks=f["w"], days=r.randint(0, 2))
        if flagged >= today:
            flagged = today - timedelta(days=1)
        if f["control"]:
            conn.execute("INSERT INTO control_observations(account_id, flagged_at, reason_code) VALUES(?,?,?)",
                         (f["aid"], flagged.isoformat(), f["reason"]))
            continue
        pb = playbooks[f["reason"]]
        churn = f["churn_date"]
        owner = owners[f["aid"]]
        age_days = (today - flagged).days
        completed = flagged + timedelta(days=r.randint(10, 40))
        if churn and churn <= completed:
            completed = churn + timedelta(days=r.randint(0, 3))
        is_open = age_days < 21 and not (churn and churn < today)
        if not is_open and completed >= today:
            completed = today - timedelta(days=1)
        if is_open:
            status, outcome, comp = r.choice(open_statuses), None, None
        else:
            status, comp = "Done", completed.isoformat()
            fw = (flagged - start).days // 7
            cw = (completed - start).days // 7
            if churn and churn <= completed:
                outcome = "Churned"
            elif any(fw <= d <= cw for d in f["downgrades"]):
                outcome = "Downgraded"
            elif f["no_response"]:
                outcome = "No response"
            else:
                outcome = "Saved"
        prio = "Urgent" if f["reason"] == "PAYMENT_ISSUE" else _weighted(r, [("High", 0.3), ("Medium", 0.5), ("Low", 0.2)])
        due = flagged + timedelta(days=pb["sla_days"] + (r.randint(4, 24) if is_open else 0))
        cur = conn.execute(
            "INSERT INTO cards(account_id, title, action_type, reason_code, description, status, priority, "
            "owner_id, due_date, created_at, updated_at, completed_at, outcome, action_taken, risk_at_creation, "
            "rar_at_creation, mrr_at_creation, source, position) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (f["aid"], pb["action_title"], pb["action_type"], f["reason"], pb["description"], status, prio,
             owner, due.isoformat(), flagged.isoformat(), (comp or flagged.isoformat()), comp, outcome,
             pb["action_title"] if comp else None, round(min(0.95, f["risk"] * 3), 3),
             None, f["rar_mrr"], "auto", r.random()),
        )
        cid = cur.lastrowid
        conn.execute("INSERT INTO treated_observations(account_id, flagged_at, reason_code, card_id) VALUES(?,?,?,?)",
                     (f["aid"], flagged.isoformat(), f["reason"], cid))
        acts = [(cid, flagged.isoformat(), None, "created", f"Card created by RevenueIQ - {pb['label']}")]
        if status != "To Do":
            acts.append((cid, (flagged + timedelta(days=1)).isoformat(), owner, "moved", "Moved to In Progress"))
        if status == "Waiting on Customer" or comp:
            acts.append((cid, (flagged + timedelta(days=3)).isoformat(), owner, "comment",
                         r.choice(["Reached out by email, waiting for reply.", "Call booked with the customer.",
                                   "Shared resources and next steps.", "Spoke with the main contact."])))
        if comp:
            acts.append((cid, comp, owner, "completed", f"Completed - outcome: {outcome}"))
        conn.executemany("INSERT INTO card_activity(card_id, created_at, actor_id, kind, text) VALUES(?,?,?,?,?)", acts)
