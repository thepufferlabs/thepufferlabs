-- =============================================================================
-- The Puffer Labs — Products, Subscriptions & Entitlements Schema
-- =============================================================================
-- Supports: courses, data-as-service, any digital product
-- Payment: provider-agnostic (Razorpay, Stripe, etc.)
-- Access: RLS-gated via user entitlements
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE product_type AS ENUM ('course', 'data_service', 'tool', 'bundle');
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE access_level AS ENUM ('free', 'premium');
CREATE TYPE payment_provider AS ENUM ('razorpay', 'stripe', 'manual', 'coupon');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded', 'disputed');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'expired');
CREATE TYPE subscription_interval AS ENUM ('month', 'quarter', 'year', 'lifetime');
CREATE TYPE coupon_type AS ENUM ('percent', 'fixed_amount');
CREATE TYPE entitlement_source AS ENUM ('purchase', 'subscription', 'coupon', 'manual', 'trial');

-- ---------------------------------------------------------------------------
-- PRODUCTS — the core catalog (courses, data services, tools)
-- ---------------------------------------------------------------------------

CREATE TABLE products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text UNIQUE NOT NULL,                    -- "k8s-zero-to-mastery"
  product_type   product_type NOT NULL DEFAULT 'course',
  status         product_status NOT NULL DEFAULT 'draft',

  -- Display
  title          text NOT NULL,
  short_description text,
  category       text,                                    -- "devops", "software-design"
  level          text,                                    -- "beginner-to-advanced"
  tags           text[] DEFAULT '{}',
  banner_path    text,                                    -- storage path
  thumbnail_path text,

  -- Pricing
  price_cents    int NOT NULL DEFAULT 0,                  -- 0 = free
  currency       text NOT NULL DEFAULT 'INR',
  compare_price_cents int,                                -- strikethrough price

  -- Source
  github_owner   text,
  github_repo    text,
  github_branch  text,
  storage_bucket text DEFAULT 'course-content',
  storage_prefix text,                                    -- "courses/k8s-zero-to-mastery/"

  -- Content stats (updated by sync workflow)
  free_doc_count     int DEFAULT 0,
  premium_doc_count  int DEFAULT 0,
  blog_count         int DEFAULT 0,
  code_sample_count  int DEFAULT 0,

  -- Metadata (flexible JSON for future fields)
  metadata       jsonb DEFAULT '{}',

  version        text DEFAULT '1.0.0',
  last_synced_at timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- ---------------------------------------------------------------------------
-- PRODUCT CONTENT INDEX — maps contentKey → storage path + access level
-- ---------------------------------------------------------------------------

CREATE TABLE product_content (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_key    text NOT NULL,                           -- "pods", "security-cheatsheet"
  title          text NOT NULL,
  section        text,                                    -- "foundations", "deep-dive"
  access_level   access_level NOT NULL DEFAULT 'free',
  content_type   text DEFAULT 'doc',                      -- "doc", "blog", "code"
  storage_path   text NOT NULL,                           -- "courses/k8s/docs/free/03-pods.md"
  tags           text[] DEFAULT '{}',
  sort_order     int DEFAULT 0,
  is_published   boolean DEFAULT true,
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),

  UNIQUE(product_id, content_key)
);

CREATE INDEX idx_content_product ON product_content(product_id);
CREATE INDEX idx_content_access ON product_content(access_level);

-- ---------------------------------------------------------------------------
-- PLANS — subscription tiers (monthly, yearly, lifetime)
-- ---------------------------------------------------------------------------

CREATE TABLE plans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text UNIQUE NOT NULL,                    -- "pro-monthly", "all-access-yearly"
  name           text NOT NULL,
  description    text,
  price_cents    int NOT NULL,
  currency       text NOT NULL DEFAULT 'INR',
  interval       subscription_interval NOT NULL,
  trial_days     int DEFAULT 0,
  is_active      boolean DEFAULT true,
  features       text[] DEFAULT '{}',                     -- ["All courses", "Priority support"]
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PLAN_PRODUCTS — which products a plan unlocks
-- ---------------------------------------------------------------------------

CREATE TABLE plan_products (
  plan_id        uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, product_id)
);

-- ---------------------------------------------------------------------------
-- BUNDLES — group products at a discounted price
-- ---------------------------------------------------------------------------

CREATE TABLE bundles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text UNIQUE NOT NULL,                    -- "devops-starter-pack"
  name           text NOT NULL,
  description    text,
  price_cents    int NOT NULL,
  currency       text NOT NULL DEFAULT 'INR',
  compare_price_cents int,                                -- total if bought individually
  is_active      boolean DEFAULT true,
  valid_from     timestamptz,
  valid_until    timestamptz,                             -- for flash sales
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- BUNDLE_PRODUCTS — products in a bundle
-- ---------------------------------------------------------------------------

