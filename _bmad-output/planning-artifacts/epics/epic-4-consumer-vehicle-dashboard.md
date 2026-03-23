# Epic 4: Consumer Vehicle Dashboard

A consumer can open a signed URL and immediately see their full vehicle dashboard — market value, equity position, loan payoff, Trade Timer signal, NHTSA recall alert, insurance card, and warranty card — all powered by cached valuations and DMS-synced data, with no account required.

## Story 4.1: Signed URL Generation & Validation

As a platform,
I want to generate time-limited signed URLs per consumer and validate them on every access,
So that consumers can access their personal dashboard securely without a login, and expired or invalidated tokens are rejected cleanly.

**Acceptance Criteria:**

**Given** a signed URL is generated for a consumer (manually or via campaign dispatch)
**When** the token is created
**Then** a `SignedUrlToken` record is written to Neon with `consumerId`, `dealerId`, `campaignId` (nullable), `expiresAt` (now + 7 days), and `invalidatedAt` (null)
**And** when the consumer opens the URL, the token is looked up by DB — expiry and `invalidatedAt` are both checked; expired tokens render a dedicated expiry screen, not a 404
**And** a valid token resolves to the correct consumer's dashboard scoped to the correct dealer tenant
**And** the token is invalidated (single UPDATE sets `invalidatedAt`) when the consumer creates a full account
**And** when a valid signed URL resolves to the consumer's dashboard, an `AuditLog` entry is written with event type `DASHBOARD_ACCESS`, `consumerId`, `dealerId`, `signedUrlTokenId`, and `timestamp`

---

## Story 4.2: Upstash Redis Valuation Cache Layer

As a platform,
I want all vehicle valuation data served from an Upstash Redis cache,
So that consumer dashboard loads never trigger real-time third-party API calls and performance is consistent at scale.

**Acceptance Criteria:**

**Given** a consumer dashboard load requests valuation data for a VIN
**When** the cache is checked for key `valuation:{vin}:{source}`
**Then** a cache hit returns the cached value immediately with no JD Power or Black Book API call made
**And** a cache miss triggers the JD Power API call; on success the result is stored in Redis with a 7–14 day TTL and also persisted to Neon
**And** if JD Power fails, Black Book is called automatically with no manual intervention; the fallback source is recorded alongside the cached value
**And** Trade Timer calculation inputs are also cached and invalidated when a DMS sync completes for that consumer's dealer

---

## Story 4.3: Vehicle Valuation Engine

As a platform,
I want the valuation engine to apply the correct pricing logic based on vehicle ownership duration,
So that every consumer sees an accurate, source-attributed market value for their vehicle.

**Acceptance Criteria:**

**Given** a valuation is requested for a VIN with a known purchase date
**When** ownership duration is calculated
**Then** vehicles owned 0–6 months use retail price from JD Power (primary) or Black Book (fallback)
**And** vehicles owned 6–12 months use the mid-point between retail and trade-in values
**And** vehicles owned 12+ months use the Jupiter proprietary algorithm (depreciation curve + market seasonality adjustment)
**And** the valuation source (`JD_POWER`, `BLACK_BOOK`) and algorithm applied are recorded and surfaced in the dashboard attribution caption

---

## Story 4.4: Vehicle Equity & Trade Timer Calculations

As a platform,
I want the system to calculate vehicle equity and Trade Timer readiness from valuation and loan data,
So that consumers see actionable financial signals without needing to do any maths themselves.

**Acceptance Criteria:**

**Given** a consumer's current market value and DMS-synced loan balance are available
**When** the equity calculation runs
**Then** equity = market value − loan payoff amount; positive equity is shown as a dollar value; negative equity is shown as an equilibrium projection (days/months until breakeven)
**And** Trade Timer readiness is calculated using the formula: depreciation rate + current equity position + market seasonality index; result maps to Green / Amber / Red state with a days-to-optimal-window figure
**And** all calculated values are cached alongside the valuation in Redis and invalidated on DMS sync

---

## Story 4.5: DealerThemeProvider & Consumer Dashboard Layout

As a consumer,
I want the dashboard to display my dealer's branding when I open my signed URL,
So that the experience feels like it comes from my dealership, not an unknown platform.

**Acceptance Criteria:**

**Given** a consumer opens a valid signed URL
**When** the `ConsumerDashboardLayout` renders
**Then** the `DealerThemeProvider` injects `--dealer-primary`, `--dealer-accent`, `--dealer-foreground`, and `--dealer-logo` CSS variables from the `Dealer` record
**And** if the dealer has not configured branding, Jupiter Blue (`#2563EB`) is used as the fallback for all CSS variables
**And** the `--dealer-foreground` colour is auto-calculated to ensure WCAG AA contrast against `--dealer-primary`
**And** the layout is single-column full-bleed on mobile (default), shifts to a centred max-width 480px container at `md` breakpoint

---

## Story 4.6: VehicleHeroSection Component

As a consumer,
I want to see my vehicle's identity and current market value as the dominant first impression when I open my dashboard,
So that I immediately understand this is about my specific vehicle and get the most important number above the fold.

**Acceptance Criteria:**

