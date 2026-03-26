# Story 2.6: Stripe Billing Setup

Status: review

## Story

As a Dealer Admin,
I want to set up my dealership's billing via Stripe,
so that my subscription is active and I can access all platform features.

## Acceptance Criteria

1. **Given** the Dealer Admin opens the billing setup step
   **When** they click "Set up billing" and complete the Stripe Checkout flow
   **Then** a Stripe Customer and Subscription are created and their IDs are stored on the `Dealer` record (`stripeCustomerId`, `stripeSubscriptionId`)

2. **And** the Dealer Admin is returned to the onboarding checklist with the billing step marked `complete`

3. **And** the Stripe Customer Portal is accessible from `/settings/billing` for future billing management (plan changes, payment method updates)

4. **And** Stripe webhook events are processed idempotently — duplicate `customer.subscription.updated` events do not create duplicate records

---

## Tasks / Subtasks

- [x] Task 1: Add billing service functions to `dealer.service.ts` (AC: 1, 4)
  - [x] Add `getDealerByStripeCustomerId(customerId: string): Promise<Dealer | null>`
  - [x] Add `updateDealerStripeSubscription(dealerId, data: { stripeCustomerId?, stripeSubscriptionId?, stripeProductId?, planName?, subscriptionStatus? }): Promise<Dealer>`
  - [x] Idempotency: use plain `prisma.dealer.update()` — same fields overwritten with same values on duplicate events produces identical state

- [x] Task 2: Add dealer-specific Stripe session helpers to `lib/payments/stripe.ts` (AC: 1, 3)
  - [x] Add `createDealerCheckoutSession({ dealerId, priceId, existingStripeCustomerId? })` — creates Stripe Checkout session; pass `existingStripeCustomerId` as `customer:` to reuse if already present
  - [x] Add `createDealerPortalSession({ stripeCustomerId, returnUrl })` — creates Stripe Customer Portal session
  - [x] Keep existing `Team`-based functions untouched — do NOT remove or modify them

- [x] Task 3: Replace stub checkout route with full implementation (AC: 1, 2)
  - [x] `POST /api/stripe/checkout` (body: `{ priceId: string }`) — DEALER_ADMIN only — validate with Zod, call `createDealerCheckoutSession()`, return `{ url }`
  - [x] `GET /api/stripe/checkout?session_id=...` — retrieve Stripe session, extract `customer` + `subscription` IDs, call `updateDealerStripeSubscription()`, mark billing OnboardingStep `complete` via `onboardingStepService.updateStep()`, log audit event `billing_setup_completed`, redirect to `/onboarding`
  - [x] Handle error cases: session not found or status not `complete` → redirect to `/onboarding?billing_error=true`

- [x] Task 4: Create Stripe Customer Portal route (AC: 3)
  - [x] Create `app/api/stripe/portal/route.ts`
  - [x] `POST /api/stripe/portal` — DEALER_ADMIN only — check `Dealer.stripeCustomerId` exists (return 400 if not), call `createDealerPortalSession()`, return `{ url }`
  - [x] Return URL for portal: `${process.env.BASE_URL}/settings/billing`

- [x] Task 5: Update webhook handler to use `dealer.service.ts` (AC: 4)
  - [x] In `app/api/stripe/webhook/route.ts`, replace calls to `getTeamByStripeCustomerId()` (non-functional stub) and `updateTeamSubscription()` (non-functional stub) with `dealer.service.ts` functions
  - [x] Handle events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - [x] For `deleted`/`canceled`: clear `stripeSubscriptionId`, `stripeProductId`, `planName`; set `subscriptionStatus: 'canceled'`
  - [x] Keep signature verification (`stripe.webhooks.constructEvent`) — do not remove
  - [x] Log `auditService.log()` for each subscription state change

- [x] Task 6: Add route protection for billing page (AC: 3)
  - [x] Update `lib/auth/route-rules.ts`: add `{ prefix: '/settings/billing', access: ['DEALER_ADMIN'] }` — insert it BEFORE the `/dashboard` catch-all (currently line 18)
  - [x] Critical: `/settings/billing` currently has NO matching rule; middleware falls through to "no rule matched → public" — this is a security gap

