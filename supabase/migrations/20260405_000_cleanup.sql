-- =============================================================================
-- CLEANUP SCRIPT — Drops all tables, types, functions, triggers, and storage
-- =============================================================================
-- WARNING: This will DELETE ALL DATA. Only run this to reset from scratch.
-- Safe to run even if tables don't exist yet (fully idempotent).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Drop tables first with CASCADE (this also drops triggers, indexes, policies)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS user_entitlements CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS bundle_products CASCADE;
DROP TABLE IF EXISTS bundles CASCADE;
DROP TABLE IF EXISTS plan_products CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS product_content CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ---------------------------------------------------------------------------
-- Drop functions
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS on_order_paid();
DROP FUNCTION IF EXISTS on_subscription_change();
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS user_has_access(uuid, uuid);
DROP FUNCTION IF EXISTS user_can_read_content(uuid, uuid);

-- ---------------------------------------------------------------------------
-- Drop enums
-- ---------------------------------------------------------------------------

DROP TYPE IF EXISTS product_type;
DROP TYPE IF EXISTS product_status;
DROP TYPE IF EXISTS access_level;
DROP TYPE IF EXISTS payment_provider;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS subscription_interval;
DROP TYPE IF EXISTS coupon_type;
DROP TYPE IF EXISTS entitlement_source;

-- ---------------------------------------------------------------------------
-- Drop storage policies (storage.objects always exists in Supabase)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Free content is public"              ON storage.objects;
DROP POLICY IF EXISTS "Course assets are public"            ON storage.objects;
DROP POLICY IF EXISTS "Premium content requires entitlement" ON storage.objects;
DROP POLICY IF EXISTS "Service role writes free content"    ON storage.objects;
DROP POLICY IF EXISTS "Service role writes premium content" ON storage.objects;
DROP POLICY IF EXISTS "Service role writes course assets"   ON storage.objects;
DROP POLICY IF EXISTS "Service role updates free content"   ON storage.objects;
DROP POLICY IF EXISTS "Service role updates premium content" ON storage.objects;
DROP POLICY IF EXISTS "Service role updates course assets"  ON storage.objects;
DROP POLICY IF EXISTS "Service role deletes free content"   ON storage.objects;
DROP POLICY IF EXISTS "Service role deletes premium content" ON storage.objects;
DROP POLICY IF EXISTS "Service role deletes course assets"  ON storage.objects;

-- ---------------------------------------------------------------------------
-- Delete storage buckets and their contents
-- ---------------------------------------------------------------------------

DELETE FROM storage.objects WHERE bucket_id IN ('free-content', 'premium-content', 'course-assets');
DELETE FROM storage.buckets WHERE id IN ('free-content', 'premium-content', 'course-assets');

-- ---------------------------------------------------------------------------
-- Done — schema is fully clean, ready for fresh migration
-- ---------------------------------------------------------------------------
