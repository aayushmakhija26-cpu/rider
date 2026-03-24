-- Enable RLS on the dealers table.
-- A dealer user should only be able to read their own dealer row.
-- The dealers table uses `id` as the tenant identifier (not `dealer_id`).
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers FORCE ROW LEVEL SECURITY;

CREATE POLICY dealers_tenant_isolation ON dealers
  AS RESTRICTIVE
  USING (
    id = NULLIF(current_setting('app.current_dealer_id', true), '')
  )
  WITH CHECK (
    id = NULLIF(current_setting('app.current_dealer_id', true), '')
  );
