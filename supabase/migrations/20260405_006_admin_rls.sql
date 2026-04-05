-- =============================================================================
-- DOMAIN 6: Admin Access Policies
-- =============================================================================
-- Grants admin/super_admin users write access to catalog, pricing,
-- coupons, and bundles. Also allows admins to read all orders & profiles.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER: check if current user is admin
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- PRODUCTS — admins can update pricing, metadata, status
-- (Products are created by the sync workflow via service_role, not by admins)
-- ---------------------------------------------------------------------------

CREATE POLICY "Admins update products"
  ON products FOR UPDATE USING (is_admin());

-- ---------------------------------------------------------------------------
-- COUPONS — admins have full CRUD
-- (Public SELECT policy already exists for active coupons)
-- ---------------------------------------------------------------------------

CREATE POLICY "Admins manage coupons"
  ON coupons FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- BUNDLES — admins have full CRUD
-- ---------------------------------------------------------------------------

CREATE POLICY "Admins manage bundles"
  ON bundles FOR ALL USING (is_admin());

CREATE POLICY "Admins manage bundle_products"
  ON bundle_products FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- ORDERS — admins can read all orders (for dashboard stats)
-- ---------------------------------------------------------------------------

CREATE POLICY "Admins read all orders"
  ON orders FOR SELECT USING (is_admin());

-- ---------------------------------------------------------------------------
-- PROFILES — admins can read all profiles (for user lookup)
-- (Users already have their own SELECT policy)
-- ---------------------------------------------------------------------------

CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT USING (is_admin());

-- ---------------------------------------------------------------------------
-- MIGRATION TRACKING
-- ---------------------------------------------------------------------------

INSERT INTO schema_migrations (version, name)
VALUES ('20260405_006', 'admin_rls')
ON CONFLICT (version) DO NOTHING;
