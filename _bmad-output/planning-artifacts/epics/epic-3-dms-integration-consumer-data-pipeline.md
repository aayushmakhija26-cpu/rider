# Epic 3: DMS Integration & Consumer Data Pipeline

Dealer Admin can connect DealerVault, run simulation mode with fixture data, view sync status timeline, diagnose failures, and trust that consumer + vehicle data flows reliably into the platform.

## Story 3.1: DealerVault Connection Setup

As a Dealer Admin,
I want to connect my dealership's DMS by entering DealerVault credentials,
So that Jupiter can begin pulling consumer and vehicle data from my system.

**Acceptance Criteria:**

**Given** the Dealer Admin opens the DMS Connection step in the onboarding checklist
**When** they enter valid DealerVault credentials and click "Connect DealerVault"
**Then** the credentials are validated against DealerVault, stored encrypted as Vercel environment variables scoped to the dealer tenant, and the connection status is marked active
**And** a Sonner toast confirms "DealerVault connected"
**And** invalid credentials return an inline error: "Couldn't connect to DealerVault. Check your credentials and try again." — no raw error codes exposed
**And** the DMS Connection step on the onboarding checklist is marked complete

---

## Story 3.2: DMS Simulation Mode

As a Dealer Admin,
I want to simulate DMS data ingestion using fixture data before going live,
So that I can preview consumer dashboards and verify the integration without a live DealerVault connection.

**Acceptance Criteria:**

**Given** the Dealer Admin has not yet connected live DealerVault credentials
**When** they enable simulation mode via a toggle on the DMS setup page
**Then** the `simulation_mode` flag is set to `true` on their `Dealer` record and fixture consumer + vehicle records are loaded into Neon scoped to their `dealerId`
**And** the Dealer Admin can preview a consumer dashboard using the simulated data (signed URL generated from fixture consumer)
**And** simulation mode is clearly labelled in the dealer portal — no simulated data can be sent to real consumers
**And** switching from simulation mode to live mode clears all fixture records before the first live sync runs

---

## Story 3.3: Inngest DMS Batch Sync Job

As a platform,
I want a nightly Inngest scheduled function to ingest, validate, and normalise DMS data for each dealer tenant,
So that consumer and vehicle records in Neon are kept current without impacting daytime platform performance.

**Acceptance Criteria:**

**Given** the Inngest `dms.sync.daily` function is scheduled for the 22:00–06:00 window
**When** the function runs for a dealer tenant
**Then** DMS data is fetched from DealerVault, validated (required fields present, VINs are 17 characters), normalised to the Prisma schema, and upserted into Neon scoped to the dealer's `dealerId`
**And** the sync completes within the nightly window without causing degraded response times on the consumer dashboard
**And** a `DmsSyncEvent` record is written to the audit table with status, record count, duration, and any validation errors
**And** if the sync fails for any reason, the `sync.alert.fire` Inngest function is triggered within 5 minutes

---

## Story 3.4: Near-Real-Time DMS Webhook Processing

As a platform,
I want the system to receive and process near-real-time DMS updates from DealerVault webhooks,
So that consumer records reflect changes (loan payoff, new vehicle, sold vehicle) without waiting for the next nightly batch.

**Acceptance Criteria:**

**Given** DealerVault sends a webhook event to `/api/webhooks/dealervault`
**When** the Route Handler receives a valid, authenticated webhook payload
**Then** an Inngest `dms/sync.requested` event is enqueued and the webhook returns `200` within 200ms (no synchronous processing)
**And** the Inngest `dms.webhook.process` function processes the event, updates the relevant `Consumer` or `Vehicle` record in Neon, and logs a `DmsSyncEvent` entry
**And** invalid or unauthenticated webhook payloads return `401` or `400` and are not processed
**And** duplicate webhook events are idempotent — re-processing the same event ID produces no duplicate records

---

## Story 3.5: DMS Sync Status & Failure Alerts

As a Dealer Admin,
I want to view my DMS sync status and receive alerts when a sync fails,
So that I can diagnose and resolve data pipeline issues before they affect consumer dashboards.

**Acceptance Criteria:**

**Given** the Dealer Admin opens the DMS status page
**When** the `SyncStatusTimeline` component loads
**Then** sync events are listed newest-first with timestamp, event type, status badge (Success/Failed/In Progress/Pending), and expandable detail (root cause, affected record count, duration, retry status)
**And** failed events show an inline "Trigger re-sync" CTA that opens a confirmation dialog before executing
**And** the confirmation dialog reads "Re-sync DealerVault?" with a one-sentence consequence and Cancel/Re-sync buttons — no X close button
**And** after confirming, the manual re-sync is queued as an Inngest event and the timeline updates to show "In Progress"

---

## Story 3.6: DMS Data Validation & Normalisation

As a platform,
I want all incoming DMS data to be validated and normalised before being written to Neon,
So that downstream features (valuation, dashboard tiles) always receive well-formed, consistent data.

**Acceptance Criteria:**

**Given** DMS data arrives via batch or webhook
**When** the validation step runs
**Then** records missing required fields (VIN, consumer name, loan balance) are rejected and logged with field-level error detail in the `DmsSyncEvent` record — not silently dropped
**And** VINs are validated as exactly 17 alphanumeric characters; invalid VINs are flagged and the record skipped
**And** currency values are normalised to cents (integer); dates normalised to UTC ISO 8601
**And** valid records proceed to upsert; the sync summary shows counts of accepted, skipped, and errored records

---
