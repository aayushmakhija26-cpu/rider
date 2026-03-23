# Project Structure & Boundaries

## Complete Project Directory Structure

```
jupiter/
├── README.md
├── AGENTS.md                           # AI agent instructions (Next.js 16.2 default)
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                     # shadcn/ui configuration
├── .env.local                          # Local dev secrets (gitignored)
├── .env.example                        # Documented env var template
├── .gitignore
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      # PR checks: typecheck, lint, test, a11y
│       ├── migrate.yml                 # Prisma migration safety check on schema changes
│       └── owasp.yml                   # OWASP ZAP scan (pre-production gate)
│
├── e2e/                                # Playwright E2E tests
│   ├── consumer-dashboard.spec.ts
│   ├── dealer-onboarding.spec.ts
│   ├── dealer-analytics.spec.ts
│   └── sysadmin-dms-monitor.spec.ts
│
├── prisma/
│   ├── schema.prisma                   # Single schema file
│   ├── seed.ts                         # Dev/UAT seed data
│   └── migrations/                     # Prisma Migrate versioned migrations
│
├── emails/                             # React Email templates
│   ├── campaign-newsletter.tsx         # Dealer-branded bi-weekly newsletter
│   └── _components/
│       ├── DealerHeader.tsx            # Dealer logo + contact block
│       └── VehicleInsightTile.tsx      # Email tile (value, equity, trade timer)
│
└── src/
    ├── middleware.ts                   # Role-based route protection (Auth.js)
    │
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx                  # Root layout
    │   ├── page.tsx                    # Landing / VIN entry (organic consumer)
    │   │
    │   ├── (consumer)/                 # Consumer dashboard route group
    │   │   ├── layout.tsx              # DealerThemeProvider + signed URL context
    │   │   ├── d/
    │   │   │   └── [token]/
    │   │   │       ├── page.tsx        # Signed URL entry → dashboard
    │   │   │       └── expired/
    │   │   │           └── page.tsx    # URL expiry screen + account creation CTA
    │   │   ├── dashboard/
    │   │   │   ├── page.tsx            # Main consumer dashboard (authenticated)
    │   │   │   └── privacy/
    │   │   │       └── page.tsx        # Opt-out, data deletion request
    │   │   └── account/
    │   │       ├── create/
    │   │       │   └── page.tsx        # Account creation form
    │   │       └── page.tsx            # Account settings
    │   │
    │   ├── (dealer)/                   # Dealer portal route group (auth required)
    │   │   ├── layout.tsx              # Sidebar layout + auth guard
    │   │   ├── onboarding/
    │   │   │   └── page.tsx            # OnboardingChecklist (Sandra's flow)
    │   │   ├── analytics/
    │   │   │   └── page.tsx            # Consumer engagement table (Jordan's view)
    │   │   ├── campaigns/
    │   │   │   ├── page.tsx            # Campaign list + preview
    │   │   │   └── [campaignId]/
    │   │   │       └── page.tsx        # Campaign detail + metrics
    │   │   ├── settings/
    │   │   │   ├── branding/
    │   │   │   │   └── page.tsx        # Logo, colours, contact info
    │   │   │   ├── billing/
    │   │   │   │   └── page.tsx        # Stripe Customer Portal (Admin only)
    │   │   │   └── integrations/
    │   │   │       └── page.tsx        # DealerVault connection + sync status
    │   │   └── team/
    │   │       └── page.tsx            # Staff account management
    │   │
    │   ├── (sysadmin)/                 # SysAdmin portal route group (SYSADMIN role)
    │   │   ├── layout.tsx
    │   │   ├── dashboard/
    │   │   │   └── page.tsx            # System health overview
    │   │   ├── dealers/
    │   │   │   ├── page.tsx            # All dealer tenants
    │   │   │   └── [dealerId]/
    │   │   │       ├── page.tsx        # Dealer detail
    │   │   │       └── dms/
    │   │   │           └── page.tsx    # SyncStatusTimeline (Priya's view)
    │   │   ├── audit/
    │   │   │   └── page.tsx            # Audit log viewer
    │   │   └── compliance/
    │   │       └── page.tsx            # Consent + opt-out compliance dashboard
    │   │
    │   ├── auth/
    │   │   ├── signin/
    │   │   │   └── page.tsx
    │   │   └── error/
    │   │       └── page.tsx
    │   │
    │   └── api/
    │       ├── auth/
    │       │   └── [...nextauth]/
    │       │       └── route.ts        # Auth.js handler
    │       ├── inngest/
    │       │   └── route.ts            # Inngest serve handler
    │       ├── dealers/
    │       │   ├── route.ts            # POST /api/dealers (register)
    │       │   └── [dealerId]/
    │       │       ├── route.ts        # GET, PATCH dealer
    │       │       ├── branding/
    │       │       │   └── route.ts
    │       │       ├── campaigns/
    │       │       │   ├── route.ts    # GET campaigns list
    │       │       │   └── [campaignId]/
    │       │       │       └── route.ts
    │       │       ├── dms/
    │       │       │   ├── route.ts    # GET sync status
    │       │       │   └── resync/
    │       │       │       └── route.ts # POST manual re-sync
    │       │       └── team/
    │       │           └── route.ts
    │       ├── consumers/
    │       │   ├── route.ts
    │       │   └── [consumerId]/
    │       │       ├── route.ts
    │       │       ├── consent/
    │       │       │   └── route.ts    # PATCH opt-out preferences
    │       │       └── delete/
    │       │           └── route.ts    # POST deletion request
    │       ├── signed-url-tokens/
    │       │   └── [token]/
    │       │       └── route.ts        # GET validate + resolve token
    │       ├── valuations/
    │       │   └── [vin]/
    │       │       └── route.ts        # GET vehicle valuation (cache-first)
    │       ├── admin/
    │       │   ├── dealers/
    │       │   │   └── route.ts        # SysAdmin: list all dealers
    │       │   └── audit/
    │       │       └── route.ts        # SysAdmin: audit log query
    │       └── webhooks/
    │           ├── dealervault/
    │           │   └── route.ts        # DealerVault webhook ingestion
    │           ├── stripe/
    │           │   └── route.ts        # Stripe billing events
    │           └── resend/
    │               └── route.ts        # Email open/click engagement events
    │
    ├── components/
    │   ├── ui/                         # shadcn/ui (owned source)
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── badge.tsx
    │   │   ├── dialog.tsx
    │   │   ├── form.tsx
    │   │   ├── input.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── sidebar.tsx
    │   │   ├── data-table.tsx          # TanStack Table wrapper
    │   │   ├── sonner.tsx
    │   │   ├── separator.tsx
    │   │   ├── avatar.tsx
    │   │   └── dropdown-menu.tsx
    │   │
    │   ├── jupiter/                    # Jupiter custom components
    │   │   ├── VehicleHeroSection.tsx
    │   │   ├── VehicleInsightTile.tsx
    │   │   ├── TradeTimerIndicator.tsx
    │   │   ├── RecallAlertTile.tsx
    │   │   ├── DealerThemeProvider.tsx
    │   │   ├── SyncStatusTimeline.tsx
    │   │   └── OnboardingChecklist.tsx
    │   │
    │   ├── consumer/
    │   │   ├── DashboardLayout.tsx
    │   │   ├── AccountCreationPrompt.tsx
    │   │   ├── UrlExpiredScreen.tsx
    │   │   └── VehicleTrendChart.tsx   # Recharts 24-month trend
    │   │
    │   └── dealer/
    │       ├── PortalLayout.tsx
    │       ├── ConsumerEngagementTable.tsx
    │       ├── CampaignPreviewModal.tsx
    │       ├── DmsConnectionForm.tsx
    │       ├── BrandingForm.tsx
    │       └── StatCard.tsx
    │
    ├── lib/
    │   ├── auth.ts                     # Auth.js v5 config (providers, adapter)
    │   ├── db.ts                       # Prisma client singleton + RLS middleware
    │   ├── redis.ts                    # Upstash Redis client
    │   ├── inngest.ts                  # Inngest client
    │   ├── resend.ts                   # Resend client
    │   └── utils.ts                    # cn(), validateDealerColour(), etc.
    │
    ├── inngest/                        # Inngest durable functions
    │   ├── dms-sync.ts                 # dms/sync.requested → batch ingestion
    │   ├── campaign-dispatch.ts        # campaign/dispatch.scheduled → email fan-out
    │   ├── valuation-refresh.ts        # valuation/refresh.requested → cache update
    │   └── sync-alert.ts              # Failure alerting on DMS sync errors
    │
    ├── services/                       # Data access layer — ALL Prisma queries here
    │   ├── dealer.service.ts           # FR1–FR6, FR39–FR41
    │   ├── consumer.service.ts         # FR7–FR12
    │   ├── dms.service.ts              # FR13–FR18
    │   ├── campaign.service.ts         # FR19–FR23
    │   ├── valuation.service.ts        # FR33–FR38 (JD Power, Black Book, Jupiter algo)
    │   ├── signed-url-token.service.ts # FR50 (token generation + validation)
    │   ├── compliance.service.ts       # FR42–FR45 (consent, opt-out, deletion)
    │   └── audit.service.ts            # FR46–FR49 (audit log)
    │
    ├── hooks/
    │   └── useDealerTheme.ts
    │
    └── types/
        ├── index.ts                    # Shared TypeScript types
        ├── auth.d.ts                   # Auth.js session type augmentation
        └── inngest.d.ts                # Inngest event type definitions
```

