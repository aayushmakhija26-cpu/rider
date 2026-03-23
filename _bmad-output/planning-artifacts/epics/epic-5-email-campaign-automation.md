# Epic 5: Email Campaign Automation

Dealer Admin can activate a bi-weekly campaign; consumers receive a dealer-branded email with a personalized signed URL that takes them directly to their vehicle dashboard; engagement is tracked and logged.

## Story 5.1: Resend & React Email Setup

As a developer,
I want Resend configured as the email provider and a base dealer-branded React Email template created,
So that all campaign emails can be composed, previewed locally, and sent through a reliable, high-deliverability provider.

**Acceptance Criteria:**

**Given** the Resend client is initialized in `lib/resend.ts` with API key from Vercel env vars
**When** a test email is triggered from the local dev environment
**Then** the email is delivered via Resend and appears in the recipient's inbox without landing in spam
**And** the React Email template accepts `dealerTheme`, `consumerName`, `vehicleData`, `signedUrl`, and `tileData` props and renders correctly in the React Email dev server preview
**And** the template applies dealer branding (`--dealer-primary` colour, dealer logo) and falls back to Jupiter Blue if no branding is configured
**And** all required CAN-SPAM elements are present in the template: unsubscribe link, sender identification (dealership name), and physical address

---

## Story 5.2: Email Campaign Preview

As a Dealer Admin,
I want to preview the branded email template before activating my campaign,
So that I can verify the branding, consumer data placeholders, and signed URL are correct before any emails go out.

**Acceptance Criteria:**

**Given** the Dealer Admin navigates to the campaign setup page
**When** they click "Preview Email"
**Then** a rendered preview of the email template is shown using a sample consumer record from their tenant (or fixture data if no consumers are synced yet)
**And** the preview shows the dealer's actual logo, brand colour, and contact info as they will appear in the live send
**And** the signed URL in the preview is clearly labelled as a sample — it does not generate a real token
**And** if no consumers are synced yet, an empty state is shown: "No consumers yet — connect your DMS to get started" with a "Connect DealerVault" CTA

---

## Story 5.3: Campaign Activation with Confirmation

As a Dealer Admin,
I want to activate my bi-weekly email campaign after reviewing the preview,
So that my consumers start receiving personalized vehicle insight emails on a regular schedule.

**Acceptance Criteria:**

**Given** the Dealer Admin clicks "Activate Campaign" on the campaign page
**When** the button is clicked
**Then** a confirmation dialog opens: title "Activate Campaign?", body "Your consumers will receive a branded email every two weeks with their vehicle insights.", Cancel (outline) + Activate (primary) buttons — no X close button
**And** confirming activation schedules the Inngest `campaign.dispatch` function for bi-weekly execution scoped to the dealer's `dealerId`
**And** a Sonner toast confirms "Campaign scheduled" and the campaign status updates to Active in the portal
**And** the campaign cannot be activated again if it is already active — the button is replaced with a status indicator

---

## Story 5.4: Inngest Campaign Dispatch & Signed URL Generation per Consumer

As a platform,
I want the Inngest `campaign.dispatch` function to fan out emails to every eligible consumer with a unique signed URL,
So that each consumer receives a personalized email that links directly to their own dashboard.

**Acceptance Criteria:**

**Given** the `campaign.dispatch` Inngest function is triggered for a dealer tenant
**When** the function runs
**Then** all consumers for the dealer tenant who have not opted out are fetched; opted-out consumers are excluded before any email is generated
**And** a unique `SignedUrlToken` is generated (and written to Neon) for each eligible consumer with a 7-day expiry
**And** each consumer's email is dispatched via Resend using the React Email template populated with their specific vehicle data and signed URL
**And** the full dispatch completes on schedule regardless of dealer consumer list size (Inngest step-level fan-out; no single-function timeout risk)

---

## Story 5.5: Email Engagement Tracking

As a Dealer Admin,
I want to see open rates and click-through rates for each campaign,
So that I can understand how consumers are engaging with their vehicle insights.

**Acceptance Criteria:**

**Given** Resend sends a webhook event to `/api/webhooks/resend` for an email open or click
**When** the webhook is received and validated
**Then** the engagement event (open, click, consumer ID, campaign ID, timestamp) is stored in Neon against the correct campaign and consumer records
**And** duplicate webhook events for the same engagement action are idempotent — no duplicate engagement records are created
**And** aggregate open rate and click-through rate are queryable per campaign (used by Epic 7 analytics)

---

## Story 5.6: Campaign Email Audit Logging

As a platform,
I want every email send to be logged in the audit trail with recipient and engagement context,
So that there is a tamper-evident record of all communications sent to consumers.

**Acceptance Criteria:**

**Given** an email is dispatched to a consumer via the `campaign.dispatch` function
**When** the Resend API call completes (success or failure)
**Then** an `AuditLog` entry is written with: event type `EMAIL_SENT`, `dealerId`, `consumerId`, `campaignId`, Resend message ID, timestamp, and delivery status
**And** subsequent engagement events (open, click) append additional `AuditLog` entries referencing the same Resend message ID
**And** audit entries are append-only — no entry is ever updated or deleted
**And** failed sends are logged with the failure reason; Inngest retries the send and logs each attempt separately

---