- [x] Task 7: Create billing settings page (AC: 3)
  - [x] Create `app/(dashboard)/settings/billing/page.tsx` (Server Component) — NOTE: project uses `(dashboard)` route group, not `(dealer)`
  - [x] Fetch `Dealer` billing fields from session `dealerId` via `dealer.service.ts`
  - [x] Show: plan name, subscription status badge, "Manage Subscription" button
  - [x] "Manage Subscription" button: client component POST to `/api/stripe/portal` → redirect to portal URL
  - [x] When no subscription: show "Set up billing" button pointing to Stripe Checkout flow

- [x] Task 8: Implement `BillingStep.tsx` with Stripe integration UI (AC: 1, 2)
  - [x] Replace placeholder with full implementation:
    - **Pending state**: "Set up billing" button — POST to `/api/stripe/checkout` with `priceId`, redirect browser to returned `url`
    - **Complete state**: plan name + status badge + "Manage Subscription" link to `/settings/billing`
  - [x] Show loading state while creating checkout session
  - [x] Use `NEXT_PUBLIC_STRIPE_PRICE_ID` env var as the priceId for the Checkout session
  - [x] Do NOT call the `onUpdate` prop for completion — billing step completion is handled server-side by the checkout GET handler

- [x] Task 9: Add test coverage (AC: 1, 2, 3, 4)
  - [x] Unit tests for `getDealerByStripeCustomerId()` and `updateDealerStripeSubscription()`
  - [x] Unit tests for webhook handler: `customer.subscription.updated` calls correct service functions; unknown customer → graceful no-op
  - [x] Route tests: `POST /api/stripe/checkout` requires DEALER_ADMIN; invalid body returns 400
  - [x] Route tests: `POST /api/stripe/portal` requires DEALER_ADMIN; missing `stripeCustomerId` returns 400
  - [x] E2E test in `tests/e2e/stripe-billing.spec.ts`

---

## Dev Notes

### Story Intent

This story wires up the Stripe billing integration for the dealer onboarding flow. The three user-facing outcomes are:

1. **Initial setup**: Dealer Admin clicks "Set up billing" → Stripe Checkout → returns with active subscription, billing step marked complete
2. **Subscription management**: From `/settings/billing`, Dealer Admin accesses the Stripe Customer Portal for plan and payment changes
3. **Webhook reliability**: Stripe subscription events update `Dealer` record idempotently in the background

The key complexity is managing two update paths for the same data: the checkout success redirect (immediate, synchronous) and the Stripe webhook (asynchronous). Both must produce identical final state.

### Current Repository Reality

**What already exists (do NOT reinvent)**

- `jupiter/lib/payments/stripe.ts` — already has `getStripe()`, `getStripePrices()`, `getStripeProducts()`, plus `createCheckoutSession()` and `createCustomerPortalSession()` that use the **Team** model (starter template). Add new dealer-specific functions alongside these — do NOT remove or modify the existing Team-based ones.
- `jupiter/app/api/stripe/webhook/route.ts` — correct signature verification structure, but calls `getTeamByStripeCustomerId()` and `updateTeamSubscription()` which are stubs in `lib/db/queries.ts` returning `null` / `void`. The webhook currently does nothing meaningful — replace these calls with `dealer.service.ts` functions.
- `jupiter/app/api/stripe/checkout/route.ts` — GET-only stub that redirects to `/pricing`. The comment explicitly states: *"Full Prisma-based implementation will be added in Story 2.6 (Stripe billing)"*. Replace entirely.
- `jupiter/components/dealer/steps/BillingStep.tsx` — stub placeholder. Needs full implementation.
- `jupiter/prisma/schema.prisma` — `Dealer` model already has all required billing fields: `stripeCustomerId` (unique), `stripeSubscriptionId` (unique), `stripeProductId`, `planName`, `subscriptionStatus`.
- `jupiter/src/services/onboardingStep.service.ts` — `updateStep(dealerId, 'billing', 'complete', data)` marks the billing step complete. Use this in the checkout GET handler.
- `jupiter/components/dealer/OnboardingChecklist.tsx` — already renders `<BillingStep>` with `{ status, data, onUpdate }` props. No changes needed here unless BillingStep props change.

**What does NOT exist yet**

