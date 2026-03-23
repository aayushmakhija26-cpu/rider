# UX Pattern Analysis & Inspiration

## Inspiring Products Analysis

**Coin by Zerodha — Consumer Dashboard Reference**

Coin is one of India's most respected financial UX products precisely because it makes complex investment data feel approachable and personal. The patterns that make it relevant for Jupiter's consumer dashboard:

- **Color as a financial language** — Green and red are used with discipline and consistency to communicate gain vs. loss at a glance. Users don't read numbers first; they read color first. This is the exact model for Jupiter's equity and Trade Timer tiles.
- **Card-based progressive disclosure** — Each holding is a card. Summary on the surface, detail on tap. Users get the answer they need at the summary level; depth is available but never forced. This maps directly to Jupiter's tile architecture (Value → Equity → Payoff → Trade Timer → Recall).
- **Numbers as heroes** — Typography hierarchy is ruthless: the most important number is the largest thing on the screen. Supporting data is visibly smaller. Jupiter's Vehicle Value should dominate the first screen the same way a portfolio total dominates Coin's home screen.
- **Minimal chrome, maximum data** — No heavy navigation, no sidebars, no competing UI elements. The product steps out of the way and lets the financial data breathe.
- **Trust through attribution** — Data sources and timestamps are visible but unobtrusive. They don't overwhelm — they reassure. Jupiter should show "Valued by JD Power" the way Coin shows exchange data attribution.

**Supabase — Dealer Portal Reference**

Supabase has set a new standard for what developer and admin tools feel like. Clean, data-dense, but never oppressive. The patterns relevant to Jupiter's dealer portal:

- **Table-first data views** — Sortable, filterable tables are the primary content pattern. Data is always accessible, never buried. Jordan's analytics view should feel like a Supabase table — clear columns, quick filtering, immediate readability.
- **Status indicators that communicate instantly** — Green dots, colored badges, and status chips mean a user never has to read a paragraph to understand system health. DMS sync status, campaign health, and consumer engagement tiers should all use this pattern.
- **Summary cards above data tables** — Key metrics (total consumers, last campaign open rate, active leads) live in stat cards at the top of the page. The table below provides the detail. Dealers scan the cards first; they drill into the table when they need to.
- **Clean empty states with purposeful CTAs** — When there's nothing yet (no campaign sent, no consumers synced), Supabase shows a clean empty state with a clear next action. Jupiter's onboarding flow should use this pattern — every empty state is a guided next step, not a blank screen.
- **Sidebar navigation with role-aware visibility** — Navigation items appear only for the roles that have access to them. Dealer Staff simply don't see Billing or Branding — the navigation reflects their reality, reducing cognitive load.

## Transferable UX Patterns

**Navigation Patterns:**
- **Sidebar nav (dealer portal)** — Role-scoped, clean, Supabase-style. Items visible only to the roles that own them. No greyed-out items that create confusion.
- **Tab-less consumer dashboard** — Single scrollable page, no bottom tab bar. Cards stack vertically; the scroll is the navigation. Coin-style.

**Interaction Patterns:**
- **Card tap to detail expansion** — Consumer tiles are cards. Tapping a tile expands detail (e.g., tapping Vehicle Value shows the 24-month trend chart). Summary always visible; depth always accessible.
- **Single-action campaign activation** — After setup, activating a campaign is one prominent button with a confirmation state. No multi-step wizard at the moment of launch.
- **Inline filtering on analytics tables** — Jordan filters the lead table inline (Trade Timer: Green, Visits: 2+) without leaving the page or opening a modal.

**Visual Patterns:**
- **Green / red / amber for financial states** — Borrowed from Coin. Green = positive equity, trade-ready. Red = negative equity, not yet. Amber = approaching threshold.
- **Stat cards + table layout for dealer analytics** — Borrowed from Supabase. Top of page: summary numbers. Below: the full data table with filtering.
- **Tabular numerals** — Financial figures (equity, payoff, market value) use tabular number rendering so columns align and digits don't shift width on update.

## Anti-Patterns to Avoid

- **Login gate before data** — Forcing account creation before showing the consumer their vehicle data kills the positive surprise moment. Never add a login wall on first entry.
- **Dashboard overload on first view** — Showing all tiles simultaneously with equal visual weight overwhelms and dilutes. Vehicle Value must lead; secondary tiles follow in a clear hierarchy.
- **Dealer CRM aesthetics** — Legacy automotive CRM tools are notorious for dense, cluttered interfaces with poor hierarchy. Jupiter's dealer portal should feel nothing like them.
- **Error states that alarm** — Red banners, warning triangles, and "Error:" prefixes on consumer-facing content destroy trust. Graceful degradation and soft language are non-negotiable.
- **Generic charts without context** — A 24-month trend line with no annotation is data without insight. Charts should be accompanied by a single plain-language summary sentence.

## Design Inspiration Strategy

**What to Adopt directly:**
- Coin's card-based tile architecture and color-as-financial-language system for the consumer dashboard
- Supabase's stat card + sortable table layout for dealer analytics
- Supabase's role-scoped sidebar navigation for the dealer portal
- Both products' minimal chrome philosophy — UI steps aside; content leads

**What to Adapt for Jupiter:**
- Coin's portfolio card pattern → adapted into Jupiter's vehicle insight tiles (same progressive disclosure, but the asset is a single vehicle, not a portfolio)
- Supabase's empty state + CTA pattern → adapted into Jupiter's onboarding steps (each incomplete setup stage shows a purposeful next action, not a blank screen)
- Supabase's status badge system → adapted for consumer engagement tiers in the lead table (Trade Timer: green badge, Visit count: numeric badge)

**What to Reject entirely:**
- Supabase's dark-mode-first aesthetic for the consumer dashboard — Jupiter's consumer experience should be light, warm, and dealer-branded. Dark mode suits the dealer portal but not the consumer's vehicle insight view.
- Any pattern that gates value behind account creation. The signed URL flow exists precisely to skip this friction.
