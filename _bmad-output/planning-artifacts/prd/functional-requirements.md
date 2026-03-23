# Functional Requirements

## Dealer Account Management

- FR1: Dealer Admin can register a new dealership account using email or OAuth (Google/Apple)
- FR2: Dealer Admin can configure dealership branding (logo, color theme, contact information)
- FR3: Dealer Admin can create and manage dealer staff accounts
- FR4: Dealer Admin can assign roles to dealer staff
- FR5: Dealer Admin can set up and manage billing via Stripe
- FR6: Dealer Admin can view and update their dealership profile

## Consumer Account Management

- FR7: Consumer can access their personalized vehicle dashboard via a dealer-issued signed URL without creating an account
- FR8: Consumer can create a full account for persistent access after signed URL expiry
- FR9: Consumer can sign up directly on the platform without a dealer-triggered email
- FR10: Consumer can view and manage their account information
- FR11: Consumer can submit a self-serve data deletion request from their dashboard
- FR12: Consumer can opt out of email communications from the platform

## DMS Integration

- FR13: Dealer Admin can connect their dealership's DMS via DealerVault integration
- FR14: The system ingests DMS data via daily batch sync
- FR15: The system receives near-real-time DMS updates via webhook
- FR16: Dealer Admin can simulate DMS data ingestion to preview consumer dashboards before live integration
- FR17: The system validates and normalizes DMS data before ingestion
- FR18: Dealer Admin can view last DMS sync status and failure alerts

## Email Campaign Management

- FR19: The system automatically sends dealer-branded bi-weekly email newsletters to consumers
- FR20: Dealer Admin can preview the email template before campaign activation
- FR21: The system generates a personalized signed URL for each consumer per campaign
- FR22: The system tracks and stores email open rates and engagement metrics per campaign
- FR23: The system logs all email sends in the audit trail including recipient engagement

## Consumer Vehicle Dashboard

- FR24: Consumer can view their vehicle's current market valuation
- FR25: Consumer can view their loan equity position (positive equity as value; negative equity as equilibrium projection)
- FR26: Consumer can view their current loan payoff amount
- FR27: Consumer can view their Trade Timer readiness signal
- FR28: Consumer can view active vehicle recalls from NHTSA
- FR29: Consumer can book a dealer service appointment via embedded scheduler (e.g., Xtime) from the recall tile
- FR30: Consumer can view up to 24 months of historical vehicle insight trends
- FR31: Consumer can view their digital insurance ID card (DMS-synced; consumer manual entry fallback)
- FR32: Consumer can view their digital warranty card (DMS-synced; consumer manual entry fallback)

## Vehicle Valuation & Calculations

- FR33: The system calculates vehicle market value using JD Power (primary), Black Book (fallback)
- FR34: The system applies the Jupiter proprietary valuation algorithm for vehicles owned 12+ months
- FR35: The system applies time-based valuation logic (retail 0–6 months; mid-point 6–12 months; Jupiter algorithm 12+ months)
- FR36: The system calculates vehicle equity from current market value and loan balance
- FR37: The system calculates Trade Timer readiness using depreciation, payoff, and seasonality formula
- FR38: The system caches valuation results for 7–14 days

## Dealer Analytics Dashboard

- FR39: Dealer Admin can view campaign performance metrics (open rates, click-throughs, consumer activity)
- FR40: Dealer Staff can view campaign performance analytics (read-only; no billing or branding access)
- FR41: Dealer Admin can identify consumers with high engagement indicators (repeat visits, Trade Timer in green zone)

## Compliance & Consent Management

- FR42: The system captures and stores consumer opt-out preferences and honors them within 10 business days
- FR43: The system tracks consumer consent for data use in accordance with CCPA/CPRA
- FR44: The system processes consumer self-serve data deletion requests and logs each action in the audit trail
- FR45: All email communications include required CAN-SPAM elements (unsubscribe link, sender identification, physical address)

## Audit & System Administration

- FR46: Jupiter SysAdmin can view audit logs for all key system actions (dashboard access, email sends, integration events, consent and deletion actions)
- FR47: Jupiter SysAdmin can monitor DMS sync status across all dealer tenants
- FR48: Jupiter SysAdmin can manually trigger a DMS re-sync for a specific dealer tenant
- FR49: Jupiter SysAdmin can manage roles and access across the platform
- FR50: The system generates and validates time-limited signed URLs for consumer dashboard access (7-day expiry)

---
