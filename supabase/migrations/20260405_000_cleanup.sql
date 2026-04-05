-- =============================================================================
-- CLEANUP — Drops ALL schema + data across all domains
-- =============================================================================
-- Safe to run even if tables don't exist (fully idempotent).
-- Storage must be emptied via REST API BEFORE running this (done by workflow).
-- =============================================================================

-- ─── DOMAIN 5: Online Courses ───────────────────────────

DROP TABLE IF EXISTS user_bookmarks       CASCADE;
DROP TABLE IF EXISTS user_course_progress CASCADE;
DROP TABLE IF EXISTS course_details       CASCADE;

-- ─── DOMAIN 4: Payments ────────────────────────────────

DROP TABLE IF EXISTS refunds              CASCADE;
DROP TABLE IF EXISTS orders               CASCADE;
DROP TABLE IF EXISTS coupons              CASCADE;

-- ─── DOMAIN 3: Licensing ───────────────────────────────

DROP TABLE IF EXISTS user_entitlements    CASCADE;
DROP TABLE IF EXISTS subscriptions        CASCADE;
DROP TABLE IF EXISTS bundle_products      CASCADE;
DROP TABLE IF EXISTS bundles              CASCADE;
DROP TABLE IF EXISTS plan_products        CASCADE;
DROP TABLE IF EXISTS plans                CASCADE;

-- ─── DOMAIN 2: Product Catalog ─────────────────────────

DROP TABLE IF EXISTS product_content      CASCADE;
DROP TABLE IF EXISTS products             CASCADE;

-- ─── DOMAIN 1: User & Auth ─────────────────────────────

DROP TABLE IF EXISTS audit_log            CASCADE;
DROP TABLE IF EXISTS user_identities      CASCADE;
DROP TABLE IF EXISTS profiles             CASCADE;
DROP TABLE IF EXISTS schema_migrations    CASCADE;

-- ─── Functions ─────────────────────────────────────────

DROP FUNCTION IF EXISTS on_order_paid()           CASCADE;
DROP FUNCTION IF EXISTS on_subscription_change()  CASCADE;
DROP FUNCTION IF EXISTS update_updated_at()       CASCADE;
DROP FUNCTION IF EXISTS user_has_access(uuid, uuid)       CASCADE;
DROP FUNCTION IF EXISTS user_can_read_content(uuid, uuid) CASCADE;

-- ─── Enums ─────────────────────────────────────────────

DROP TYPE IF EXISTS product_type;
DROP TYPE IF EXISTS product_status;
DROP TYPE IF EXISTS access_level;
DROP TYPE IF EXISTS payment_provider;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS subscription_interval;
DROP TYPE IF EXISTS coupon_type;
DROP TYPE IF EXISTS coupon_type;
DROP TYPE IF EXISTS entitlement_source;
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS identity_provider;
DROP TYPE IF EXISTS audit_action;

-- ─── Storage Policies ──────────────────────────────────

DROP POLICY IF EXISTS "Free content is public"               ON storage.objects;
DROP POLICY IF EXISTS "Course assets are public"             ON storage.objects;
DROP POLICY IF EXISTS "Premium storage needs entitlement"    ON storage.objects;
DROP POLICY IF EXISTS "Service writes free"                  ON storage.objects;
DROP POLICY IF EXISTS "Service writes premium"               ON storage.objects;
DROP POLICY IF EXISTS "Service writes assets"                ON storage.objects;
DROP POLICY IF EXISTS "Service updates free"                 ON storage.objects;
DROP POLICY IF EXISTS "Service updates premium"              ON storage.objects;
DROP POLICY IF EXISTS "Service updates assets"               ON storage.objects;
DROP POLICY IF EXISTS "Service deletes free"                 ON storage.objects;
DROP POLICY IF EXISTS "Service deletes premium"              ON storage.objects;
DROP POLICY IF EXISTS "Service deletes assets"               ON storage.objects;

-- Storage buckets are emptied & deleted via REST API in the workflow.
-- =============================================================================
