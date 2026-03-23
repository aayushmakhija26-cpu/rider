# Core Architectural Decisions

## Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Multi-tenancy isolation: RLS in Postgres
- Background job infrastructure: Inngest
- Authentication: Auth.js v5 + JWT sessions
- Signed URL system: DB-stored tokens
- Caching layer: Upstash Redis

**Important Decisions (Shape Architecture):**
- API pattern: REST via Next.js Route Handlers
- Email delivery: Resend + React Email
- Validation: Zod
- State: Next.js Server Components + fetch
- Secret management: Vercel Environment Variables (KMS upgrade post-MVP)

**Deferred Decisions (Post-MVP):**
- KMS-backed secret rotation (Doppler or AWS KMS) — accepted gap against NFR
- Error tracking (Sentry or equivalent) — Vercel logs used for MVP
- TanStack Query — reconsidered if client-side caching needs emerge

---

## Data Architecture

**Multi-tenancy Isolation: Row-Level Security (RLS)**
- Single Postgres schema; every tenant-scoped table carries a `dealer_id` column
- Postgres RLS policies enforce isolation at the database layer — no cross-tenant data access possible even from application bugs
- Prisma client configured with a middleware that sets `app.current_dealer_id` session variable on every connection, used by RLS policies
- Aligns with Neon's serverless connection model; no schema provisioning overhead

**Caching: Upstash Redis**
- Serverless Redis via Upstash — per-request billing, zero cold starts, native Vercel integration
- Valuation cache keys: `valuation:{vin}:{source}` with 7–14 day TTL
- Cache-aside pattern: check Redis → hit returns cached value; miss triggers JD Power / Black Book API call → result stored in Redis + Postgres
- Consumer dashboard always reads from cache — no real-time third-party API calls on page load (meets NFR: valuation served from cache on every dashboard load)
- Trade Timer calculation inputs also cached; invalidated on DMS sync completion

**Validation: Zod**
- Runtime schema validation at all API Route Handler boundaries
- `zod-prisma-types` generates Zod schemas from Prisma models — single source of truth for data shapes
- React Hook Form + Zod resolvers for all client-side forms

**ORM & Migrations: Prisma**
- Schema-first with Prisma Migrate for versioned, repeatable migrations
- Prisma Client with RLS middleware for tenant context injection
- Neon serverless driver (`@neondatabase/serverless`) for HTTP-based connections in Vercel serverless functions

---

## Authentication & Security

**Auth: Auth.js v5 (NextAuth) + JWT Sessions**
- Email/password login (from starter) + Google OAuth + Apple OAuth (FR1)
- JWT sessions stored in HTTP-only cookies; session includes `userId`, `role`, `dealerId` (null for Consumer and SysAdmin)
- Auth.js Prisma adapter for session and account persistence in Neon
- Session `role` field drives RBAC at both route and API layer

**RBAC: Role-Scoped Middleware**
- 4 roles: `DEALER_ADMIN`, `DEALER_STAFF`, `CONSUMER`, `SYSADMIN`
- Next.js middleware (`middleware.ts`) enforces route-level access by role
- API Route Handlers perform a secondary role check before data access
- Prisma RLS middleware injects `dealer_id` from session for tenant scoping

**Signed URLs: DB-Stored Tokens**
- Random token generated per consumer per campaign (`crypto.randomUUID()`); stored in Postgres with `consumer_id`, `dealer_id`, `campaign_id`, `expires_at`, `invalidated_at`
- Validation: DB lookup on every signed URL resolution — checks expiry and invalidated status
- Invalidation on account creation: single UPDATE sets `invalidated_at`
- 7-day expiry enforced at DB level; expired tokens return a dedicated expiry screen

**Secret Management: Vercel Environment Variables**
- All API keys and credentials stored as Vercel environment variables (encrypted at rest by Vercel)
- Separate env var sets per environment (Dev / Preview / Production)
- Manual rotation procedure documented; zero-downtime rotation via Vercel API (update env var → redeploy)
- **Accepted gap:** Does not meet the PRD's "KMS-managed secrets" NFR strictly. Post-MVP upgrade path: migrate to Doppler or AWS Secrets Manager with HSM-backed KMS and automated rotation workflows

**Additional Security:**
- TLS 1.2+ enforced by Vercel and Neon (no configuration required)
- IP allowlisting on admin and DMS integration endpoints via Vercel Firewall rules
- OWASP Top 10 review conducted pre-launch (manual + automated via CI)

---

## API & Communication Patterns

**API Design: REST via Next.js Route Handlers**
- All API endpoints as `app/api/[resource]/route.ts` files
- Standard HTTP verbs; JSON request/response bodies
- Zod validation on all request bodies at the Route Handler boundary
- Error responses follow a consistent shape: `{ error: string, code: string }`

**Background Jobs: Inngest**
- Hosts all long-running and scheduled processes that cannot run on Vercel serverless functions
- Key functions:
  - `dms.sync.daily` — nightly DMS batch ingestion per dealer tenant (scheduled)
  - `dms.webhook.process` — near-real-time DMS webhook event processing
  - `campaign.dispatch` — bi-weekly email campaign fan-out per dealer tenant (scheduled; generates signed URLs + triggers Resend sends per consumer)
  - `valuation.refresh` — cache refresh job for expiring valuation entries
  - `sync.alert.fire` — failure alert on DMS sync errors
