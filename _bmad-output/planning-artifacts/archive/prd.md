---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: ['docs/SOW.md']
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 1
classification:
  projectType: saas_b2b
  domain: automotive_retail_dealertech
  complexity: medium-high
  projectContext: greenfield
---

# Product Requirements Document — Jupiter

**Author:** Aayush Makhija
**Date:** 2026-03-23
**Project:** Rider | Nebula Technologies Pvt Ltd
**Classification:** SaaS B2B · Automotive Retail / Dealertech · Medium-High Complexity · Greenfield MVP
**Compliance:** CAN-SPAM, CCPA/CPRA · **Deployment:** AWS, CI/CD (Dev / UAT / Prod)

---

## Executive Summary

Jupiter is a mobile-first SaaS B2B platform enabling automotive dealerships to maintain continuous, data-driven engagement with their vehicle-owning customers. The platform delivers automated, dealer-branded bi-weekly email newsletters containing personalized vehicle insights — current market value, equity position, loan payoff, recall status, and trade readiness — each linked to a secure, responsive consumer dashboard.

Jupiter solves a fundamental gap: dealers possess data consumers find highly valuable, but lack a systematic mechanism to deliver it at the right moment. Dealers identify and reach in-market customers before competitors; consumers receive effortless, trustworthy visibility into their vehicle's financial status without seeking it out.

**Target Users:**
- **Dealer Admin:** Needs a turnkey engagement tool that keeps their brand present in consumers' lives, surfaces trade-in opportunities, and requires minimal operational overhead.
- **Dealer Staff:** Needs visibility into campaign performance and engagement analytics.
- **Consumer:** Needs a single trusted source of truth for their vehicle's value, equity, and status — delivered proactively by their dealer.
- **Jupiter SysAdmin:** Needs system-wide oversight, audit capability, and compliance controls.

### What Makes This Special

Jupiter's core insight is **manufactured readiness** — it doesn't wait for consumers to enter the market. By surfacing personalized, data-backed insights through a trusted, dealer-branded channel, Jupiter creates the moment of intent before the consumer goes looking elsewhere. The "aha" is not just the data — it's the active presence of the dealer at precisely the right time.

This positions Jupiter not as a marketing tool but as relationship infrastructure: something both dealers and consumers rely on without thinking about it. The competitive moat is DMS integration depth (DealerVault), multi-source valuation accuracy (JD Power + Black Book + proprietary Jupiter algorithm), and dealer branding — making Jupiter uniquely credible compared to generic vehicle valuation tools.

---

## Success Criteria

### User Success

**Consumer:**
- Opens bi-weekly dealer-branded newsletters consistently
- Clicks through to the personalized vehicle dashboard
- Returns independently (repeat visits without email prompt)
- Initiates a trade or service conversation with the dealer as a direct result of a Jupiter insight

**Dealer Admin:**
- Brand present in consumer inboxes with zero manual effort per campaign
- Measurable leads generated through Jupiter-triggered consumer interactions
- Analytics surface actionable engagement data (open rates, click-throughs, consumer activity)

**Dealer Staff:**
- Accesses and interprets engagement analytics without training overhead

### Business Success

**3-Month Targets (MVP Validation):**
- Dealerships onboarded and sending live campaigns
- Email open rate benchmarked against automotive industry average (~20–25%)
- Consumer dashboard click-through rate tracked per campaign
- At least one Jupiter-attributed lead conversion documented per active dealer

**12-Month Targets (Growth Indicator):**
- MoM increase in active dealerships
- Consumer engagement rate trending upward (repeat dashboard visits per consumer)
- Email volume scaling with dealer base at ≥99% delivery rate
- Jupiter-attributed leads measurable and reportable per dealer

### Technical Success

