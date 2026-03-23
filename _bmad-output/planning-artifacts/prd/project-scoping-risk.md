# Project Scoping & Risk

## Scoping Decisions

The full SOW scope is the MVP. The platform must ship as a complete, integrated experience — no partial releases. If deadline pressure forces cuts, insurance/warranty tiles are the first feature removed (additive, not core to the value proposition).

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| DealerVault integration complexity | High | Simulation mode enables parallel UI development; daily batch is primary, webhook is enhancement |
| JD Power / Black Book API access not yet secured | Medium | VIN Decode + Black Book serve as interim fallback; Jupiter algorithm covers 12+ month vehicles |
| Valuation data quality / accuracy | Medium | QA against known vehicle datasets pre-launch; cached data absorbs API outage impact |
| Dealers unable to self-onboard | Medium | Onboarding target <30 minutes; simulation mode demonstrates value before live DMS data |
| Consumer email engagement below expectations | Medium | Tracked from Month 1; benchmarked against automotive industry averages (~20–25% open rate) |
| DMS sync failure | Ongoing | Automated failure alerting; SysAdmin manual re-sync capability |
| Consumer data deletion request | Ongoing | Self-serve deletion flow; deletion logged in audit trail; dealer engagement history anonymized |
| Email opt-out compliance | Ongoing | Opt-out status checked before every send; honored within 10 business days |

---
