-- =============================================================================
-- FOUNDATION LAYER (PROTECTED — never dropped by cleanup)
-- =============================================================================
-- This is the bedrock of the platform. Dropping these breaks auth completely.
-- Only the nuclear cleanup (000_cleanup_nuclear.sql) touches this layer.
--
-- Contains:
--   - Enums for user roles, statuses, providers
--   - profiles table (extends auth.users)
--   - user_identities table (federated OAuth links)
--   - audit_log table (immutable event trail)
--   - Auth triggers on auth.users (auto-create profile on signup, track logins)
--   - update_updated_at() shared trigger function
--   - schema_migrations tracking table
-- =============================================================================

-- ─── Enums ──────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'premium', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE identity_provider AS ENUM ('email', 'github', 'google');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE audit_action AS ENUM (
  'login', 'logout', 'register', 'password_reset',
  'profile_update', 'role_change', 'subscription_change',
  'premium_access', 'account_suspended', 'account_reactivated',
  'purchase', 'refund'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Shared trigger function ────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ─── PROFILES ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text NOT NULL,
  full_name         text,
  display_name      text,
  avatar_url        text,
  bio               text,
  phone             text,
  primary_provider  identity_provider DEFAULT 'email',
  role              user_role DEFAULT 'user',
  status            user_status DEFAULT 'active',
  preferences       jsonb DEFAULT '{}',
  provider_meta     jsonb DEFAULT '{}',
  email_verified_at timestamptz,
  last_sign_in_at   timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email  ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role   ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── USER IDENTITIES ───────────────────────────────────

CREATE TABLE IF NOT EXISTS user_identities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider        identity_provider NOT NULL,
  provider_uid    text NOT NULL,
  provider_email  text,
  provider_data   jsonb DEFAULT '{}',
  linked_at       timestamptz DEFAULT now(),
  UNIQUE (provider, provider_uid)
);

CREATE INDEX IF NOT EXISTS idx_identities_user ON user_identities(user_id);

-- ─── AUDIT LOG ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action      audit_action NOT NULL,
  ip_address  inet,
  user_agent  text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ─── AUTH TRIGGERS on auth.users ────────────────────────
-- These auto-create profiles and track logins.
-- CRITICAL: without these, OAuth signup breaks with "Database error granting user"

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _provider identity_provider;
  _avatar   text;
  _name     text;
BEGIN
  _provider := CASE
    WHEN NEW.raw_app_meta_data ->> 'provider' = 'github' THEN 'github'::identity_provider
    WHEN NEW.raw_app_meta_data ->> 'provider' = 'google' THEN 'google'::identity_provider
    ELSE 'email'::identity_provider
  END;

  _name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'user_name',
    split_part(NEW.email, '@', 1)
  );

  _avatar := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );

  INSERT INTO profiles (
    id, email, full_name, display_name, avatar_url,
    primary_provider, provider_meta,
    email_verified_at, last_sign_in_at
  ) VALUES (
    NEW.id, NEW.email, _name, _name, _avatar,
    _provider, COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END,
    now()
  );

  INSERT INTO user_identities (user_id, provider, provider_uid, provider_email, provider_data)
  VALUES (
    NEW.id, _provider,
    COALESCE(NEW.raw_user_meta_data ->> 'provider_id', NEW.id::text),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  );

  INSERT INTO audit_log (user_id, action, metadata)
  VALUES (NEW.id, 'register', jsonb_build_object('provider', _provider::text));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
    UPDATE profiles
    SET last_sign_in_at = NEW.last_sign_in_at, updated_at = now()
    WHERE id = NEW.id;

    INSERT INTO audit_log (user_id, action, metadata)
    VALUES (NEW.id, 'login', jsonb_build_object(
      'provider', COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email')
    ));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_login();

-- ─── RLS ────────────────────────────────────────────────

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own profile"     ON profiles        FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users update own profile"   ON profiles        FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users read own identities"  ON user_identities FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users read own audit log"   ON audit_log       FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Migration tracking ────────────────────────────────

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     text PRIMARY KEY,
  name        text NOT NULL,
  executed_at timestamptz DEFAULT now()
);

INSERT INTO schema_migrations (version, name)
VALUES ('20260405_001', 'foundation')
ON CONFLICT (version) DO NOTHING;
