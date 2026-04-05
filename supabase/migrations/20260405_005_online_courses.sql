-- =============================================================================
-- DOMAIN 5: Online Courses
-- =============================================================================
-- Course-specific metadata on top of the generic product catalog.
-- Sidebar structure, TOC, user progress tracking.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- COURSE DETAILS — extends products with course-specific fields
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS course_details (
  product_id          uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,

  -- Sidebar & TOC stored as JSONB (synced from GitHub repo)
  sidebar_data        jsonb DEFAULT '{}',
  toc_data            jsonb DEFAULT '{}',

  -- Content stats
  blog_count          int DEFAULT 0,
  code_sample_count   int DEFAULT 0,
  cheatsheet_count    int DEFAULT 0,
  has_interview_prep  boolean DEFAULT false,

  -- Learning path metadata
  estimated_hours     numeric(4,1),
  prerequisites       text[] DEFAULT '{}',
  learning_outcomes   text[] DEFAULT '{}',

  last_content_update timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- USER COURSE PROGRESS — tracks which lessons a user has completed
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_course_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_key   text NOT NULL,
  completed_at  timestamptz DEFAULT now(),
  time_spent_seconds int DEFAULT 0,
  UNIQUE(user_id, product_id, content_key)
);

CREATE INDEX IF NOT EXISTS idx_progress_user    ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_product ON user_course_progress(user_id, product_id);

-- ---------------------------------------------------------------------------
-- USER COURSE BOOKMARKS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_key   text NOT NULL,
  note          text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, content_key)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id, product_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE course_details       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks       ENABLE ROW LEVEL SECURITY;

-- Course details are public (part of catalog)
CREATE POLICY "Course details are public"
  ON course_details FOR SELECT USING (true);

-- Progress and bookmarks are user-scoped
CREATE POLICY "Users see own progress"
  ON user_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users track own progress"
  ON user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress"
  ON user_course_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users see own bookmarks"
  ON user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bookmarks"
  ON user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own bookmarks"
  ON user_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

CREATE TRIGGER course_details_updated_at
  BEFORE UPDATE ON course_details FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version, name)
VALUES ('20260405_005', 'online_courses')
ON CONFLICT (version) DO NOTHING;
