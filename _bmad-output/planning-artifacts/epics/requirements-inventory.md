# Requirements Inventory

## Functional Requirements

**Dealer Account Management**
- FR1: Dealer Admin can register a new dealership account using email or OAuth (Google/Apple)
- FR2: Dealer Admin can configure dealership branding (logo, color theme, contact information)
- FR3: Dealer Admin can create and manage dealer staff accounts
- FR4: Dealer Admin can assign roles to dealer staff
- FR5: Dealer Admin can set up and manage billing via Stripe
- FR6: Dealer Admin can view and update their dealership profile

**Consumer Account Management**
- FR7: Consumer can access their personalized vehicle dashboard via a dealer-issued signed URL without creating an account
- FR8: Consumer can create a full account for persistent access after signed URL expiry
- FR9: Consumer can sign up directly on the platform without a dealer-triggered email
- FR10: Consumer can view and manage their account information
- FR11: Consumer can submit a self-serve data deletion request from their dashboard
- FR12: Consumer can opt out of email communications from the platform

**DMS Integration**
- FR13: Dealer Admin can connect their dealership's DMS via DealerVault integration
- FR14: The system ingests DMS data via daily batch sync
- FR15: The system receives near-real-time DMS updates via webhook
- FR16: Dealer Admin can simulate DMS data ingestion to preview consumer dashboards before live integration
- FR17: The system validates and normalizes DMS data before ingestion
- FR18: Dealer Admin can view last DMS sync status and failure alerts

**Email Campaign Management**
- FR19: The system automatically sends dealer-branded bi-weekly email newsletters to consumers
- FR20: Dealer Admin can preview the email template before campaign activation
- FR21: The system generates a personalized signed URL for each consumer per campaign
- FR22: The system tracks and stores email open rates and engagement metrics per campaign
- FR23: The system logs all email sends in the audit trail including recipient engagement

**Consumer Vehicle Dashboard**
- FR24: Consumer can view their vehicle's current market valuation
- FR25: Consumer can view their loan equity position (positive equity as value; negative equity as equilibrium projection)
- FR26: Consumer can view their current loan payoff amount
- FR27: Consumer can view their Trade Timer readiness signal
- FR28: Consumer can view active vehicle recalls from NHTSA
- FR29: Consumer can book a dealer service appointment via embedded scheduler (e.g., Xtime) from the recall tile
- FR30: Consumer can view up to 24 months of historical vehicle insight trends
- FR31: Consumer can view their digital insurance ID card (DMS-synced; consumer manual entry fallback)
- FR32: Consumer can view their digital warranty card (DMS-synced; consumer manual entry fallback)

**Vehicle Valuation & Calculations**
- FR33: The system calculates vehicle market value using JD Power (primary), Black Book (fallback)
- FR34: The system applies the Jupiter proprietary valuation algorithm for vehicles owned 12+ months
- FR35: The system applies time-based valuation logic (retail 0–6 months; mid-point 6–12 months; Jupiter algorithm 12+ months)
- FR36: The system calculates vehicle equity from current market value and loan balance
- FR37: The system calculates Trade Timer readiness using depreciation, payoff, and seasonality formula
- FR38: The system caches valuation results for 7–14 days

**Dealer Analytics Dashboard**
- FR39: Dealer Admin can view campaign performance metrics (open rates, click-throughs, consumer activity)
- FR40: Dealer Staff can view campaign performance analytics (read-only; no billing or branding access)
- FR41: Dealer Admin can identify consumers with high engagement indicators (repeat visits, Trade Timer in green zone)

**Compliance & Consent Management**
- FR42: The system captures and stores consumer opt-out preferences and honors them within 10 business days
- FR43: The system tracks consumer consent for data use in accordance with CCPA/CPRA
- FR44: The system processes consumer self-serve data deletion requests and logs each action in the audit trail
- FR45: All email communications include required CAN-SPAM elements (unsubscribe link, sender identification, physical address)