- No `getDealerByStripeCustomerId()` or `updateDealerStripeSubscription()` in `dealer.service.ts`
- No POST `/api/stripe/checkout` route (only the GET stub exists)
- No `/api/stripe/portal` route
- No `app/(dealer)/settings/billing/page.tsx` (confirmed: no match in codebase)
- No route protection for `/settings/billing` — current middleware behavior: `if (!rule) return slideSession(request, null)` → **falls through as public page** (security gap)

**Starter-template residue — DO NOT extend or reuse**

- `lib/payments/actions.ts` — `checkoutAction` and `customerPortalAction` use `withTeam` (starter auth middleware, not the Jupiter `requireAuth` pattern). Do not call or extend these.
- `lib/db/queries.ts` — `getTeamByStripeCustomerId()` and `updateTeamSubscription()` are stubs retained for build compatibility only. Do not add new calls to these.
- `app/api/stripe/checkout/route.ts` — the current stub was explicitly designed as temporary for Story 1.1. Replace it, don't build on it.

### Key Constraints and Decisions

**1. Two-path subscription update (checkout redirect + webhook)**

After completing Stripe Checkout:
- Stripe redirects to `GET /api/stripe/checkout?session_id=...`
- Handler calls `stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription', 'subscription.items.data.price.product'] })`
- Extracts `customer` (string ID) and `subscription` (object with `id`, `status`, `items`)
- Calls `updateDealerStripeSubscription()` with all billing fields
- Calls `onboardingStepService.updateStep(dealerId, 'billing', 'complete', { planName, subscriptionStatus: 'active' })`
- Redirects to `/onboarding`

Webhooks (`customer.subscription.created/updated`) also call `updateDealerStripeSubscription()`. Both paths write the same fields with the same values — a plain `prisma.dealer.update()` is inherently idempotent.

**2. Stripe Customer ID — created at checkout, reused on retry**

The Stripe Customer is NOT created at dealer registration. It is created by Stripe during the first Checkout flow. For dealers retrying after a cancelled checkout (where no subscription was created but a Customer was), pass `customer: dealer.stripeCustomerId || undefined` in the Checkout session creation to reuse the existing Customer.

**3. Webhook signature verification is mandatory**

The existing webhook handler already does `stripe.webhooks.constructEvent(payload, signature, webhookSecret)`. Do NOT remove this — it prevents replay attacks.

**4. Route protection gap — security issue**

`/settings/billing` has no matching ROUTE_RULES entry. The middleware's `if (!rule || rule.access === 'public')` branch returns `slideSession(request, null)` — the page is effectively public. Add:
```typescript
{ prefix: '/settings/billing', access: ['DEALER_ADMIN'] }
```
Insert BEFORE the `/dashboard` rule (line 18 in current `route-rules.ts`). More-specific prefixes must precede less-specific ones (enforced comment at line 8).

**5. OnboardingStep billing completion is server-side only**

The `BillingStep` `onUpdate` callback triggers step completion for other steps (branding, staff). For billing, do NOT use `onUpdate` — the step is marked complete by the checkout GET handler after verifying with Stripe. The "Set up billing" button should redirect to Stripe, not call `onUpdate`.

**6. STRIPE_PRICE_ID environment variable**

For the initial MVP, the billing step uses a single plan. Use `process.env.STRIPE_PRICE_ID` (or `NEXT_PUBLIC_STRIPE_PRICE_ID` if needed on client side) as the priceId for the Checkout session. This must be documented in `.env.example`. Do not hardcode a price ID.

**7. `handleSubscriptionChange` in `lib/payments/stripe.ts`**

The existing `handleSubscriptionChange()` function uses `getTeamByStripeCustomerId()` (stub returning null) and `updateTeamSubscription()` (stub returning void). Do NOT call this function from the updated webhook handler — bypass it entirely and call `dealer.service.ts` functions directly.

### Suggested Implementation Sequence

1. Add `getDealerByStripeCustomerId()` and `updateDealerStripeSubscription()` to `dealer.service.ts`
2. Add `createDealerCheckoutSession()` and `createDealerPortalSession()` to `lib/payments/stripe.ts`
3. Replace `app/api/stripe/checkout/route.ts` (full POST + GET implementation)
4. Create `app/api/stripe/portal/route.ts`
5. Update `app/api/stripe/webhook/route.ts` to use dealer service functions
6. Add `/settings/billing` to `lib/auth/route-rules.ts`
7. Create `app/(dealer)/settings/billing/page.tsx`
8. Implement `components/dealer/steps/BillingStep.tsx`
9. Add tests