CREATE TABLE bundle_products (
  bundle_id      uuid NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, product_id)
);

-- ---------------------------------------------------------------------------
-- COUPONS — discount codes for products, plans, or bundles
-- ---------------------------------------------------------------------------

CREATE TABLE coupons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text UNIQUE NOT NULL,                    -- "LAUNCH50"
  coupon_type    coupon_type NOT NULL,
  discount_value int NOT NULL,                            -- 50 (percent) or 50000 (cents)
  currency       text DEFAULT 'INR',
  max_uses       int,                                     -- null = unlimited
  used_count     int DEFAULT 0,
  min_purchase_cents int DEFAULT 0,
  applies_to_product_id uuid REFERENCES products(id),     -- null = all products
  applies_to_plan_id    uuid REFERENCES plans(id),
  applies_to_bundle_id  uuid REFERENCES bundles(id),
  valid_from     timestamptz DEFAULT now(),
  valid_until    timestamptz,
  is_active      boolean DEFAULT true,
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_coupons_code ON coupons(code);

-- ---------------------------------------------------------------------------
-- ORDERS — payment-provider-agnostic order tracking
-- ---------------------------------------------------------------------------

CREATE TABLE orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         payment_status NOT NULL DEFAULT 'pending',

  -- What was purchased
  product_id     uuid REFERENCES products(id),
  bundle_id      uuid REFERENCES bundles(id),
  plan_id        uuid REFERENCES plans(id),
  coupon_id      uuid REFERENCES coupons(id),

  -- Pricing
  subtotal_cents int NOT NULL,
  discount_cents int DEFAULT 0,
  total_cents    int NOT NULL,
  currency       text NOT NULL DEFAULT 'INR',

  -- Payment provider details
  provider       payment_provider NOT NULL,
  provider_order_id    text,                              -- razorpay_order_id / stripe_session_id
  provider_payment_id  text,                              -- razorpay_payment_id / stripe_pi_id
  provider_signature   text,                              -- for verification
  provider_data        jsonb DEFAULT '{}',                -- raw webhook payload

  receipt_url    text,
  notes          text,
  metadata       jsonb DEFAULT '{}',

  paid_at        timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_provider ON orders(provider_order_id);

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS — recurring access periods
-- ---------------------------------------------------------------------------

CREATE TABLE subscriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id        uuid NOT NULL REFERENCES plans(id),
  order_id       uuid REFERENCES orders(id),
  status         subscription_status NOT NULL DEFAULT 'active',

  -- Provider
  provider       payment_provider,
  provider_subscription_id text,

  -- Period
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end   timestamptz,                       -- null = lifetime
  trial_start          timestamptz,
  trial_end            timestamptz,
  canceled_at          timestamptz,
  cancel_reason        text,

  auto_renew     boolean DEFAULT true,
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_subs_user ON subscriptions(user_id);
CREATE INDEX idx_subs_status ON subscriptions(status);
CREATE INDEX idx_subs_period ON subscriptions(current_period_end);

-- ---------------------------------------------------------------------------
-- USER ENTITLEMENTS — the single source of truth for "can user X access product Y"
-- Denormalized for fast RLS checks. Populated by triggers on orders/subscriptions.
-- ---------------------------------------------------------------------------

CREATE TABLE user_entitlements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source         entitlement_source NOT NULL,
  source_id      uuid,                                    -- order_id or subscription_id
  granted_at     timestamptz DEFAULT now(),
  expires_at     timestamptz,                             -- null = lifetime
  is_active      boolean DEFAULT true,
  metadata       jsonb DEFAULT '{}',

  UNIQUE(user_id, product_id, source_id)
);

