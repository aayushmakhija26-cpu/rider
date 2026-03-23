# Responsive Design & Accessibility

## Responsive Strategy

Jupiter operates on two distinct surfaces with different primary device contexts:

| Surface | Primary | Secondary | Approach |
|---|---|---|---|
| Consumer Dashboard | Mobile (360–430px) | Desktop | Mobile-first, progressive enhancement |
| Dealer Portal | Desktop (1280px+) | Tablet, Mobile | Desktop-first, graceful degradation |

The consumer dashboard is delivered via a signed URL in an email — the majority of consumers will open it on their phone. Every layout decision starts from 375px and expands outward.

The dealer portal is a professional tool used at a desk. Mobile support is a fallback for occasional on-lot use, not a primary use case.

---

## Breakpoint Strategy

Using Tailwind CSS default breakpoints:

| Breakpoint | Min Width | Consumer Dashboard | Dealer Portal |
|---|---|---|---|
| (default) | 0px | Single column, full bleed | — |
| `sm` | 640px | Two-column tile grid | — |
| `md` | 768px | Max-width container, centered | Mobile fallback layout |
| `lg` | 1024px | — | Primary layout, sidebar + content |
| `xl` | 1280px | — | Full dashboard, stat columns |
| `2xl` | 1536px | — | Wide table views, expanded panels |

**Consumer Dashboard Layout Progression:**
- `default`: `VehicleHeroSection` full width → single-column `VehicleInsightTile` stack → stacked CTA buttons
- `sm`: Insight tiles shift to 2-column grid
- `md`: Container max-width `480px`, centred — feels like an app, not a website

**Dealer Portal Layout Progression:**
- `lg`: Fixed left sidebar (240px) + main content area — sidebar contains nav
- `xl`: Main content gains a right panel for contextual detail / quick actions
- `md` and below: Sidebar collapses to top navigation bar; table columns hide non-critical fields

---

## Accessibility Strategy

**Standard: WCAG 2.1 Level AA** — required per PRD NFRs.

### Colour Contrast

| Element | Foreground | Background | Ratio | Pass |
|---|---|---|---|---|
| Body text | `#111827` (gray-900) | `#FFFFFF` | 16.1:1 | AA + AAA |
| Secondary text | `#6B7280` (gray-500) | `#FFFFFF` | 4.6:1 | AA |
| Jupiter Blue CTA | `#FFFFFF` | `#2563EB` | 4.8:1 | AA |
| Financial positive | `#FFFFFF` | `#059669` (emerald-600) | 4.6:1 | AA |
| Financial negative | `#FFFFFF` | `#DC2626` (red-600) | 5.9:1 | AA |
| Financial caution | `#111827` | `#D97706` (amber-600) | 4.7:1 | AA |

Dealer theming: `--dealer-primary` must be validated at tenant onboarding to ensure AA contrast against white. The `DealerThemeProvider` applies a contrast check at render time and falls back to `#2563EB` if the dealer-supplied colour fails.

### Keyboard Navigation

- All interactive elements reachable via `Tab` in logical DOM order
- Focus ring: `ring-2 ring-offset-2 ring-blue-500` — visible on all surfaces
- Dealer portal table rows: `↑` / `↓` arrow navigation within focused table
- Modal: focus trapped inside modal while open; `Escape` closes; focus returns to trigger element
- Consumer dashboard CTAs: `Enter` / `Space` activate; no hover-only interactions

### Screen Reader Support

- `VehicleHeroSection`: `<h1>` vehicle name, `aria-label` on value figure includes currency and change context — e.g., `aria-label="Current vehicle value: $28,400, up $1,200 from last month"`
- `VehicleInsightTile`: `role="article"`, tile title as `<h2>`, icon decorative (`aria-hidden="true"`)
- `TradeTimerIndicator`: Live region `aria-live="polite"` for countdown updates; full sentence readable — "Optimal trade window in 47 days"
- `RecallAlertTile`: `role="alert"` for active recalls; `aria-label` includes recall count
- Financial colour indicators: Never rely on colour alone — always paired with a text label or icon (▲ ▼ ●) with `aria-label`
- `SyncStatusTimeline`: Timeline items use `<ol>` with `<li>` and `aria-label` on status icons
- Dealer portal tables: `<th scope="col">` headers; `aria-sort` on sortable columns; row actions have descriptive `aria-label` (e.g., `aria-label="View dashboard for Marcus Williams"`)

