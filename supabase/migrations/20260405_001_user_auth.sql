-- =============================================================================
-- DOMAIN 1: User & Authentication
-- =============================================================================
-- Profiles, federated identities, audit trail
-- Extends Supabase auth.users
-- =============================================================================

-- Enums
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

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- USER IDENTITIES — federated provider links (GitHub + Google + email)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- AUDIT LOG — immutable event trail
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"     ON profiles        FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"   ON profiles        FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users read own identities"  ON user_identities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own audit log"   ON audit_log       FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- MIGRATION TRACKING
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     text PRIMARY KEY,
  name        text NOT NULL,
  executed_at timestamptz DEFAULT now()
);

INSERT INTO schema_migrations (version, name)
VALUES ('20260405_001', 'user_auth')
ON CONFLICT (version) DO NOTHING;
