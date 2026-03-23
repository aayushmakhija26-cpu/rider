# Defining Core Experience

## Defining Experience

Jupiter has two co-equal defining experiences — one for each side of the platform. Neither works without the other, and both must be executed with the same level of craft.

**Consumer: "I didn't know I could know this."**
> Open an email from your dealer, tap once, and instantly see what your car is worth — no account, no login, no sales pitch.

The consumer arrives cold. The dashboard has one job: make them feel like they just discovered something genuinely useful about their own vehicle, without ever feeling like they were sold to. If this moment lands, everything else follows — the return visit, the account creation, the trade inquiry. If it doesn't, nothing downstream matters.

**Dealer Staff: "I know who to call before my competition does."**
> Open the analytics dashboard first thing in the morning and immediately see which customers are approaching their trade window — no configuration, no report setup, no digging.

Jordan arrives with a purpose: identify the warm leads and move. The analytics view has one job: surface the shortlist before he has to ask for it. If the right names are visible within 30 seconds of opening, Jupiter becomes a daily habit. If it requires effort to find the signal, it becomes a tool that gets checked once a month.

## User Mental Model

**Consumer Mental Model:**
Consumers have no existing mental model for a dealer-branded vehicle insight dashboard — this is a new category. What they do bring is a mental model from financial apps:
- "Numbers in green mean good. Red means bad."
- "My portfolio value is the first thing I see."
- "I can tap a card to see more detail."
- "Data this personal should be trustworthy — I want to know where it comes from."

The UX must meet these borrowed expectations exactly. Fighting the financial app mental model would require user education Jupiter cannot afford. Working with it makes the dashboard instantly legible to anyone who has ever opened a banking or investment app.

**Dealer Staff Mental Model:**
Jordan's mental model comes from CRM and sales tools — but his frustration with those tools is well-documented. He expects:
- "The important stuff is buried and I have to configure it."
- "I'll need to run a report or apply filters to find hot leads."
- "This will take longer than I want it to."

Jupiter's opportunity is to shatter this expectation. The default view should already show him what he needs. No filter setup. No report wizard. The shortlist is the default state, not the result of effort.

## Success Criteria

**Consumer dashboard cold-entry is successful when:**
- Vehicle is identified (year, make, model) above the fold within 1 second of load
- Current market value is the dominant visual element — largest number on screen
- Consumer does not need to scroll to understand that the data is about their car
- No login prompt appears before any data is shown
- Consumer scrolls down voluntarily (curiosity, not instruction)
- Consumer returns to the URL within 7 days without a second email prompt

**Dealer staff morning scan is successful when:**
- Page load to "I know who to call" takes under 30 seconds
- High-intent consumers are visible in the default view without filter configuration
- Trade Timer status and recent visit count are visible at the row level — no click required
- Jordan can identify 1–3 names worth calling before his first coffee is finished
- He opens it again tomorrow without being asked

## Novel vs. Established Patterns

**Consumer Dashboard — Familiar patterns, novel context:**
The consumer dashboard uses entirely familiar UX patterns (financial card layout, color-coded status, progressive disclosure). The novelty is not the interaction design — it's the content. Consumers have never received this data from their dealer before. The UX deliberately uses established patterns to make novel content feel immediately trustworthy and legible. No user education required.

The one genuinely novel element is the **Trade Timer** — a readiness signal with no direct analogue in consumer finance apps. The UX approach: frame it as a countdown-style indicator (familiar from countdowns, progress bars, and timers in other contexts) rather than an abstract score. "You enter your optimal trade window in 47 days" is concrete and readable. "Trade Readiness: 73%" is not.

**Dealer Staff Analytics — Familiar patterns, raised expectations:**
The analytics view uses established data table and dashboard patterns (Supabase, Linear, Notion databases). The innovation is in the defaults — pre-sorted by engagement signal, pre-filtered to active consumers, Trade Timer status visible at the row level without drilling in. The pattern is familiar; the effort saved is the differentiator.

## Experience Mechanics

**Consumer Cold-Entry Flow:**

1. **Initiation** — Consumer taps email CTA. Signed URL resolves. No redirect, no splash screen, no loading skeleton that looks broken. Dealer logo and brand color appear within the first paint.

2. **Interaction** — Single scrollable page. Vehicle hero section (image, year, make, model) loads first. Vehicle Value tile renders immediately below with the current market value as the dominant number. Supporting tiles (Equity, Payoff, Trade Timer, Recall) stack below in priority order. Each tile is a card — tappable for detail, readable at summary level.

3. **Feedback** — Color communicates state before numbers are read. Equity tile: green border + positive number = immediately understood. Trade Timer: progress arc or countdown text = instantly scannable. Recall tile: amber badge if active recall exists = draws attention without alarming.

4. **Completion** — No explicit completion state. The consumer has learned what their car is worth. The next step surfaces naturally: "Want to keep tracking this?" (account creation CTA) appears as a soft prompt after they've scrolled past the core tiles — earned, not forced.

**Dealer Staff Morning Scan Flow:**

1. **Initiation** — Jordan opens the dealer portal and navigates to the Analytics view (or it is the default landing page post-login). No configuration required.

2. **Interaction** — Default view: stat cards at top (total active consumers, last campaign open rate, consumers in green Trade Timer zone). Below: consumer table pre-sorted by engagement score (Trade Timer status + recent visits). Top rows are the warmest leads. Jordan reads down the list.

3. **Feedback** — Each row shows: consumer name, vehicle, Trade Timer badge (Green / Amber / Red), dashboard visits in last 30 days, last visit date. A green Trade Timer badge + 2+ recent visits = call this person today. No calculation required — the signal is composed at the row level.

4. **Completion** — Jordan identifies his shortlist, flags or notes the names (or picks up the phone directly). The scan is complete. The interaction took under 30 seconds. He will do it again tomorrow.
