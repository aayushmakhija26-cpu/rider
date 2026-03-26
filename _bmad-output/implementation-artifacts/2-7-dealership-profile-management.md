# Story 2.7: Dealership Profile Management

Status: done

## Story

As a Dealer Admin,
I want to view and update my dealership's profile information after initial setup,
so that I can keep our details current without re-doing the full onboarding flow.

## Acceptance Criteria

1. **Given** the Dealer Admin navigates to dealership settings
   **When** they update any profile field (name, contact info, logo, brand colour) and save
   **Then** the `Dealer` record is updated and a Sonner toast confirms "Branding saved"

2. **And** changes to brand colour re-run the WCAG AA contrast validation and show a warning if the new colour fails (contrast ratio < 4.5:1 against white); the system falls back to Jupiter Blue (`#2563EB`) when saving

3. **And** the settings page is inaccessible to `DEALER_STAFF` users (middleware redirects to `403`/`/unauthorized`)

---

## Tasks / Subtasks

- [x] Task 1: Add `getDealerProfile()` and `updateDealerProfile()` to `dealer.service.ts` (AC: 1, 2)
  - [x] `getDealerProfile(dealerId: string)` — returns `{ id, name, logoUrl, primaryColour, contactPhone, contactEmail, websiteUrl }`; throws if not found
  - [x] `updateDealerProfile(dealerId, data: { name?, logoUrl?, primaryColour?, contactPhone?, contactEmail?, websiteUrl? })` — validates dealer exists, applies `getSafeColour()` to `primaryColour` if provided, calls `prisma.dealer.update()`; returns updated `Dealer`

- [x] Task 2: Create `profileSchema` in `src/schemas/profile.ts` (AC: 1)
  - [x] Extend the branding field shapes from `brandingSchema` and add `name: z.string().min(1).max(100).optional()`
  - [x] Export `ProfileInput = z.infer<typeof profileSchema>`

- [x] Task 3: Create `PATCH /api/dealers/[dealerId]/profile` route (AC: 1, 2)
  - [x] File: `jupiter/app/api/dealers/[dealerId]/profile/route.ts`
  - [x] `PATCH` handler — `requireAuth(['DEALER_ADMIN'])` → verify `session.dealerId === dealerId` → parse body with `profileSchema` → call `updateDealerProfile()` → `auditService.log({ action: 'dealer_profile_updated', ... })` → return updated profile fields
  - [x] Standard error handling: `AuthError` → 401/403, `ZodError` → 400 `VALIDATION_ERROR`, catch-all → 500
  - [x] Response shape: return data directly (no wrapper) — `{ id, name, logoUrl, primaryColour, contactPhone, contactEmail, websiteUrl }`

- [x] Task 4: Add route protection for `/settings/profile` (AC: 3)
  - [x] In `lib/auth/route-rules.ts`, add `{ prefix: '/settings/profile', access: ['DEALER_ADMIN'] }` — insert BEFORE the `/dashboard` catch-all (ordering is load-bearing per line 7 comment)

- [x] Task 5: Create settings page and form (AC: 1, 2, 3)
  - [x] `app/(dashboard)/settings/profile/page.tsx` — Server Component: `getSession()` → redirect non-DEALER_ADMIN to `/unauthorized` → call `getDealerProfile(session.dealerId)` → render `<ProfileSettingsForm>` with current values
  - [x] `app/(dashboard)/settings/profile/ProfileSettingsForm.tsx` — Client Component (`'use client'`): plain useState form (react-hook-form not in project deps) → on submit PATCH `/api/dealers/${dealerId}/profile` → on success show Sonner toast "Branding saved"; on error show destructive toast
  - [x] Colour input: show inline WCAG warning text when entered colour fails `meetsWCAGAA()` (client-side preview only — the actual fallback is applied server-side via `getSafeColour()`)
  - [x] All fields pre-filled with current values from server fetch

- [x] Task 6: Add unit tests (AC: 1, 2)
  - [x] `getDealerProfile()`: returns correct fields; throws if dealer not found
  - [x] `updateDealerProfile()`: updates fields; applies `getSafeColour()` fallback to failing colour; calling twice with same data produces same result (idempotent)
  - [x] `PATCH /api/dealers/[dealerId]/profile` without auth → 401; with `DEALER_STAFF` → 403; with `DEALER_ADMIN` + invalid body → 400; mismatched `dealerId` → 403

---

## Dev Notes

### Story Intent

This story creates the post-onboarding dealership profile settings page. Story 2.3 handled the *initial* branding setup as part of the onboarding checklist flow. This story adds a permanent standalone settings page where a Dealer Admin can return at any time to update dealership name, logo, brand colour, and contact info.