- Email campaigns deliver on bi-weekly schedule at ≥99% delivery rate
- Consumer dashboards load correctly via signed URLs with no data errors
- DMS sync completes daily batch with automated failure alerting
- Valuation data cached and refreshed within 7–14 day window
- Historical data retained accurately for 24 months
- All key actions captured in audit logs
- System passes OWASP Top 10 checks prior to production launch
- CAN-SPAM and CCPA/CPRA compliance requirements met at launch

### Measurable Outcomes

| Metric | Target |
|---|---|
| Email delivery rate | ≥99% |
| Consumer dashboard click-through rate | Tracked per campaign, benchmarked from Month 1 |
| Repeat consumer dashboard visits | % of consumers with 2+ visits per month |
| Jupiter-attributed dealer leads | ≥1 per active dealer per month at 3-month mark |
| DMS sync failure rate | <1% with automated alerting on failure |
| Audit log coverage | 100% of key system actions captured |

---

## Product Scope

### MVP — Phase 1 (Platform MVP)

All core capabilities ship together. A partial platform (email without dashboard, or dashboard without valuation data) delivers no value — the MVP is the smallest complete experience.

**Core capabilities:**
- Dealer onboarding (email/OAuth registration, branding, Stripe billing)
- Role-based access control (Admin, Staff, Consumer, SysAdmin)
- DealerVault DMS integration (daily batch + webhook + simulation mode)
- Bi-weekly automated email campaigns with dealer branding
- Consumer dashboard: Vehicle Value, Equity, Payoff, Trade Timer, Recall tiles
- Vehicle valuation: JD Power (primary) → Black Book (fallback), cached 7–14 days
- Jupiter proprietary valuation algorithm (vehicles owned 12+ months)
- Trade Timer calculation (depreciation + payoff + seasonality)
- NHTSA recall integration (active recalls only) + embedded service scheduler
- Signed URL generation (7-day expiry) + optional consumer account creation
- Historical trend data (24 months)
- Dealer analytics dashboard
- Audit logging + CAN-SPAM / CCPA/CPRA compliance controls
- AWS CI/CD across Dev / UAT / Prod + OWASP Top 10 compliance

**Descoped if deadline pressure:** Insurance and warranty tiles — DMS-dependent, adds integration complexity, does not affect core value proposition.

### Post-MVP — Phase 2 (Growth)

- Insurance and warranty tiles (DMS-synced, consumer manual entry fallback)
- Dealer-specific email trigger customization
- Direct-to-consumer subscription management (Jupiter.ai path)
- Advanced dealer analytics and AI-driven reporting

### Future — Phase 3 (Expansion)

- AI-based trade timer residual calculations (replacing rule-based MVP logic)
- AI-driven personalization
- Custom third-party integrations beyond DealerVault
- Predictive lead scoring
- Consumer-facing mobile app with proactive notifications

---

## User Journeys

### Journey 1: Consumer — "I didn't know I was ready"

**Persona:** Marcus, 34, bought a used SUV 18 months ago. Vaguely aware his car has lost value but hasn't thought seriously about trading in — he's busy.

**Opening Scene:** Marcus receives a bi-weekly email from his dealership. The subject line references his vehicle and mentions his equity position has improved. He almost deletes it, but the number catches his eye.

**Rising Action:** He clicks through — no login required. He sees his vehicle's current market value (JD Power), remaining loan payoff, equity in positive green, and a Trade Timer showing he's entering the optimal trade window in 60 days. He scrolls down and finds an active recall he didn't know about, with a direct link to book a service appointment.

**Climax:** He bookmarks the signed URL and checks it again three days later. The URL has expired. He registers for a full account — he wants to keep tracking this data. He returns the following week, unprompted.

**Resolution:** Two weeks later, Marcus contacts the dealer via the dashboard. He trades in his SUV. The dealer logs the lead as Jupiter-attributed. Marcus never felt sold to — he felt informed.

*Alternate entry:* Marcus discovers Jupiter directly, enters his VIN, creates an account, and is matched to a participating dealer.

---

