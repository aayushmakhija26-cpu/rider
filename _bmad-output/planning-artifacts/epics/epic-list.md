# Epic List

## Epic 1: Foundation & Developer Platform Setup
The platform is initialized from the `nextjs/saas-starter` template, all infrastructure is configured (Prisma + Neon + RLS, Auth.js v5, 4-role RBAC, Vercel Dev/Preview/Prod, GitHub Actions CI/CD, Tailwind design tokens), and every technical layer is in place to enable all subsequent epics.
**FRs covered:** None directly — enables all FRs
**✅ Verify:** Register → log in → confirm role-based routing works → confirm Vercel deploy pipeline is green across environments

---

## Epic 2: Dealer Registration, Onboarding & Account Management
Dealer Admin can fully onboard — register using email or OAuth, configure dealership branding, invite and manage dealer staff, assign roles, and set up Stripe billing.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**✅ Verify:** Walk the full OnboardingChecklist as Sandra — register → upload logo → set brand colour (confirm contrast validation) → invite staff member → assign role → enter Stripe billing → confirm all steps complete

---

## Epic 3: DMS Integration & Consumer Data Pipeline
Dealer Admin can connect DealerVault, run simulation mode with fixture data, view sync status timeline, diagnose failures, and trust that consumer + vehicle data flows reliably into the platform.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18
**✅ Verify:** Enable simulation mode → trigger DMS batch sync → open SyncStatusTimeline → confirm records appear → force a failure → confirm alert fires → manually re-sync → confirm recovery and logs

---

## Epic 4: Consumer Vehicle Dashboard
A consumer can open a signed URL and immediately see their full vehicle dashboard — market value, equity position, loan payoff, Trade Timer signal, NHTSA recall alert — all powered by cached valuations and DMS-synced data, with no account required.
**FRs covered (MVP):** FR7, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR33, FR34, FR35, FR36, FR37, FR38, FR50
**FRs covered (Post-MVP — defer if deadline pressure):** FR31, FR32 (Story 4.10 insurance/warranty tiles), FR30 chart UI (Story 4.11 Recharts tile expansion — data capture is MVP, chart rendering is post-MVP)
**✅ Verify:** Generate signed URL → open on mobile → confirm all core tiles render → confirm Trade Timer status → confirm recall tile appears/hides correctly → confirm URL expires after 7 days → confirm DASHBOARD_ACCESS audit log entry written → confirm stale data messaging

---

## Epic 5: Email Campaign Automation
Dealer Admin can activate a bi-weekly campaign; consumers receive a dealer-branded email with a personalized signed URL that takes them directly to their vehicle dashboard; engagement is tracked and logged.
**FRs covered:** FR19, FR20, FR21, FR22, FR23
**✅ Verify:** Preview email template → activate campaign → confirm email received in test inbox → click signed URL → confirm correct consumer dashboard opens → check engagement metrics appear in platform

---

## Epic 6: Consumer Account & Self-Service
A consumer can discover Jupiter via a public landing page (VIN entry + dealer matching + waitlist), upgrade to a persistent account from their dashboard, manage their profile, opt out of email communications, and submit a self-serve data deletion request.
**FRs covered:** FR8, FR9, FR10, FR11, FR12
**Stories:** 6.6 (landing page + VIN entry), 6.1 (account from signed URL), 6.2 (direct sign-up), 6.3 (profile), 6.4 (opt-out), 6.5 (deletion request)
**✅ Verify:** Navigate to public landing page → enter VIN → confirm dealer match or waitlist → create account → confirm persistent login works → opt out of emails → confirm opt-out stored → submit deletion request → confirm audit trail entry created

---

## Epic 7: Dealer Analytics & Engagement Intelligence
Dealer Admin and Staff can view a sortable, filterable consumer analytics table, identify Trade Timer green-zone consumers, and see campaign performance metrics — actionable sales intelligence at a glance.
**FRs covered:** FR39, FR40, FR41
**✅ Verify:** Log in as Dealer Admin → open analytics → confirm table loads with correct default sort → filter by Trade Timer green zone → confirm Dealer Staff sees analytics but not billing/branding → confirm empty state renders correctly before first campaign

---

## Epic 8: Compliance, Consent & Data Governance
The platform fully honours consumer consent and opt-out rights, processes self-serve deletion requests, maintains a tamper-evident audit trail, and ensures all emails satisfy CAN-SPAM and CCPA/CPRA obligations.
**FRs covered:** FR42, FR43, FR44, FR45
**✅ Verify:** Opt out a consumer → activate campaign → confirm opted-out consumer excluded from send list → trigger deletion request → confirm data purged and audit log entry present → inspect sent email for CAN-SPAM elements (unsubscribe link, physical address)

---

## Epic 9: SysAdmin Operations & Platform Governance
Jupiter SysAdmin can log in to the SysAdmin portal, monitor DMS sync health across all dealer tenants (and trigger manual re-syncs from the same view), review the full audit log, process deletion requests, and manage platform roles.
**FRs covered:** FR46, FR47, FR48, FR49
**Stories:** 9.1 (portal auth), 9.2 (dealer tenant overview), 9.3 (DMS monitoring + manual re-sync — merged from 9.3+9.4), 9.5 (audit log viewer), 9.6 (deletion queue), 9.7 (role management)
**✅ Verify:** Log in as SysAdmin → view all dealer DMS sync statuses → trigger manual re-sync → confirm Inngest event fired + audit log entry written → open audit log → filter by DASHBOARD_ACCESS event type → process a pending deletion request → confirm data purged
