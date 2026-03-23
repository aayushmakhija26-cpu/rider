# Design Direction Decision

## Design Directions Explored

Six directions were explored across both consumer dashboard and dealer portal surfaces:

- **A — Financial Trust**: Coin-inspired cards, dark sidebar portal
- **B — Bold Hero**: Full-width vehicle image hero with value overlay
- **C — Minimal Data**: Ultra-sparse, whitespace-heavy, typography-first
- **D — Warm Welcome**: Friendly copy, soft gradients, conversational tone
- **E — Command Center**: Dense dark metrics bar, power-user analytics table
- **F — Sales Ready**: Explicit priority tiers (Call today / this week / monitor)

## Chosen Direction

**Consumer Dashboard: Bold Hero + Minimal Data (B + C)**

The consumer experience opens with Direction B's full-width vehicle hero — dealer logo, vehicle image or illustration, and the market value as a large overlay on a dark gradient. This is the "positive surprise" moment: dramatic, personal, immediate. Below the hero fold, the tile layout adopts Direction C's minimal, typographic approach — generous whitespace, numbers leading, labels restrained. The drama is concentrated at the top; the data breathes below.

**Dealer Portal: Minimal Data + Inline Page Stats (C + adapted E)**

The dealer portal adopts Direction C's clean, typographic restraint throughout — white sidebar, no heavy cards, borders and typography as the primary design tools. The Command Center's need for at-a-glance metrics is addressed without stat boxes: the two most important numbers (green zone count + campaign open rate) appear right-aligned in the page title row, on the same line as the page heading. No added layout height, no visual ceremony.

```
Analytics                    12 in green zone  ·  34% open rate
```

The remaining metrics (total active consumers, Jupiter-attributed leads) are available in the table itself or as column summaries — present when needed, never dominating the layout.

## Design Rationale

**Consumer (B + C):**
- The Bold Hero concentrates the "positive surprise" emotional impact at the single most important moment — the first 3 seconds of cold entry. The vehicle visual and value overlay make the dashboard feel personal and credible before any scrolling.
- Minimal Data below the hero ensures the financial tiles don't compete with each other. Each number has room to be read. The sparse layout reinforces credibility — it feels like a trusted source, not a marketing page.
- The contrast between the dramatic hero and the calm data below creates a natural visual rhythm: arrive with impact, explore with ease.

**Dealer Portal (C + inline stats):**
- Direction C's clean aesthetic aligns with the "quiet control" emotional target — the portal feels professional and uncluttered, never overwhelming.
- Four stat boxes in a grid create layout weight disproportionate to the information they carry. Two numbers right-aligned in the title row delivers the same morning scan value with zero added vertical space.
- The table starts immediately — Jordan's eyes go directly to the leads.

## Implementation Notes

**Consumer dashboard composition:**
- Hero: full-width dark gradient, dealer logo top-left, vehicle year/make/model and `$VALUE` as dominant overlay text. Value at `text-4xl font-bold`.
- Below the fold: Direction C typographic layout — section dividers, left-right paired values, progress bar for Trade Timer, inline recall alert.
- Account creation CTA: minimal text link at page bottom, never a modal or interrupt.

**Dealer portal composition:**
- Sidebar: white background, typographic nav, role-scoped visibility.
- Page header: title left-aligned, 2 key metrics right-aligned in `text-sm text-muted-foreground`. Separated by a `·` divider. Updates on data refresh.
- Table: full-width, pre-sorted by engagement signal (Trade Timer + visit count), TanStack Table via shadcn/ui DataTable. Begins immediately below the title row.
- No stat card grid. No dark metrics bar. Borders and color alone create structure.
