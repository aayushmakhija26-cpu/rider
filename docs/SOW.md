 

 

 

 

 

 

 

      					    Nebula Technologies Pvt Ltd - Jupiter 

  								        Statement of Work - 1 

 

 

 

 

 

 

 

 

 

 

 

 

 

 

Preface 

This Statement of Work (SOW) outlines the terms and approach under which Nebula will design, develop, and deploy a mobile-first web MVP for Jupiter on the cloud platform provided by Jupiter. 

Nebula will deliver an end-to-end solution that enables dealerships to engage consumers through automated, dealer-branded vehicle insight newsletters. The platform will send personalized, bi-weekly emails containing key insights such as vehicle value, equity, payoff, recall status, and trade timer, each linked to a secure, responsive consumer dashboard. 

Scope 

Web Application Development: Mobile-first responsive web dashboards for consumers and admin portals for dealers. 

UX/UI Design: Wireframes, interactive prototypes, and branding-consistent design for emails and dashboards. 

Integrations: include JD Power, Black Book, and NHTSA APIs for vehicle valuation and recall data, plus VIN Decode for non-DMS customers. 

Testing & QA: Security testing (OWASP Top 10 checks), load/performance testing and Functional testing to ensure high-quality delivery. 

Compliance & Security: encrypted data at rest/in transit, KMS-managed secrets, IP allow-listing, and adherence to CAN-SPAM, CCPA/CPRA. 

Deployment: Setup CI/CD for Dev, UAT & Prod. Setup and configure deployment servers in AWS. 

 

Out of Scope 

 

AI-driven personalization or advanced analytics beyond the MVP’s rule-based insights. 

Custom integrations. 

Direct-to-consumer subscription management for Jupiter.ai (optional path included but not in MVP). 

Getting compliance for CAN-SPAM and CCPA/CPRA 

Functional Requirements 

Dealer Onboarding & Account Management 

Dealers can register using email or OAuth (Google/Apple). 

The Dealer Admin can manage dealer staff accounts and assign roles. 

Dealer profile includes branding elements: logo, color theme, contact info. 

Billing setup and management via Stripe (only Dealer Admin). 

Role-Based Access & Permissions 

Dealer Admin: Full access to billing, branding, integrations, and analytics dashboards. 

Dealer Staff: Access to analytics dashboards, cannot edit billing or branding. 

Consumer: Access personalized dashboard via signed URL or optional account; view vehicle insights and account info. 

Jupiter SysAdmin: Support and compliance access, including audit logs, system monitoring, and role management.  

DMS Integration 

Integration with Dealer Vault to support multiple DMS platforms 

Daily batch syncs and near-real-time webhook updates. 

Ability to simulate DMS ingestion for testing dashboards before live integration. 

Dashboard to show last sync status and failure alerts.  

Database schema designed to receive and parse DMS data (financials, ownership, service, insurance & warranty). 

Validation layer ensures DMS data is normalized and cleansed before ingestion. 

Email Automation & Campaign Management 

Biweekly automated dealer-branded newsletters with dynamic tiles (Value, Equity, Payoff, Recall, Trade Timer). 

Preview Email Template  

Standardized triggers for MVP; future release may allow dealer-specific customizations. 

Audit logs for all emails sent, including recipient engagement metrics. 

Tracks open rates and engagement metrics; stores results in structured format for AI-based analytics and reporting. 

Consumer Dashboard 

Mobile-first responsive dashboard accessible via secure, expiring signed URLs. 

Displays authorized tiles configured by dealer. 

Optional account creation for daily insights and notifications. 

Historical trend visualization (up to 24 months). 

Valuation & Trade Timer Calculations 

Vehicle valuation prioritizes JD Power, fallback to Black Book. 

Trade Timer uses predefined formulas (depreciation + payoff + seasonality). 

Equity calculation is based on loan balance and market value. 

Cached results (7–14 days) to optimize performance. 

Valuation logic based on time since purchase:  

0–6 months: Show retail valuation. 

6–12 months: Show mid-point valuation (average of retail and trade/private party values).  

12+ months: Use proprietary Jupiter valuation algorithm. 

Trade Timer uses predefined formulas combining depreciation, payoff, and seasonality.  

Displays equity values directly on dashboard:  

If positive, show equity value.  

If negative, show equilibrium projection (when vehicle value equals loan payoff). 

Insurance 

Displays a digital insurance ID card with provider, policy number, coverage type, effective/expiry dates.  

Pulls data automatically from dealer DMS; allows customer (NOT dealer) manual entry for service only.  

Ensures insurance information is securely stored and updated periodically. 

Warranty 

Displays digital warranty card with provider, plan type, coverage period, and status. 

Syncs automatically with dealer DMS; allows customer (not dealer) manual input if data is unavailable. 

Recall/Service Schedule 

Shows active recalls retrieved via free NHTSA API 

Only active recalls are displayed 

Embeds the dealer’s service scheduler (e.g., Xtime or similar) for booking recall or maintenance services. 

Dealer Dashboard 

Displays analytics and operational data for the dealer. 

Audit, Reporting & Compliance 

Capture key system actions: dashboard access, email sends, integration events. 

Compliance with CAN-SPAM, CCPA/CPRA; track user consent and opt-out preferences. 

Reporting for Dealer Admin and Staff: email engagement metrics, vehicle insights trends, sync status 

Non-Functional Requirements 

Responsive UI: supports desktop, tablet, and mobile browsers 

Security: token-based link access, TLS encryption, and data protection 

Assumptions 

Customer provides cloud infra, API keys (AI, email/SMS), and branding assets. 

All third‑party service costs (AWS, OpenAI, Twilio/SendGrid) are the customer’s responsibility. 

DMS integration initially via DealerVault 

Dealer-branded emails and dashboards follow dealer-specific branding (logo, colors, contact info). 

Consumers do not need accounts; signed URLs provide secure access to dashboards.  

Audit logs capture all key actions: dashboard access, email sends, and integration events. 

Email cadence: biweekly automated campaigns; standardized triggers for MVP. 

Dashboard & email data: valuations cached 7–14 days; historical data retained 24 months. 

Security & Compliance: encrypted data at rest/in transit, KMS-managed secrets, IP allow-listing, and adherence to CAN-SPAM, CCPA/CPRA. 

Trade Timer logic: MVP uses rule-based calculations (depreciation + payoff + seasonality); AI-based residuals added in future releases. 

Valuation logic: prioritize JD Power; fallback to Black Book; attribution displayed; single authoritative value shown. 

Terms and Condition and Privacy content will be provided by Jupiter team. 