---

## Prisma Schema Models

| Model | Purpose |
|---|---|
| `Dealer` | Tenant; branding, billing, DMS credentials, simulation_mode flag |
| `DealerUser` | Dealer Admin + Dealer Staff; role enum, dealerId FK |
| `Consumer` | Consumer accounts; optional (signed URL access requires no account) |
| `SignedUrlToken` | Per-consumer per-campaign token; expires_at, invalidated_at |
| `Vehicle` | From DMS; VIN, ownership data, financial data, insurance, warranty |
| `DmsSync` | Sync event log; status, root_cause, triggered_by, dealer FK |
| `Campaign` | Campaign run per dealer; scheduled_at, sent_at, status |
| `CampaignSend` | Individual email send; consumer FK, campaign FK, token FK, opened_at, clicked_at |
| `ValuationCache` | Cached valuation result; VIN, source, value, cached_at, expires_at |
| `AuditLog` | Append-only; action, actor_id, actor_role, dealer_id, target_id, target_type, metadata, created_at |
| `ConsentRecord` | CCPA/CPRA; consumer FK, opt_out_email, opt_out_data_sale, deletion_requested_at, deletion_completed_at |

---

## Architectural Boundaries

**API Boundaries:**
- External-facing: `/api/webhooks/*` — DealerVault, Stripe, Resend, Inngest
- Consumer-facing: `/api/signed-url-tokens/[token]`, `/api/valuations/[vin]`
- Dealer-facing: `/api/dealers/**`, `/api/consumers/**`, `/api/campaigns/**`
- Admin-only: `/api/admin/**` — SYSADMIN role enforced in middleware
- All boundaries: Zod validation → service call → audit log (where applicable)

