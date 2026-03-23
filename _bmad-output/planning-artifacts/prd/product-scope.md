# Product Scope

## MVP — Phase 1 (Platform MVP)

All core capabilities ship together. A partial platform (email without dashboard, or dashboard without valuation data) delivers no value — the MVP is the smallest complete experience.

**Core capabilities:**
- Dealer onboarding (email/OAuth registration, branding, Stripe billing)
- Role-based access control (Admin, Staff, Consumer, SysAdmin)
- DealerVault DMS integration (daily batch + webhook + simulation mode)
- Bi-weekly automated email campaigns with dealer branding
- Consumer dashboard: Vehicle Value, Equity, Payoff, Trade Timer, Recall tiles
- Vehicle valuation: JD Power (primary) → Black Book (fallback), cached 7–14 days
- Jupiter proprietary valuation algorithm (vehicles owned 12+ months)
- Trade Timer calculation (depreciation + payoff + seasonality)
- NHTSA recall integration (active recalls only) + embedded service scheduler
- Signed URL generation (7-day expiry) + optional consumer account creation
- Historical trend data (24 months)
- Dealer analytics dashboard
- Audit logging + CAN-SPAM / CCPA/CPRA compliance controls
- AWS CI/CD across Dev / UAT / Prod + OWASP Top 10 compliance

**Descoped if deadline pressure:** Insurance and warranty tiles — DMS-dependent, adds integration complexity, does not affect core value proposition.

## Post-MVP — Phase 2 (Growth)

- Insurance and warranty tiles (DMS-synced, consumer manual entry fallback)
- Dealer-specific email trigger customization
- Direct-to-consumer subscription management (Jupiter.ai path)
- Advanced dealer analytics and AI-driven reporting

## Future — Phase 3 (Expansion)

- AI-based trade timer residual calculations (replacing rule-based MVP logic)
- AI-driven personalization
- Custom third-party integrations beyond DealerVault
- Predictive lead scoring
- Consumer-facing mobile app with proactive notifications

---