The Sonner toast `"Branding saved"` is specified by AC — use this exact string.

### Current Repository Reality

**What already exists — do NOT reinvent**

- `jupiter/src/services/dealer.service.ts` — already has `updateBranding()` (handles logoUrl, primaryColour, contactPhone, contactEmail, websiteUrl — but NOT `name`) and `getBranding()` (read-only, same fields). Add the new `getDealerProfile()` and `updateDealerProfile()` functions alongside these. Do NOT modify the existing functions — they are used by the onboarding flow.
- `jupiter/src/lib/contrast.ts` — exports `getSafeColour(hex)`, `meetsWCAGAA(hex)`, `FALLBACK_COLOUR` (`#2563EB`). Import from `@/src/lib/contrast`.
- `jupiter/src/schemas/branding.ts` — `brandingSchema` with logoUrl, primaryColour, contactPhone, contactEmail, websiteUrl. Do NOT modify this schema — it is used by the existing branding onboarding route. Create a new `profileSchema` in `src/schemas/profile.ts` that adds `name`.
- `jupiter/app/api/dealers/[dealerId]/branding/route.ts` — `POST` handler for onboarding branding save. Do NOT modify or reuse for this story. Create a separate `profile/route.ts` at the same level.
- `jupiter/lib/auth/route-rules.ts` — the ordering comment at line 7 is critical. `/settings/profile` must be inserted BEFORE the `/dashboard` catch-all at line 20.
- `jupiter/lib/auth/session.ts` — `requireAuth(roles)` throws `AuthError` with `.code` of `'UNAUTHORIZED'` or `'FORBIDDEN'`; `getSession()` returns `SessionData | null`. Both are imported from `@/lib/auth/session`.
- `jupiter/src/services/audit.service.ts` — `auditService.log({ action, actorId, actorRole, dealerId, targetId, targetType, metadata? })`. Import `{ auditService }` from `@/src/services/audit.service`.

**What does NOT exist yet**

- No `getDealerProfile()` or `updateDealerProfile()` in `dealer.service.ts`
- No `src/schemas/profile.ts`
- No `PATCH /api/dealers/[dealerId]/profile` route
- No `app/(dashboard)/settings/profile/` directory or files
- No `/settings/profile` rule in `route-rules.ts` — without this, `DEALER_STAFF` can access the page

**Important: Route group is `(dashboard)`, not `(dealer)`**

The architecture doc specifies `app/(dealer)/settings/branding/page.tsx` but the actual codebase uses `(dashboard)`. Story 2.6 confirmed this: the billing settings page was created at `app/(dashboard)/settings/billing/page.tsx`. Follow the same convention — create at `app/(dashboard)/settings/profile/page.tsx`.

**Important: Prisma queries in services only**

The billing page (Story 2.6) used `prisma.dealer.findUnique()` directly in the Server Component page — this violates the architecture rule. Do NOT repeat this for Story 2.7. Use `getDealerProfile()` from `dealer.service.ts` in the page instead.

### Key Constraints

**1. `name` is NOT handled by the existing branding flow**

The `Dealer.name` field (required, no default) exists in the schema but `updateBranding()` and `brandingSchema` do not include it. The profile settings page must allow editing `name` — this requires the new service function and schema.

**2. Colour WCAG validation — two layers**

- **Client-side (UX)**: Show an inline warning when the user types a colour that fails `meetsWCAGAA()`. This is informational only — use `meetsWCAGAA(hex)` from `@/src/lib/contrast` in the form component.
- **Server-side (enforcement)**: `updateDealerProfile()` must call `getSafeColour(primaryColour)` before writing to DB. The fallback to Jupiter Blue is enforced server-side, not just shown as a warning.

**3. Route protection ordering**

`route-rules.ts` line 7: `// ORDERING IS LOAD-BEARING: more-specific prefixes must precede less-specific ones.`

Current relevant entries (lines 18–20):
```typescript
{ prefix: '/settings/billing', access: ['DEALER_ADMIN'] },
// Dealer portal
{ prefix: '/dashboard', access: ['DEALER_ADMIN', 'DEALER_STAFF'] },
```

Insert `/settings/profile` after `/settings/billing` and before the `/dashboard` rule.

**4. Tenant isolation check in route handler**

The branding route does this correctly — verify `session.dealerId === dealerId` from URL params and return 403 if they differ. Replicate this in the profile route.

**5. No `onUpdate` or onboarding side effects**

Unlike Story 2.3 (which called `onboardingStepService.updateStep()` to mark branding complete), this story makes no onboarding state changes. It is a pure settings update.

### File Locations

