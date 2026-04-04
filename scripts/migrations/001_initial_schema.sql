-- Migration 001: Initial Schema
-- This is the baseline — identical to supabase-schema.sql
-- Run ONLY if starting fresh. Skip if schema already exists.
--
-- To check: SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles');

-- See scripts/supabase-schema.sql for the full initial schema.
-- This file is a marker for the migration history.

-- Record this migration
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.schema_migrations (version, name)
VALUES ('001', 'initial_schema')
ON CONFLICT (version) DO NOTHING;