### Journey 2: Dealer Admin — "My brand, on autopilot"

**Persona:** Sandra, Dealer Principal. Previous email tools required constant manual effort, looked generic, and generated no measurable leads.

**Opening Scene:** Sandra registers with her business email (or OAuth) — straight to registration, no provisioning wait. She uploads her logo, sets brand colors, adds contact info, and connects Stripe. Onboarding takes under 30 minutes.

**Rising Action:** She connects DealerVault herself through integration settings. The simulation mode previews consumer dashboards before live data flows. She approves the first campaign run; the system schedules bi-weekly sends automatically.

**Climax:** Three weeks in, Sandra's analytics show 34% open rate on the last campaign, six consumers with multiple dashboard visits, two initiated contacts, one deal in progress — flagged as Jupiter-attributed.

**Resolution:** Sandra stops thinking about Jupiter as a tool — it runs itself. Her brand is in front of customers every two weeks with data they care about. One less thing to manage; a new source of warm leads.

---

### Journey 3: Dealer Staff — "Show me what's working"

**Persona:** Jordan, sales associate. Doesn't manage billing or branding — wants to know which customers are hot.

**Opening Scene:** Jordan logs in with staff credentials. Analytics dashboard is accessible; billing and branding settings are not.

**Rising Action:** He filters engagement reports for consumers with 2+ dashboard visits in the last 30 days and a Trade Timer in the green zone. He spots three names.

**Resolution:** Jordan flags them for outreach. One is Marcus. Jupiter becomes part of his daily workflow before morning calls.

---

### Journey 4: Jupiter SysAdmin — "Everything is running, and I can prove it"

**Persona:** Priya, platform operations lead. Responsible for compliance, system health, and escalations.

**Opening Scene:** A dealer reports their DMS sync hasn't reflected a new vehicle. Priya logs into the SysAdmin portal.

**Rising Action:** She pulls the audit log for that dealer's DMS integration events. She sees the last successful sync, a failed webhook 6 hours ago, and the automated alert that fired. Root cause: a malformed VIN that failed the validation layer.

**Resolution:** She escalates to the dealer to correct the DMS record, manually triggers a re-sync. The audit log captures her action. She checks the compliance dashboard — all opt-out preferences current, no CAN-SPAM violations. System status: green.

---

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---|---|
| Consumer (email-triggered) | Signed URL generation, expiring access, dynamic dashboard tiles, optional account creation |
| Consumer (organic) | VIN entry, dealer matching, self-serve account creation |
| Consumer (repeat visit) | Account persistence, 24-month historical trends, recall booking embed |
| Dealer Admin | Self-registration, branding, DealerVault self-serve integration, simulation mode, campaign scheduling, analytics, Stripe billing |
| Dealer Staff | Role-scoped analytics access, engagement filtering, lead identification |
| Jupiter SysAdmin | Audit logs, DMS sync monitoring, failure alerting, compliance dashboard, role management, manual re-sync |

---

## Domain-Specific Requirements

### Compliance & Regulatory