**Audit & System Administration**
- FR46: Jupiter SysAdmin can view audit logs for all key system actions (dashboard access, email sends, integration events, consent and deletion actions)
- FR47: Jupiter SysAdmin can monitor DMS sync status across all dealer tenants
- FR48: Jupiter SysAdmin can manually trigger a DMS re-sync for a specific dealer tenant
- FR49: Jupiter SysAdmin can manage roles and access across the platform
- FR50: The system generates and validates time-limited signed URLs for consumer dashboard access (7-day expiry)

## Non-Functional Requirements

**Performance**
- NFR1: Consumer dashboard loads within 3 seconds on a standard mobile connection (95th percentile)
- NFR2: Valuation data served from cache on every dashboard load — no real-time API calls per request
- NFR3: Bi-weekly email campaigns complete full dispatch on schedule regardless of dealer list size
- NFR4: DMS batch sync completes within a nightly window (22:00–06:00) without impacting daytime platform performance

**Security**
- NFR5: All data encrypted at rest and in transit (TLS 1.2+)
- NFR6: KMS-managed secrets for all API keys and credentials; rotation requires no platform downtime
- NFR7: IP allow-listing enforced on admin and integration endpoints
- NFR8: Signed URLs time-limited (7-day expiry); invalidated on consumer account creation
- NFR9: Token-based authentication for all authenticated sessions
- NFR10: OWASP Top 10 vulnerabilities remediated before production launch
- NFR11: Tenant data fully isolated — no cross-tenant data access at any layer

**Scalability**
- NFR12: New dealer tenants onboard without infrastructure changes
- NFR13: Email send infrastructure scales with dealer base without degrading delivery rate below 99%
- NFR14: Valuation caching absorbs consumer volume growth without proportional increase in third-party API calls
- NFR15: AWS/Vercel deployment supports horizontal scaling for consumer dashboard traffic growth

**Accessibility**
- NFR16: Consumer dashboard conforms to WCAG 2.1 Level AA
- NFR17: All interfaces usable on mobile, tablet, and desktop without horizontal scrolling or zooming

**Reliability**
- NFR18: Email delivery rate: ≥99%
- NFR19: DMS sync failure rate: <1%; automated alerting on every failure
- NFR20: Audit logs append-only and tamper-evident
- NFR21: Historical data retained without loss for 24 months
- NFR22: CI/CD pipeline supports hotfix deployment to production within one business day

**Integration**
- NFR23: DealerVault integration supports daily batch and near-real-time webhook; simulation mode available pre-go-live
- NFR24: JD Power → Black Book fallback is automatic with no manual intervention
- NFR25: NHTSA API calls fault-tolerant — recall tile hidden gracefully if API unavailable
- NFR26: Stripe webhook events processed idempotently to prevent duplicate billing
- NFR27: All third-party API credentials managed via KMS

## Additional Requirements

_From Architecture — technical requirements that impact epic and story creation:_

