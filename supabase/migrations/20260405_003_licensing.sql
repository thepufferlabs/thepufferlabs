-- =============================================================================
-- DOMAIN 3: Licensing, Subscriptions & Entitlements
-- =============================================================================
-- Plans, bundles, user entitlements — the access control layer.
-- Entitlements are the single source of truth for "can user access product?"
-- =============================================================================

DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE subscription_interval AS ENUM ('month', 'quarter', 'year', 'lifetime');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE entitlement_source AS ENUM ('purchase', 'subscription', 'coupon', 'manual', 'trial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- PLANS — subscription tiers
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  description   text,
  price_cents   int NOT NULL,
  currency      text NOT NULL DEFAULT 'INR',
  interval      subscription_interval NOT NULL,
  trial_days    int DEFAULT 0,
  is_active     boolean DEFAULT true,
  features      text[] DEFAULT '{}',
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PLAN_PRODUCTS — which products a plan unlocks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plan_products (
  plan_id    uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, product_id)
);

-- ---------------------------------------------------------------------------
-- BUNDLES — group products at a discounted price
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bundles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name                text NOT NULL,
  description         text,
  price_cents         int NOT NULL,
  currency            text NOT NULL DEFAULT 'INR',
  compare_price_cents int,
  is_active           boolean DEFAULT true,
  valid_from          timestamptz,
  valid_until         timestamptz,
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- BUNDLE_PRODUCTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bundle_products (
  bundle_id  uuid NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, product_id)
);

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS — user's active subscription periods
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                  uuid NOT NULL REFERENCES plans(id),
  order_id                 uuid,  -- FK added in 004_payments after orders table exists
  status                   subscription_status NOT NULL DEFAULT 'active',
  current_period_start     timestamptz NOT NULL DEFAULT now(),
  current_period_end       timestamptz,
  trial_start              timestamptz,
  trial_end                timestamptz,
  canceled_at              timestamptz,
  cancel_reason            text,
  auto_renew               boolean DEFAULT true,
  metadata                 jsonb DEFAULT '{}',
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subs_user   ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_period ON subscriptions(current_period_end);

-- ---------------------------------------------------------------------------
-- USER ENTITLEMENTS — single source of truth for access control
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_entitlements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source      entitlement_source NOT NULL,
  source_id   uuid,
  granted_at  timestamptz DEFAULT now(),
  expires_at  timestamptz,
  is_active   boolean DEFAULT true,
  metadata    jsonb DEFAULT '{}',
  UNIQUE(user_id, product_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_ent_user    ON user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_ent_product ON user_entitlements(product_id);
CREATE INDEX IF NOT EXISTS idx_ent_active  ON user_entitlements(user_id, product_id, is_active)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- ACCESS CONTROL FUNCTIONS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_has_access(p_user_id uuid, p_product_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_entitlements
    WHERE user_id = p_user_id
      AND product_id = p_product_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION user_can_read_content(p_user_id uuid, p_content_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM product_content pc
    WHERE pc.id = p_content_id
      AND (pc.access_level = 'free' OR user_has_access(p_user_id, pc.product_id))
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS POLICIES
-- ---------------------------------------------------------------------------

ALTER TABLE plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are public"            ON plans           FOR SELECT USING (is_active = true);
CREATE POLICY "Plan products are public"    ON plan_products   FOR SELECT USING (true);
CREATE POLICY "Active bundles are public"   ON bundles         FOR SELECT USING (is_active = true);
CREATE POLICY "Bundle products are public"  ON bundle_products FOR SELECT USING (true);
CREATE POLICY "Users see own subs"          ON subscriptions     FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users see own entitlements"  ON user_entitlements FOR SELECT USING (auth.uid() = user_id);

-- NOW add the content RLS that depends on entitlements
CREATE POLICY "Content: free public, premium needs entitlement"
  ON product_content FOR SELECT USING (
    access_level = 'free'
    OR user_has_access(auth.uid(), product_id)
  );

-- Premium storage RLS
CREATE POLICY "Premium storage needs entitlement"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'premium-content'
    AND EXISTS (
      SELECT 1 FROM user_entitlements ue
      JOIN products p ON p.id = ue.product_id
      WHERE ue.user_id = auth.uid()
        AND ue.is_active = true
        AND (ue.expires_at IS NULL OR ue.expires_at > now())
        AND (storage.foldername(name))[1] = p.slug
    )
  );

-- ---------------------------------------------------------------------------
-- TRIGGERS — auto-grant entitlements on subscription changes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION on_subscription_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    INSERT INTO user_entitlements (user_id, product_id, source, source_id, expires_at)
    SELECT NEW.user_id, pp.product_id, 'subscription', NEW.id, NEW.current_period_end
    FROM plan_products pp WHERE pp.plan_id = NEW.plan_id
    ON CONFLICT (user_id, product_id, source_id) DO UPDATE
      SET is_active = true, expires_at = NEW.current_period_end;
  ELSIF NEW.status IN ('canceled', 'expired') THEN
    UPDATE user_entitlements SET is_active = false
    WHERE source_id = NEW.id AND source = 'subscription';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_subscription_change
  AFTER INSERT OR UPDATE OF status ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION on_subscription_change();

CREATE TRIGGER plans_updated_at     BEFORE UPDATE ON plans         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subs_updated_at      BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version, name)
VALUES ('20260405_003', 'licensing')
ON CONFLICT (version) DO NOTHING;