**Given** the consumer dashboard loads with valid valuation data
**When** the `VehicleHeroSection` renders
**Then** the dealer logo, dealership name, vehicle year/make/model, market value (in `text-4xl font-bold font-tabular`), value delta badge (↑/↓ with emerald/red colour), and attribution caption ("Valued by JD Power") are all visible above the fold on a 375px viewport
**And** in the `loading` state, the hero gradient renders immediately and skeleton pulse shows on value and vehicle name — hero background never flashes white
**And** in the `stale-data` state, the last known value is shown with inline text: "We're refreshing your data — check back shortly"
**And** the component has `role="banner"`, vehicle identity as `aria-label`, and market value as `aria-live="polite"`

---

## Story 4.7: VehicleInsightTile Component & Equity/Payoff Tiles

As a consumer,
I want to see my equity position and current loan payoff amount in clear, expandable tiles below the hero,
So that I understand my financial standing at a glance and can dig into details on demand.

**Acceptance Criteria:**

**Given** the consumer dashboard loads below the hero
**When** the equity and payoff `VehicleInsightTile` components render
**Then** each tile shows: label (`text-xs uppercase tracking-wide`), primary value (`text-2xl font-bold font-tabular`) with colour variant (emerald for positive equity, red for negative, slate for neutral), supporting text, and a chevron expand affordance
**And** tapping/clicking the tile expands it to show a plain-language summary; the chevron rotates to indicate expanded state
**And** in the `unavailable` state the tile is hidden entirely — no empty placeholder is shown
**And** each tile has `role="region"` and `aria-label` specific to the tile type; the expand button has `aria-expanded` set correctly

---

## Story 4.8: TradeTimerIndicator Component & Tile

As a consumer,
I want to see a plain-language Trade Timer signal that tells me when the optimal time to trade my vehicle is,
So that I can make an informed decision without interpreting a chart or percentage score.

**Acceptance Criteria:**

**Given** a Trade Timer readiness value is available for the consumer's vehicle
**When** the `TradeTimerIndicator` renders inside a `VehicleInsightTile`
**Then** a coloured dot + plain English sentence is shown: Green = "Optimal window in N days", Amber = "Approaching optimal window in N days", Red = "Not yet in trade window · Est. N days"
**And** supporting text reads: "Based on depreciation, payoff, and market seasonality"
**And** no gauge, arc, percentage, or score is used — text-only treatment
**And** the container `aria-label` includes the full sentence so screen readers read it correctly; `aria-live="polite"` is set for countdown updates

---

## Story 4.9: RecallAlertTile Component & NHTSA Integration

As a consumer,
I want to see an alert if my vehicle has an active NHTSA recall, with a direct link to book a service appointment,
So that I can take action on a safety issue without leaving my dashboard.

**Acceptance Criteria:**

**Given** the NHTSA API returns one or more active recalls for the consumer's VIN
**When** the `RecallAlertTile` renders
**Then** the amber alert container shows the recall title, description, and a "→ Book a service appointment" text-link CTA that opens the dealer's embedded scheduler (e.g. Xtime)
**And** if there are no active recalls, the tile returns `null` — no empty placeholder, no "No recalls found" message
**And** if the NHTSA API is unavailable, the tile is hidden gracefully — no error is shown to the consumer
**And** the tile has `role="alert"` and `aria-label="Active vehicle recall"` when visible

---

## Story 4.10: Insurance & Warranty Tiles *(Post-MVP — defer if deadline pressure)*

> **Scope note:** This story covers FR31 and FR32. Per the PRD scoping decision, insurance and warranty tiles are the first feature cut under deadline pressure — they are DMS-dependent and additive to the core value proposition. The UX component strategy also classifies these tile variants as Phase 3 post-MVP. Implement only if MVP timeline allows.

As a consumer,
I want to see my digital insurance ID card and warranty card on my dashboard,
So that I have quick access to key vehicle documents without searching through emails or a glove box.

**Acceptance Criteria:**

**Given** the consumer's `Vehicle` record includes DMS-synced insurance and warranty data
**When** the insurance and warranty `VehicleInsightTile` variants render
**Then** each tile shows the relevant document details (insurer name + policy number for insurance; coverage type + expiry for warranty)
**And** if DMS data is absent for either document, the consumer is shown an inline manual entry prompt within the tile expansion — not a separate page
**And** manually entered data is saved to the `Consumer` record and persists across sessions
**And** tiles with no data and no manual entry attempted are hidden entirely

---

## Story 4.11: 24-Month Historical Trends (Tile Expansion) *(Post-MVP — defer if deadline pressure)*

> **Scope note:** The UX component strategy classifies the `VehicleInsightTile` expanded state with Recharts as Phase 3 post-MVP. Historical trend data storage (FR30) is an MVP requirement and should be captured from day one — but the Recharts chart UI rendering inside the tile expansion can be deferred. Implement data capture in the valuation engine; defer the chart UI until post-MVP.

As a consumer,
I want to see up to 24 months of historical trends for my vehicle's value and equity when I expand a tile,
So that I can understand how my vehicle's financial position has changed over time.

**Acceptance Criteria:**

**Given** at least 2 months of historical valuation records exist for the consumer's VIN
**When** the consumer expands a `VehicleInsightTile` (equity or valuation)
**Then** a Recharts line chart renders inside the expanded state showing up to 24 data points (one per month)
**And** the chart is lazy-loaded — it is not included in the initial page bundle or paint
**And** if fewer than 2 months of history exist, the expanded state shows only the plain-language summary with no chart
**And** the chart is wrapped in a responsive container and never causes horizontal scroll on a 375px viewport

---