**Component Boundaries:**
- `components/ui/` — no Jupiter business logic; pure presentational primitives
- `components/jupiter/` — accepts typed props only; no direct data fetching
- `components/consumer/` — may use Server Component data fetching patterns
- `components/dealer/` — may use Server Component data fetching patterns
- Consumer components always accept `dealerTheme` prop; dealer components never do

**Service Boundaries:**
- `services/` — owns all database access; returns typed domain objects
- `inngest/` — calls services only; never calls Prisma directly
- `app/api/` Route Handlers — calls services only; never calls Prisma directly
- `lib/redis.ts` — valuation cache access; only called from `valuation.service.ts`

**Data Boundaries:**
- RLS enforces tenant isolation at Postgres level
- `valuation.service.ts` owns all cache reads/writes via `lib/redis.ts`
- `audit.service.ts` is the only writer to the `AuditLog` table
- `compliance.service.ts` owns all consent and deletion record writes

---

## Requirements to Structure Mapping

| FR Category | Primary Location |
|---|---|
| Dealer Account Management (FR1–FR6) | `services/dealer.service.ts`, `app/(dealer)/settings/`, `app/(dealer)/onboarding/` |
| Consumer Account Management (FR7–FR12) | `services/consumer.service.ts`, `app/(consumer)/account/`, `app/(consumer)/dashboard/privacy/` |
| DMS Integration (FR13–FR18) | `services/dms.service.ts`, `inngest/dms-sync.ts`, `app/(dealer)/settings/integrations/`, `app/api/webhooks/dealervault/` |
| Email Campaigns (FR19–FR23) | `services/campaign.service.ts`, `inngest/campaign-dispatch.ts`, `emails/campaign-newsletter.tsx`, `app/api/webhooks/resend/` |
| Consumer Dashboard (FR24–FR32) | `app/(consumer)/d/[token]/`, `components/jupiter/`, `components/consumer/` |
| Valuation & Calculations (FR33–FR38) | `services/valuation.service.ts`, `inngest/valuation-refresh.ts`, `lib/redis.ts` |
| Dealer Analytics (FR39–FR41) | `app/(dealer)/analytics/`, `components/dealer/ConsumerEngagementTable.tsx` |
| Compliance & Consent (FR42–FR45) | `services/compliance.service.ts`, `app/(consumer)/dashboard/privacy/`, `app/api/consumers/[consumerId]/consent/` |
| Audit & SysAdmin (FR46–FR50) | `services/audit.service.ts`, `app/(sysadmin)/`, `app/api/admin/`, `components/jupiter/SyncStatusTimeline.tsx` |

