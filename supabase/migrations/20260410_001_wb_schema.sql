-- ============================================================
-- Mini World Bank Analytics Platform — Schema
-- ============================================================

-- 1. Reference: Countries
CREATE TABLE IF NOT EXISTS wb_countries (
    code        TEXT PRIMARY KEY,          -- ISO 3166-1 alpha-3
    name        TEXT NOT NULL,
    region      TEXT,
    income_level TEXT,
    capital_city TEXT,
    longitude   NUMERIC,
    latitude    NUMERIC,
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Reference: Indicators
CREATE TABLE IF NOT EXISTS wb_indicators (
    code        TEXT PRIMARY KEY,          -- e.g. NY.GDP.MKTP.CD
    name        TEXT NOT NULL,
    description TEXT,
    source_org  TEXT DEFAULT 'World Bank',
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Fact: Indicator values (normalized)
CREATE TABLE IF NOT EXISTS wb_indicator_values (
    country_code       TEXT NOT NULL REFERENCES wb_countries(code),
    indicator_code     TEXT NOT NULL REFERENCES wb_indicators(code),
    year               INT  NOT NULL,
    value              NUMERIC,
    unit               TEXT,
    source_update_date DATE,
    ingested_at        TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY (country_code, indicator_code, year)
);

-- 4. Raw: Unprocessed API payloads (audit trail)
CREATE TABLE IF NOT EXISTS wb_raw_observations (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_run_id   UUID NOT NULL,
    request_url  TEXT NOT NULL,
    payload_json JSONB NOT NULL,
    page         INT,
    total_pages  INT,
    fetched_at   TIMESTAMPTZ DEFAULT now()
);

-- 5. Job tracking: Sync runs
CREATE TABLE IF NOT EXISTS wb_sync_runs (
    run_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status         TEXT NOT NULL DEFAULT 'running'
                   CHECK (status IN ('running','completed','failed','cancelled')),
    started_at     TIMESTAMPTZ DEFAULT now(),
    finished_at    TIMESTAMPTZ,
    indicators     TEXT[],
    countries      TEXT[],
    rows_inserted  INT DEFAULT 0,
    rows_updated   INT DEFAULT 0,
    rows_skipped   INT DEFAULT 0,
    error_message  TEXT,
    metadata       JSONB DEFAULT '{}'
);

-- ============================================================
-- Indexes for analytics queries
-- ============================================================

-- Fast lookup by indicator + country + year range
CREATE INDEX IF NOT EXISTS idx_wb_values_indicator_country_year
    ON wb_indicator_values (indicator_code, country_code, year);

-- Fast lookup by country across all indicators
CREATE INDEX IF NOT EXISTS idx_wb_values_country_year
    ON wb_indicator_values (country_code, year);

-- Fast lookup by year (for cross-country comparisons)
CREATE INDEX IF NOT EXISTS idx_wb_values_year
    ON wb_indicator_values (year DESC);

-- Raw observations by job run
CREATE INDEX IF NOT EXISTS idx_wb_raw_job_run
    ON wb_raw_observations (job_run_id);

-- Sync runs by status and time
CREATE INDEX IF NOT EXISTS idx_wb_sync_status
    ON wb_sync_runs (status, started_at DESC);

-- ============================================================
-- Materialized Views for Analytics
-- ============================================================

-- Country-year summary: all indicators pivoted per country per year
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_country_year_summary AS
SELECT
    v.country_code,
    c.name AS country_name,
    c.region,
    v.year,
    MAX(CASE WHEN v.indicator_code = 'NY.GDP.MKTP.CD' THEN v.value END) AS gdp,
    MAX(CASE WHEN v.indicator_code = 'NY.GDP.PCAP.CD' THEN v.value END) AS gdp_per_capita,
    MAX(CASE WHEN v.indicator_code = 'SP.POP.TOTL'    THEN v.value END) AS population
FROM wb_indicator_values v
JOIN wb_countries c ON c.code = v.country_code
GROUP BY v.country_code, c.name, c.region, v.year
ORDER BY v.country_code, v.year;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_country_year
    ON mv_country_year_summary (country_code, year);

-- Indicator trends: year-over-year change
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_indicator_trends AS
SELECT
    v.country_code,
    c.name AS country_name,
    v.indicator_code,
    i.name AS indicator_name,
    v.year,
    v.value,
    LAG(v.value) OVER (
        PARTITION BY v.country_code, v.indicator_code ORDER BY v.year
    ) AS prev_value,
    CASE
        WHEN LAG(v.value) OVER (
            PARTITION BY v.country_code, v.indicator_code ORDER BY v.year
        ) IS NOT NULL
        AND LAG(v.value) OVER (
            PARTITION BY v.country_code, v.indicator_code ORDER BY v.year
        ) != 0
        THEN ROUND(
            ((v.value - LAG(v.value) OVER (
                PARTITION BY v.country_code, v.indicator_code ORDER BY v.year
            )) / ABS(LAG(v.value) OVER (
                PARTITION BY v.country_code, v.indicator_code ORDER BY v.year
            ))) * 100, 2
        )
    END AS yoy_change_pct
FROM wb_indicator_values v
JOIN wb_countries c ON c.code = v.country_code
JOIN wb_indicators i ON i.code = v.indicator_code
WHERE v.value IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_trends_lookup
    ON mv_indicator_trends (indicator_code, country_code, year);

-- ============================================================
-- Helper function: Refresh materialized views
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_wb_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_country_year_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_indicator_trends;
END;
$$;

-- ============================================================
-- Seed reference data
-- ============================================================
INSERT INTO wb_countries (code, name, region, income_level) VALUES
    ('IND', 'India',          'South Asia',              'Lower middle income'),
    ('USA', 'United States',  'North America',           'High income'),
    ('CHN', 'China',          'East Asia & Pacific',     'Upper middle income'),
    ('GBR', 'United Kingdom', 'Europe & Central Asia',   'High income')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    income_level = EXCLUDED.income_level,
    updated_at = now();

INSERT INTO wb_indicators (code, name, description) VALUES
    ('NY.GDP.MKTP.CD', 'GDP (current US$)',            'Gross domestic product at current US dollars'),
    ('NY.GDP.PCAP.CD', 'GDP per capita (current US$)', 'GDP divided by midyear population'),
    ('SP.POP.TOTL',    'Population, total',            'Total population count based on de facto definition')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

-- ============================================================
-- RLS (optional, open read for analytics)
-- ============================================================
ALTER TABLE wb_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wb_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE wb_indicator_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE wb_raw_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wb_sync_runs ENABLE ROW LEVEL SECURITY;

-- Public read access for analytics
CREATE POLICY "Public read wb_countries"      ON wb_countries      FOR SELECT USING (true);
CREATE POLICY "Public read wb_indicators"     ON wb_indicators     FOR SELECT USING (true);
CREATE POLICY "Public read wb_indicator_values" ON wb_indicator_values FOR SELECT USING (true);
CREATE POLICY "Public read wb_sync_runs"      ON wb_sync_runs      FOR SELECT USING (true);

-- Service role can write
CREATE POLICY "Service write wb_countries"       ON wb_countries       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write wb_indicators"      ON wb_indicators      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write wb_indicator_values" ON wb_indicator_values FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write wb_raw_observations" ON wb_raw_observations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write wb_sync_runs"       ON wb_sync_runs       FOR ALL USING (true) WITH CHECK (true);
