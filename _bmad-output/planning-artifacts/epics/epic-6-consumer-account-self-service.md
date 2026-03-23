# Epic 6: Consumer Account & Self-Service

A consumer can discover Jupiter directly via a public landing page, enter their VIN to identify their vehicle, and either be matched to a participating dealer or join a waitlist — as well as upgrade to a persistent account from their dashboard, manage their profile, opt out of email communications, and submit a self-serve data deletion request — entirely on their own terms.

## Story 6.6: Public Consumer Landing Page & Organic VIN Entry

As a consumer,
I want to enter my vehicle's VIN on a public Jupiter landing page to see if my dealer is on the platform,
So that I can access my vehicle insights proactively without waiting for a dealer-triggered email.

**Acceptance Criteria:**

**Given** a consumer navigates to the public Jupiter landing page (unauthenticated)
**When** the page loads
**Then** a single-field VIN entry form is shown with placeholder "Enter your 17-character VIN", a "Get my vehicle insights" primary CTA, and no other required fields
**And** VIN input auto-uppercases, enforces a 17-character limit, shows a real-time character count, and displays an inline decode confirmation ("2021 Toyota Camry") once a valid VIN is detected via the VIN Decode integration
**And** an invalid VIN (wrong length or non-alphanumeric) shows an inline error: "Check your VIN — it should be 17 characters" without submitting

**Given** the consumer submits a valid, decoded VIN
**When** the platform checks for a participating dealer matching the consumer's region
**Then** if a participating dealer is found, the consumer is shown the matched dealer's branding and directed to the account creation flow (Story 6.2) with the VIN pre-filled
**And** if no participating dealer is found, a waitlist screen is shown: "Jupiter is coming to your area — enter your email to be notified when your dealer joins", with an optional email capture field and "Notify me" CTA
**And** a submitted waitlist entry stores `email` (if provided), `vin`, `region`, and `submittedAt` in a `Waitlist` table in Neon — not linked to any dealer tenant

**Given** the consumer submits a waitlist entry
**When** the entry is saved
**Then** a confirmation message is shown: "You're on the list. We'll email you when Jupiter launches in your area."
**And** no account is created and no session is established — the consumer can close the tab without losing their spot

---

## Story 6.1: Consumer Account Creation from Signed URL

As a consumer,
I want to create a persistent account from my dashboard after arriving via a signed URL,
So that I can access my vehicle insights anytime without needing a new email link.

**Acceptance Criteria:**

**Given** a consumer is viewing their dashboard via a valid signed URL
**When** they click the account creation CTA and submit a valid email + password
**Then** a `CONSUMER` `User` record is created in Neon linked to their existing `Consumer` record
**And** the signed URL token is immediately invalidated (`invalidatedAt` set) so it can no longer be used for unauthenticated access
**And** the consumer is redirected to their dashboard with a persistent JWT session — no re-entry of the signed URL required
**And** form validation is inline, shown on blur (not on keystroke); the only primary button on screen is the account creation CTA

---

## Story 6.2: Direct Consumer Sign-Up (Without Dealer Email)

As a consumer,
I want to sign up directly on the Jupiter platform without receiving a dealer-triggered email first,
So that I can proactively track my vehicle even if my dealer hasn't sent me an invitation.

**Acceptance Criteria:**

**Given** a consumer navigates to the public sign-up page
**When** they register with a valid email, password, and their vehicle VIN
**Then** a `CONSUMER` `User` record and a linked `Consumer` record are created; the VIN is stored for dashboard population once a matching dealer DMS record is found
**And** if no matching DMS record exists for the VIN, the dashboard shows a pending state: "We're setting up your vehicle insights — check back soon"
**And** the consumer is logged in immediately with a JWT session after registration
**And** VIN entry auto-uppercases input, enforces 17-character limit, shows a real-time character count, and displays inline decode confirmation ("2021 Toyota Camry") once a valid VIN is detected

---

## Story 6.3: Consumer Profile Management

As a consumer,
I want to view and update my account information,
So that my profile stays accurate and I have control over my personal details.

**Acceptance Criteria:**

**Given** a consumer is logged in and navigates to their account settings
**When** they update their name, email, or password and save
**Then** the `User` record is updated in Neon and a Sonner toast confirms "Account updated"
**And** changing email requires re-verification via a confirmation email sent to the new address before the change takes effect
**And** password change requires the current password to be entered first; incorrect current password returns an inline error
**And** the settings page is only accessible to authenticated `CONSUMER` sessions — unauthenticated access redirects to the sign-in page

---

## Story 6.4: Email Opt-Out

As a consumer,
I want to opt out of email communications from the platform,
So that I stop receiving vehicle insight emails if I no longer want them.

**Acceptance Criteria:**

**Given** a consumer opens the unsubscribe link in any campaign email or navigates to communication preferences in their account settings
**When** they confirm they want to opt out
**Then** the `Consumer.emailOptOut` flag is set to `true` in Neon and a confirmation page/message is shown: "You've been unsubscribed from vehicle insight emails"
**And** the opt-out is honoured within the next campaign dispatch — the consumer is excluded from the eligible send list in Story 5.4
**And** the opt-out preference is captured in the `AuditLog` with timestamp, consumerId, and dealerId
**And** opting out via the unsubscribe link does not require the consumer to be logged in

---

## Story 6.5: Self-Serve Data Deletion Request

As a consumer,
I want to submit a request to have my data deleted from the platform,
So that I can exercise my right to erasure under CCPA/CPRA.

**Acceptance Criteria:**

**Given** a logged-in consumer navigates to their account settings and clicks "Request data deletion"
**When** they confirm the deletion request via a confirmation dialog ("Delete my data?" — Cancel + Delete buttons, no X close)
**Then** a data deletion request record is created in Neon with status `PENDING`, `consumerId`, `requestedAt`, and `dealerId`
**And** an `AuditLog` entry is written immediately: event type `DELETION_REQUESTED`, `consumerId`, `dealerId`, timestamp
**And** the consumer sees an in-app confirmation: "Your deletion request has been received. We'll process it within 10 business days."
**And** the deletion request is visible to Jupiter SysAdmin for processing (used in Epic 9)

---