### Architecture Compliance

- All Prisma queries in `src/services/` — `getDealerByStripeCustomerId()` and `updateDealerStripeSubscription()` go in `dealer.service.ts` (already imports `prisma` from `@/src/lib/db`)
- Route Handlers use `requireAuth(['DEALER_ADMIN'])` from `lib/auth/session.ts`
- Error responses: `Response.json({ error: string, code: string }, { status: N })`
- Success (data): `Response.json(data)` or `Response.json(data, { status: 201 })` — no `{ success: true, data: ... }` wrapper
- Audit log billing_setup_completed and subscription changes via `auditService.log()`
- Zod validation at Route Handler boundary BEFORE service calls
- ISO 8601 dates in API responses
- Stripe API version already set to `2025-04-30.basil` in `lib/payments/stripe.ts`

### Previous Story Intelligence

**From Story 2.5 (Role Assignment)**
- `requireAuth()` from `lib/auth/session.ts` is the auth check pattern in Route Handlers — returns `SessionData` or throws `AuthError`
- `auditService.log()` call shape: `{ action: string, actorId: string, actorRole: Role, dealerId: string, targetId: string, targetType: string, metadata?: object }`
- Route files: `jupiter/app/api/[resource]/route.ts`

**From Story 2.3 (Branding) + Story 2.2 (Onboarding)**
- `onboardingStepService.updateStep()` is the pattern for marking steps complete
- `dealer.service.ts` imports: `import { prisma } from '@/src/lib/db'` and `import type { Dealer, DealerUser } from '@prisma/client'`
- `OnboardingChecklist` renders `BillingStep` — no need to change the checklist itself

**From Story 2.4 (Staff Management)**
- Zod schemas for route bodies use `z.object({...}).safeParse(body)` pattern (or `.parse()` in try/catch)

### File Structure Guidance

**New or changed files**

```
jupiter/src/services/dealer.service.ts              (add getDealerByStripeCustomerId, updateDealerStripeSubscription)
jupiter/lib/payments/stripe.ts                      (add createDealerCheckoutSession, createDealerPortalSession)
jupiter/app/api/stripe/checkout/route.ts            (replace stub — full POST + GET)
jupiter/app/api/stripe/webhook/route.ts             (update subscription lookup/update to use dealer.service.ts)
jupiter/app/api/stripe/portal/route.ts              (new: POST → create portal session + return { url })
jupiter/app/(dealer)/settings/billing/page.tsx      (new: billing settings Server Component)
jupiter/components/dealer/steps/BillingStep.tsx     (implement with checkout button and subscription status)
jupiter/lib/auth/route-rules.ts                     (add /settings/billing as DEALER_ADMIN)
jupiter/src/services/dealer.service.test.ts         (add billing service tests)
jupiter/tests/e2e/stripe-billing.spec.ts            (new: E2E billing setup flow)
```

**Files to treat carefully**

```
jupiter/lib/payments/actions.ts   — Do NOT modify; legacy starter withTeam actions
jupiter/lib/db/queries.ts         — Do NOT add new calls; stubs only for build compatibility
jupiter/lib/db/schema.ts          — Do NOT modify; legacy Team type
jupiter/lib/payments/stripe.ts    — ADD new dealer functions; do NOT modify Team-based functions
```

### UX / Interaction Requirements

**BillingStep.tsx states:**
- **Pending** (no billing set up): "Set up billing" button — on click, POST to `/api/stripe/checkout` with `priceId`, then `window.location.href = url` to redirect to Stripe
- **Complete** (billing active): show `planName` + `subscriptionStatus` badge (emerald for `active`/`trialing`, red for `canceled`/`unpaid`) + "Manage Subscription" link to `/settings/billing`
- **Loading**: disable button and show spinner while creating checkout session

