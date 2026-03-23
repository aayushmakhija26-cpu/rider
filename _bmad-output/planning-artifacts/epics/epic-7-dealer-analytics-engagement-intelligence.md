# Epic 7: Dealer Analytics & Engagement Intelligence

Dealer Admin and Staff can view a sortable, filterable consumer analytics table, identify Trade Timer green-zone consumers, and see campaign performance metrics — actionable sales intelligence at a glance.

## Story 7.1: Dealer Portal Layout & Navigation

As a Dealer Admin or Dealer Staff,
I want a persistent left sidebar with role-scoped navigation items when I use the dealer portal,
So that I can move between sections quickly and only see what I'm permitted to access.

**Acceptance Criteria:**

**Given** a `DEALER_ADMIN` or `DEALER_STAFF` user is logged in to the dealer portal
**When** any dealer portal page loads at `lg` breakpoint or above
**Then** a fixed left sidebar (240px) renders with navigation items scoped to the user's role — items the user cannot access are absent entirely, not greyed out
**And** `DEALER_ADMIN` sees: Dashboard, Analytics, Campaigns, DMS, Branding, Staff, Billing
**And** `DEALER_STAFF` sees: Dashboard, Analytics only
**And** below `lg` breakpoint, the sidebar collapses to a top navigation bar accessible via a hamburger Sheet component
**And** page transitions are instant (Next.js client-side routing); no full-page reloads

---

## Story 7.2: Campaign Performance Metrics View

As a Dealer Admin,
I want to see aggregate campaign performance metrics (open rates, click-throughs, consumer activity),
So that I can assess whether my email campaigns are driving consumer engagement.

**Acceptance Criteria:**

**Given** the Dealer Admin navigates to the Analytics section
**When** the campaign performance panel loads
**Then** aggregate metrics are displayed per campaign: total sent, open rate (%), click-through rate (%), and total dashboard visits attributed to the campaign
**And** metrics are computed from the engagement data stored in Epic 5 (Story 5.5)
**And** if no campaigns have been sent yet, the empty state reads: "Your first campaign hasn't gone out yet" with a "Preview your campaign" CTA
**And** `DEALER_STAFF` can view this panel with the same read-only data; billing and branding controls are absent from their view

---

## Story 7.3: Consumer Engagement Analytics Table

As a Dealer Admin or Dealer Staff,
I want to see a table of all consumers with their engagement indicators and Trade Timer status,
So that I can quickly identify who is most likely to be ready to trade.

**Acceptance Criteria:**

**Given** the dealer portal analytics page loads
**When** the `DataTable` component renders
**Then** 5 skeleton rows appear immediately; real consumer data replaces them in-place with no layout shift
**And** the table includes columns: consumer name (with Avatar initials), vehicle year/make/model, Trade Timer status (Badge: Green/Amber/Red), last dashboard visit, open count, and row actions (DropdownMenu)
**And** the table is pre-sorted by Trade Timer status (Green first) then by last dashboard visit (most recent first)
**And** each row's DropdownMenu includes "View dashboard" — clicking it calls an authenticated API endpoint (`POST /api/dealer/consumers/[consumerId]/preview-url`, requires `DEALER_ADMIN` or `DEALER_STAFF` session with matching `dealerId`) that generates a new `SignedUrlToken` scoped to the requesting dealer, then opens the resulting URL in a new tab
**And** only consumers belonging to the authenticated dealer's `dealerId` are returned — RLS enforces this at the database layer

---

## Story 7.4: Consumer Table Filtering & Search

As a Dealer Admin or Dealer Staff,
I want to filter the consumer table by Trade Timer status and search by name or vehicle,
So that I can zero in on the most actionable consumers without scanning every row.

**Acceptance Criteria:**

**Given** the consumer analytics table is loaded
**When** the Dealer Admin selects a Trade Timer filter (Green / Amber / Red) or types in the search box
**Then** inline column filters apply immediately; active filters appear as filter chips above the table
**And** the text search filters by consumer name or vehicle year/make/model (case-insensitive, partial match)
**And** filters persist within the session — navigating away and returning restores the last active filter state
**And** clearing all filters restores the default sort (Green Trade Timer first)
**And** if the filtered result set is empty, the empty state reads: "No consumers in the green zone yet · Check back after the next campaign" (for green filter) or a generic "No results match your filters" for other combinations

---

## Story 7.5: High-Engagement Consumer Identification

As a Dealer Admin,
I want to easily identify consumers who have visited their dashboard multiple times or are in the Trade Timer green zone,
So that I can prioritise outreach to consumers most likely to trade.

**Acceptance Criteria:**

**Given** the Dealer Admin views the analytics table
**When** a consumer has visited their dashboard 3 or more times since the last campaign, or their Trade Timer status is Green
**Then** that consumer is visually distinguished in the table — Trade Timer Green badge is shown in emerald; repeat-visit consumers have a visit count displayed prominently
**And** the Dealer Admin can sort the table by visit count descending to surface highest-engagement consumers at the top
**And** the "high engagement" definition (3+ visits OR Trade Timer Green) is applied consistently across the table, filters, and any future export functionality

---
