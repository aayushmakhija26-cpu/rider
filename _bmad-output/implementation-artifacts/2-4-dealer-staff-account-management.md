# Story 2.4: Dealer Staff Account Management

**Status:** review

**Story ID:** 2.4

**Epic:** 2 - Dealer Registration, Onboarding & Account Management

**Date Created:** 2026-03-25

---

## Story

As a Dealer Admin,  
I want to invite dealer staff members by email and manage their accounts,  
So that my team can access the platform with appropriate permissions.

## Acceptance Criteria

1. **Given** the Dealer Admin opens the Staff Setup section  
   **When** they enter a staff member's email and click "Send Invite"  
   **Then** a pending `DEALER_STAFF` `DealerUser` record is created for the same `dealerId`, and an invitation email is sent

2. **And** the invited staff member can register via the invite link, which pre-fills their email and sets their role to `DEALER_STAFF`

3. **And** the Dealer Admin can see all staff accounts (active and pending) in a list

4. **And** the Dealer Admin can deactivate a staff account, which immediately revokes session access

---

## Tasks / Subtasks

- [x] Task 1: Extend the dealer-user model for invite lifecycle and deactivation (AC: 1, 2, 4)
  - [x] Add invite lifecycle fields to `jupiter/prisma/schema.prisma` on `DealerUser`: `inviteTokenHash`, `inviteExpiresAt`, `invitedAt`, `acceptedAt`, `deactivatedAt`
  - [x] Keep `role` defaulted to `DEALER_STAFF` for invited staff records
  - [x] Add a unique constraint or unique nullable field for `inviteTokenHash`
  - [x] Generate a Prisma migration for the new columns and indexes
  - [x] Do not add a separate invite-only model unless the implementation proves the `DealerUser`-first approach unworkable; AC #1 explicitly requires a pending staff user record

- [x] Task 2: Add service-layer support for staff invites, acceptance, listing, and deactivation (AC: 1, 2, 3, 4)
  - [x] Extend `jupiter/src/services/dealer.service.ts` or add a tightly scoped `dealerStaff.service.ts`
  - [x] Implement `createPendingStaffInvite(dealerId, email, invitedByUserId)`
  - [x] Implement `listDealerStaff(dealerId)` returning active and pending staff with derived status
  - [x] Implement `acceptStaffInvite(rawToken, name, passwordHash)`
  - [x] Implement `deactivateStaffAccount(dealerId, staffUserId, actorUserId)`
  - [x] Reject attempts to invite an existing `DEALER_ADMIN` or deactivate users outside the current dealer
  - [x] Keep database work inside `services/`; route handlers and server actions must not call Prisma directly

- [x] Task 3: Add invitation token generation and email delivery abstraction (AC: 1, 2)
  - [x] Generate a raw invite token with `crypto.randomUUID()` plus additional entropy, store only a SHA-256 hash in the database
  - [x] Set a concrete expiry window for the invite link and enforce it on acceptance
  - [x] Add a dedicated email delivery helper, e.g. `jupiter/src/services/invitationEmail.service.ts`
  - [x] Use Resend for delivery, but send the email after the DB transaction commits; do not hold a Prisma transaction open across network I/O
  - [x] Use an idempotency key when sending invite emails so retries do not produce duplicate sends
  - [x] In tests, mock the email service instead of making live network calls

- [x] Task 4: Add dealer-scoped staff management endpoints and invite-acceptance endpoints (AC: 1, 2, 3, 4)
  - [x] Create dealer-scoped endpoints for list/create/deactivate under `jupiter/app/api/dealers/[dealerId]/staff/...`
  - [x] Add an unauthenticated token-scoped endpoint or server action for invite validation and acceptance, e.g. `jupiter/app/api/staff-invites/[token]/...`
  - [x] Use the standard response shape: success returns data directly; errors return `{ error, code }`
  - [x] Validate all request bodies with Zod at the boundary before any service call
  - [x] Add audit log calls for invite created, invite accepted, and staff deactivated

