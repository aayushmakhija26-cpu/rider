# Component Strategy

## Design System Components

The following shadcn/ui components are used as-is with no custom extension.

| Component | Usage |
|---|---|
| `Button` | All CTAs — campaign activation, service booking, account creation, form submission |
| `Input` / `Form` | Registration, branding setup, VIN entry, DMS credentials |
| `Dialog` / `Sheet` | Confirmation dialogs (campaign activation, re-sync trigger), mobile filter drawers |
| `Badge` | Trade Timer status (Green / Amber / Red), DMS sync health, role labels |
| `Separator` | Section dividers on consumer dashboard tiles |
| `Avatar` | Consumer initials in analytics table rows |
| `DataTable` (TanStack) | Dealer analytics consumer table — sortable, filterable, pre-sorted |
| `Sidebar` | Dealer portal navigation — role-scoped, white background |
| `Sonner` (Toast) | Non-critical system notifications (sync complete, campaign scheduled) |
| `DropdownMenu` | Table row actions, user account menu |
| `Skeleton` | Loading states for dashboard tiles and table rows |

## Custom Components

### `VehicleHeroSection`

**Purpose:** The defining first-impression moment of the consumer dashboard. Renders the dealer brand, vehicle identity, and market value as the dominant visual above the fold.

**Anatomy:**
- Full-width container with dark gradient background (`bg-gradient-to-b from-slate-900 to-slate-800`)
- Top-left: dealer logo (from `--dealer-logo`) + dealership name
- Centre/bottom: vehicle year, make, model in `text-sm text-white/70`
- Market value in `text-4xl font-bold text-white font-tabular`
- Value delta badge: `↑ $1,200 this month` in emerald or red depending on direction
- Attribution caption: `Valued by JD Power` in `text-xs text-white/50`

**States:** `loading`, `default`, `no-image`, `stale-data`

**Props:** `dealerLogo`, `dealerName`, `vehicleYear`, `vehicleMake`, `vehicleModel`, `marketValue`, `valueDelta`, `valuationSource`, `isLoading`, `isStale`

**Accessibility:** `role="banner"`, vehicle identity as `aria-label`, value as `aria-live="polite"` for data refresh updates

---

### `VehicleInsightTile`

**Purpose:** Reusable tile for each data insight below the hero (Equity, Payoff, Trade Timer, Recall, Insurance, Warranty). Supports expandable detail state.

**Anatomy:**
- Container: full-width, `border-b border-slate-100`, `py-5 px-0` — no card box, pure typographic layout
- Label: `text-xs text-slate-400 uppercase tracking-wide`
- Primary value: `text-2xl font-bold font-tabular` with colour variant
- Supporting text: `text-xs text-slate-400 mt-0.5`
- Expand affordance: chevron right, rotates to down when expanded
- Expanded state: 24-month trend chart (Recharts) + plain-language summary

**States:** `default`, `expanded`, `positive`, `negative`, `neutral`, `loading`, `unavailable`

**Variants:** `equity`, `payoff`, `tradeTimer`, `recall`, `insurance`, `warranty`

**Accessibility:** `role="region"`, `aria-label` per tile type, expand button with `aria-expanded`

---

### `TradeTimerIndicator`

**Purpose:** Communicates trade readiness as plain language with colour — no gauge, no arc, no percentage score.

**Anatomy:**
- Status line: coloured dot + primary text
  - Green: `● Optimal window in 47 days`
  - Amber: `● Approaching optimal window in 68 days`
  - Red: `● Not yet in trade window · Est. 94 days`
- Supporting text: `text-xs text-slate-400` — "Based on depreciation, payoff, and market seasonality"

**States:** `green`, `amber`, `red`, `loading`

**Rationale:** Text-only treatment aligns with the Minimal Data direction. The colour dot provides immediate state recognition; the plain English sentence provides the insight without requiring users to interpret a visual metaphor.

**Accessibility:** Status communicated via `aria-label` on the container — screen readers read the full sentence, not the colour

---

### `RecallAlertTile`