- **🚨 STARTER TEMPLATE (Epic 1 Story 1)**: Architecture specifies `nextjs/saas-starter` as the bootstrap template. Initialization command: `npx degit nextjs/saas-starter jupiter && pnpm install`, then replace Drizzle with Prisma + Neon. This is the mandatory first story.
- Database: PostgreSQL via Neon (serverless) + Prisma ORM (schema-first, migrations via `prisma migrate`). RLS via Postgres Row-Level Security with `dealer_id` on every tenant-scoped table. Prisma middleware injects session `dealer_id`.
- Auth: Auth.js v5 (NextAuth) + JWT sessions (HTTP-only cookies). Email/password from starter + Google/Apple OAuth extension. Session includes `userId`, `role`, `dealerId`.
- RBAC: 4 roles (`DEALER_ADMIN`, `DEALER_STAFF`, `CONSUMER`, `SYSADMIN`). Enforced at Next.js middleware (route-level) + API Route Handler (secondary check) + Prisma RLS (data layer).
- Signed URLs: Random token per consumer per campaign stored in Postgres with expiry and invalidation fields. Validated on every resolution via DB lookup.
- Background Jobs: Inngest for all long-running/scheduled jobs — `dms.sync.daily`, `dms.webhook.process`, `campaign.dispatch`, `valuation.refresh`, `sync.alert.fire`.
- Caching: Upstash Redis. Cache-aside pattern for valuations. Cache key: `valuation:{vin}:{source}`. TTL: 7–14 days.
- Email Delivery: Resend + React Email. Templates are React components. Engagement tracking via Resend webhooks.
- DMS Integration: DealerVault. Batch via Inngest scheduled function. Webhook endpoint: `app/api/webhooks/dealervault/route.ts`. Simulation mode via `simulation_mode` flag per tenant.
- Payments: Stripe Checkout + Customer Portal + idempotent webhook handler (pre-wired from starter).
- Validation: Zod at all Route Handler boundaries + React Hook Form + Zod resolvers on all client forms.
- Secret Management: Vercel Environment Variables (MVP). Post-MVP upgrade to Doppler/AWS KMS.
- Deployment: Vercel (frontend + API routes). GitHub Actions for quality gates (Prisma migration checks, axe-core accessibility CI, Vitest unit tests, OWASP pre-launch).
- Monitoring: Vercel Analytics + Speed Insights. Vercel Log Drains for structured logs. Audit logs in append-only Postgres table (24-month retention).
- Implementation sequence (from architecture): Schema → Auth/RBAC → Inngest scaffolding → Redis cache → Resend/React Email → DealerVault → Valuation engine → Consumer dashboard → Dealer portal → Compliance layer.

## UX Design Requirements