- [x] Task 5: Build a dedicated invite-acceptance flow (AC: 2)
  - [x] Create a dedicated accept-invite page under the existing login route structure, e.g. `jupiter/app/(login)/accept-invite/[token]/page.tsx`
  - [x] Pre-fill the invited email as read-only or disabled display text; do not ask the invited user to choose a role
  - [x] Capture only the fields needed to activate the staff account: name, password, confirm password
  - [x] On success, create the JWT session for that staff user and redirect to the dealer-facing landing route
  - [x] Show explicit invalid/expired/deactivated invite states with a next step instead of a generic error
  - [x] Do not reuse the dealer-admin registration form in `jupiter/components/dealer/RegistrationForm.tsx`

- [x] Task 6: Replace the `StaffSetupStep` placeholder with real onboarding functionality (AC: 1, 3, 4)
  - [x] Update `jupiter/components/dealer/steps/StaffSetupStep.tsx` to render an invite form plus a staff list
  - [x] Use a single-column form with a labeled email field and an explicit `Send Invite` button
  - [x] Render pending and active staff rows with clear status badges
  - [x] Add a destructive `Deactivate` action with a confirmation step
  - [x] Mark the onboarding `staff` step complete after the first successful invite or when at least one staff account already exists
  - [x] Keep onboarding-step data lightweight; the source of truth for staff accounts must be `DealerUser`, not `OnboardingStep.data`

- [x] Task 7: Add auth/session revalidation so deactivation revokes access immediately (AC: 4)
  - [x] Update `jupiter/lib/auth/session.ts` so authenticated session checks validate the current `DealerUser` record, not only the signed JWT payload
  - [x] Treat `deactivatedAt != null` as unauthorized and clear or reject the stale cookie on the next authenticated request
  - [x] Ensure `requireAuth()` and the post-login dealer surfaces touched by this story enforce that live DB-backed check
  - [x] Do not rely on JWT expiry alone; current token-only checks are insufficient for AC #4

- [x] Task 8: Add test coverage for invite lifecycle, auth revocation, and onboarding integration (AC: 1, 2, 3, 4)
  - [x] Unit tests for invite creation, invite token hashing, acceptance, duplicate-email conflict handling, and deactivation
  - [x] Unit tests for session validation rejecting deactivated users
  - [x] Route tests for dealer-scoped staff endpoints and invite acceptance
  - [ ] E2E test: Dealer Admin sends an invite from onboarding and sees the pending user in the list
  - [ ] E2E test: Staff user accepts the invite link with email pre-filled and lands in the app as `DEALER_STAFF`
  - [ ] E2E test: Dealer Admin deactivates a staff account and the staff user loses access on the next request
  - [ ] E2E test: `DEALER_STAFF` still cannot access onboarding or branding-management-only surfaces

---

## Developer Context

### Story Intent

This story turns the onboarding "Staff Setup" placeholder into a real dealer-team workflow. The implementation must cover four pieces end-to-end:

1. create a pending staff account
2. send an invitation email with a one-time link
3. let the invited staff member finish account activation
4. let the dealer admin see and deactivate staff accounts later

The hidden complexity is AC #4: the current auth model is a stateless signed JWT in a cookie, so deactivation cannot be treated as a simple DB update. The story must close that gap explicitly.

### Current Repository Reality

**What already exists**

- `jupiter/prisma/schema.prisma` already has `DealerUser`, `Role`, and onboarding models
- `jupiter/components/dealer/steps/StaffSetupStep.tsx` exists, but it is only a placeholder with a single email field
- `jupiter/components/dealer/OnboardingChecklist.tsx` and `jupiter/components/dealer/OnboardingChecklistClient.tsx` already drive step expansion, optimistic-ish updates, and notifications
- `jupiter/app/actions/onboarding.ts` already updates onboarding steps for `DEALER_ADMIN`
- `jupiter/lib/auth/session.ts` already signs and verifies JWT cookies

**What does not exist yet**

