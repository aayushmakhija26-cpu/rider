# Domain-Specific Requirements

## Compliance & Regulatory

- **CAN-SPAM:** Unsubscribe mechanism, sender identification, and physical dealership address required in all emails. Opt-out requests honored within 10 business days. Opt-out status checked before every campaign send. Jupiter legal team owns compliance certification and legal text (out of Nebula's scope).
- **CCPA/CPRA:** Consent tracking, opt-out of data sale preference, and self-serve data deletion request flow in consumer dashboard. Audit trail of all consent and deletion events maintained.
- **Terms & Privacy content:** Provided by Jupiter legal team; platform renders and version-controls content.

## Technical Constraints

- All data encrypted at rest and in transit (TLS 1.2+)
- KMS-managed secrets for all API keys and credentials
- IP allow-listing on admin and integration endpoints
- Signed URLs expire after 7 days; invalidated upon consumer account creation
- OWASP Top 10 security checks required before production launch
- Load and performance testing required prior to launch

---
