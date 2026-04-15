-- ============================================================
-- Flat Aggregation Table: Pre-computed analytics per country
-- Refreshed after every data sync
-- ============================================================

-- 1. Latest value per country per indicator (with YoY + rank)
CREATE TABLE IF NOT EXISTS wb_country_latest (
    country_code   TEXT NOT NULL,
    country_name   TEXT NOT NULL,
    region         TEXT,
    income_level   TEXT,
    indicator_code TEXT NOT NULL,
    indicator_name TEXT,
    latest_year    INT NOT NULL,
    latest_value   NUMERIC,
    prev_value     NUMERIC,
    yoy_change_pct NUMERIC,
    global_rank    INT,
    regional_rank  INT,
    min_value      NUMERIC,
    max_value      NUMERIC,
    avg_value      NUMERIC,
    data_points    INT DEFAULT 0,
    first_year     INT,
    updated_at     TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY (country_code, indicator_code)
);

CREATE INDEX IF NOT EXISTS idx_wbl_indicator ON wb_country_latest (indicator_code);
CREATE INDEX IF NOT EXISTS idx_wbl_region ON wb_country_latest (region);
CREATE INDEX IF NOT EXISTS idx_wbl_rank ON wb_country_latest (indicator_code, global_rank);
CREATE INDEX IF NOT EXISTS idx_wbl_country ON wb_country_latest (country_code);