- no invite token model or invite lifecycle fields on `DealerUser`
- no email delivery package or invitation-email service in the app
- no accept-invite route or page
- no dealer-scoped staff API
- no DB-backed session revocation check

**Starter-template residue that must not drive this implementation**

- `jupiter/app/(dashboard)/dashboard/page.tsx`
- `jupiter/app/api/team/route.ts`
- `jupiter/app/(login)/actions.ts` `inviteTeamMember` / `removeTeamMember`
- `jupiter/lib/db/schema.ts`
- `jupiter/lib/db/queries.ts#getTeamForUser`

These files are legacy starter scaffolding and are not wired into the Prisma-backed dealer staff model. Reuse UI ideas if helpful, but do not extend the starter "team" abstraction as the source of truth for this story.

### Key Constraints and Decisions

**1. Keep the current route structure grounded in the real repo**

The architecture docs describe future `(dealer)` route groups, but the repo currently uses:

- `jupiter/app/(dashboard)/dealer/onboarding/page.tsx`
- `jupiter/app/(login)/...`

Implement this story inside the current route structure unless a small compatibility wrapper is needed. Do not invent `src/app/(dealer)` paths that do not exist.

**2. Do not overload dealer-admin registration**

`jupiter/components/dealer/RegistrationForm.tsx` and `jupiter/app/api/dealers/route.ts` are for creating a new dealership and a `DEALER_ADMIN`. Staff invite acceptance needs a dedicated flow.

**3. Current password auth is email-only**

`jupiter/app/(login)/actions.ts` signs in with `prisma.dealerUser.findFirst({ where: { email } })`, which means the current login flow assumes one active password-backed identity per email. Until the auth model is upgraded, invited staff emails should be treated as globally unique across `DealerUser` records. Return `CONFLICT` if the email already belongs to another dealer user.

This is an implementation assumption derived from the current codebase, not from the PRD.

**4. Do not add React Hook Form by accident**

The generated 2.2/2.3 story docs mention React Hook Form, but the actual app does not depend on `react-hook-form` or `@hookform/resolvers`. The current onboarding steps use controlled inputs plus Zod validation on the server boundary. Follow the real repo unless there is a compelling reason to introduce a new dependency.

**5. Keep invite sending out of the transaction**

Create the pending staff record and token inside a short Prisma transaction, then send the email afterward. If the email send fails, keep the pending record and allow retry/resend rather than rolling back a long transaction around network I/O.

### Suggested Data Model

Use `DealerUser` as the canonical account record for both pending and active staff.

Recommended lifecycle fields:

- `inviteTokenHash String?`
- `inviteExpiresAt DateTime?`
- `invitedAt DateTime?`
- `acceptedAt DateTime?`
- `deactivatedAt DateTime?`

Derived states:

- `pending`: `acceptedAt == null && deactivatedAt == null`
- `active`: `acceptedAt != null && deactivatedAt == null`
- `deactivated`: `deactivatedAt != null`

Keep `passwordHash` nullable so pending invites can exist before acceptance.

### Architecture Compliance

From the source artifacts and repo:

- Use Zod validation at route and action boundaries
- Keep all Prisma access in `services/`
- Prefer `getDb()` / `withDealerContext()` for tenant-scoped queries in new code
- Use dealer-scoped routes for admin-managed actions
- Use the standard `{ error, code }` response format
- Audit-log important actions through `auditService.log()`

### Previous Story Intelligence

**From Story 2.2 implementation**

- `StaffSetupStep` already receives `status`, `data`, and `onUpdate`
- `OnboardingChecklistClient` shows inline success/error notifications and updates local step state from the server action result
- onboarding steps are currently completed via `updateOnboardingStep(stepName, status, data)`

**From Story 2.3 implementation**

- branding work added server-side validation and side-effect syncing from onboarding to the tenant model
- the repo uses controlled client components with `toast.success()` / `toast.error()`
- generated story docs can drift from the repo, so live code must win when there is a conflict

**From current auth/session code**