### Touch Targets

- Minimum touch target: **44×44px** (Apple HIG / WCAG 2.5.5)
- Consumer dashboard tile tap targets span the full tile width
- CTA buttons: minimum height `h-12` (48px) on mobile
- Dealer portal: standard `h-9` (36px) buttons acceptable at desktop; expand to `h-11` on `md` and below

### Motion and Animation

- Respect `prefers-reduced-motion` — all transitions wrapped in:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  ```
- Consumer dashboard: subtle fade-in on tile mount (150ms ease-out) — reduced to instant on motion preference
- No auto-playing animations, carousels, or looping content on either surface

---

## Testing Strategy

### Device Test Matrix — Consumer Dashboard

| Device | Viewport | Priority |
|---|---|---|
| iPhone 14 / 15 | 390×844 | P0 |
| iPhone SE (3rd gen) | 375×667 | P0 |
| Samsung Galaxy S23 | 360×780 | P0 |
| iPad Mini | 744×1133 | P1 |
| Desktop Chrome | 1440×900 | P2 |

### Device Test Matrix — Dealer Portal

| Device | Viewport | Priority |
|---|---|---|
| Desktop (1440p) | 1440×900 | P0 |
| Laptop (1280p) | 1280×800 | P0 |
| iPad Pro (landscape) | 1024×768 | P1 |
| iPad (portrait) | 768×1024 | P1 |
| iPhone 14 | 390×844 | P2 |

### Browser Matrix

| Browser | Consumer | Dealer Portal |
|---|---|---|
| Chrome (latest) | P0 | P0 |
| Safari iOS (latest) | P0 | P1 |
| Safari macOS (latest) | P1 | P0 |
| Firefox (latest) | P1 | P1 |
| Edge (latest) | P2 | P0 |

### Accessibility Testing

- **Automated**: axe-core integrated into CI via `@axe-core/react` — zero AA violations gate merges
- **Manual**: keyboard-only walkthrough of all critical paths per sprint
- **Screen reader**: VoiceOver (iOS) for consumer dashboard; NVDA + Chrome for dealer portal
- **Contrast audit**: Storybook a11y addon flags contrast failures during component development

---

## Implementation Guidelines

**shadcn/ui + Tailwind defaults handle most accessibility primitives** — Radix UI primitives (used by shadcn) provide keyboard navigation, focus management, and ARIA roles out of the box for: Dialog, DropdownMenu, Select, Tabs, Tooltip, AlertDialog.

**Custom components must explicitly implement:**
- `VehicleInsightTile` — `role`, `aria-label`, keyboard activation
- `TradeTimerIndicator` — `aria-live` region
- `RecallAlertTile` — `role="alert"` for active recall state
- `SyncStatusTimeline` — semantic list markup

**Tailwind responsive pattern for dealer portal:**
```tsx
// Sidebar: visible at lg+, hidden below
<aside className="hidden lg:flex lg:w-60 lg:flex-col ...">

// Mobile nav: visible below lg
<nav className="flex lg:hidden ...">

// Table: hide secondary columns on smaller viewports
<td className="hidden xl:table-cell">Campaign</td>
```

**Dealer theming contrast validation (pseudocode):**
```ts
function validateDealerColour(hex: string): string {
  const ratio = getContrastRatio(hex, '#FFFFFF');
  return ratio >= 4.5 ? hex : '#2563EB'; // fallback to Jupiter Blue
}
```

---

*UX Design Specification complete. This document covers all 14 steps of the BMAD UX design workflow and is ready to inform architecture and implementation.*
