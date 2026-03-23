# Epic 8: Compliance, Consent & Data Governance

The platform fully honours consumer consent and opt-out rights, processes self-serve deletion requests, maintains a tamper-evident audit trail, and ensures all emails satisfy CAN-SPAM and CCPA/CPRA obligations.

## Story 8.1: Consumer Opt-Out Enforcement in Campaign Dispatch

As a platform,
I want consumer opt-out preferences to be checked and enforced before every campaign dispatch,
So that no email is ever sent to a consumer who has opted out, and the opt-out is honoured within 10 business days of the request.

**Acceptance Criteria:**

**Given** a consumer has `emailOptOut = true` on their `Consumer` record (set in Story 6.4)
**When** the `campaign.dispatch` Inngest function runs
**Then** the consumer is excluded from the eligible send list before any `SignedUrlToken` is generated or any Resend API call is made for them
**And** the exclusion is logged in the campaign dispatch summary (opted-out count recorded alongside sent count)
**And** opt-out requests set before a campaign dispatch window are always honoured in that dispatch — there is no grace period that could result in a send after opt-out
**And** re-opting in (if supported in future) would require an explicit consumer action — opt-out is never reversed automatically

---

## Story 8.2: CCPA/CPRA Consent Tracking

As a platform,
I want consumer consent for data use to be captured and stored in accordance with CCPA/CPRA,
So that Jupiter can demonstrate consent status for any consumer at any point in time.

**Acceptance Criteria:**

**Given** a consumer first accesses their dashboard (via signed URL or direct sign-up)
**When** the dashboard loads for the first time
**Then** a `ConsentRecord` is created in Neon with `consumerId`, `dealerId`, `consentType` (`DATA_USE`), `consentedAt`, `ipAddress`, and `userAgent`
**And** if the consumer subsequently opts out (Story 6.4), a new `ConsentRecord` entry is appended with `consentType` (`OPT_OUT`) and timestamp — the original consent record is never modified
**And** consent records are append-only; no record is ever updated or deleted
**And** consent records are queryable by SysAdmin per consumer (used in Epic 9 audit log)

---

## Story 8.3: Self-Serve Data Deletion Processing

As a platform,
I want consumer data deletion requests to be processed completely and logged at every step,
So that consumers' right to erasure under CCPA/CPRA is fulfilled within 10 business days.

**Acceptance Criteria:**

**Given** a `PENDING` deletion request exists in Neon with a valid `deletionRequestId` (created in Story 6.5)
**When** the data deletion service is invoked with that `deletionRequestId` (callable via an internal API endpoint `/api/internal/deletion/process` or programmatically — used by the SysAdmin UI in Epic 9 Story 9.6)
**Then** the consumer's PII is purged from all Neon tables (`Consumer`, `User`, `SignedUrlToken`, `ConsentRecord` PII fields) — records are anonymised, not hard-deleted, to preserve audit trail integrity
**And** an `AuditLog` entry is written for each table affected: event type `DELETION_PROCESSED`, `consumerId`, `dealerId`, `processedBy` (invoking actor userId), `processedAt`
**And** the deletion request record is updated to status `COMPLETED` with `completedAt` timestamp
**And** the entire processing logic is testable via a direct API/integration test call without requiring a SysAdmin UI — the service is UI-agnostic
**And** the service is idempotent: invoking it twice with the same `deletionRequestId` does not double-purge or produce duplicate audit entries

---

## Story 8.4: CAN-SPAM Compliance Validation

As a platform,
I want every outbound campaign email to be validated for CAN-SPAM compliance before dispatch,
So that Jupiter and its dealer tenants are protected from regulatory violations.

**Acceptance Criteria:**

**Given** the `campaign.dispatch` Inngest function is preparing emails for a dealer tenant
**When** the React Email template is rendered for dispatch
**Then** a pre-send validation step confirms the rendered HTML contains: an unsubscribe link (pointing to the opt-out route from Story 6.4), the dealership's physical address, and the dealership name as sender identification
**And** if any required element is missing, the dispatch for that dealer is halted and an `AuditLog` entry is written with event type `CAMPAIGN_BLOCKED_CAN_SPAM`, with detail on the missing element
**And** the Dealer Admin is notified via Sonner toast (next portal login) that their campaign was paused pending a branding update
**And** the validation runs per-dealer, per-dispatch — a missing physical address for one dealer does not block other dealers' dispatches

---

## Story 8.5: Audit Log Foundation & Append-Only Enforcement

As a platform,
I want a central append-only audit log table that captures all key system actions across every domain,
So that there is a tamper-evident, 24-month record of dashboard access, email sends, integration events, consent actions, and deletion actions.

**Acceptance Criteria:**

**Given** any key system action occurs (dashboard access, email send, DMS sync event, consent record, deletion request/processing)
**When** the action completes
**Then** an `AuditLog` row is inserted with: `id`, `eventType`, `dealerId` (nullable), `consumerId` (nullable), `actorId` (nullable), `payload` (JSONB), `createdAt`
**And** no `UPDATE` or `DELETE` is ever issued against the `AuditLog` table — enforced via Postgres RLS policy that permits `INSERT` only
**And** `createdAt` is indexed for time-range queries; the table never truncates records within 24 months of creation
**And** a Vitest test confirms that an attempt to update or delete an audit log entry throws a Postgres permission error

---
