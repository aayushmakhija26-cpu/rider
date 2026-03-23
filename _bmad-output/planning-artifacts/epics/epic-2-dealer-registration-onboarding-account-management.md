# Epic 2: Dealer Registration, Onboarding & Account Management

Dealer Admin can fully onboard — register using email or OAuth, configure dealership branding, invite and manage dealer staff, assign roles, and set up Stripe billing.

## Story 2.1: Dealer Admin Registration

As a Dealer Admin,
I want to register a new dealership account using email/password or OAuth (Google/Apple),
So that I have a dealership account and can begin configuring my platform presence.

**Acceptance Criteria:**

**Given** a prospective Dealer Admin submits the registration form with their email and dealership name
**When** the form is submitted with valid data
**Then** a `Dealer` record and a linked `DEALER_ADMIN` `User` record are created in Neon
**And** the user is logged in with a JWT session (role = `DEALER_ADMIN`, `dealerId` set) and redirected to the onboarding checklist
**And** submitting with an already-registered email returns an inline error: "An account with this email already exists"
**And** OAuth registration (Google/Apple) creates the same records with the same redirect outcome

---

## Story 2.2: Dealer Onboarding Checklist

As a Dealer Admin,
I want a step-by-step onboarding checklist that tracks my setup progress,
So that I know exactly what to configure before going live and can resume where I left off.

**Acceptance Criteria:**

**Given** a Dealer Admin logs in for the first time after registration
**When** the onboarding page loads
**Then** the `OnboardingChecklist` component renders with all steps: Branding, DMS Connection, Staff Setup, Billing — each showing pending/active/complete/skipped state
**And** each step can be completed in any order; progress is saved automatically on field blur (not on explicit save)
**And** completed steps show in emerald; the active step expands its content inline without navigating away
**And** once all required steps are complete, a "First campaign scheduled" confirmation banner is shown

---

## Story 2.3: Dealership Branding Configuration

As a Dealer Admin,
I want to configure my dealership's logo, brand colour, and contact information,
So that consumer-facing emails and dashboards display my dealership's identity.

**Acceptance Criteria:**

**Given** the Dealer Admin opens the branding setup step
**When** they upload a logo, enter a hex colour, and save
**Then** the `Dealer` record is updated with `logoUrl`, `primaryColour`, and `contactInfo` fields
**And** the colour picker shows a hex input + native colour picker + live preview of the brand colour applied to a sample email header and dashboard hero
**And** if the entered colour fails WCAG AA contrast (ratio < 4.5:1 against white), an inline warning is shown and the system falls back to Jupiter Blue (`#2563EB`) in all consumer-facing renders
**And** branding changes are reflected immediately in the live preview without a page reload

---

## Story 2.4: Dealer Staff Account Management

As a Dealer Admin,
I want to invite dealer staff members by email and manage their accounts,
So that my team can access the platform with appropriate permissions.

**Acceptance Criteria:**

**Given** the Dealer Admin opens the Staff Setup section
**When** they enter a staff member's email and click "Send Invite"
**Then** a pending `DEALER_STAFF` `User` record is created scoped to the same `dealerId`, and an invitation email is sent
**And** the invited staff member can register via the invite link, which pre-fills their email and sets their role to `DEALER_STAFF`
**And** the Dealer Admin can see all staff accounts (active and pending) in a list
**And** the Dealer Admin can deactivate a staff account, which immediately revokes session access

---

## Story 2.5: Role Assignment for Dealer Staff

As a Dealer Admin,
I want to assign and update roles for dealer staff members,
So that staff have access to what they need and nothing more.

**Acceptance Criteria:**

**Given** the Dealer Admin views a staff member's record
**When** they change the role assignment and save
**Then** the `User.role` is updated in Neon and the change takes effect on the staff member's next session (or immediately on active sessions via session revalidation)
**And** `DEALER_STAFF` role cannot access billing, branding, or staff management — these routes return `403`
**And** `DEALER_ADMIN` role has full access to all dealer portal routes

---

## Story 2.6: Stripe Billing Setup

As a Dealer Admin,
I want to set up my dealership's billing via Stripe,
So that my subscription is active and I can access all platform features.

**Acceptance Criteria:**

**Given** the Dealer Admin opens the billing setup step
**When** they click "Set up billing" and complete the Stripe Checkout flow
**Then** a Stripe Customer and Subscription are created and their IDs are stored on the `Dealer` record
**And** the Dealer Admin is returned to the onboarding checklist with the billing step marked complete
**And** the Stripe Customer Portal is accessible from account settings for future billing management (plan changes, payment method updates)
**And** Stripe webhook events are processed idempotently — duplicate `customer.subscription.updated` events do not create duplicate records

---

## Story 2.7: Dealership Profile Management

As a Dealer Admin,
I want to view and update my dealership's profile information after initial setup,
So that I can keep our details current without re-doing the full onboarding flow.

**Acceptance Criteria:**

**Given** the Dealer Admin navigates to dealership settings
**When** they update any profile field (name, contact info, logo, brand colour) and save
**Then** the `Dealer` record is updated and a Sonner toast confirms "Branding saved"
**And** changes to brand colour re-run the WCAG AA contrast validation and show a warning if the new colour fails
**And** the settings page is inaccessible to `DEALER_STAFF` users (redirects to `403`)

---