- **CAN-SPAM:** Unsubscribe mechanism, sender identification, and physical dealership address required in all emails. Opt-out requests honored within 10 business days. Opt-out status checked before every campaign send. Jupiter legal team owns compliance certification and legal text (out of Nebula's scope).
- **CCPA/CPRA:** Consent tracking, opt-out of data sale preference, and self-serve data deletion request flow in consumer dashboard. Audit trail of all consent and deletion events maintained.
- **Terms & Privacy content:** Provided by Jupiter legal team; platform renders and version-controls content.

### Technical Constraints

- All data encrypted at rest and in transit (TLS 1.2+)
- KMS-managed secrets for all API keys and credentials
- IP allow-listing on admin and integration endpoints
- Signed URLs expire after 7 days; invalidated upon consumer account creation
- OWASP Top 10 security checks required before production launch
- Load and performance testing required prior to launch

---

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Trade Timer — Proprietary Readiness Signal**
Jupiter pioneers a consumer-facing Trade Timer synthesizing vehicle depreciation rate, current loan payoff, and market seasonality into a single actionable readiness signal. No existing dealer engagement platform surfaces this combination as a consumer-facing insight. The moat is not the algorithm — it's the platform's ability to deliver it at scale, branded per dealer, to the right consumer at the right moment.

**2. Jupiter Proprietary Valuation Algorithm (12+ months)**
For vehicles owned beyond 12 months — where standard retail and trade values diverge significantly — Jupiter applies a proprietary valuation algorithm (already defined by the Jupiter team). This replaces reliance on JD Power/Black Book for longer-tenure vehicles, giving Jupiter a data differentiation advantage as its consumer base matures.

**3. Manufactured Readiness — Proactive Engagement Model**
Rather than waiting for consumers to self-identify as in-market, Jupiter manufactures the moment of intent by surfacing personalized insights before the consumer goes looking elsewhere. This transforms a passive dealer-consumer relationship into a continuous, data-driven engagement loop.

### Validation Approach

- Trade Timer accuracy validated post-launch against actual trade-in timing (do "green" signals correlate with higher conversion rates?)
- Jupiter valuation algorithm compared against JD Power/Black Book outputs during QA to validate divergence and accuracy
- Engagement metrics (repeat visits, Jupiter-attributed leads) validate the manufactured readiness model

### Innovation Risks

| Risk | Mitigation |
|---|---|
| Trade Timer produces inaccurate signals | Rule-based formula reviewed and tuned pre-launch; AI refinement planned post-MVP |
| Jupiter valuation algorithm produces outlier values | QA testing against known vehicle datasets required before production |
| Manufactured readiness fails to drive engagement | Tracked from Month 1; benchmarked against automotive industry averages |

---

## SaaS B2B Platform Requirements

### Multi-Tenancy Model

Each dealership is a fully isolated tenant — branding, consumer data, campaign history, and analytics scoped per tenant with no cross-tenant visibility. Tenant provisioning is fully self-serve. Consumer accounts belong to one dealer tenant in MVP.

**Implementation constraints:**
- Tenant data isolation enforced at database schema level (row-level security or schema-per-tenant)
- Signed URLs scoped to the correct tenant's branding and consumer data
- Campaign scheduling runs platform-wide (bi-weekly cadence) but rendered per-tenant
- SysAdmin access must not expose one tenant's data when investigating another
- Stripe webhook events attributed to the correct tenant

### RBAC Matrix

| Role | Billing | Branding | Integrations | Analytics | Consumer Data | System Admin |
|---|---|---|---|---|---|---|
| Dealer Admin | ✓ | ✓ | ✓ | ✓ | Read | — |
| Dealer Staff | — | — | — | ✓ | Read | — |
| Consumer | — | — | — | — | Own data only | — |
| Jupiter SysAdmin | — | — | — | — | Audit access | ✓ |

### Subscription Model

- **MVP:** Single flat-rate subscription per dealership, managed via Stripe by Dealer Admin
- Full platform access on subscription — no feature gating at MVP
- Post-MVP: tiered plans based on consumer volume, email send limits, or feature access

### Integration Architecture

| Integration | Scope | Owner | Notes |
|---|---|---|---|
| DealerVault (DMS) | Per tenant | Dealer Admin (self-serve) | Daily batch + webhook; simulation mode pre-go-live |
| JD Power API | Platform | Jupiter SysAdmin | Valuation primary; cached 7–14 days |
| Black Book API | Platform | Jupiter SysAdmin | Valuation fallback; auto-switch, no manual intervention |
| NHTSA API | Platform | Jupiter SysAdmin | Active recalls only; fault-tolerant (tile hidden if unavailable) |
| VIN Decode | Platform | Jupiter SysAdmin | Non-DMS consumer fallback |
| Stripe | Per tenant | Dealer Admin | Idempotent webhook processing |
| Email delivery (SendGrid or equivalent) | Platform | Jupiter SysAdmin | Bi-weekly automated sends; ≥99% delivery rate |

---

## Project Scoping & Risk

### Scoping Decisions

The full SOW scope is the MVP. The platform must ship as a complete, integrated experience — no partial releases. If deadline pressure forces cuts, insurance/warranty tiles are the first feature removed (additive, not core to the value proposition).

### Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| DealerVault integration complexity | High | Simulation mode enables parallel UI development; daily batch is primary, webhook is enhancement |
| JD Power / Black Book API access not yet secured | Medium | VIN Decode + Black Book serve as interim fallback; Jupiter algorithm covers 12+ month vehicles |
| Valuation data quality / accuracy | Medium | QA against known vehicle datasets pre-launch; cached data absorbs API outage impact |
| Dealers unable to self-onboard | Medium | Onboarding target <30 minutes; simulation mode demonstrates value before live DMS data |
| Consumer email engagement below expectations | Medium | Tracked from Month 1; benchmarked against automotive industry averages (~20–25% open rate) |
| DMS sync failure | Ongoing | Automated failure alerting; SysAdmin manual re-sync capability |
| Consumer data deletion request | Ongoing | Self-serve deletion flow; deletion logged in audit trail; dealer engagement history anonymized |
| Email opt-out compliance | Ongoing | Opt-out status checked before every send; honored within 10 business days |

---

## Functional Requirements

### Dealer Account Management

- FR1: Dealer Admin can register a new dealership account using email or OAuth (Google/Apple)
- FR2: Dealer Admin can configure dealership branding (logo, color theme, contact information)
- FR3: Dealer Admin can create and manage dealer staff accounts
- FR4: Dealer Admin can assign roles to dealer staff
- FR5: Dealer Admin can set up and manage billing via Stripe
- FR6: Dealer Admin can view and update their dealership profile

### Consumer Account Management

- FR7: Consumer can access their personalized vehicle dashboard via a dealer-issued signed URL without creating an account
- FR8: Consumer can create a full account for persistent access after signed URL expiry
- FR9: Consumer can sign up directly on the platform without a dealer-triggered email
- FR10: Consumer can view and manage their account information
- FR11: Consumer can submit a self-serve data deletion request from their dashboard
- FR12: Consumer can opt out of email communications from the platform

### DMS Integration

- FR13: Dealer Admin can connect their dealership's DMS via DealerVault integration
- FR14: The system ingests DMS data via daily batch sync
- FR15: The system receives near-real-time DMS updates via webhook
- FR16: Dealer Admin can simulate DMS data ingestion to preview consumer dashboards before live integration
- FR17: The system validates and normalizes DMS data before ingestion
- FR18: Dealer Admin can view last DMS sync status and failure alerts

### Email Campaign Management

- FR19: The system automatically sends dealer-branded bi-weekly email newsletters to consumers
- FR20: Dealer Admin can preview the email template before campaign activation
- FR21: The system generates a personalized signed URL for each consumer per campaign
- FR22: The system tracks and stores email open rates and engagement metrics per campaign
- FR23: The system logs all email sends in the audit trail including recipient engagement

### Consumer Vehicle Dashboard

- FR24: Consumer can view their vehicle's current market valuation
- FR25: Consumer can view their loan equity position (positive equity as value; negative equity as equilibrium projection)
- FR26: Consumer can view their current loan payoff amount
- FR27: Consumer can view their Trade Timer readiness signal
- FR28: Consumer can view active vehicle recalls from NHTSA
- FR29: Consumer can book a dealer service appointment via embedded scheduler (e.g., Xtime) from the recall tile
- FR30: Consumer can view up to 24 months of historical vehicle insight trends
- FR31: Consumer can view their digital insurance ID card (DMS-synced; consumer manual entry fallback)
- FR32: Consumer can view their digital warranty card (DMS-synced; consumer manual entry fallback)

### Vehicle Valuation & Calculations

- FR33: The system calculates vehicle market value using JD Power (primary), Black Book (fallback)
- FR34: The system applies the Jupiter proprietary valuation algorithm for vehicles owned 12+ months
- FR35: The system applies time-based valuation logic (retail 0–6 months; mid-point 6–12 months; Jupiter algorithm 12+ months)
- FR36: The system calculates vehicle equity from current market value and loan balance
- FR37: The system calculates Trade Timer readiness using depreciation, payoff, and seasonality formula
- FR38: The system caches valuation results for 7–14 days

### Dealer Analytics Dashboard

- FR39: Dealer Admin can view campaign performance metrics (open rates, click-throughs, consumer activity)
- FR40: Dealer Staff can view campaign performance analytics (read-only; no billing or branding access)
- FR41: Dealer Admin can identify consumers with high engagement indicators (repeat visits, Trade Timer in green zone)

### Compliance & Consent Management

- FR42: The system captures and stores consumer opt-out preferences and honors them within 10 business days
- FR43: The system tracks consumer consent for data use in accordance with CCPA/CPRA
- FR44: The system processes consumer self-serve data deletion requests and logs each action in the audit trail
- FR45: All email communications include required CAN-SPAM elements (unsubscribe link, sender identification, physical address)

### Audit & System Administration

- FR46: Jupiter SysAdmin can view audit logs for all key system actions (dashboard access, email sends, integration events, consent and deletion actions)
- FR47: Jupiter SysAdmin can monitor DMS sync status across all dealer tenants
- FR48: Jupiter SysAdmin can manually trigger a DMS re-sync for a specific dealer tenant
- FR49: Jupiter SysAdmin can manage roles and access across the platform
- FR50: The system generates and validates time-limited signed URLs for consumer dashboard access (7-day expiry)

---

## Non-Functional Requirements

### Performance

- Consumer dashboard loads within 3 seconds on a standard mobile connection (95th percentile)
- Valuation data served from cache on every dashboard load — no real-time API calls per request
- Bi-weekly email campaigns complete full dispatch on schedule regardless of dealer list size
- DMS batch sync completes within a nightly window (22:00–06:00) without impacting daytime platform performance

### Security

- All data encrypted at rest and in transit (TLS 1.2+)
- KMS-managed secrets for all API keys and credentials; rotation requires no platform downtime
- IP allow-listing enforced on admin and integration endpoints
- Signed URLs time-limited (7-day expiry); invalidated on consumer account creation
- Token-based authentication for all authenticated sessions
- OWASP Top 10 vulnerabilities remediated before production launch
- Tenant data fully isolated — no cross-tenant data access at any layer

### Scalability

- New dealer tenants onboard without infrastructure changes
- Email send infrastructure scales with dealer base without degrading delivery rate below 99%
- Valuation caching absorbs consumer volume growth without proportional increase in third-party API calls
- AWS deployment supports horizontal scaling for consumer dashboard traffic growth

### Accessibility

- Consumer dashboard conforms to WCAG 2.1 Level AA
- All interfaces usable on mobile, tablet, and desktop without horizontal scrolling or zooming

### Reliability

- Email delivery rate: ≥99%
- DMS sync failure rate: <1%; automated alerting on every failure
- Audit logs append-only and tamper-evident
- Historical data retained without loss for 24 months
- CI/CD pipeline supports hotfix deployment to production within one business day

### Integration

- DealerVault integration supports daily batch and near-real-time webhook; simulation mode available pre-go-live
- JD Power → Black Book fallback is automatic with no manual intervention
- NHTSA API calls fault-tolerant — recall tile hidden gracefully if API unavailable
- Stripe webhook events processed idempotently to prevent duplicate billing
- All third-party API credentials managed via KMS
