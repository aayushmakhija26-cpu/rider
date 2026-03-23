# Project Context Analysis

## Requirements Overview

**Functional Requirements:** 50 FRs across 9 functional areas — dealer & consumer account management, DMS integration, email campaign automation, consumer vehicle dashboard, vehicle valuation & calculations, dealer analytics, compliance & consent management, and audit & system administration.

**Non-Functional Requirements:**
- Performance: Consumer dashboard ≤3s (p95 mobile), valuation always served from cache, email dispatch on schedule regardless of list size, DMS batch within 22:00–06:00 window
- Security: TLS 1.2+, KMS-managed secrets, IP allowlisting on admin/integration endpoints, 7-day signed URL expiry, token-based auth, OWASP Top 10 cleared pre-launch, full tenant isolation at every layer
- Scalability: New tenants onboard without infrastructure changes, email infrastructure scales to maintain ≥99% delivery, valuation cache absorbs consumer growth without proportional third-party API call increase, Vercel serverless scales automatically for frontend
- Reliability: ≥99% email delivery, <1% DMS sync failure with automated alerting, append-only audit logs, 24-month data retention, hotfix CI/CD within one business day
- Accessibility: WCAG 2.1 Level AA across all surfaces
- Compliance: CAN-SPAM (unsubscribe, opt-out within 10 days), CCPA/CPRA (consent tracking, self-serve deletion), audit trail of all key actions

**Scale & Complexity:**
- Primary domain: Full-stack SaaS B2B — backend-heavy with significant frontend surface
- Complexity level: Medium-High
- Distinct backend service domains: 8 (auth, signed URL, tenant management, DMS pipeline, valuation engine, email campaign engine, audit logger, RBAC)
- Frontend surfaces: 2 (mobile-first consumer dashboard, desktop-first dealer/admin portal)

## Technical Constraints & Dependencies

- **Vercel** is the deployment platform for the Next.js frontend (consumer dashboard + dealer portal)
- Long-running backend processes (DMS batch sync, email campaign engine) require a separate execution environment — Vercel serverless functions have execution timeout limits and are not suited for batch orchestration
- CI/CD for the frontend is handled natively by Vercel via Git integration (Dev / UAT / Prod environments via branch-based deployments)
- Backend API services and workers will need a separate hosting decision (to be resolved in stack decision steps)
- Next.js + React + Tailwind CSS + shadcn/ui is the confirmed frontend stack
- DealerVault is the mandated DMS integration path for MVP
- JD Power (primary) → Black Book (fallback) for vehicle valuation
- NHTSA API for recalls (free, fault-tolerant required)
- Stripe for billing (idempotent webhook processing required)
- SendGrid or equivalent for email delivery
- KMS-managed secrets (rotation must not require platform downtime)
- OWASP Top 10 cleared pre-launch; load and performance testing required prior to launch

## Cross-Cutting Concerns Identified

1. **Multi-tenancy isolation** — Enforced at database, API, and URL generation layers; no cross-tenant data access at any layer
2. **RBAC enforcement** — 4 roles (Dealer Admin, Dealer Staff, Consumer, SysAdmin) with distinct permission sets; enforced at route, API, and data access layers
3. **Audit logging** — All key actions captured: dashboard access, email sends, integration events, consent and deletion actions; append-only, tamper-evident
4. **Compliance hooks** — CAN-SPAM pre-send opt-out check, CCPA/CPRA consent state propagated across email, dashboard, and data deletion flows
5. **Valuation caching** — 7-14 day cache layer absorbs third-party API volume; cache invalidation strategy required across multiple data sources
6. **Signed URL lifecycle** — Generation, validation, expiry, tenant scoping, and invalidation on account creation must be consistent across all consumer entry points
7. **KMS secret management** — All third-party API credentials via KMS; zero-downtime rotation required
8. **Error handling at integration boundaries** — DealerVault failures → alerting + manual re-sync; NHTSA unavailability → graceful tile hide; JD Power failure → Black Book automatic fallback; Stripe webhook → idempotent processing