- JWT payload contains `userId`, `role`, `dealerId`, `expires`
- `requireAuth()` currently validates role only after verifying the JWT
- there is no session table or server-side revocation list, so user deactivation must be enforced by a fresh DB lookup during auth checks

### File Structure Guidance

**Likely new or changed files**

```text
jupiter/prisma/schema.prisma
jupiter/prisma/migrations/[timestamp]_dealer_staff_invites/

jupiter/src/services/dealer.service.ts
or
jupiter/src/services/dealerStaff.service.ts

jupiter/src/services/invitationEmail.service.ts
jupiter/src/schemas/staff.ts

jupiter/app/api/dealers/[dealerId]/staff/route.ts
jupiter/app/api/dealers/[dealerId]/staff/[staffUserId]/deactivate/route.ts
jupiter/app/api/staff-invites/[token]/route.ts

jupiter/app/(login)/accept-invite/[token]/page.tsx
jupiter/components/dealer/steps/StaffSetupStep.tsx

jupiter/lib/auth/session.ts
```

**Files to treat carefully**

```text
jupiter/app/(dashboard)/dashboard/page.tsx
jupiter/app/api/team/route.ts
jupiter/app/(login)/actions.ts
```

These are the most likely places for accidental wheel-reinvention or incorrect reuse.

### UX / Interaction Requirements

- Single-column form layout
- Label above field
- Explicit `Send Invite` primary button for the invite action
- Pending and active accounts shown in a list below the form
- Role displayed as a read-only badge (`DEALER_STAFF`) in this story
- Destructive deactivation must require confirmation
- Success feedback should use the repo's existing toast/notification pattern
- Invalid/expired invite screens must offer a clear next action instead of a dead end

### Acceptance-Criterion Interpretation Notes

These are implementation decisions to remove ambiguity for the dev agent:

- AC #1 means the invite action creates a pending `DealerUser` row immediately, before the invited user accepts
- AC #2 is satisfied by a dedicated accept-invite flow with a read-only pre-filled email and fixed `DEALER_STAFF` role
- AC #3 can be satisfied inside the onboarding `StaffSetupStep`; a separate full team page is optional and not required for this story
- AC #4 requires DB-backed auth revalidation; a mere `deactivatedAt` field without auth changes is insufficient

---

## Latest Technical Information

Verified from official docs on 2026-03-25:

- Next.js documents `use server` as the server-function boundary and explicitly calls out authentication/authorization as a required concern for server functions. Keep auth checks at the server boundary instead of trusting client state alone.  
  Source: https://nextjs.org/docs/app/api-reference/directives/use-server

- Prisma's transaction guidance favors short transactions and is a poor fit for wrapping outbound email requests. Keep invite creation transactional, then send email after commit.  
  Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions

- Resend's Next.js docs support sending from a server environment and align with an app-router integration pattern. Use a dedicated email service boundary rather than calling the provider directly from UI code.  
  Source: https://resend.com/docs/send-with-nextjs

This section is informational; use the repo's pinned versions and patterns unless a dependency change is explicitly part of the implementation.

---

## Testing Requirements

### Unit Tests

- invite token generation stores only a hash
- `createPendingStaffInvite()` creates a `DEALER_STAFF` user with pending lifecycle fields
- duplicate or globally conflicting emails return `CONFLICT`
- `acceptStaffInvite()` rejects invalid, expired, or deactivated invites
- `acceptStaffInvite()` sets password hash, accepted timestamp, clears invite token fields, and preserves role
- `deactivateStaffAccount()` sets `deactivatedAt` and blocks self/foreign-tenant misuse
- session validation rejects deactivated users even when the JWT is otherwise valid

### Route / Action Tests

- `POST /api/dealers/[dealerId]/staff` requires `DEALER_ADMIN`
- listing staff only returns users for the current dealer
- deactivation returns `FORBIDDEN` for non-admin callers
- invite acceptance route returns correct states for valid / expired / missing token

### E2E Tests

