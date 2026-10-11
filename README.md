# RevenueIQ - Revenue Intelligence Platform

RevenueIQ predicts which SaaS customers are about to cancel their subscription, ranks them by how much revenue
is at stake, explains why, recommends a retention action and tracks that action on a kanban board until it is done.
Recorded outcomes, plus a 10% control group, show whether the retention work actually saves revenue.

Everything runs locally on your PC with no database server and no cloud account.

## Quick start (Windows)

1. Install **Python 3.10 or newer** from https://www.python.org/downloads/ (tick **"Add python.exe to PATH"**).
2. Unzip the project anywhere.
3. Double-click **`run.bat`**.

On first run, `run.bat` sets everything up automatically:

| Step | What happens | Time |
|---|---|---|
| 1 | Finds Python and creates a shared environment in `%LOCALAPPDATA%\RevenueIQ\env` with the packages | 1-2 min, **once per PC** |
| 2 | Starts the app and opens **http://127.0.0.1:8000** in your browser | ~1.5 s |
| 3 | First run in a folder: the browser shows a setup screen while demo data is generated and the churn model is trained | ~20 s, first run only |

Every later start takes about **1.5 seconds**. The package environment is shared by all RevenueIQ folders on
the PC, so unzipping a new version does not reinstall anything (packages are only reinstalled if
`requirements.txt` changes). Keep the black window open while you use the app. Close it to stop.

- **`reset.bat`** deletes all data. The next `run.bat` builds fresh demo data.
- To remove the shared package environment completely, delete the folder `%LOCALAPPDATA%\RevenueIQ`
  (run.bat recreates it when needed, and repairs it automatically if a package goes missing).
- If port 8000 is busy, the next free port (8001, 8002, ...) is used and printed in the window.

## What's inside

| Page | What it does |
|---|---|
| **Dashboard** | ARR, ARR at risk, high-risk accounts, open/overdue actions, ARR saved, risk tiers, risk by reason, top accounts, your personal queue, monthly churned MRR (voluntary vs payment failures) |
| **Accounts** | Search, filter (risk tier, segment, owner, reason, status), sort, paginate, export to CSV |
| **Account detail** | Churn-risk gauge, LTV, revenue at risk, the reasons behind the risk, recommended playbook, usage chart, tickets, payments, NPS, action history, one-click "Create action card" |
| **Action Board** | Section tabs (Suggested, To Do, In Progress, Waiting, Done) with a card grid. Accept/dismiss, one-click next step (Start, Complete), move menu, drag cards onto tabs, owner, priority, due date, notes, activity log. Completing a card requires an outcome |
| **Signals** | Live feed of important events: failed payments, renewals at risk, risk jumps, usage drops, champion gone quiet, support escalations, detractor NPS, seats nearly full. Turn any signal into an action card, mark as reviewed, see the biggest risk movers over 30 days |
| **Renewals** | Annual renewals for the next 30-180 days: renewing ARR, forecast to renew, ARR at risk, at-risk renewals with no plan, forecast chart by window, one-click "Create plan" |
| **Expansion** | Upsell opportunities scored 0-100 from seat usage, user growth, NPS and feature adoption, with play (seat expansion / plan upgrade) and estimated extra ARR. Expansion cards close as Expanded / Not now / No response |
| **Revenue Analytics** | Ending ARR, NRR, GRR, net new ARR, logo churn; monthly ARR movement (new, expansion, contraction, churn); retention heatmap by signup cohort; ARR mix and concentration; churn by segment, plan, region and industry |
| **Impact** | Treated vs control-group churn rate (real program effect), save rate by playbook, outcomes, monthly results, team leaderboard |
| **Churn Model** | ROC-AUC, PR-AUC, lift, precision@50, calibration chart, feature importance, model comparison, training history, buttons for Retrain, Re-score and Reset |
| **Playbooks** | Edit the action, steps, SLA and on/off switch for each churn reason |

Use **"Acting as"** (top right) to choose which team member you are. Your actions and notes are logged under that name.

## How the intelligence works

1. **Data**: accounts, weekly product usage, seats, support tickets, payments, NPS and churn events.
   The demo uses a realistic simulator in which churn is driven by engagement, champion loss, support friction,
   failed payments and renewals, so the model has real signal to learn from.
2. **Point-in-time features (22 signals)**: usage trends, seat utilisation, feature adoption, champion activity,
   ticket volume, severity and sentiment, failed payments, MRR change, NPS, tenure and days to renewal.
   Each is computed only from data before the snapshot date, so there is no leakage from the future.
3. **Model**: Logistic Regression and Gradient Boosting are trained on older months, compared on a validation
   period, calibrated (Platt scaling) and tested on the newest months. The model with the best validation PR-AUC is used.
4. **Value**: LTV = MRR x 80% gross margin x expected lifetime for the segment.
   **Revenue at risk = churn probability x LTV.** This is the ranking used everywhere.
5. **Explanations**: each signal is reset to a typical healthy value one at a time, and the drop in risk is measured.
   Signals are grouped into reason codes (Payment issue, Champion lost, Usage decline, Low adoption, and so on).
6. **Recommendations**: the top reason maps to a playbook (an unresolved failed payment always comes first).
   Priority depends on revenue at risk and renewal date.
7. **Workflow**: each scoring run creates up to 40 cards for high- and medium-risk accounts, with at most 50 open
   suggestions. It skips duplicates, adds cooldowns, auto-dismisses suggestions whose risk has dropped, and holds out
   control-group accounts.
8. **Learning loop**: outcomes and the control group feed the Impact page, showing which actions work.

## Project structure

```
RevenueIQ/
  run.bat              one-click start (Windows)
  reset.bat            delete all data
  run.py               launcher: first-run build, free port, opens browser
  requirements.txt
  backend/
    app.py             FastAPI REST API + serves the UI
    db.py              SQLite schema and helpers
    generate_data.py   synthetic SaaS data + simulated retention program
    features.py        point-in-time feature engineering
    model.py           training, calibration, scoring, explanations, LTV, auto-cards
    playbooks.py       reason codes and default playbooks
    pipeline.py        generate -> train -> score
  frontend/            index.html, styles.css, app.js (no build step)
    fonts/             Lexend Deca (bundled, works offline)
  data/                created on first run (SQLite database + model file)
```

## Running manually (any OS)

```bash
python -m venv .venv
.venv/bin/pip install -r requirements.txt      # Windows: .venv\Scripts\pip
.venv/bin/python run.py                        # Windows: .venv\Scripts\python run.py
```

API docs are available at `/docs` while the app is running.

## Using real data later

Replace `generate_data.py` with a loader that fills the same tables (`accounts`, `usage_weekly`, `tickets`,
`payments`, `nps`) from your billing system (e.g. Stripe), product analytics, helpdesk and CRM. Then use
**Retrain model** on the Churn Model page. Features, model, scoring, cards and impact all work unchanged.
