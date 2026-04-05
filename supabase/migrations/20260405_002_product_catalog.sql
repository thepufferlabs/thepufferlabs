-- =============================================================================
-- DOMAIN 2: Product Catalog
-- =============================================================================
-- Generic product system — courses, data services, tools, any digital product.
-- Content is stored in Supabase Storage, metadata here.
-- =============================================================================

DO $$ BEGIN CREATE TYPE product_type AS ENUM ('course', 'data_service', 'tool', 'bundle');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- PRODUCTS — the core catalog
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  product_type        product_type NOT NULL DEFAULT 'course',
  status              product_status NOT NULL DEFAULT 'draft',

  -- Display
  title               text NOT NULL,
  short_description   text,
  long_description    text,
  category            text,
  level               text,
  tags                text[] DEFAULT '{}',
  banner_path         text,
  thumbnail_path      text,

  -- Pricing
  price_cents         int NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'INR',
  compare_price_cents int,                                -- strikethrough price

  -- Source (GitHub origin)
  github_owner        text,
  github_repo         text,
  github_branch       text,

  -- Storage
  storage_bucket      text DEFAULT 'course-content',
  storage_prefix      text,

  -- Stats (updated by sync workflow)
  free_content_count    int DEFAULT 0,
  premium_content_count int DEFAULT 0,

  -- Flexible metadata
  metadata            jsonb DEFAULT '{}',
  version             text DEFAULT '1.0.0',
  last_synced_at      timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug     ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_type     ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_tags     ON products USING gin(tags);

-- ---------------------------------------------------------------------------
-- PRODUCT CONTENT INDEX — maps content keys to storage paths + access level
-- Used by all product types (courses map docs, data services map datasets)
-- ---------------------------------------------------------------------------

DO $$ BEGIN CREATE TYPE access_level AS ENUM ('free', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS product_content (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_key   text NOT NULL,
  title         text NOT NULL,
  section       text,
  access_level  access_level NOT NULL DEFAULT 'free',
  content_type  text DEFAULT 'doc',
  storage_path  text NOT NULL,
  tags          text[] DEFAULT '{}',
  sort_order    int DEFAULT 0,
  is_published  boolean DEFAULT true,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  UNIQUE(product_id, content_key)
);

CREATE INDEX IF NOT EXISTS idx_content_product ON product_content(product_id);
CREATE INDEX IF NOT EXISTS idx_content_access  ON product_content(access_level);

-- ---------------------------------------------------------------------------
-- RLS — catalog is publicly readable
-- ---------------------------------------------------------------------------

ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published products are public"
  ON products FOR SELECT USING (status = 'published');

-- Content RLS is handled in 003_licensing after entitlements table exists

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- STORAGE BUCKETS
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public) VALUES
  ('free-content', 'free-content', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('premium-content', 'premium-content', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Free content is public"
  ON storage.objects FOR SELECT USING (bucket_id = 'free-content');

CREATE POLICY "Course assets are public"
  ON storage.objects FOR SELECT USING (bucket_id = 'course-assets');

-- Service role write policies for all buckets
CREATE POLICY "Service writes free"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'free-content'    AND auth.role() = 'service_role');
CREATE POLICY "Service writes premium" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'premium-content' AND auth.role() = 'service_role');
CREATE POLICY "Service writes assets"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-assets'   AND auth.role() = 'service_role');
CREATE POLICY "Service updates free"    ON storage.objects FOR UPDATE USING (bucket_id = 'free-content'    AND auth.role() = 'service_role');
CREATE POLICY "Service updates premium" ON storage.objects FOR UPDATE USING (bucket_id = 'premium-content' AND auth.role() = 'service_role');
CREATE POLICY "Service updates assets"  ON storage.objects FOR UPDATE USING (bucket_id = 'course-assets'   AND auth.role() = 'service_role');
CREATE POLICY "Service deletes free"    ON storage.objects FOR DELETE USING (bucket_id = 'free-content'    AND auth.role() = 'service_role');
CREATE POLICY "Service deletes premium" ON storage.objects FOR DELETE USING (bucket_id = 'premium-content' AND auth.role() = 'service_role');
CREATE POLICY "Service deletes assets"  ON storage.objects FOR DELETE USING (bucket_id = 'course-assets'   AND auth.role() = 'service_role');

INSERT INTO schema_migrations (version, name)
VALUES ('20260405_002', 'product_catalog')
ON CONFLICT (version) DO NOTHING;
