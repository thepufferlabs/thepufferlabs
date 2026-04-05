-- =============================================================================
-- DOMAIN 4: Payment Gateway & Order Management
-- =============================================================================
-- Provider-agnostic: Razorpay (India), Stripe (international), manual
-- Full order lifecycle: create → authorize → pay → refund/cancel
-- =============================================================================

DO $$ BEGIN CREATE TYPE payment_provider AS ENUM ('razorpay', 'stripe', 'manual', 'coupon');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded', 'disputed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE coupon_type AS ENUM ('percent', 'fixed_amount');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- COUPONS — discount codes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS coupons (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  text UNIQUE NOT NULL,
  coupon_type           coupon_type NOT NULL,
  discount_value        int NOT NULL,           -- 50 (percent) or 50000 (paise/cents)
  currency              text DEFAULT 'INR',
  max_uses              int,                    -- null = unlimited
  used_count            int DEFAULT 0,
  max_uses_per_user     int DEFAULT 1,
  min_purchase_cents    int DEFAULT 0,
  applies_to_product_id uuid REFERENCES products(id),
  applies_to_plan_id    uuid REFERENCES plans(id),
  applies_to_bundle_id  uuid REFERENCES bundles(id),
  valid_from            timestamptz DEFAULT now(),
  valid_until           timestamptz,
  is_active             boolean DEFAULT true,
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ---------------------------------------------------------------------------
-- ORDERS — every purchase attempt creates an order
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          text UNIQUE NOT NULL DEFAULT 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                payment_status NOT NULL DEFAULT 'pending',

  -- What was purchased (exactly one should be set)
  product_id            uuid REFERENCES products(id),
  bundle_id             uuid REFERENCES bundles(id),
  plan_id               uuid REFERENCES plans(id),
  coupon_id             uuid REFERENCES coupons(id),

  -- Amounts
  subtotal_cents        int NOT NULL,
  discount_cents        int DEFAULT 0,
  tax_cents             int DEFAULT 0,
  total_cents           int NOT NULL,
  currency              text NOT NULL DEFAULT 'INR',

  -- Payment provider
  provider              payment_provider NOT NULL,
  provider_order_id     text,
  provider_payment_id   text,
  provider_signature    text,
  provider_data         jsonb DEFAULT '{}',

  -- Lifecycle
  receipt_url           text,
  notes                 text,
  paid_at               timestamptz,
  canceled_at           timestamptz,
  cancel_reason         text,

  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user     ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON orders(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_number   ON orders(order_number);

-- ---------------------------------------------------------------------------
-- REFUNDS — tracks partial or full refunds against orders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS refunds (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents          int NOT NULL,
  currency              text NOT NULL DEFAULT 'INR',
  reason                text,
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),

  -- Provider
  provider              payment_provider,
  provider_refund_id    text,
  provider_data         jsonb DEFAULT '{}',

  processed_at          timestamptz,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user  ON refunds(user_id);

-- ---------------------------------------------------------------------------
-- Add FK from subscriptions to orders (deferred from 003)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE subscriptions ADD CONSTRAINT fk_subs_order
    FOREIGN KEY (order_id) REFERENCES orders(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- TRIGGERS — auto-grant entitlements on payment
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION on_order_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
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

    -- Bundle purchase
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

    -- Log the purchase
    INSERT INTO audit_log (user_id, action, metadata)
    VALUES (NEW.user_id, 'purchase', jsonb_build_object(
      'order_id', NEW.id, 'total_cents', NEW.total_cents, 'currency', NEW.currency
    ));
  END IF;

  -- Handle refunds — revoke entitlements
  IF NEW.status = 'refunded' AND OLD.status = 'paid' THEN
    UPDATE user_entitlements SET is_active = false
    WHERE source_id = NEW.id AND source = 'purchase';

    INSERT INTO audit_log (user_id, action, metadata)
    VALUES (NEW.user_id, 'refund', jsonb_build_object('order_id', NEW.id));
  END IF;

  -- Handle cancellation
  IF NEW.status = 'canceled' AND OLD.status IN ('pending', 'authorized') THEN
    NEW.canceled_at = now();
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_order_status
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION on_order_paid();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Valid coupons are public"
  ON coupons FOR SELECT USING (
    is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR used_count < max_uses)
  );

CREATE POLICY "Users see own orders"   ON orders  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create orders"    ON orders  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own refunds"  ON refunds FOR SELECT USING (auth.uid() = user_id);

INSERT INTO schema_migrations (version, name)
VALUES ('20260405_004', 'payments')
ON CONFLICT (version) DO NOTHING;