-- RLS
ALTER TABLE wb_country_latest ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read wb_country_latest" ON wb_country_latest;
CREATE POLICY "Public read wb_country_latest" ON wb_country_latest FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write wb_country_latest" ON wb_country_latest;
CREATE POLICY "Service write wb_country_latest" ON wb_country_latest FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 2. Country summary: one row per country with key metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS wb_country_summary (
    country_code     TEXT PRIMARY KEY,
    country_name     TEXT NOT NULL,
    region           TEXT,
    income_level     TEXT,
    -- Economy
    gdp              NUMERIC,
    gdp_year         INT,
    gdp_growth_pct   NUMERIC,
    gdp_per_capita   NUMERIC,
    gni_per_capita   NUMERIC,
    -- People
    population       NUMERIC,
    pop_growth_pct   NUMERIC,
    urban_pct        NUMERIC,
    life_expectancy  NUMERIC,
    literacy_pct     NUMERIC,
    -- Work
    unemployment_pct NUMERIC,
    labor_force_pct  NUMERIC,
    inflation_pct    NUMERIC,
    -- Trade
    trade_pct_gdp    NUMERIC,
    fdi_net          NUMERIC,
    -- Infra
    internet_pct     NUMERIC,
    electric_kwh     NUMERIC,
    co2_per_capita   NUMERIC,
    -- Spending
    health_pct_gdp   NUMERIC,
    edu_pct_gdp      NUMERIC,
    -- Rankings
    gdp_rank         INT,
    gdp_pc_rank      INT,
    pop_rank         INT,
    -- Meta
    latest_year      INT,
    indicator_count  INT DEFAULT 0,
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wcs_region ON wb_country_summary (region);
CREATE INDEX IF NOT EXISTS idx_wcs_gdp_rank ON wb_country_summary (gdp_rank);
CREATE INDEX IF NOT EXISTS idx_wcs_income ON wb_country_summary (income_level);

ALTER TABLE wb_country_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read wb_country_summary" ON wb_country_summary;
CREATE POLICY "Public read wb_country_summary" ON wb_country_summary FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write wb_country_summary" ON wb_country_summary;
CREATE POLICY "Service write wb_country_summary" ON wb_country_summary FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 3. Refresh function: rebuilds both tables from raw data
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_wb_aggregations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- ── Step 1: Rebuild wb_country_latest ──────────────────────
    TRUNCATE wb_country_latest;

    -- Insert latest value per country+indicator with stats
    INSERT INTO wb_country_latest (
        country_code, country_name, region, income_level,
        indicator_code, indicator_name,
        latest_year, latest_value, prev_value, yoy_change_pct,
        min_value, max_value, avg_value, data_points, first_year
    )
    SELECT
        v.country_code,
        COALESCE(c.name, v.country_code),
        c.region,
        c.income_level,
        v.indicator_code,
        COALESCE(i.name, v.indicator_code),
        v.year AS latest_year,
        v.value AS latest_value,
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
        END AS yoy_change_pct,
        stats.min_val,
        stats.max_val,
        stats.avg_val,
        stats.cnt,
        stats.first_yr
    FROM wb_indicator_values v
    LEFT JOIN wb_countries c ON c.code = v.country_code
    LEFT JOIN wb_indicators i ON i.code = v.indicator_code
    LEFT JOIN LATERAL (
        SELECT
            MIN(s.value) AS min_val,
            MAX(s.value) AS max_val,
            ROUND(AVG(s.value), 2) AS avg_val,
            COUNT(*) AS cnt,
            MIN(s.year) AS first_yr
        FROM wb_indicator_values s
        WHERE s.country_code = v.country_code
          AND s.indicator_code = v.indicator_code
          AND s.value IS NOT NULL
    ) stats ON true
    WHERE v.value IS NOT NULL
      AND v.year = (
          SELECT MAX(v2.year)
          FROM wb_indicator_values v2
          WHERE v2.country_code = v.country_code
            AND v2.indicator_code = v.indicator_code
            AND v2.value IS NOT NULL
      );

    -- Compute global ranks per indicator
    UPDATE wb_country_latest l
    SET global_rank = sub.rnk
    FROM (
        SELECT country_code, indicator_code,
               RANK() OVER (PARTITION BY indicator_code ORDER BY latest_value DESC) AS rnk
        FROM wb_country_latest
        WHERE latest_value IS NOT NULL
    ) sub
    WHERE l.country_code = sub.country_code
      AND l.indicator_code = sub.indicator_code;

    -- Compute regional ranks
    UPDATE wb_country_latest l
    SET regional_rank = sub.rnk
    FROM (
        SELECT country_code, indicator_code,
               RANK() OVER (PARTITION BY indicator_code, region ORDER BY latest_value DESC) AS rnk
        FROM wb_country_latest
        WHERE latest_value IS NOT NULL AND region IS NOT NULL
    ) sub
    WHERE l.country_code = sub.country_code
      AND l.indicator_code = sub.indicator_code;

    -- ── Step 2: Rebuild wb_country_summary ─────────────────────
    TRUNCATE wb_country_summary;

    INSERT INTO wb_country_summary (
        country_code, country_name, region, income_level,
        gdp, gdp_year, gdp_growth_pct, gdp_per_capita, gni_per_capita,
        population, pop_growth_pct, urban_pct, life_expectancy, literacy_pct,
        unemployment_pct, labor_force_pct, inflation_pct,
        trade_pct_gdp, fdi_net,
        internet_pct, electric_kwh, co2_per_capita,
        health_pct_gdp, edu_pct_gdp,
        latest_year, indicator_count
    )
    SELECT
        cl.country_code,
        MAX(cl.country_name),
        MAX(cl.region),
        MAX(cl.income_level),
        MAX(CASE WHEN cl.indicator_code = 'NY.GDP.MKTP.CD'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'NY.GDP.MKTP.CD'   THEN cl.latest_year  END),
        MAX(CASE WHEN cl.indicator_code = 'NY.GDP.MKTP.KD.ZG' THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'NY.GDP.PCAP.CD'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'NY.GNP.PCAP.CD'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SP.POP.TOTL'      THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SP.POP.GROW'      THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SP.URB.TOTL.IN.ZS' THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SP.DYN.LE00.IN'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SE.ADT.LITR.ZS'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SL.UEM.TOTL.ZS'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SL.TLF.CACT.ZS'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'FP.CPI.TOTL.ZG'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'NE.TRD.GNFS.ZS'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'BX.KLT.DINV.CD.WD' THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'IT.NET.USER.ZS'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'EG.USE.ELEC.KH.PC' THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'EN.ATM.CO2E.PC'   THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SH.XPD.CHEX.GD.ZS' THEN cl.latest_value END),
        MAX(CASE WHEN cl.indicator_code = 'SE.XPD.TOTL.GD.ZS' THEN cl.latest_value END),
        MAX(cl.latest_year),
        COUNT(DISTINCT cl.indicator_code)
    FROM wb_country_latest cl
    GROUP BY cl.country_code;

    -- Compute GDP rank
    UPDATE wb_country_summary s
    SET gdp_rank = sub.rnk
    FROM (
        SELECT country_code, RANK() OVER (ORDER BY gdp DESC NULLS LAST) AS rnk
        FROM wb_country_summary WHERE gdp IS NOT NULL
    ) sub WHERE s.country_code = sub.country_code;

    -- GDP per capita rank
    UPDATE wb_country_summary s
    SET gdp_pc_rank = sub.rnk
    FROM (
        SELECT country_code, RANK() OVER (ORDER BY gdp_per_capita DESC NULLS LAST) AS rnk
        FROM wb_country_summary WHERE gdp_per_capita IS NOT NULL
    ) sub WHERE s.country_code = sub.country_code;

    -- Population rank
    UPDATE wb_country_summary s
    SET pop_rank = sub.rnk
    FROM (
        SELECT country_code, RANK() OVER (ORDER BY population DESC NULLS LAST) AS rnk
        FROM wb_country_summary WHERE population IS NOT NULL
    ) sub WHERE s.country_code = sub.country_code;

    -- Set updated_at
    UPDATE wb_country_latest SET updated_at = now();
    UPDATE wb_country_summary SET updated_at = now();
END;
$$;

COMMENT ON FUNCTION refresh_wb_aggregations() IS
    'Rebuilds wb_country_latest and wb_country_summary from raw wb_indicator_values. Call after every data sync.';
