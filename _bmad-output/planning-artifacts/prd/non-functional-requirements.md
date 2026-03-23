# Non-Functional Requirements

## Performance

- Consumer dashboard loads within 3 seconds on a standard mobile connection (95th percentile)
- Valuation data served from cache on every dashboard load — no real-time API calls per request
- Bi-weekly email campaigns complete full dispatch on schedule regardless of dealer list size
- DMS batch sync completes within a nightly window (22:00–06:00) without impacting daytime platform performance

## Security

- All data encrypted at rest and in transit (TLS 1.2+)
- KMS-managed secrets for all API keys and credentials; rotation requires no platform downtime
- IP allow-listing enforced on admin and integration endpoints
- Signed URLs time-limited (7-day expiry); invalidated on consumer account creation
- Token-based authentication for all authenticated sessions
- OWASP Top 10 vulnerabilities remediated before production launch
- Tenant data fully isolated — no cross-tenant data access at any layer

## Scalability

- New dealer tenants onboard without infrastructure changes
- Email send infrastructure scales with dealer base without degrading delivery rate below 99%
- Valuation caching absorbs consumer volume growth without proportional increase in third-party API calls
- AWS deployment supports horizontal scaling for consumer dashboard traffic growth

## Accessibility

- Consumer dashboard conforms to WCAG 2.1 Level AA
- All interfaces usable on mobile, tablet, and desktop without horizontal scrolling or zooming

## Reliability

- Email delivery rate: ≥99%
- DMS sync failure rate: <1%; automated alerting on every failure
- Audit logs append-only and tamper-evident
- Historical data retained without loss for 24 months
- CI/CD pipeline supports hotfix deployment to production within one business day

## Integration

- DealerVault integration supports daily batch and near-real-time webhook; simulation mode available pre-go-live
- JD Power → Black Book fallback is automatic with no manual intervention
- NHTSA API calls fault-tolerant — recall tile hidden gracefully if API unavailable
- Stripe webhook events processed idempotently to prevent duplicate billing
- All third-party API credentials managed via KMS
