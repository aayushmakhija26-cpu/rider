# User Journey Flows

## Journey 1: Consumer — Email-Triggered Cold Entry

Marcus receives a dealer-branded bi-weekly email, taps through, and experiences Jupiter for the first time — no account, no context, no intent.

```mermaid
flowchart TD
    A([Email delivered to consumer inbox]) --> B{Consumer opens email?}
    B -- No --> B1([Email unread · Campaign metric recorded])
    B -- Yes --> C[Open rate recorded · CTA visible]
    C --> D{Consumer clicks CTA?}
    D -- No --> D1([Click-through not recorded])
    D -- Yes --> E[Signed URL resolves]
    E --> F{URL valid and not expired?}
    F -- Expired --> G[Expiry screen shown\n'Your link has expired'\nSoft account creation prompt]
    G --> G1{Consumer creates account?}
    G1 -- Yes --> H[Account created · Dashboard accessible]
    G1 -- No --> G2([Session ends])
    F -- Valid --> I[Dashboard loads\nDealer brand applied\nVehicle hero renders]
    I --> J[Consumer sees vehicle + market value\nFirst paint within 1 second]
    J --> K{Consumer scrolls?}
    K -- No --> K1([Session ends · Dashboard view recorded])
    K -- Yes --> L[Equity tile · Payoff tile · Trade Timer · Recall tile visible]
    L --> M{Active recall present?}
    M -- Yes --> N[Recall tile highlighted amber\nBook service CTA visible]
    N --> O{Consumer books service?}
    O -- Yes --> O1([Service booking recorded · Dealer notified])
    O -- No --> P
    M -- No --> P[Account creation soft prompt shown\n'Keep tracking your vehicle']
    P --> Q{Consumer creates account?}
    Q -- Yes --> R[Account created · Signed URL invalidated\nDashboard accessible with login]
    Q -- No --> S([Session ends · Visit count recorded])
    R --> S1([Consumer has persistent access\nReturns without email prompt])
```

**Flow optimisations:**
- Dashboard hero renders on first paint — no skeleton loader that looks broken
- No login prompt before any data is shown
- Account CTA appears only after consumer has scrolled past core tiles — earned, not forced
- URL expiry screen is the upgrade funnel, not an error state

---

## Journey 2: Consumer — Direct / Organic Entry

Marcus discovers Jupiter directly and arrives without a dealer-issued signed URL.

```mermaid
flowchart TD
    A([Consumer arrives at Jupiter platform directly]) --> B[Landing page shown\nVIN entry prompt]
    B --> C[Consumer enters VIN]
    C --> D{VIN valid?}
    D -- Invalid --> D1[Inline validation error\n'Check your VIN — 17 characters']
    D1 --> C
    D -- Valid --> E[VIN decoded · Vehicle identified]
    E --> F{Participating dealer found\nfor consumer's region?}
    F -- No --> G[Waitlist / notification prompt\n'Jupiter is coming to your area']
    G --> G1([Consumer optionally joins waitlist])
    F -- Yes --> H[Dealer matched\nConsumer shown dealer branding]
    H --> I[Account creation required\nfor organic entry]
    I --> J{Consumer creates account?}
    J -- No --> J1([Session ends])
    J -- Yes --> K[Account created\nDealer association stored]
    K --> L[Dashboard loads with available data\nValuation calculated from VIN]
    L --> M([Consumer has persistent access\nAdded to dealer's consumer list])
```

**Flow optimisations:**
- VIN entry is the only required field — no form overhead
- Dealer matching is automatic and invisible to the consumer
- Organic entry requires account creation — framed as "set up your vehicle tracker", not "register"

---

## Journey 3: Dealer Admin — Onboarding to First Campaign

Sandra registers, configures her dealership, connects DMS, and activates her first campaign — target: under 30 minutes total.

```mermaid
flowchart TD
    A([Sandra visits Jupiter registration page]) --> B{Registration method}
    B -- Email --> C[Email + password · Dealership name]
    B -- OAuth --> D[Google or Apple OAuth · Dealership name]
    C --> E[Account created · Onboarding checklist shown]
    D --> E
    E --> F[Step 1: Branding\nLogo upload · Primary colour · Contact info]
    F --> G{Branding saved?}
    G -- No / Skip --> G1[Default Jupiter branding applied\nCan return later]
    G -- Yes --> H[Branding confirmed · Preview shown]
    G1 --> I
    H --> I[Step 2: Billing\nStripe setup · Plan selection]
    I --> J{Stripe connected?}
    J -- No --> J1[Billing pending · Can continue in trial]
    J -- Yes --> K[Billing active]
    J1 --> L
    K --> L[Step 3: DMS Integration\nDealerVault connection]
    L --> M{Connect DealerVault now?}
    M -- No / Later --> N[Simulation mode activated automatically\nSample consumer data loaded]
    M -- Yes --> O[DealerVault credentials entered]
    O --> P{Connection successful?}
    P -- Fail --> Q[Error shown with reason\nFallback: simulation mode offered]
    Q --> N
    P -- Success --> R[Live DMS sync initiated\nFirst batch scheduled]
    N --> S[Step 4: Preview campaign\nEmail template shown with dealer branding]
    R --> S
    S --> T{Sandra approves campaign?}
    T -- No --> U[Sandra requests changes\nBranding / content adjustments]
    U --> S
    T -- Yes --> V[First campaign scheduled\nBi-weekly cadence locked in]
    V --> W([Onboarding complete\nSandra lands on Analytics dashboard\nNext campaign date shown])
```