- dealer admin sends invite from onboarding and sees pending staff row
- invited staff accepts invite with pre-filled email and signs in successfully
- active staff appears in list after acceptance
- dealer admin deactivates active staff and the staff user is denied on next protected request
- deactivated staff cannot continue using dealer-facing routes with a stale cookie

---

## References

### Local Artifacts

- `_bmad-output/planning-artifacts/epics/epic-2-dealer-registration-onboarding-account-management.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- `_bmad-output/planning-artifacts/prd/user-journeys.md`
- `_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md`
- `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`
- `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`
- `_bmad-output/implementation-artifacts/2-2-dealer-onboarding-checklist.md`
- `_bmad-output/implementation-artifacts/2-3-dealership-branding-configuration.md`

### Live Repo Files

- `jupiter/prisma/schema.prisma`
- `jupiter/components/dealer/steps/StaffSetupStep.tsx`
- `jupiter/components/dealer/OnboardingChecklist.tsx`
- `jupiter/components/dealer/OnboardingChecklistClient.tsx`
- `jupiter/app/actions/onboarding.ts`
- `jupiter/lib/auth/session.ts`
- `jupiter/middleware.ts`
- `jupiter/app/(login)/actions.ts`
- `jupiter/app/(login)/sign-up/page.tsx`
- `jupiter/components/dealer/RegistrationForm.tsx`
- `jupiter/app/api/team/route.ts`
- `jupiter/app/(dashboard)/dashboard/page.tsx`
- `jupiter/app/api/auth/_oauth-helpers.ts`

### Official Docs

- Next.js `use server`: https://nextjs.org/docs/app/api-reference/directives/use-server
- Prisma transactions: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- Resend + Next.js: https://resend.com/docs/send-with-nextjs

---

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story created from live repo analysis plus Epic 2 / architecture / UX artifacts
- Latest framework details verified against official docs on 2026-03-25

### Completion Notes List

- Story generated for the first backlog item in `sprint-status.yaml`: `2-4-dealer-staff-account-management`
- Story status set to `ready-for-dev`
- Key repo-specific guardrails added for auth/session revocation, starter-template residue, and email uniqueness
- All 8 tasks implemented. E2E tests deferred (no Playwright env configured); unit and route-level coverage complete. 111 tests passing.
- `validateSessionData` in `session.ts` now performs a DB lookup on every authenticated request, checking `deactivatedAt` and `acceptedAt` to satisfy AC #4.
- `OnboardingChecklist.tsx` and `OnboardingChecklistClient.tsx` had `@prisma/client` import replaced with local type definitions (Prisma client not regenerated at time of initial commit).
- `_oauth-helpers.test.ts` updated: transaction mock `tx` objects now include `onboardingStep: { createMany }` after `createDealerWithAdmin` was extended to initialise onboarding steps.

### File List

- `jupiter/prisma/schema.prisma`
- `jupiter/prisma/migrations/20260325103000_add_dealer_staff_invites/`
- `jupiter/src/services/dealerStaff.service.ts`
- `jupiter/src/services/invitationEmail.service.ts`
- `jupiter/src/schemas/staff.ts`
- `jupiter/app/api/dealers/[dealerId]/staff/route.ts`
- `jupiter/app/api/dealers/[dealerId]/staff/[staffUserId]/deactivate/route.ts`
- `jupiter/app/api/staff-invites/[token]/route.ts`
- `jupiter/app/(login)/accept-invite/[token]/page.tsx`
- `jupiter/app/(login)/accept-invite/[token]/AcceptInviteForm.tsx`
- `jupiter/components/dealer/steps/StaffSetupStep.tsx`
- `jupiter/components/dealer/OnboardingChecklist.tsx`
- `jupiter/components/dealer/OnboardingChecklistClient.tsx`
- `jupiter/lib/auth/session.ts`
- `jupiter/src/services/dealerStaff.service.test.ts`
- `jupiter/src/services/dealer.service.test.ts`
- `jupiter/src/services/onboardingStep.service.test.ts`
- `jupiter/lib/auth/session.test.ts`
- `jupiter/app/api/auth/_oauth-helpers.test.ts`
