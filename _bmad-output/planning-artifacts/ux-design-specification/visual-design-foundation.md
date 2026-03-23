# Visual Design Foundation

## Color System

Jupiter's brand palette of blue, green, and white maps directly onto the two surfaces and the financial state language established in our emotional design principles.

**Jupiter Brand Palette (Dealer Portal):**

| Token | Value | Usage |
|---|---|---|
| `--jupiter-blue` | `#2563EB` (blue-600) | Primary actions, navigation active state, links |
| `--jupiter-blue-light` | `#EFF6FF` (blue-50) | Sidebar background, stat card backgrounds |
| `--jupiter-blue-dark` | `#1E40AF` (blue-800) | Hover states, pressed states |
| `--jupiter-green` | `#059669` (emerald-600) | Success states, active badges, positive indicators |
| `--jupiter-green-light` | `#ECFDF5` (emerald-50) | Success tile backgrounds, green zone highlights |
| `--surface-white` | `#FFFFFF` | Page background, card surfaces |
| `--surface-muted` | `#F8FAFC` (slate-50) | Table row alternates, input backgrounds |
| `--border` | `#E2E8F0` (slate-200) | Card borders, table dividers, input outlines |
| `--text-primary` | `#0F172A` (slate-900) | Body text, headings |
| `--text-muted` | `#64748B` (slate-500) | Supporting labels, metadata, timestamps |

**Financial State Palette (Consumer Dashboard + Dealer Analytics):**

| State | Color | Token | Usage |
|---|---|---|---|
| Positive equity / Trade-ready | `#059669` | `equity-positive` | Green tile border, positive equity value, Trade Timer green badge |
| Negative equity / Not yet | `#EF4444` | `equity-negative` | Red tile border, negative equity value |
| Approaching threshold | `#F59E0B` | `equity-approaching` | Amber badge, Trade Timer amber zone |
| Neutral / No data | `#94A3B8` | `equity-neutral` | Greyed tile, data pending state |

The financial state palette is fixed across all tenants — these colors are universal financial conventions that consumers read instinctively. They are never overridden by dealer theming.

**Per-Tenant Dealer Theming (Consumer Dashboard):**

| Token | Source | Usage |
|---|---|---|
| `--dealer-primary` | Dealer config | Hero section background, CTA button color, link color |
| `--dealer-accent` | Dealer config | Secondary interactive elements, highlight borders |
| `--dealer-foreground` | Auto-derived | Text on dealer primary (white or dark, calculated for contrast) |
| `--dealer-logo` | Dealer config | Logo URL, rendered in header of consumer dashboard |

Jupiter's blue is used as the default `--dealer-primary` for any dealer that has not configured custom branding — ensuring the consumer dashboard always renders correctly even before branding setup is complete.

## Typography System

**Primary Typeface: Inter** (with Geist as fallback for Next.js projects)

Inter is the de facto standard for clean, legible SaaS and financial interfaces. Its tabular numeral support is essential for Jupiter's financial figures — digits maintain consistent width as values update, preventing layout shift.

**Type Scale:**

| Level | Size / Weight | Usage |
|---|---|---|
| Display | `text-4xl font-bold` (36px) | Vehicle Value on consumer dashboard — the hero number |
| H1 | `text-2xl font-semibold` (24px) | Page titles, section headers |
| H2 | `text-xl font-semibold` (20px) | Card titles, tile headers |
| H3 | `text-base font-semibold` (16px) | Sub-section labels, stat card values |
| Body | `text-sm` (14px) | Supporting text, table cell content |
| Caption | `text-xs text-muted-foreground` (12px) | Data attribution ("Valued by JD Power"), timestamps, footnotes |

**Tabular Numerals:**
All financial figures (Vehicle Value, Equity, Payoff, loan amounts) apply `font-variant-numeric: tabular-nums` to ensure column alignment and prevent visual jitter as cached values refresh.

**Tone:**
The typography system is intentionally neutral and legible — the data is the personality, not the font. Inter's clean geometry supports both the "trusted financial tool" consumer feel and the "professional admin portal" dealer feel without needing a secondary display face.

## Spacing & Layout Foundation

**Base Unit: 4px** (Tailwind's default spacing scale)

A 4px base unit provides enough granularity for tight data-dense layouts (dealer tables) and spacious card layouts (consumer dashboard) from the same system.

**Consumer Dashboard Layout:**
- Single-column on mobile (`max-w-screen-sm`, padded `px-4`)
- Two-column card grid on tablet+ (`grid-cols-2 gap-4`)
- Card internal padding: `p-4` (16px) on mobile, `p-6` (24px) on tablet+
- Tile spacing: `space-y-4` (16px gap between stacked cards)
- Generous whitespace — cards breathe; nothing feels cramped
- Vehicle hero section: full-width, `pb-6` separation from first tile

**Dealer Portal Layout:**
- Fixed sidebar: `w-64` (256px), full viewport height
- Main content area: fluid, `px-6 py-6` internal padding
- Stat cards row: `grid-cols-4 gap-4` on desktop, `grid-cols-2` on tablet
- Table: full width, `text-sm`, row height `h-12` (48px) for comfortable scanning
- Data density calibrated to desktop — efficient but not cramped

**Elevation & Depth:**
- Cards: `shadow-sm` — subtle, not dramatic
- Modals / Dialogs: `shadow-lg` — clearly floating
- Sidebar: `border-r border-slate-200` — division without shadow
- No heavy drop shadows — the aesthetic is flat with gentle structure

## Accessibility Considerations

- **Contrast** — All text/background combinations target WCAG 2.1 AA (4.5:1 for body, 3:1 for large text). Jupiter blue on white: 4.6:1 ✓. Emerald-600 on white: 4.5:1 ✓.
- **Color alone is never the only signal** — Financial states (green/red/amber) are always paired with a text label or icon. A colorblind consumer can still read "Positive equity" without relying on green alone.
- **Focus rings** — shadcn/ui's default focus rings retained and visible on all interactive elements. Never removed for aesthetic reasons.
- **Font size floor** — `text-xs` (12px) is the minimum used for any content a user needs to act on. Attribution captions at 12px are informational only.
- **Touch targets** — All tappable elements on the consumer dashboard meet the 44×44px minimum touch target size on mobile.
