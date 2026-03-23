# User Journeys

## Journey 1: Consumer — "I didn't know I was ready"

**Persona:** Marcus, 34, bought a used SUV 18 months ago. Vaguely aware his car has lost value but hasn't thought seriously about trading in — he's busy.

**Opening Scene:** Marcus receives a bi-weekly email from his dealership. The subject line references his vehicle and mentions his equity position has improved. He almost deletes it, but the number catches his eye.

**Rising Action:** He clicks through — no login required. He sees his vehicle's current market value (JD Power), remaining loan payoff, equity in positive green, and a Trade Timer showing he's entering the optimal trade window in 60 days. He scrolls down and finds an active recall he didn't know about, with a direct link to book a service appointment.

**Climax:** He bookmarks the signed URL and checks it again three days later. The URL has expired. He registers for a full account — he wants to keep tracking this data. He returns the following week, unprompted.

**Resolution:** Two weeks later, Marcus contacts the dealer via the dashboard. He trades in his SUV. The dealer logs the lead as Jupiter-attributed. Marcus never felt sold to — he felt informed.

*Alternate entry:* Marcus discovers Jupiter directly, enters his VIN, creates an account, and is matched to a participating dealer.

---

## Journey 2: Dealer Admin — "My brand, on autopilot"

**Persona:** Sandra, Dealer Principal. Previous email tools required constant manual effort, looked generic, and generated no measurable leads.

**Opening Scene:** Sandra registers with her business email (or OAuth) — straight to registration, no provisioning wait. She uploads her logo, sets brand colors, adds contact info, and connects Stripe. Onboarding takes under 30 minutes.

**Rising Action:** She connects DealerVault herself through integration settings. The simulation mode previews consumer dashboards before live data flows. She approves the first campaign run; the system schedules bi-weekly sends automatically.

**Climax:** Three weeks in, Sandra's analytics show 34% open rate on the last campaign, six consumers with multiple dashboard visits, two initiated contacts, one deal in progress — flagged as Jupiter-attributed.

**Resolution:** Sandra stops thinking about Jupiter as a tool — it runs itself. Her brand is in front of customers every two weeks with data they care about. One less thing to manage; a new source of warm leads.

---

## Journey 3: Dealer Staff — "Show me what's working"

**Persona:** Jordan, sales associate. Doesn't manage billing or branding — wants to know which customers are hot.

**Opening Scene:** Jordan logs in with staff credentials. Analytics dashboard is accessible; billing and branding settings are not.

**Rising Action:** He filters engagement reports for consumers with 2+ dashboard visits in the last 30 days and a Trade Timer in the green zone. He spots three names.

**Resolution:** Jordan flags them for outreach. One is Marcus. Jupiter becomes part of his daily workflow before morning calls.

---

## Journey 4: Jupiter SysAdmin — "Everything is running, and I can prove it"

**Persona:** Priya, platform operations lead. Responsible for compliance, system health, and escalations.

**Opening Scene:** A dealer reports their DMS sync hasn't reflected a new vehicle. Priya logs into the SysAdmin portal.

**Rising Action:** She pulls the audit log for that dealer's DMS integration events. She sees the last successful sync, a failed webhook 6 hours ago, and the automated alert that fired. Root cause: a malformed VIN that failed the validation layer.

**Resolution:** She escalates to the dealer to correct the DMS record, manually triggers a re-sync. The audit log captures her action. She checks the compliance dashboard — all opt-out preferences current, no CAN-SPAM violations. System status: green.

---

## Journey Requirements Summary

| Journey | Capabilities Revealed |
|---|---|
| Consumer (email-triggered) | Signed URL generation, expiring access, dynamic dashboard tiles, optional account creation |
| Consumer (organic) | VIN entry, dealer matching, self-serve account creation |
| Consumer (repeat visit) | Account persistence, 24-month historical trends, recall booking embed |
| Dealer Admin | Self-registration, branding, DealerVault self-serve integration, simulation mode, campaign scheduling, analytics, Stripe billing |
| Dealer Staff | Role-scoped analytics access, engagement filtering, lead identification |
| Jupiter SysAdmin | Audit logs, DMS sync monitoring, failure alerting, compliance dashboard, role management, manual re-sync |

---
