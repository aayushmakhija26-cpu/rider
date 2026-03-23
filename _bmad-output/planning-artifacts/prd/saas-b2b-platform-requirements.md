# SaaS B2B Platform Requirements

## Multi-Tenancy Model

Each dealership is a fully isolated tenant — branding, consumer data, campaign history, and analytics scoped per tenant with no cross-tenant visibility. Tenant provisioning is fully self-serve. Consumer accounts belong to one dealer tenant in MVP.

**Implementation constraints:**
- Tenant data isolation enforced at database schema level (row-level security or schema-per-tenant)
- Signed URLs scoped to the correct tenant's branding and consumer data
- Campaign scheduling runs platform-wide (bi-weekly cadence) but rendered per-tenant
- SysAdmin access must not expose one tenant's data when investigating another
- Stripe webhook events attributed to the correct tenant

## RBAC Matrix

| Role | Billing | Branding | Integrations | Analytics | Consumer Data | System Admin |
|---|---|---|---|---|---|---|
| Dealer Admin | ✓ | ✓ | ✓ | ✓ | Read | — |
| Dealer Staff | — | — | — | ✓ | Read | — |
| Consumer | — | — | — | — | Own data only | — |
| Jupiter SysAdmin | — | — | — | — | Audit access | ✓ |

## Subscription Model

- **MVP:** Single flat-rate subscription per dealership, managed via Stripe by Dealer Admin
- Full platform access on subscription — no feature gating at MVP
- Post-MVP: tiered plans based on consumer volume, email send limits, or feature access

## Integration Architecture

| Integration | Scope | Owner | Notes |
|---|---|---|---|
| DealerVault (DMS) | Per tenant | Dealer Admin (self-serve) | Daily batch + webhook; simulation mode pre-go-live |
| JD Power API | Platform | Jupiter SysAdmin | Valuation primary; cached 7–14 days |
| Black Book API | Platform | Jupiter SysAdmin | Valuation fallback; auto-switch, no manual intervention |
| NHTSA API | Platform | Jupiter SysAdmin | Active recalls only; fault-tolerant (tile hidden if unavailable) |
| VIN Decode | Platform | Jupiter SysAdmin | Non-DMS consumer fallback |
| Stripe | Per tenant | Dealer Admin | Idempotent webhook processing |
| Email delivery (SendGrid or equivalent) | Platform | Jupiter SysAdmin | Bi-weekly automated sends; ≥99% delivery rate |

---