- UX-DR1: **DealerThemeProvider** — per-tenant CSS variable injection (`--dealer-primary`, `--dealer-accent`, `--dealer-foreground`, `--dealer-logo`) at ConsumerDashboardLayout level. Must include WCAG AA contrast auto-correction: if dealer colour fails 4.5:1 ratio against white, fall back to Jupiter Blue (`#2563EB`). Applied once; all child consumer components inherit.
- UX-DR2: **VehicleHeroSection custom component** — full-width dark gradient container; dealer logo + name (top-left); vehicle year/make/model; market value in `text-4xl font-bold`; value delta badge (emerald/red); attribution caption. States: `loading`, `default`, `no-image`, `stale-data`. Accessibility: `role="banner"`, value as `aria-live="polite"`.
- UX-DR3: **VehicleInsightTile custom component** — reusable tile for equity, payoff, Trade Timer, recall, insurance, warranty. Full-width, no card box, typographic layout. Expandable with chevron. Expanded state shows 24-month Recharts trend chart. States: `default`, `expanded`, `positive`, `negative`, `neutral`, `loading`, `unavailable`. Accessibility: `role="region"`, `aria-label` per tile, `aria-expanded` on expand button.
- UX-DR4: **TradeTimerIndicator custom component** — text-only treatment: coloured dot + plain language sentence (e.g. "Optimal window in 47 days"). Three states: `green`, `amber`, `red`. No gauge, arc, or percentage. Accessibility: `aria-live="polite"`, full sentence as `aria-label`.
- UX-DR5: **RecallAlertTile custom component** — amber container, warning icon, recall title + description, "Book a service appointment" text-link CTA. States: `active` (visible), `hidden` (returns null), `loading` (hidden). Accessibility: `role="alert"`, `aria-label="Active vehicle recall"`.
- UX-DR6: **SyncStatusTimeline custom component** — vertical chronological event list (newest first). Each event: timestamp, type, status badge (Success/Failed/In Progress/Pending), expandable detail with root cause + retry info. Inline manual re-sync CTA on failed events (triggers confirmation dialog). Accessibility: `role="log"`, `aria-live="polite"`.
- UX-DR7: **OnboardingChecklist custom component** — vertical step list (numbered). Step states: pending (grey), active (blue, expanded inline), complete (emerald), skipped (slate italic). Active step expands content inline — no modal/page navigation. Completion state: all green + "First campaign scheduled" confirmation. Accessibility: `role="list"`, `aria-current="step"` on active item.
- UX-DR8: **shadcn/ui DataTable configuration** — TanStack DataTable for dealer analytics consumer table. Sortable, filterable. Pre-sorted by engagement indicator. Avatar for consumer initials. Row actions via DropdownMenu. Inline column filters; filter chips above table when active; text search by name/vehicle. Filters persist within session.
- UX-DR9: **Responsive strategy — Consumer Dashboard** — mobile-first (375px base). Default: single-column full-bleed. `sm`: 2-column tile grid. `md`: max-width 480px, centred. Hero gradient renders immediately, skeleton pulse on values. Target: Vehicle Value visible within 1 second.
- UX-DR10: **Responsive strategy — Dealer Portal** — desktop-first (1280px+). `lg`: fixed left sidebar (240px) + main content. `xl`: right panel for contextual detail. Below `lg`: sidebar collapses to top nav, secondary table columns hidden.
- UX-DR11: **Accessibility implementation** — WCAG 2.1 AA across all surfaces. Keyboard navigation: all interactive elements reachable via Tab; arrow keys in tables; focus trap in modals; Escape to close. Screen reader: VehicleHeroSection `<h1>` + aria-label on values; financial colours always paired with text/icon; never rely on colour alone. Touch targets: minimum 44×44px; CTA buttons `h-12` on mobile. Motion: `prefers-reduced-motion` respected with global CSS rule.
- UX-DR12: **UX Consistency Patterns implementation** — Button hierarchy (one primary per context; text-link for consumer CTAs; destructive always with confirmation dialog). Feedback patterns (Sonner toast for success/error; inline stale data messaging; Skeleton loaders — no full-page spinners; inline field validation on blur). Form patterns (single-column; label above; auto-save on blur for onboarding). Empty state patterns (icon + explanation + CTA; never "empty"; hide consumer tiles with no data entirely). Modal/confirmation patterns (irreversible actions only; no X on destructive confirmations). Navigation (no chrome on consumer dashboard; role-scoped sidebar items absent, not greyed).
- UX-DR13: **Visual design tokens** — Color system: Jupiter Blue `#2563EB` (primary CTA); emerald-600 `#059669` (financial positive); red-600 `#DC2626` (financial negative); amber-600 `#D97706` (financial caution); gray-900 `#111827` (body text). Typography: tabular figures for all financial values (`font-tabular`). Spacing: Tailwind default scale. All implemented as CSS variables and Tailwind config extensions.
- UX-DR14: **Recharts integration** — 24-month historical trend chart inside `VehicleInsightTile` expanded state. Responsive container wrapping. Lazy-loaded (not in initial paint). Phase 3 / post-MVP enhancement.

## FR Coverage Map

- FR1–FR6: Epic 2 — Dealer registration, branding, staff management, roles, Stripe billing, profile
- FR7: Epic 4 — Consumer signed URL dashboard access (no account required)
- FR8–FR12: Epic 6 — Consumer account creation, profile management, opt-out, self-serve deletion
- FR13–FR18: Epic 3 — DealerVault connection, daily batch sync, webhook, simulation mode, validation, sync status
- FR19–FR23: Epic 5 — Bi-weekly campaign dispatch, email preview, signed URL per consumer, engagement tracking, audit logging
- FR24–FR32: Epic 4 — Consumer dashboard tiles (valuation, equity, payoff, Trade Timer, recall, service booking, history, insurance, warranty)
- FR33–FR38: Epic 4 — Valuation engine (JD Power/Black Book/Jupiter algorithm, equity calc, Trade Timer calc, Redis cache)
- FR39–FR41: Epic 7 — Dealer analytics table, Staff read-only access, high-engagement consumer identification
- FR42–FR45: Epic 8 — Opt-out preferences, CCPA/CPRA consent tracking, self-serve deletion + audit, CAN-SPAM compliance
- FR46–FR49: Epic 9 — SysAdmin audit log, DMS monitoring, manual re-sync, role management
- FR50: Epic 4 — Signed URL generation, validation, 7-day expiry, invalidation on account creation
