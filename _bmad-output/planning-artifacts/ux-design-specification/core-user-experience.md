# Core User Experience

## Defining Experience

Jupiter's UX lives or dies on two distinct moments of truth:

**Moment 1 — The Consumer Cold Entry.**
A consumer arrives from a dealer-branded email — but the dealer controls the copy, so the quality of the warm-up is unpredictable. The dashboard cannot rely on the email having set expectations. It must be entirely self-evident on arrival: whose car, whose numbers, why it matters — within 3 seconds, on a phone, with no account. This is the make-or-break interaction. Every downstream behavior (repeat visits, account creation, trade inquiry) depends on winning this moment.

**Moment 2 — The Dealer Staff Morning Scan.**
Jordan opens the analytics dashboard at the start of each day and needs to know — in under 30 seconds — which customers are worth a call. This is a daily workflow tool, not a reporting view. It must reward the habit of opening it by immediately surfacing signal over noise.

## Platform Strategy

**Consumer Dashboard:** Mobile-first, touch-optimized. Accessed primarily via email link on a smartphone. No assumptions about account state or session continuity on first visit. Progressive disclosure — the most important data leads; complexity is available but not forced.

**Dealer Admin & Staff Portal:** Desktop-primary, designed for focused seated work (onboarding, analytics review, campaign management). Fully responsive for mobile access, but the primary experience is optimized for a wide-screen context where data density and multi-column layouts are appropriate. Touch interactions should work, but are not the design driver.

## Effortless Interactions

The following must feel completely frictionless — zero cognitive load, zero hesitation:

- **Consumer: arriving at the dashboard** — Vehicle identity (year, make, model, image) and current market value are immediately visible above the fold with no scroll. No login prompt on first entry.
- **Consumer: understanding equity** — Positive or negative equity must be communicated through color and plain language before a number is read. Green = good. Red = not yet.
- **Consumer: converting to an account** — When the signed URL expires, the upgrade prompt must feel like a natural continuation ("Keep tracking [Vehicle]") not a forced registration wall.
- **Dealer Staff: identifying hot leads** — Filtering to trade-ready, high-engagement consumers must be a single interaction, not a multi-step report configuration.
- **Dealer Admin: activating the first campaign** — After branding and DMS setup, the path to "first campaign scheduled" should feel like pressing a single confident button, not approving a complex configuration.

## Critical Success Moments

| User | Make-or-Break Moment | What Success Looks Like |
|---|---|---|
| Consumer | First dashboard view (cold entry) | Immediately sees their vehicle and a number that feels personal and credible |
| Consumer | Signed URL expiry | Chooses to create an account rather than abandoning |
| Dealer Admin | Completing onboarding | Activates first campaign with confidence in under 30 minutes |
| Dealer Staff | Morning analytics scan | Identifies 1–3 actionable leads without needing to configure filters |
| Jupiter SysAdmin | Diagnosing a DMS failure | Finds root cause in audit log within 2 minutes |

## Experience Principles

1. **Data before identity** — The consumer sees their vehicle data before they are ever asked for an account. Trust is earned before it is requested.
2. **Vehicle Value anchors everything** — Current market value is the first number a consumer reads. All other tiles (equity, payoff, trade readiness) are framed relative to it. Clarity of value creates the foundation for every other insight.
3. **Signal over noise for dealers** — The dealer-side UX surfaces actionable signals (hot leads, campaign performance, sync health) prominently. Detailed data is available, but never leads.
4. **The dealer brand is the only brand consumers see** — Jupiter's identity is invisible to consumers. Every consumer-facing surface reflects dealer branding: logo, colors, tone. Jupiter operates as infrastructure, not a product.
5. **Effortless first, configurable second** — Every user's first interaction with any part of the platform must work without configuration, training, or documentation. Power features exist, but never block the primary path.