**Cross-Cutting Concerns:**
- **Auth & RBAC:** `src/middleware.ts` + `lib/auth.ts` + `src/types/auth.d.ts`
- **Tenant isolation:** `lib/db.ts` (RLS middleware applied globally)
- **Audit logging:** `services/audit.service.ts` (called from all Route Handlers + Inngest steps)
- **Signed URL lifecycle:** `services/signed-url-token.service.ts` + `app/api/signed-url-tokens/`
- **Dealer theming:** `components/jupiter/DealerThemeProvider.tsx` → `app/(consumer)/layout.tsx`

---

## Data Flow

**Consumer Dashboard (signed URL entry):**
```
Email CTA click
  → GET /d/[token]
  → signed-url-token.service.ts validates token (expiry + invalidated_at)
  → dealer.service.ts fetches dealer branding
  → DealerThemeProvider injects CSS vars
  → valuation.service.ts reads Upstash Redis cache
  → Consumer sees dashboard; AuditLog.log("dashboard.accessed")
```

**Bi-weekly Campaign Dispatch:**
```
Inngest scheduler fires campaign/dispatch.scheduled
  → campaign.service.ts fetches eligible consumers per dealer
  → signed-url-token.service.ts generates token per consumer
  → React Email renders dealer-branded newsletter HTML
  → Resend API sends per consumer
  → Resend webhook → /api/webhooks/resend → campaign.service.ts records open/click
  → AuditLog.log("email.sent") per send
```

**DMS Sync (nightly batch):**
```
Inngest dms/sync.requested (scheduled 22:00)
  → dms.service.ts fetches DealerVault data per dealer
  → Validation + normalisation layer
  → Vehicle records upserted in Postgres
  → valuation-refresh.ts triggered for affected VINs
  → DmsSync record written (status, duration)
  → On failure: sync-alert.ts fires → SysAdmin notified
  → AuditLog.log("dms.sync.completed" | "dms.sync.failed")
```
