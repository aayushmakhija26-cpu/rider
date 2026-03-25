-- Enable RLS on tenant-scoped tables
-- FORCE ROW LEVEL SECURITY ensures the table owner role is also subject to policies.
ALTER TABLE dealer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_users FORCE ROW LEVEL SECURITY;
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumers FORCE ROW LEVEL SECURITY;

-- DealerUser RLS: block if no tenant context, allow only matching dealer.
-- NULLIF converts the empty string returned by current_setting when the GUC is unset
-- into NULL, making the fail-closed behaviour explicit rather than coincidental.
-- WITH CHECK protects INSERT and UPDATE (USING alone only protects SELECT/DELETE).
CREATE POLICY dealer_users_tenant_isolation ON dealer_users
  AS RESTRICTIVE
  USING (
    dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')
  )
  WITH CHECK (
    dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')
  );

-- Consumer RLS: block if no tenant context, allow only matching dealer.
CREATE POLICY consumers_tenant_isolation ON consumers
  AS RESTRICTIVE
  USING (
    dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')
  )
  WITH CHECK (
    dealer_id = NULLIF(current_setting('app.current_dealer_id', true), '')
  );
