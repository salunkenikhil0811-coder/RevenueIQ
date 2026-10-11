"""Reason codes and the retention playbooks that map each reason to an action."""

REASONS = {
    "PAYMENT_ISSUE": "Payment issue",
    "CHAMPION_LOST": "Champion lost",
    "USAGE_DECLINE": "Usage decline",
    "LOW_ADOPTION": "Low adoption",
    "SUPPORT_FRICTION": "Support friction",
    "DOWNGRADE_SIGNAL": "Downgrade signal",
    "RENEWAL_RISK": "Renewal approaching",
    "LOW_SATISFACTION": "Low satisfaction",
    "NEW_CUSTOMER": "Onboarding risk",
    "EXPANSION": "Expansion opportunity",
}

# Which model feature feeds which reason code. Profile features (seats, mrr,
# segment) influence the score but are not actionable, so they map to None.
FEATURE_REASON = {
    "seat_utilization": "LOW_ADOPTION",
    "features_used": "LOW_ADOPTION",
    "sessions_per_user": "LOW_ADOPTION",
    "active_users_trend": "USAGE_DECLINE",
    "sessions_trend": "USAGE_DECLINE",
    "features_trend": "USAGE_DECLINE",
    "zero_activity_weeks": "USAGE_DECLINE",
    "champion_inactive_weeks": "CHAMPION_LOST",
    "failed_payments_90d": "PAYMENT_ISSUE",
    "unresolved_payment": "PAYMENT_ISSUE",
    "tickets_90d": "SUPPORT_FRICTION",
    "high_sev_tickets_90d": "SUPPORT_FRICTION",
    "neg_ticket_ratio": "SUPPORT_FRICTION",
    "avg_resolution_hours": "SUPPORT_FRICTION",
    "mrr_change_90d": "DOWNGRADE_SIGNAL",
    "days_to_renewal": "RENEWAL_RISK",
    "is_annual": "RENEWAL_RISK",
    "last_nps": "LOW_SATISFACTION",
    "tenure_days": "NEW_CUSTOMER",
    "seats": None,
    "mrr": None,
    "segment_code": None,
}

DEFAULT_PLAYBOOKS = [
    {
        "reason_code": "PAYMENT_ISSUE",
        "action_type": "payment_recovery",
        "action_title": "Recover failed payment",
        "description": "The account has a failed or unresolved payment. Involuntary churn is the easiest churn to prevent - act fast.",
        "steps": "Confirm the failure reason in billing\nSend a secure card-update link to the billing contact\nCall the billing contact if not fixed within 48h\nOffer invoice billing for larger accounts",
        "sla_days": 2,
    },
    {
        "reason_code": "CHAMPION_LOST",
        "action_type": "exec_outreach",
        "action_title": "Re-establish a champion",
        "description": "The main day-to-day user has gone quiet. Accounts without a champion churn far more often.",
        "steps": "Check LinkedIn / CRM for role changes\nIdentify the next most active user\nBook an intro call with the new owner\nLoop in an executive sponsor for high-value accounts",
        "sla_days": 5,
    },
    {
        "reason_code": "USAGE_DECLINE",
        "action_type": "health_check",
        "action_title": "Run a health-check call",
        "description": "Active usage is dropping compared with the previous two months.",
        "steps": "Review which teams or features dropped off\nBook a 30-minute health-check call\nAgree on 2-3 success goals for the next 30 days\nSchedule a follow-up in 2 weeks",
        "sla_days": 5,
    },
    {
        "reason_code": "LOW_ADOPTION",
        "action_type": "training",
        "action_title": "Run an adoption workshop",
        "description": "Only a small share of paid seats and core features are used, so the customer is not getting full value.",
        "steps": "Identify inactive seats and unused core features\nRun a live training / workshop for the team\nShare short how-to guides for top 3 unused features\nRe-check seat utilisation after 2 weeks",
        "sla_days": 7,
    },
    {
        "reason_code": "SUPPORT_FRICTION",
        "action_type": "support_escalation",
        "action_title": "Escalate and resolve open issues",
        "description": "High ticket volume, severe issues or negative sentiment are hurting the relationship.",
        "steps": "Review open and recent high-severity tickets\nEscalate blockers to support / engineering lead\nCall the customer with a resolution plan\nConfirm resolution and ask for feedback",
        "sla_days": 3,
    },
    {
        "reason_code": "DOWNGRADE_SIGNAL",
        "action_type": "value_review",
        "action_title": "Value review and plan right-sizing",
        "description": "The account recently reduced seats or MRR - often a step before cancelling.",
        "steps": "Prepare an ROI / usage summary\nUnderstand why seats were removed\nOffer the right plan instead of losing the account\nDocument the agreed plan",
        "sla_days": 7,
    },
    {
        "reason_code": "RENEWAL_RISK",
        "action_type": "renewal_outreach",
        "action_title": "Start the renewal conversation early",
        "description": "Renewal is close and risk signals are present. Start early so there is time to fix issues.",
        "steps": "Prepare a renewal pack with value delivered\nBook a renewal call with the decision maker\nAddress open concerns before the renewal date\nConfirm renewal terms in writing",
        "sla_days": 7,
    },
    {
        "reason_code": "LOW_SATISFACTION",
        "action_type": "feedback_loop",
        "action_title": "Close the loop on feedback",
        "description": "Recent NPS shows the customer is unhappy.",
        "steps": "Read the NPS comment and recent tickets\nCall the respondent within 48h\nAgree on a fix or workaround\nFollow up when the fix ships",
        "sla_days": 5,
    },
    {
        "reason_code": "NEW_CUSTOMER",
        "action_type": "onboarding",
        "action_title": "Onboarding rescue session",
        "description": "A new customer is not ramping up as expected during onboarding.",
        "steps": "Check onboarding checklist progress\nRun a guided setup session\nConnect key integrations together\nSet a 30-day success milestone",
        "sla_days": 5,
    },
    {
        "reason_code": "EXPANSION",
        "action_type": "expansion",
        "action_title": "Expansion conversation",
        "description": "Strong usage and full seats signal room to grow. Help the customer get more value with more seats or a higher plan.",
        "steps": "Review seat usage and feature adoption\nPrepare a value summary with usage highlights\nBook a growth conversation with the decision maker\nSend a tailored seat or plan proposal",
        "sla_days": 10,
    },
]


def seed_playbooks(conn):
    for p in DEFAULT_PLAYBOOKS:
        conn.execute(
            "INSERT OR REPLACE INTO playbooks(reason_code, label, action_type, action_title, "
            "description, steps, sla_days, enabled) VALUES(?,?,?,?,?,?,?,1)",
            (p["reason_code"], REASONS[p["reason_code"]], p["action_type"], p["action_title"],
             p["description"], p["steps"], p["sla_days"]),
        )


def load_playbooks(conn):
    out = {}
    for r in conn.execute("SELECT * FROM playbooks").fetchall():
        out[r["reason_code"]] = dict(r)
    return out