**Billing settings page (`/settings/billing`):**
- Show current plan info and subscription status
- "Manage Subscription" button → form POST to `/api/stripe/portal` → redirect to Customer Portal URL
- When no subscription exists → "Set up billing" button (same checkout flow as BillingStep)
- Inaccessible to `DEALER_STAFF` (403 from middleware after Task 6)

### Acceptance-Criterion Interpretation Notes

- **AC #1**: Both `stripeCustomerId` AND `stripeSubscriptionId` must be persisted on `Dealer`. Both are available from `stripe.checkout.sessions.retrieve()` in the success handler.
- **AC #2**: The redirect to `/onboarding` after checkout success is the mechanism. The billing OnboardingStep must be set to `complete` BEFORE the redirect fires, so the next page load shows the updated state.
- **AC #3**: Customer Portal is accessible via a POST form on `/settings/billing`. The route `/settings/billing` must also be protected as DEALER_ADMIN-only.
- **AC #4**: Idempotent webhook = same final DB state when the same event fires multiple times. A plain `prisma.dealer.update({ where: { id: dealer.id }, data: { ... } })` satisfies this — overwriting with identical values is a no-op in effect.

---

## Latest Technical Information

Verified from official docs (2026-03-26):

- **Stripe API version**: `2025-04-30.basil` — already configured in `lib/payments/stripe.ts:56`. No change needed.
- **Stripe Checkout success_url**: Include `{CHECKOUT_SESSION_ID}` as a literal placeholder in the URL string; Stripe substitutes it before redirecting. Example: `${BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`.
- **Stripe Customer Portal**: Requires calling `stripe.billingPortal.sessions.create({ customer, return_url })`. A Billing Portal configuration must exist in the Stripe Dashboard, or create one programmatically (the existing `createCustomerPortalSession()` in `lib/payments/stripe.ts` shows the auto-create pattern — replicate this for `createDealerPortalSession()`).
- **Idempotency in Prisma**: A plain `prisma.dealer.update()` that writes the same field values is inherently idempotent. No additional idempotency keys needed for this story.
- **Stripe webhook event types for subscriptions**: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. The existing webhook handler covers `updated` and `deleted` — add `created` for completeness.

---

## Testing Requirements

### Unit Tests

- `getDealerByStripeCustomerId('cus_xxx')`: returns the matching `Dealer` record; returns `null` when not found
- `updateDealerStripeSubscription(dealerId, data)`: updates all billing fields and returns updated `Dealer`; calling twice with same data produces same result
- Webhook `POST` handler with valid signature + `customer.subscription.updated`:
  - calls `getDealerByStripeCustomerId()` with the subscription's customer ID
  - calls `updateDealerStripeSubscription()` with correct fields
- Webhook handler with unknown customer: logs error, returns `{ received: true }` (no throw)

### Route / Action Tests

- `POST /api/stripe/checkout` without auth → 401
- `POST /api/stripe/checkout` with `DEALER_STAFF` → 403
- `POST /api/stripe/checkout` with `DEALER_ADMIN` + invalid body (no priceId) → 400 `VALIDATION_ERROR`
- `POST /api/stripe/portal` without auth → 401
- `POST /api/stripe/portal` with `DEALER_ADMIN` but no `stripeCustomerId` on dealer → 400
- `POST /api/stripe/webhook` with invalid signature → 400

### E2E Tests (`tests/e2e/stripe-billing.spec.ts`)

- Dealer Admin sees "Set up billing" button in billing step of onboarding checklist
- Clicking "Set up billing" redirects to a Stripe Checkout URL (use `PLAYWRIGHT_TEST=true` mock catalog via `shouldUseMockStripeCatalog()` in `lib/payments/stripe.ts`)
- After mock checkout completion, billing step shows as `complete` in onboarding checklist
- `/settings/billing` page is accessible to DEALER_ADMIN, returns 403 for DEALER_STAFF

---

## References

### Local Artifacts

- `_bmad-output/planning-artifacts/epics/epic-2-dealer-registration-onboarding-account-management.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/implementation-artifacts/2-5-role-assignment-for-dealer-staff.md`

### Live Repo Files

