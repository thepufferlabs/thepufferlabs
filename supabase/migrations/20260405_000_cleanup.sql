-- =============================================================================
-- CLEANUP SCRIPT — Drops all tables, types, functions, triggers, and storage
-- =============================================================================
-- WARNING: This will DELETE ALL DATA. Only run this to reset from scratch.
--
-- Usage:
--   To run:  psql $DATABASE_URL -f supabase/migrations/20260405_000_cleanup.sql
--   Or via Supabase SQL Editor: paste and execute
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Drop triggers first (they depend on functions)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_order_paid         ON orders;
DROP TRIGGER IF EXISTS trg_subscription_change ON subscriptions;
DROP TRIGGER IF EXISTS trg_products_updated   ON products;
DROP TRIGGER IF EXISTS trg_plans_updated      ON plans;
DROP TRIGGER IF EXISTS trg_orders_updated     ON orders;
DROP TRIGGER IF EXISTS trg_subs_updated       ON subscriptions;

-- ---------------------------------------------------------------------------
-- Drop functions
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS on_order_paid();
DROP FUNCTION IF EXISTS on_subscription_change();
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS user_has_access(uuid, uuid);
DROP FUNCTION IF EXISTS user_can_read_content(uuid, uuid);

-- ---------------------------------------------------------------------------
-- Drop storage policies
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
-- Drop RLS policies on tables
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Products are publicly readable"                          ON products;
DROP POLICY IF EXISTS "Product content: free is public, premium needs entitlement" ON product_content;
DROP POLICY IF EXISTS "Plans are publicly readable"                             ON plans;
DROP POLICY IF EXISTS "Bundles are publicly readable"                           ON bundles;
DROP POLICY IF EXISTS "Bundle products are publicly readable"                   ON bundle_products;
DROP POLICY IF EXISTS "Active coupons are publicly readable"                    ON coupons;
DROP POLICY IF EXISTS "Users see own orders"                                    ON orders;
DROP POLICY IF EXISTS "Users can create orders"                                 ON orders;
DROP POLICY IF EXISTS "Users see own subscriptions"                             ON subscriptions;
DROP POLICY IF EXISTS "Users see own entitlements"                              ON user_entitlements;

-- ---------------------------------------------------------------------------
-- Drop tables (order matters due to foreign keys)
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
-- Delete storage buckets and their contents
-- ---------------------------------------------------------------------------

DELETE FROM storage.objects WHERE bucket_id IN ('free-content', 'premium-content', 'course-assets');
DELETE FROM storage.buckets WHERE id IN ('free-content', 'premium-content', 'course-assets');

-- ---------------------------------------------------------------------------
-- Done — schema is fully clean, ready for fresh migration
-- ---------------------------------------------------------------------------
