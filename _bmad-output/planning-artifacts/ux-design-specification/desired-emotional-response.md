# Desired Emotional Response

## Primary Emotional Goals

**Consumer — Positive Surprise.**
The consumer should feel like they've just discovered something genuinely useful that they didn't know existed. Not "I was sold to." Not "my dealer wants something from me." The feeling is closer to: *"I didn't realise I could know this about my own car."* This is the emotion of a pleasant, unprompted discovery — the same feeling as checking your credit score for the first time and finding it's better than expected. Surprise that becomes trust. Delight that becomes a habit.

**Dealer Admin — Quiet Control.**
After a history of tools that demanded constant attention, the Dealer Admin should feel the quiet satisfaction of a machine that runs itself. Not excitement — relief. The feeling of setting something up properly and watching it work. The dashboard shouldn't make them feel busy; it should make them feel smart for choosing it.

**Dealer Staff — Unfair Advantage.**
Jordan should feel like he knows something his competitors don't. The morning scan should feel like having insider information — a shortlist of customers who are ready to trade before they know it themselves. Confidence, sharpness, momentum.

**Jupiter SysAdmin — Calm Confidence.**
When everything runs, Priya should feel nothing — invisible infrastructure is the goal. When something breaks, she should feel in control, not alarmed. The audit trail exists so that problems have clear answers, not mysteries. The emotional target is: "I found it, I fixed it, I proved it."

## Emotional Journey Mapping

| Stage | Consumer | Dealer Admin | Dealer Staff |
|---|---|---|---|
| First arrival | Mild curiosity → Genuine surprise ("this is my actual car value") | Mild skepticism → Growing confidence as setup progresses | Neutral → Quickly oriented |
| Core interaction | Engaged discovery — scrolling to see more | Calm satisfaction — watching the campaign activate | Focused clarity — seeing the shortlist |
| Task completion | "I want to come back to this" | "This will run itself" | "I know who to call" |
| Error / failure | Calm reassurance — no alarm, no confusion | Transparent status — knows what's happening | Unaffected if unrelated to their view |
| Return visit | Familiarity + anticipation ("what's changed?") | Passive confidence | Daily ritual — habitual check |

## Micro-Emotions

**Consumer:**
- **Trust over skepticism** — Vehicle Value shown with data attribution (JD Power, Black Book) makes the number feel sourced, not invented. Attribution isn't a footnote — it's a trust signal.
- **Surprise over expectation** — The Trade Timer, equity position, and recall status should feel like discoveries, not confirmations. Layout and copy should frame each tile as a reveal, not a report.
- **Ownership over overwhelm** — The consumer should feel like the data belongs to them. Not a dealer pitch, not a finance lecture. Their car, their numbers, their choice.

**Dealer Admin:**
- **Confidence over anxiety** during onboarding — Progress indicators, simulation mode, and a clear "you're ready to launch" moment eliminate fear of misconfiguration.
- **Pride over indifference** at analytics — Seeing a 34% open rate should feel like a win they can attribute to their brand, not just a number on a screen.

**Dealer Staff:**
- **Urgency without pressure** — The lead shortlist creates motivation to act, but should never feel like surveillance or a quota system.

**Jupiter SysAdmin:**
- **Clarity over complexity** — Audit logs and sync dashboards should feel like reading a timeline, not decoding a system log.

## Design Implications

| Emotional Goal | UX Design Approach |
|---|---|
| Consumer positive surprise | Progressive tile reveal on scroll; copy framed as insight ("Your equity has grown") not data label ("Equity: $4,200"); first-time dashboard animation that draws the eye to Vehicle Value |
| Consumer trust | Data source attribution on valuation tiles; dealer logo and brand color prominent at the top; no Jupiter branding visible to consumers |
| Calm reassurance on errors | Soft, neutral language for stale data or unavailable tiles ("We're refreshing your data — check back shortly"); tiles gracefully hidden rather than showing error states |
| Dealer Admin quiet control | Onboarding progress bar; simulation mode as a confidence-builder before going live; campaign activation as a single prominent CTA with clear confirmation |
| Dealer Staff unfair advantage | High-signal lead indicators (badge counts, color-coded trade readiness); default view shows top opportunities, not raw data tables |
| SysAdmin calm confidence | Chronological audit log with clear action labels; DMS sync health shown as a status timeline, not just a boolean; failure alerts with root cause hints, not just error codes |

## Emotional Design Principles

1. **Lead with the reveal, not the label** — Every data point on the consumer dashboard should be introduced with context ("Your vehicle is worth") before showing the number. Numbers without context are data. Numbers with context are insights.
2. **Calm is a design choice** — Error states, loading states, and stale data should never feel alarming. Soft language, neutral tones, and graceful degradation keep the consumer experience trustworthy even when data is incomplete.
3. **Let the data do the selling** — The consumer dashboard must never feel like a dealer CTA. Trade Timer and equity data speak for themselves. CTAs exist, but never dominate. The emotional journey from insight to action must feel self-directed.
4. **Reward the habit** — Dealer Staff and returning consumers should feel a subtle sense of anticipation when opening the platform. New data, updated signals, and visible changes since last visit reinforce the habit of returning.
5. **Invisible infrastructure, visible results** — For Dealer Admin, the platform should disappear into the background. What remains visible are outcomes: leads, open rates, consumer activity. The work is done; the results are clear.
