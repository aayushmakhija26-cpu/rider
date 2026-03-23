# Design System Foundation

## Design System Choice

**shadcn/ui + Tailwind CSS**, built on Next.js + React.

Two distinct visual surfaces, one unified system:
- **Consumer Dashboard** — Light, warm, dealer-branded. Tailwind CSS variables drive per-tenant color theming (dealer primary color, logo placement). shadcn/ui components provide the accessible, minimal base; Tailwind utilities handle the financial card aesthetics inspired by Coin.
- **Dealer Portal** — Clean, data-dense, fixed aesthetic. Supabase-inspired sidebar layout, stat cards, and sortable tables built on shadcn/ui's Table, Card, and Badge components. No per-tenant theming required — consistent professional look across all dealer accounts.

## Rationale for Selection

- **Stack alignment** — Next.js + React + Tailwind is the confirmed frontend stack. shadcn/ui is purpose-built for this combination; zero friction in adoption.
- **Dealer branding flexibility** — Tailwind CSS custom properties (design tokens) make per-tenant color theming straightforward. Dealer primary color, accent, and logo propagate through CSS variables — no component-level overrides required.
- **Component ownership** — shadcn/ui components are copied into the codebase, not imported from a black-box library. Full control over behaviour, styling, and accessibility — critical for a platform that must render correctly across dealer-branded contexts.
- **Coin-style consumer UX** — Tailwind's utility-first approach makes it easy to build the typography-heavy, card-based financial dashboard aesthetic without fighting a pre-opinionated design system.
- **Supabase-style dealer portal** — shadcn/ui's DataTable, Badge, and Card primitives are the exact components that produce the clean admin aesthetic we're targeting.
- **WCAG 2.1 AA compliance** — shadcn/ui components ship with accessible defaults (aria labels, keyboard navigation, focus rings). Accessibility is built in, not retrofitted.

## Implementation Approach

**Consumer Dashboard (mobile-first, dealer-branded):**
- Tailwind CSS variables for dealer theme tokens: `--dealer-primary`, `--dealer-accent`, `--dealer-logo-url`. Set at the layout level from dealer config on each signed URL resolve.
- shadcn/ui Card as the base for every vehicle insight tile. Each tile is a self-contained card with summary-visible and detail-expanded states.
- Tailwind typography scale: Vehicle Value rendered at `text-4xl font-bold`; supporting data at `text-sm text-muted-foreground`. Numbers lead; labels follow.
- Green / red / amber financial states via Tailwind semantic color tokens: `text-emerald-600` (positive equity), `text-red-500` (negative equity), `text-amber-500` (approaching threshold).
- Single-column scrollable layout on mobile; two-column card grid on tablet+.

**Dealer Portal (desktop-primary, fixed aesthetic):**
- shadcn/ui Sidebar for role-scoped navigation. Navigation items rendered conditionally based on user role — Staff sees no Billing or Branding routes.
- shadcn/ui DataTable with TanStack Table for the consumer engagement analytics view. Inline column filtering, sortable headers, row-level status badges.
- shadcn/ui Card for summary stat blocks at the top of analytics pages (total consumers, last campaign open rate, active leads in green zone).
- shadcn/ui Badge for status indicators: DMS sync health, Trade Timer tier, consumer engagement level.
- Light mode default; dark mode optional for dealer portal (Tailwind `dark:` variants available if needed post-MVP).

## Customization Strategy

**Design Tokens (Tailwind theme extension):**
- `dealer`: { primary, accent, foreground } — per-tenant, set via CSS vars
- `equity`: { positive, negative, neutral } — financial state palette
- `status`: { green, amber, red, grey } — system status palette
- `surface`: { card, page, sidebar } — layout surfaces

**Component Extension Pattern:**
- Base shadcn/ui components used as-is for standard interactions (Button, Input, Dialog, Badge, Table)
- Extended variants created for Jupiter-specific components: `VehicleInsightCard`, `TradeTimerGauge`, `LeadScoreRow`, `SyncStatusTimeline`
- Consumer-facing components always accept a `dealerTheme` prop that applies CSS variable overrides at the component root

**Typography:**
- Inter (or Geist) as the primary typeface — clean, legible at all sizes, excellent tabular numeral support for financial data
- Tabular nums enabled via `font-variant-numeric: tabular-nums` on all financial figures to prevent layout shift as values update
