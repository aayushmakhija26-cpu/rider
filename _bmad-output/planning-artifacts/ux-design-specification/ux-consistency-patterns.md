# UX Consistency Patterns

## Button Hierarchy

**Consumer Dashboard (minimal, non-intrusive):**
- **Primary action** (`Button variant="default"`) — used sparingly. Only one per screen. Reserved for account creation CTA. Full width on mobile.
- **Text action** (`Button variant="link"`) — the default for most consumer CTAs. Never a filled button for secondary actions. Example: `→ Book a service appointment`, `Keep tracking your vehicle →`
- No destructive buttons on the consumer surface.

**Dealer Portal (standard SaaS hierarchy):**
- **Primary** (`variant="default"`, Jupiter blue) — one per page section. Example: `Activate Campaign`, `Save Branding`, `Connect DealerVault`
- **Secondary** (`variant="outline"`) — supporting actions alongside a primary. Example: `Preview Email`, `Cancel`, `Skip for now`
- **Destructive** (`variant="destructive"`) — irreversible actions only, always preceded by a confirmation dialog.
- **Ghost** (`variant="ghost"`) — table row actions, icon buttons, low-stakes navigation.

**Rules:**
- Never two primary buttons in the same visual context
- Destructive actions never appear without a confirmation step
- Icon-only buttons always have a `title` and `aria-label`

---

## Feedback Patterns

**Success:** Sonner toast, bottom-right, auto-dismiss after 4 seconds. Format: plain past tense — `Campaign scheduled`, `Branding saved`. No confetti, no modal.

**Error (system / API):** Sonner toast, `variant="destructive"`, does not auto-dismiss. Plain language + next action — `Couldn't connect to DealerVault. Check your credentials and try again.` Never expose raw error codes.

**Stale / unavailable data (consumer-facing):** Inline within the affected tile only. Language: `We're refreshing your data — check back shortly`. Tile remains visible with last known value if available. Never: `Error`, `Failed`, `Unavailable`, `N/A`.

**Loading:** shadcn/ui `Skeleton` on the specific element loading — never a full-page spinner. Loading states never block interaction on already-loaded parts of the page.

**Validation (forms):** Inline, below the field. On blur, not on keystroke. Format: constructive — `Enter a valid 17-character VIN` not `Invalid VIN`. Required field errors only shown after first submit attempt.

---

## Form Patterns

- Single-column layout always — never two-column form layouts
- Label above field, always — never placeholder-as-label
- Helper text below field in `text-xs text-muted-foreground`
- Onboarding forms: progress saved automatically on field blur
- VIN entry: auto-uppercase, 17-character limit, real-time character count, inline decode confirmation once valid
- Branding colour picker: hex input + native colour picker + live preview of dealer primary applied to sample email and dashboard hero

---

## Navigation Patterns

**Consumer dashboard:** No navigation chrome. Single-page scroll. Dealer logo in the hero is not a link.

**Dealer portal:** Persistent left sidebar on desktop. Mobile: Sheet component slides in from hamburger. Role-scoped items are absent entirely, not greyed out. Page transitions: instant (Next.js routing).

**Breadcrumbs:** Used only when navigating into a detail view from a table. Format: `Analytics > Marcus Thompson`.

---

## Empty State Patterns

Every empty state has: icon, plain-language explanation, single clear next action.

| Context | Message | CTA |
|---|---|---|
| No campaigns sent yet | `Your first campaign hasn't gone out yet` | `Preview your campaign` |
| No consumers synced | `No consumers yet — connect your DMS to get started` | `Connect DealerVault` |
| No active recalls | Tile hidden entirely | — |
| No consumers in green zone | `No consumers in the green zone yet · Check back after the next campaign` | — |

**Rules:** Empty states never use the word "empty". Never show an empty table with headers and no rows — use an empty state component. Consumer tiles with no data are hidden entirely.

---

## Loading State Patterns

**Consumer dashboard cold entry:** Hero gradient renders immediately, skeleton pulse on value and vehicle name. Vehicle Value tile loads with priority. Tiles below the fold load progressively on scroll. Target: Vehicle Value visible within 1 second.

**Dealer portal table:** 5 skeleton rows render immediately. Real data replaces skeletons in-place — no layout shift. Inline filters disabled during initial load.

**DMS sync in progress:** Current event shows pulse animation. Page does not auto-refresh — manual refresh available.

---

## Modal and Confirmation Patterns

**Use a modal for:** irreversible actions (campaign activation, data deletion, manual re-sync), actions requiring additional input.

**Never use a modal for:** inline validation errors, success feedback, tile detail expansion on consumer dashboard.

**Confirmation dialog structure:**
- Title: action verb + subject — `Activate Campaign?`
- Body: one sentence explaining consequences
- Buttons: `Cancel` (outline) + primary action
- No X close button on destructive confirmations — forces explicit cancel

---

## Search and Filter Patterns

**Dealer analytics table:** Inline column filters. Filter chips appear above table when active. Single text search above table filters by consumer name or vehicle. Filters persist within the session.

**SysAdmin audit log:** Date range picker + event type filter inline above the timeline. Filters applied on change. Export as CSV button right-aligned above the timeline.

---