```
jupiter/src/services/dealer.service.ts                     (add getDealerProfile, updateDealerProfile)
jupiter/src/schemas/profile.ts                             (new: profileSchema with name field)
jupiter/app/api/dealers/[dealerId]/profile/route.ts        (new: PATCH handler)
jupiter/lib/auth/route-rules.ts                            (add /settings/profile as DEALER_ADMIN)
jupiter/app/(dashboard)/settings/profile/page.tsx          (new: Server Component)
jupiter/app/(dashboard)/settings/profile/ProfileSettingsForm.tsx  (new: Client Component form)
jupiter/src/services/dealer.service.test.ts                (add getDealerProfile, updateDealerProfile tests)
```

**Do NOT modify**
```
jupiter/src/schemas/branding.ts              — used by onboarding branding route
jupiter/app/api/dealers/[dealerId]/branding/ — onboarding flow, leave unchanged
jupiter/src/services/dealer.service.ts       — only ADD new functions, don't change existing ones
```

### Implementation Pattern Reference

Route handler shape (from `branding/route.ts` Story 2.3):
```typescript
import { requireAuth, AuthError } from '@/lib/auth/session';
import { updateDealerProfile, getDealerProfile } from '@/src/services/dealer.service';
import { profileSchema } from '@/src/schemas/profile';
import { auditService } from '@/src/services/audit.service';
import { ZodError } from 'zod';

export async function PATCH(req: Request, { params }: { params: Promise<{ dealerId: string }> }) {
  try {
    const session = await requireAuth(['DEALER_ADMIN']);
    const { dealerId } = await params;
    if (session.dealerId !== dealerId) {
      return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }
    const body = await req.json();
    const validated = profileSchema.parse(body);
    const dealer = await updateDealerProfile(session.dealerId, validated);
    await auditService.log({
      action: 'dealer_profile_updated',
      actorId: session.userId,
      actorRole: session.role,
      dealerId: session.dealerId,
      targetId: session.dealerId,
      targetType: 'dealer',
    });
    return Response.json({ id: dealer.id, name: dealer.name, logoUrl: dealer.logoUrl, ... });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    if (error instanceof ZodError) {
      return Response.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.flatten() }, { status: 400 });
    }
    console.error('[dealers/profile/PATCH]', error);
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
```

Server Component page shape (modelled on billing page but using service layer correctly):
```typescript
import { getSession } from '@/lib/auth/session';
import { getDealerProfile } from '@/src/services/dealer.service';
import { redirect } from 'next/navigation';
import { ProfileSettingsForm } from './ProfileSettingsForm';

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session) redirect('/dealer/sign-in');
  if (session.role !== 'DEALER_ADMIN') redirect('/unauthorized');

  const profile = await getDealerProfile(session.dealerId);
  return <ProfileSettingsForm dealerId={session.dealerId} initialValues={profile} />;
}
```

### UX Requirements

- **Form fields**: Dealership Name (text), Logo URL (URL input), Brand Colour (hex + native colour picker), Contact Phone, Contact Email, Website URL
- **Colour warning**: Show inline warning below the colour field if entered colour fails WCAG AA — `"This colour may not meet accessibility standards. It will be saved as Jupiter Blue (#2563EB)."` — shown conditionally, not blocking
- **Save button**: `variant="default"` (Jupiter blue), label "Save changes", disabled + spinner while POST in flight
- **Success feedback**: Sonner toast `"Branding saved"` (plain past tense, auto-dismiss 4s) — exact string per AC
- **Error feedback**: Sonner toast `variant="destructive"`, does not auto-dismiss
- **Pre-fill**: All fields populated from server-fetched current values on page load
- **Single-column layout**: per UX consistency patterns — never two-column

### Architecture Compliance

- All Prisma queries go through `services/` — `getDealerProfile()` and `updateDealerProfile()` live in `dealer.service.ts`
- Route handler uses `requireAuth(['DEALER_ADMIN'])` — no direct session reads in route file
- Zod validation at route boundary BEFORE service call
- Error responses: `{ error: string, code: string }` shape
- Success response: data directly (no `{ success: true, data: ... }` wrapper)
- Audit log after successful update via `auditService.log()`
- ISO 8601 dates in API responses (Prisma auto-handles this)

### Previous Story Intelligence

**From Story 2.6 (Stripe Billing):**
- Route group is `(dashboard)`, NOT `(dealer)` — confirmed by billing page at `app/(dashboard)/settings/billing/`
- Client components extracted to separate files (`ManageSubscriptionButton.tsx`, `SetupBillingButton.tsx`) to keep pages as Server Components — follow same pattern for `ProfileSettingsForm.tsx`
- `requireAuth()` throws `AuthError` — catch with `error instanceof AuthError` and check `error.code`