- Inngest handles retries, concurrency, step-level durability, and scheduling
- Vercel → Inngest communication via signed webhook from Route Handlers

**Email Delivery: Resend + React Email**
- Resend as the transactional email provider (≥99% delivery rate NFR)
- React Email for dealer-branded email template authoring — templates are React components that accept `dealerTheme`, `consumerData`, `vehicleData` props
- Each campaign send triggered by Inngest's `campaign.dispatch` function; Resend API called per consumer within the Inngest step
- Engagement tracking (open rates, click-throughs) via Resend webhooks → stored in Postgres per campaign

**DMS Integration: DealerVault via Inngest**
- DealerVault daily batch: Inngest scheduled function fetches, validates, and normalises data per dealer tenant nightly
- Webhook: DealerVault pushes events to a Next.js Route Handler (`app/api/webhooks/dealervault/route.ts`) → enqueues Inngest event for processing
- Simulation mode: seeded fixture data loaded into Postgres without live DealerVault credentials; toggled per dealer tenant via a `simulation_mode` flag

**Third-Party API Error Handling:**
- JD Power failure → automatic Black Book fallback (no manual intervention)
- NHTSA unavailable → recall tile hidden gracefully (no error shown to consumer)
- Stripe webhooks → idempotency key on every event; duplicate events safely ignored

---

## Frontend Architecture

**Rendering: Next.js Server Components + fetch**
- Server Components as the default for all data-fetching views
- Dealer portal (data-dense, analytics): fully server-rendered — no client state libraries needed
- Consumer dashboard: server-rendered initial load with selective Client Components for interactive tile expansion and account creation flow
- `fetch` with Next.js caching directives for API data; `revalidatePath` / `revalidateTag` for on-demand cache invalidation after mutations

**Forms: React Hook Form + Zod**
- All forms (registration, branding, DMS setup, VIN entry) use React Hook Form with Zod resolvers
- Server Actions for form submission where appropriate (Next.js 16 pattern)

**Charts: Recharts**
- Used for 24-month historical trend visualisation inside `VehicleInsightTile` expanded state
- Responsive container wrapping; lazy-loaded (not in initial paint)

**Email Templates: React Email**
- Templates authored as React components in `emails/` directory
- Props: `dealerTheme`, `consumerName`, `vehicleData`, `signedUrl`, `tileData`
- Previewed locally via React Email dev server; rendered to HTML by Resend at send time

**Component Structure:**
- `src/components/ui/` — shadcn/ui components (owned, not imported)
- `src/components/jupiter/` — Jupiter custom components (VehicleHeroSection, VehicleInsightTile, TradeTimerIndicator, RecallAlertTile, SyncStatusTimeline, OnboardingChecklist)
- `src/components/dealer/` — Dealer portal specific components
- `src/components/consumer/` — Consumer dashboard specific components

---

## Infrastructure & Deployment

**CI/CD: Vercel (frontend) + GitHub Actions (quality gates)**
- Vercel: automatic preview deployments on every PR; production deploy on merge to `main`; environment promotion via branch strategy (dev → preview → main)
- GitHub Actions: Prisma migration safety checks, Zod schema validation, axe-core accessibility CI (`@axe-core/playwright`), unit tests (Vitest), OWASP checks pre-launch

**Monitoring: Vercel Analytics + Speed Insights**
- Page-level performance, Core Web Vitals, and visitor analytics
- Vercel Speed Insights for real-user performance monitoring on consumer dashboard (mobile p95 load time NFR tracked here)
- **Accepted gap:** No automated runtime error tracking for MVP; server errors investigated via Vercel function logs. Post-MVP: add Sentry

**Logging:**
- Application logs: Vercel Log Drains (structured JSON) forwarded to log aggregation (Logtail / Better Stack or Axiom — to be configured)
- Audit logs: append-only Postgres table in Neon; `created_at` indexed; never deleted; 24-month retention enforced

---

## Decision Impact Analysis

**Implementation Sequence:**
1. Prisma schema design (tenant model, RLS policies, signed URL tokens, audit log)
2. Auth.js v5 setup with Google/Apple OAuth + 4-role RBAC middleware
3. Inngest function scaffolding (DMS sync, campaign dispatch, valuation refresh)
4. Upstash Redis caching layer (valuation cache-aside pattern)
5. Resend + React Email (dealer-branded template + campaign dispatch integration)
6. DealerVault integration (batch + webhook + simulation mode)
7. Valuation engine (JD Power → Black Book → Jupiter algorithm + cache write)
8. Consumer dashboard (signed URL resolution, DealerThemeProvider, tile rendering)
9. Dealer portal (analytics, onboarding checklist, DMS sync status)
10. Compliance layer (opt-out checks, CCPA consent, deletion workflows, audit hooks)

**Cross-Component Dependencies:**
- RLS middleware depends on session `dealer_id` → Auth must be set up before any data access layer
- Valuation cache depends on Upstash Redis → cache layer before consumer dashboard
- Campaign dispatch depends on Resend + signed URL generation → both must exist before email pipeline
- Inngest functions depend on Prisma models → schema must be finalised first
- DealerThemeProvider depends on dealer config in Postgres → tenant model before consumer dashboard