- `jupiter/lib/payments/stripe.ts` — existing Stripe helpers (add dealer functions here)
- `jupiter/app/api/stripe/checkout/route.ts` — stub to replace
- `jupiter/app/api/stripe/webhook/route.ts` — update subscription lookup
- `jupiter/components/dealer/steps/BillingStep.tsx` — stub to implement
- `jupiter/src/services/dealer.service.ts` — add billing functions
- `jupiter/src/services/onboardingStep.service.ts` — use `updateStep()` for billing completion
- `jupiter/prisma/schema.prisma` — Dealer model with billing fields
- `jupiter/lib/auth/route-rules.ts` — add `/settings/billing` as DEALER_ADMIN
- `jupiter/lib/auth/session.ts` — use `requireAuth()` in route handlers
- `jupiter/src/services/audit.service.ts` — audit log pattern

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Story 2.6 created from live repo analysis: stripe.ts, webhook route, checkout route, BillingStep.tsx, dealer.service.ts, onboardingStep.service.ts, route-rules.ts, middleware.ts all examined
- Epic 2 story 2.6 identified as next backlog item in sprint-status.yaml
- Previous story 2.5 intelligence loaded: requireAuth, auditService, file structure patterns
- Starter template residue mapped: actions.ts (withTeam), queries.ts stubs (getTeamByStripeCustomerId returns null — webhook is non-functional), checkout route stub with explicit "Story 2.6" comment
- Security gap found: /settings/billing has NO ROUTE_RULES match — middleware falls through to public. Must fix in Task 6.
- MOCK_STRIPE_PRODUCTS / MOCK_STRIPE_PRICES already defined in stripe.ts for Playwright test mode

### Completion Notes List

- Story created for 2-6-stripe-billing-setup (next backlog item in epic 2 after 2-5 marked done)
- Status set to ready-for-dev
- Critical path: dealer.service.ts billing functions → checkout route (POST+GET) → webhook update → route protection → billing page → BillingStep UI
- Starter template residue clearly mapped: withTeam actions, Team model queries (both non-functional for dealer use case)
- Route protection security gap identified, documented, and included as explicit Task 6
- Two-path idempotency pattern documented (checkout redirect + webhook both write same fields)
- Stripe Customer ID creation-at-checkout pattern documented with retry handling (reuse existing Customer)

**Implementation completed 2026-03-26:**
- All 9 tasks implemented and tested (45 unit/integration tests pass, 0 new regressions)
- Project uses `(dashboard)` route group (not `(dealer)` as noted in story) — billing page created at `app/(dashboard)/settings/billing/page.tsx`
- `ManageSubscriptionButton.tsx` extracted as client component to keep billing page a Server Component
- Webhook updated to handle `customer.subscription.created` in addition to `updated`/`deleted`
- Pre-existing test failures in `staff/role/route.test.ts` (3 tests) are from in-progress Story 2.5 code review work — not regressions from this story
- `NEXT_PUBLIC_STRIPE_PRICE_ID` used in `BillingStep.tsx` for client-side checkout initiation; documented in `.env.example`

### File List

**Modified files:**
- `jupiter/src/services/dealer.service.ts` — added `getDealerByStripeCustomerId`, `updateDealerStripeSubscription`
- `jupiter/lib/payments/stripe.ts` — added `createDealerCheckoutSession`, `createDealerPortalSession`
- `jupiter/app/api/stripe/checkout/route.ts` — replaced stub with full POST + GET implementation
- `jupiter/app/api/stripe/webhook/route.ts` — updated to use `dealer.service.ts` functions; handles `created`/`updated`/`deleted` events
- `jupiter/lib/auth/route-rules.ts` — added `/settings/billing` as DEALER_ADMIN-only rule
- `jupiter/components/dealer/steps/BillingStep.tsx` — full implementation with pending/complete states and loading spinner
- `jupiter/src/services/dealer.service.test.ts` — added billing service unit tests
- `jupiter/.env.example` — added `NEXT_PUBLIC_STRIPE_PRICE_ID`

**New files:**
- `jupiter/app/api/stripe/portal/route.ts` — POST endpoint for Stripe Customer Portal sessions
- `jupiter/app/(dashboard)/settings/billing/page.tsx` — billing settings Server Component
- `jupiter/app/(dashboard)/settings/billing/ManageSubscriptionButton.tsx` — client component for portal redirect button
- `jupiter/tests/e2e/stripe-billing.spec.ts` — E2E tests for billing setup flow and access control