**From Story 2.3 (Branding):**
- `getSafeColour()` must be applied to `primaryColour` before DB write — it returns the original hex if WCAG passes, or `'#2563EB'` if it fails
- `brandingSchema` pattern: optional fields with `.or(z.literal(''))` to allow clearing fields
- `updateBranding()` only updates fields present in the `data` object — same pattern for `updateDealerProfile()`

**From Story 2.5 (Role Assignment):**
- `auditService.log()` call shape: `{ action: string, actorId: string, actorRole: Role, dealerId: string, targetId: string, targetType: string, metadata?: object }`

---

## References

- `_bmad-output/planning-artifacts/epics/epic-2-dealer-registration-onboarding-account-management.md` — Story 2.7 AC
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md` — API format, error codes, service boundaries
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md` — file locations, Dealer model
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md` — form patterns, feedback patterns
- `_bmad-output/implementation-artifacts/2-6-stripe-billing-setup.md` — previous story (route group, page structure)
- `jupiter/src/services/dealer.service.ts` — existing service functions to build on
- `jupiter/src/schemas/branding.ts` — schema pattern to follow for `profileSchema`
- `jupiter/src/lib/contrast.ts` — `getSafeColour()`, `meetsWCAGAA()`, `FALLBACK_COLOUR`
- `jupiter/app/api/dealers/[dealerId]/branding/route.ts` — route handler pattern
- `jupiter/lib/auth/route-rules.ts` — add `/settings/profile` rule here
- `jupiter/lib/auth/session.ts` — `getSession()`, `requireAuth()`, `AuthError`
- `jupiter/src/services/audit.service.ts` — `auditService.log()`
- `jupiter/prisma/schema.prisma` — `Dealer` model fields

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Identified as first backlog story in sprint-status.yaml (epic-2 already in-progress)
- Route group confirmed as `(dashboard)` from Story 2.6 billing page location
- Confirmed `name` field not handled by existing `updateBranding()` or `brandingSchema` — new service function and schema required
- No `/settings/profile` route rule exists — security gap for DEALER_STAFF access
- Architecture boundary violation noted in Story 2.6 billing page (direct prisma call) — story guards against repeating this
- Sonner toast string `"Branding saved"` specified verbatim in epic AC

### Completion Notes List

- Implemented `getDealerProfile()` and `updateDealerProfile()` in `dealer.service.ts` alongside existing `getBranding()`/`updateBranding()` — existing onboarding functions untouched
- `updateDealerProfile()` applies `getSafeColour()` to `primaryColour` before DB write; empty string fields are cleared to null
- `profileSchema` extends `brandingSchema` via `.extend()` adding optional `name` field; no changes to branding schema
- PATCH route uses `instanceof AuthError` for error handling (newer pattern vs legacy `error.message.includes()` in branding route)
- Route test mocks `@/lib/auth/session` with `importOriginal` to preserve real `AuthError` class for `instanceof` checks
- `ProfileSettingsForm` uses plain `useState` (react-hook-form not in project dependencies); follows BrandingStep.tsx pattern
- WCAG warning message verbatim: "This colour may not meet accessibility standards. It will be saved as Jupiter Blue (#2563EB)."
- Toast success string verbatim per AC: "Branding saved"
- `/settings/profile` rule inserted after `/settings/billing` and before `/dashboard` catch-all in route-rules.ts
- Pre-existing failures in `staff/[staffUserId]/role/route.test.ts` (4 tests) were present before this story; confirmed via git stash

### File List

- `jupiter/src/services/dealer.service.ts` — added `getDealerProfile()`, `updateDealerProfile()`
- `jupiter/src/schemas/profile.ts` — new: `profileSchema`, `ProfileInput`
- `jupiter/app/api/dealers/[dealerId]/profile/route.ts` — new: PATCH handler
- `jupiter/lib/auth/route-rules.ts` — added `/settings/profile` rule
- `jupiter/app/(dashboard)/settings/profile/page.tsx` — new: Server Component page
- `jupiter/app/(dashboard)/settings/profile/ProfileSettingsForm.tsx` — new: Client Component form
- `jupiter/src/services/dealer.service.test.ts` — added `getDealerProfile` and `updateDealerProfile` test suites
- `jupiter/app/api/dealers/[dealerId]/profile/route.test.ts` — new: PATCH route tests

## Change Log

- 2026-03-26: Implemented Story 2.7 — added dealership profile settings page with getDealerProfile/updateDealerProfile service functions, PATCH API route, /settings/profile route protection, Server Component page, Client Component form with WCAG colour warning, and unit tests (23 tests added, all passing)
