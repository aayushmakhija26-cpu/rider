# Epic 9: SysAdmin Operations & Platform Governance

Jupiter SysAdmin can log in to the SysAdmin portal, monitor DMS sync health across all dealer tenants, review the full audit log, trigger manual re-syncs, process deletion requests, and manage platform roles.

## Story 9.1: SysAdmin Portal Layout & Authentication

As a Jupiter SysAdmin,
I want a dedicated SysAdmin portal accessible only to `SYSADMIN` role sessions, protected by IP allowlisting,
So that platform-wide operations are restricted to authorised Jupiter staff only.

**Acceptance Criteria:**

**Given** a user attempts to access any `/sysadmin` route
**When** the Next.js middleware runs
**Then** the route is blocked for any session with a role other than `SYSADMIN` — redirected to the sign-in page, not a 404
**And** Vercel Firewall rules enforce IP allowlisting on the `/sysadmin` route group — requests from non-allowlisted IPs receive `403` before hitting the application
**And** the SysAdmin portal renders a desktop-first layout with a left sidebar: Dealers, DMS Monitor, Audit Log, Deletion Requests, Role Management
**And** the SysAdmin session carries no `dealerId` — RLS does not restrict SysAdmin queries to a single tenant

---

## Story 9.2: Dealer Tenant Overview

As a Jupiter SysAdmin,
I want to view all registered dealer tenants and their key status indicators,
So that I have a complete picture of platform health at a glance.

**Acceptance Criteria:**

**Given** the SysAdmin navigates to the Dealers section
**When** the dealer list loads
**Then** all dealer tenants are listed with: dealership name, registration date, subscription status (Stripe), DMS connection status, last DMS sync timestamp, and consumer count
**And** each row links to a dealer detail view showing full onboarding status, branding config, staff list, and sync history
**And** the list is sortable by registration date, subscription status, and last sync timestamp
**And** data is cross-tenant — RLS bypass for `SYSADMIN` role is applied correctly, returning all dealers regardless of `dealer_id`

---

## Story 9.3: Cross-Tenant DMS Sync Monitoring & Manual Re-Sync

As a Jupiter SysAdmin,
I want to monitor DMS sync status across all dealer tenants from a single view and manually trigger re-syncs when needed,
So that I can proactively identify and respond to sync failures before dealers notice data gaps, without waiting for the next nightly batch.

**Acceptance Criteria:**

**Given** the SysAdmin navigates to the DMS Monitor section
**When** the monitor loads
**Then** all dealer tenants are listed with their most recent sync event: timestamp, status (Success/Failed/In Progress), record counts, and failure reason if applicable
**And** failed syncs are visually prominent (red status badge) and sorted to the top of the list
**And** each failed sync row shows an inline "Trigger re-sync" CTA that opens a confirmation dialog before executing: "Re-sync [Dealer Name]?" — Cancel + Re-sync buttons, no X close
**And** confirming re-sync enqueues an Inngest `dms/sync.requested` event immediately, scoped to that dealer's `dealerId`
**And** the DMS Monitor updates the dealer's sync status to "In Progress" within the same view — no full-page refresh required
**And** an `AuditLog` entry is written: event type `DMS_RESYNC_TRIGGERED`, `dealerId`, `actorId` (SysAdmin userId), `triggeredAt`
**And** the re-sync runs through the same validation and normalisation pipeline as the nightly batch (Story 3.3) — no special-case logic for manual triggers
**And** the dealer detail view (Story 9.2) also includes a "Trigger re-sync" CTA that follows the same confirmation and processing flow

---

> **Note:** Story 9.4 (previously "Manual DMS Re-Sync for a Dealer Tenant") has been merged into this story. The monitoring view and the re-sync action are a tightly coupled UX/service pair.

---

## Story 9.5: Platform Audit Log Viewer

As a Jupiter SysAdmin,
I want to search and filter the full platform audit log by date range and event type,
So that I can investigate any system action, compliance event, or security incident across all tenants.

**Acceptance Criteria:**

**Given** the SysAdmin navigates to the Audit Log section
**When** the audit log viewer loads
**Then** a date range picker and event type filter render inline above the log timeline; filters apply on change with no submit button required
**And** event types available for filtering include: `DASHBOARD_ACCESS`, `EMAIL_SENT`, `DMS_SYNC_EVENT`, `CONSENT_RECORDED`, `OPT_OUT`, `DELETION_REQUESTED`, `DELETION_PROCESSED`, `DMS_RESYNC_TRIGGERED`, `CAMPAIGN_BLOCKED_CAN_SPAM`
**And** each log entry shows: timestamp, event type badge, dealer name, consumer identifier (anonymised if deletion processed), actor, and an expandable payload detail
**And** a "Export as CSV" button (right-aligned above the timeline) exports the current filtered result set
**And** the audit log is read-only — no entry can be edited or deleted from the UI or the underlying database

---

## Story 9.6: Deletion Request Queue & Processing

As a Jupiter SysAdmin,
I want to view and process pending consumer data deletion requests,
So that CCPA/CPRA erasure obligations are fulfilled within the 10-business-day deadline.

**Acceptance Criteria:**

**Given** the SysAdmin navigates to the Deletion Requests section
**When** the queue loads
**Then** all `PENDING` deletion requests are listed with: consumer identifier, dealer name, `requestedAt`, days remaining until the 10-business-day deadline, and a "Process deletion" CTA
**And** requests within 2 business days of the deadline are highlighted in amber; overdue requests are highlighted in red
**And** clicking "Process deletion" opens a confirmation dialog: "Permanently anonymise data for [Consumer ID]?" — Cancel + Process buttons, no X close
**And** confirming triggers the deletion processing logic from Story 8.3: PII purged, audit entries written, request status set to `COMPLETED`
**And** completed requests remain visible in the queue with `COMPLETED` status for 90 days before being archived

---

## Story 9.7: Platform Role Management

As a Jupiter SysAdmin,
I want to view and manage roles across all users on the platform,
So that I can correct incorrect role assignments, revoke access, and maintain platform security hygiene.

**Acceptance Criteria:**

**Given** the SysAdmin navigates to Role Management
**When** the user list loads
**Then** all platform users are listed with: name, email, current role, `dealerId` (if applicable), last login, and account status (active/deactivated)
**And** the SysAdmin can change a user's role via an inline dropdown — the change takes effect on the user's next session
**And** the SysAdmin can deactivate any user account, which immediately invalidates their active session
**And** every role change and deactivation is written to the `AuditLog`: event type `ROLE_CHANGED` or `ACCOUNT_DEACTIVATED`, `actorId` (SysAdmin userId), `targetUserId`, `previousRole`, `newRole`, `timestamp`
**And** the SysAdmin cannot deactivate their own account from this interface

---
