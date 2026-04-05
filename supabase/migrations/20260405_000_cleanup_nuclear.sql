-- =============================================================================
-- NUCLEAR CLEANUP: Everything Including Foundation
-- =============================================================================
-- !! DANGER: This drops ALL tables, ALL functions, ALL triggers, ALL enums.
-- !! Auth will completely break. Users cannot sign in after running this.
-- !! You MUST re-run ALL migrations (001-005) to restore the platform.
--
-- Only use this when:
--   - Decommissioning the project
--   - Starting completely from scratch
--   - Major schema redesign that changes foundation tables
--
-- The GitHub workflow requires typing "NUCLEAR DELETE" to run this.
-- =============================================================================

-- ─── First run the feature-layer cleanup ────────────────

-- Domain 5
DROP TABLE IF EXISTS user_bookmarks       CASCADE;
DROP TABLE IF EXISTS user_course_progress CASCADE;
DROP TABLE IF EXISTS course_details       CASCADE;

-- Domain 4
DROP TABLE IF EXISTS refunds              CASCADE;
DROP TABLE IF EXISTS orders               CASCADE;
DROP TABLE IF EXISTS coupons              CASCADE;

-- Domain 3
DROP TABLE IF EXISTS user_entitlements    CASCADE;
DROP TABLE IF EXISTS subscriptions        CASCADE;
DROP TABLE IF EXISTS bundle_products      CASCADE;
DROP TABLE IF EXISTS bundles              CASCADE;
DROP TABLE IF EXISTS plan_products        CASCADE;
DROP TABLE IF EXISTS plans                CASCADE;

-- Domain 2
DROP TABLE IF EXISTS product_content      CASCADE;
DROP TABLE IF EXISTS products             CASCADE;

-- ─── Now drop the foundation (Domain 1) ─────────────────

-- Auth triggers on auth.users (must drop before functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login   ON auth.users;

-- Domain 1 tables
DROP TABLE IF EXISTS audit_log            CASCADE;
DROP TABLE IF EXISTS user_identities      CASCADE;
DROP TABLE IF EXISTS profiles             CASCADE;
DROP TABLE IF EXISTS schema_migrations    CASCADE;

-- ─── ALL functions ──────────────────────────────────────

DROP FUNCTION IF EXISTS handle_new_user()         CASCADE;
DROP FUNCTION IF EXISTS handle_user_login()       CASCADE;
DROP FUNCTION IF EXISTS update_updated_at()       CASCADE;
DROP FUNCTION IF EXISTS on_order_paid()           CASCADE;
DROP FUNCTION IF EXISTS on_subscription_change()  CASCADE;
DROP FUNCTION IF EXISTS user_has_access(uuid, uuid)       CASCADE;
DROP FUNCTION IF EXISTS user_can_read_content(uuid, uuid) CASCADE;

-- ─── ALL enums ──────────────────────────────────────────

-- Foundation enums
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS identity_provider;
DROP TYPE IF EXISTS audit_action;

-- Feature enums
DROP TYPE IF EXISTS product_type;
DROP TYPE IF EXISTS product_status;
DROP TYPE IF EXISTS access_level;
DROP TYPE IF EXISTS payment_provider;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS subscription_interval;
DROP TYPE IF EXISTS coupon_type;
DROP TYPE IF EXISTS entitlement_source;

-- ─── Storage policies ───────────────────────────────────

DROP POLICY IF EXISTS "Free content is public"            ON storage.objects;
DROP POLICY IF EXISTS "Course assets are public"          ON storage.objects;
DROP POLICY IF EXISTS "Premium storage needs entitlement" ON storage.objects;
DROP POLICY IF EXISTS "Service writes free"               ON storage.objects;
DROP POLICY IF EXISTS "Service writes premium"            ON storage.objects;
DROP POLICY IF EXISTS "Service writes assets"             ON storage.objects;
DROP POLICY IF EXISTS "Service updates free"              ON storage.objects;
DROP POLICY IF EXISTS "Service updates premium"           ON storage.objects;
DROP POLICY IF EXISTS "Service updates assets"            ON storage.objects;
DROP POLICY IF EXISTS "Service deletes free"              ON storage.objects;
DROP POLICY IF EXISTS "Service deletes premium"           ON storage.objects;
DROP POLICY IF EXISTS "Service deletes assets"            ON storage.objects;

-- Storage buckets are emptied/deleted via REST API in the workflow.

-- =============================================================================
-- NOTHING REMAINS. Re-run all migrations (001-005) to rebuild.
-- =============================================================================