**Flow optimisations:**
- Each onboarding step is independent — Sandra can skip and return
- Simulation mode activates automatically if DMS is not connected — no dead ends
- Campaign preview is the final confidence-builder before activation
- "First campaign scheduled" is the completion state, not "onboarding complete"

---

## Journey 4: Dealer Staff — Morning Scan

Jordan opens the dealer portal at the start of his day to identify which consumers are worth calling. Target: shortlist visible within 30 seconds.

```mermaid
flowchart TD
    A([Jordan navigates to dealer portal]) --> B[Login · Staff credentials]
    B --> C[Analytics view loads as default landing page]
    C --> D[Page title: 'Analytics'\nRight-aligned: '12 in green zone · 34% open rate']
    D --> E[Consumer table loads\nPre-sorted: Trade Timer status + visit count\nTop rows = warmest leads]
    E --> F{Jordan identifies leads?}
    F -- Yes, immediately --> G[Reviews top 2–3 rows\nTrade Timer badge + visit count visible per row]
    F -- Needs to filter --> H[Inline filter: Trade Timer = Green\nOr: Visits 2+\nNo page navigation required]
    H --> G
    G --> I{Action on lead?}
    I -- Call now --> J([Jordan notes name · picks up phone\nNo action recorded in Jupiter])
    I -- View detail --> K[Consumer row expanded or detail page\nFull engagement history · last visit · tile interactions]
    K --> L([Jordan has full context · proceeds with outreach])
    I -- No action today --> M([Jordan closes tab\nReturns tomorrow])
```

**Flow optimisations:**
- Analytics is the default post-login view — zero navigation required
- Table is pre-sorted by engagement signal — no filter configuration needed for the standard morning scan
- Inline filtering available for edge cases without leaving the page
- No "save" or "submit" action — scan is passive, action happens off-platform

---

## Journey 5: Jupiter SysAdmin — DMS Failure Diagnosis

Priya receives an automated failure alert and needs to identify root cause, escalate to the dealer, and restore sync — target: root cause found within 2 minutes.

```mermaid
flowchart TD
    A([Automated failure alert fired\nDMS sync failure · Dealer tenant identified]) --> B[Priya receives alert\nEmail or platform notification]
    B --> C[Priya logs into SysAdmin portal]
    C --> D[Navigates to DMS Sync Monitor]
    D --> E[Dealer tenant located\nSync status timeline shown]
    E --> F[Last successful sync visible\nFailed event highlighted with timestamp]
    F --> G[Priya opens audit log for failed event]
    G --> H{Root cause identifiable?}
    H -- Yes: malformed VIN --> I[Root cause shown: 'VIN validation failed · Record ID shown']
    H -- Yes: API timeout --> I2[Root cause shown: 'DealerVault API timeout · Duration shown']
    H -- Yes: auth error --> I3[Root cause shown: 'DealerVault credentials rejected']
    H -- Unclear --> J[Priya escalates to engineering\nAudit log exported]
    I --> K[Priya contacts dealer\nRequests DMS record correction]
    I2 --> L[Priya monitors · retry scheduled automatically]
    I3 --> M[Priya requests dealer to reauthorise DealerVault]
    K --> N{Dealer corrects record?}
    N -- Yes --> O[Priya triggers manual re-sync from SysAdmin portal]
    N -- Pending --> N1([Priya notes open item · monitors])
    O --> P[Re-sync initiated · Progress visible in timeline]
    P --> Q{Re-sync successful?}
    Q -- Yes --> R([Sync restored · Audit log records Priya's manual trigger\nDealer notified])
    Q -- No --> S([Priya escalates · Incident logged])
```

**Flow optimisations:**
- Sync status timeline is the entry point — not a raw log list
- Root cause surfaced at the event level — not buried in log lines
- Manual re-sync is a single action available directly from the dealer tenant view
- Every Priya-initiated action is captured in the audit log automatically

---

## Journey Patterns

**Entry patterns:**
- Consumer always enters via URL (signed or account login) — no app store, no download
- Dealer portal always requires authenticated login — no signed URL access
- SysAdmin portal always requires authenticated login with separate role verification

**Decision patterns:**
- Every optional step (account creation, DMS connection, billing) has a graceful skip path — no dead ends
- Error states always offer a next action — never a dead end screen
- Confirmation steps before irreversible actions (campaign activation, manual re-sync)

**Feedback patterns:**
- Progress is communicated through state changes (badge colour, status label, timeline event) not toast notifications alone
- Success states are calm and understated — no confetti or celebration animations
- Failure states use soft language and always include a next step

## Flow Optimisation Principles

1. **Default state is the useful state** — Every view loads in its most actionable configuration. Jordan's table is pre-sorted. Priya's sync monitor shows the most recent event first. Sandra's onboarding shows the next incomplete step. No configuration required to reach value.
2. **Skip paths everywhere** — Every optional step has a "do this later" path. No flow forces completion of a step that isn't immediately necessary.
3. **Errors are events, not failures** — DMS failures, expired URLs, and invalid VINs are handled as known states with clear next actions. No user should ever see a generic error screen.
4. **Off-ramps, not dead ends** — Every terminal state (URL expired, no dealer found, sync failure) offers a meaningful next step rather than ending the session abruptly.
