-- =============================================================================
-- CLEANUP: Feature Layers Only (SAFE)
-- =============================================================================
-- Drops domains 2-5 (products, licensing, payments, courses).
-- PRESERVES domain 1 (foundation): profiles, auth triggers, identities, audit.
--
-- Auth continues to work after running this. Users can still sign in.
-- Re-run migrations 002-005 to recreate feature tables.
--
-- For a full nuclear reset, use 000_cleanup_nuclear.sql instead.
-- =============================================================================

-- ─── Domain 5: Online Courses ───────────────────────────

DROP TABLE IF EXISTS user_bookmarks       CASCADE;
DROP TABLE IF EXISTS user_course_progress CASCADE;
DROP TABLE IF EXISTS course_details       CASCADE;

-- ─── Domain 4: Payments ─────────────────────────────────

DROP TABLE IF EXISTS refunds              CASCADE;
DROP TABLE IF EXISTS orders               CASCADE;
DROP TABLE IF EXISTS coupons              CASCADE;

-- ─── Domain 3: Licensing ────────────────────────────────

DROP TABLE IF EXISTS user_entitlements    CASCADE;
DROP TABLE IF EXISTS subscriptions        CASCADE;
DROP TABLE IF EXISTS bundle_products      CASCADE;
DROP TABLE IF EXISTS bundles              CASCADE;
DROP TABLE IF EXISTS plan_products        CASCADE;
DROP TABLE IF EXISTS plans                CASCADE;

-- ─── Domain 2: Product Catalog ──────────────────────────

DROP TABLE IF EXISTS product_content      CASCADE;
DROP TABLE IF EXISTS products             CASCADE;

-- ─── Feature-layer functions ────────────────────────────

DROP FUNCTION IF EXISTS on_order_paid()           CASCADE;
DROP FUNCTION IF EXISTS on_subscription_change()  CASCADE;
DROP FUNCTION IF EXISTS user_has_access(uuid, uuid)       CASCADE;
DROP FUNCTION IF EXISTS user_can_read_content(uuid, uuid) CASCADE;

-- ─── Feature-layer enums ────────────────────────────────

DROP TYPE IF EXISTS product_type;
DROP TYPE IF EXISTS product_status;
DROP TYPE IF EXISTS access_level;
DROP TYPE IF EXISTS payment_provider;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS subscription_interval;
DROP TYPE IF EXISTS coupon_type;
DROP TYPE IF EXISTS entitlement_source;

-- ─── Storage policies (not buckets — those are cleaned via REST API) ──

DROP POLICY IF EXISTS "Published products are public"          ON products;
DROP POLICY IF EXISTS "Content: free public, premium needs entitlement" ON product_content;
DROP POLICY IF EXISTS "Free content is public"                 ON storage.objects;
DROP POLICY IF EXISTS "Course assets are public"               ON storage.objects;
DROP POLICY IF EXISTS "Premium storage needs entitlement"      ON storage.objects;
DROP POLICY IF EXISTS "Service writes free"                    ON storage.objects;
DROP POLICY IF EXISTS "Service writes premium"                 ON storage.objects;
DROP POLICY IF EXISTS "Service writes assets"                  ON storage.objects;
DROP POLICY IF EXISTS "Service updates free"                   ON storage.objects;
DROP POLICY IF EXISTS "Service updates premium"                ON storage.objects;
DROP POLICY IF EXISTS "Service updates assets"                 ON storage.objects;
DROP POLICY IF EXISTS "Service deletes free"                   ON storage.objects;
DROP POLICY IF EXISTS "Service deletes premium"                ON storage.objects;
DROP POLICY IF EXISTS "Service deletes assets"                 ON storage.objects;

-- Remove feature migration records (foundation stays)
DELETE FROM schema_migrations WHERE version IN (
  '20260405_002', '20260405_003', '20260405_004', '20260405_005'
);

-- =============================================================================
-- PRESERVED (not touched):
--   - profiles, user_identities, audit_log, schema_migrations
--   - update_updated_at(), handle_new_user(), handle_user_login()
--   - auth.users triggers (on_auth_user_created, on_auth_user_login)
--   - user_role, user_status, identity_provider, audit_action enums
-- =============================================================================