CREATE INDEX idx_entitlements_user ON user_entitlements(user_id);
CREATE INDEX idx_entitlements_product ON user_entitlements(product_id);
CREATE INDEX idx_entitlements_active ON user_entitlements(user_id, product_id, is_active)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION — check if user has access to a product
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_has_access(p_user_id uuid, p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_entitlements
    WHERE user_id = p_user_id
      AND product_id = p_product_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION — check if user has access to specific content
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_can_read_content(p_user_id uuid, p_content_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM product_content pc
    WHERE pc.id = p_content_id
      AND (
        pc.access_level = 'free'
        OR user_has_access(p_user_id, pc.product_id)
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- TRIGGER — auto-grant entitlements when order is paid
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION on_order_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expires_at timestamptz := now() + interval '1 year';
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Direct product purchase
    IF NEW.product_id IS NOT NULL THEN
      INSERT INTO user_entitlements (user_id, product_id, source, source_id, expires_at)
      VALUES (NEW.user_id, NEW.product_id, 'purchase', NEW.id, v_expires_at)
      ON CONFLICT (user_id, product_id, source_id) DO UPDATE
        SET is_active = true, expires_at = v_expires_at;
    END IF;

    -- Bundle purchase — grant all products in the bundle
    IF NEW.bundle_id IS NOT NULL THEN
      INSERT INTO user_entitlements (user_id, product_id, source, source_id, expires_at)
      SELECT NEW.user_id, bp.product_id, 'purchase', NEW.id, v_expires_at
      FROM bundle_products bp WHERE bp.bundle_id = NEW.bundle_id
      ON CONFLICT (user_id, product_id, source_id) DO UPDATE
        SET is_active = true, expires_at = v_expires_at;
    END IF;

    -- Update coupon usage
    IF NEW.coupon_id IS NOT NULL THEN
      UPDATE coupons SET used_count = used_count + 1 WHERE id = NEW.coupon_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_paid
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION on_order_paid();

-- ---------------------------------------------------------------------------
-- TRIGGER — auto-grant entitlements when subscription becomes active
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION on_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    -- Grant all products in the plan
    INSERT INTO user_entitlements (user_id, product_id, source, source_id, expires_at)
    SELECT NEW.user_id, pp.product_id, 'subscription', NEW.id, NEW.current_period_end
    FROM plan_products pp WHERE pp.plan_id = NEW.plan_id
    ON CONFLICT (user_id, product_id, source_id) DO UPDATE
      SET is_active = true, expires_at = NEW.current_period_end;
  ELSIF NEW.status IN ('canceled', 'expired') THEN
    -- Deactivate entitlements from this subscription
    UPDATE user_entitlements
    SET is_active = false
    WHERE source_id = NEW.id AND source = 'subscription';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscription_change
  AFTER INSERT OR UPDATE OF status ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION on_subscription_change();

-- ---------------------------------------------------------------------------
-- TRIGGER — auto-update updated_at timestamps
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_updated   BEFORE UPDATE ON products      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_plans_updated      BEFORE UPDATE ON plans         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated     BEFORE UPDATE ON orders        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subs_updated       BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- RLS POLICIES
-- ---------------------------------------------------------------------------

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

-- Products & plans: publicly readable (catalog)
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT USING (status = 'published');

CREATE POLICY "Product content: free is public, premium needs entitlement"
  ON product_content FOR SELECT USING (
    access_level = 'free'
    OR user_has_access(auth.uid(), product_id)
  );

CREATE POLICY "Plans are publicly readable"
  ON plans FOR SELECT USING (is_active = true);

CREATE POLICY "Bundles are publicly readable"
  ON bundles FOR SELECT USING (is_active = true);

CREATE POLICY "Bundle products are publicly readable"
  ON bundle_products FOR SELECT USING (true);

CREATE POLICY "Active coupons are publicly readable"
  ON coupons FOR SELECT USING (
    is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR used_count < max_uses)
  );

-- Orders: users see only their own
CREATE POLICY "Users see own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: users see only their own
CREATE POLICY "Users see own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Entitlements: users see only their own
CREATE POLICY "Users see own entitlements"
  ON user_entitlements FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- STORAGE BUCKETS (run via Supabase dashboard or management API)
-- ---------------------------------------------------------------------------

-- Free content: public bucket, no auth needed
INSERT INTO storage.buckets (id, name, public) VALUES
  ('free-content', 'free-content', true)
ON CONFLICT (id) DO NOTHING;

-- Premium content: private bucket, access via RLS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('premium-content', 'premium-content', false)
ON CONFLICT (id) DO NOTHING;

-- Course assets (banners, thumbnails): public bucket
INSERT INTO storage.buckets (id, name, public) VALUES
  ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- STORAGE RLS POLICIES
-- ---------------------------------------------------------------------------

-- Free content: anyone can read
CREATE POLICY "Free content is public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'free-content');

-- Course assets: anyone can read
CREATE POLICY "Course assets are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-assets');

-- Premium content: only users with active entitlement
-- Storage path pattern: {product_slug}/...
CREATE POLICY "Premium content requires entitlement"
  ON storage.objects FOR SELECT
  USING (
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

-- Service role can write to all buckets (for GitHub Actions sync)
CREATE POLICY "Service role writes free content"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'free-content' AND auth.role() = 'service_role');

CREATE POLICY "Service role writes premium content"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'premium-content' AND auth.role() = 'service_role');

CREATE POLICY "Service role writes course assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-assets' AND auth.role() = 'service_role');

CREATE POLICY "Service role updates free content"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'free-content' AND auth.role() = 'service_role');

CREATE POLICY "Service role updates premium content"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'premium-content' AND auth.role() = 'service_role');

CREATE POLICY "Service role updates course assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-assets' AND auth.role() = 'service_role');

CREATE POLICY "Service role deletes free content"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'free-content' AND auth.role() = 'service_role');

CREATE POLICY "Service role deletes premium content"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'premium-content' AND auth.role() = 'service_role');

CREATE POLICY "Service role deletes course assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-assets' AND auth.role() = 'service_role');