**Purpose:** Surfaces active NHTSA recalls with a service booking CTA. Hidden when no recall exists.

**Anatomy:**
- Container: `bg-amber-50 border border-amber-200 rounded-xl px-4 py-3`
- Icon: amber warning symbol (left-aligned)
- Recall title: `text-sm font-semibold text-amber-800`
- Recall description: `text-xs text-amber-600`
- Book service CTA: text button `→ Book a service appointment` in `text-blue-600`

**States:** `active` (shown), `hidden` (returns null), `loading` (hidden until resolved)

**Accessibility:** `role="alert"`, `aria-label="Active vehicle recall"` on the icon

---

### `DealerThemeProvider`

**Purpose:** Injects per-tenant dealer CSS variables at the layout level for the consumer dashboard.

**Behaviour:**
- Sets `--dealer-primary`, `--dealer-accent`, `--dealer-foreground`, `--dealer-logo` on the root element
- Falls back to Jupiter blue (`#2563EB`) if dealer has not configured branding
- `--dealer-foreground` auto-calculated for WCAG AA contrast against `--dealer-primary`
- Applied once at `ConsumerDashboardLayout` level — all child components inherit

---

### `SyncStatusTimeline`

**Purpose:** Priya's primary diagnostic tool. Renders DMS sync events as a chronological timeline with status indicators and root cause hints.

**Anatomy:**
- Vertical event list, newest first
- Each event: timestamp + event type + status badge + expandable detail
- Status badges: `Success` (emerald), `Failed` (red), `In Progress` (blue), `Pending` (slate)
- Expanded event: root cause text, affected record IDs, duration, retry status
- Manual re-sync CTA: inline on failed events, triggers confirmation dialog before executing

**States:** `healthy`, `failed`, `in-progress`, `empty`

**Accessibility:** `role="log"`, `aria-live="polite"` for real-time updates during active sync

---

### `OnboardingChecklist`

**Purpose:** Sandra's step-by-step onboarding progress tracker. Each step is independently completable, resumable, and skippable.

**Anatomy:**
- Vertical step list with numbered indicators
- Step states: pending (grey), active (blue, expanded), complete (emerald), skipped (slate italic)
- Active step renders content inline — no modal or page navigation
- Completion state: all steps green + "First campaign scheduled" confirmation

**Accessibility:** `role="list"`, `aria-current="step"` on the active item

---

## Component Implementation Strategy

**Ownership:** Custom components in `src/components/jupiter/`, shadcn/ui components in `src/components/ui/`. Jupiter components import from `ui/` but never pollute it.

**Theming contract:**
- Consumer-facing components consume `--dealer-primary` and `--dealer-accent` CSS variables
- Dealer portal components use fixed Jupiter tokens only — no dealer theming
- Financial state colours are fixed semantic tokens — never overridden by dealer theming

**Testing requirements:**
- `DealerThemeProvider` must be tested with edge-case dealer colours to validate contrast auto-correction
- `TradeTimerIndicator` must be screen-reader tested to confirm text-only approach is fully accessible
- `RecallAlertTile` must be tested in the hidden state to confirm no empty placeholder renders

## Implementation Roadmap

**Phase 1 — Consumer Dashboard (MVP Critical):**
- `DealerThemeProvider` — required before any consumer component renders
- `VehicleHeroSection` — highest priority, the defining first impression
- `VehicleInsightTile` — all consumer data tiles depend on this
- `TradeTimerIndicator` — rendered inside `VehicleInsightTile` variant
- `RecallAlertTile` — consumer safety signal, required for MVP

**Phase 2 — Dealer Portal (MVP Critical):**
- `OnboardingChecklist` — Sandra cannot complete onboarding without this
- `SyncStatusTimeline` — Priya cannot diagnose DMS failures without this
- shadcn/ui `DataTable` configuration — Jordan's morning scan depends on correct default sort

**Phase 3 — Enhancement (Post-MVP):**
- `VehicleInsightTile` expanded state with Recharts trend chart
- Insurance and warranty tile variants of `VehicleInsightTile`
- Advanced filtering UI on the dealer analytics DataTable
