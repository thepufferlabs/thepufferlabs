-- ============================================================
-- Analytics Query Functions (exposed via Supabase RPC)
-- These power the premium reports dashboard
-- ============================================================

-- 1. GDP trend for a single country
CREATE OR REPLACE FUNCTION get_gdp_trend(p_country TEXT)
RETURNS TABLE (
    year INT,
    gdp NUMERIC,
    gdp_per_capita NUMERIC,
    population NUMERIC,
    gdp_yoy_pct NUMERIC
)
LANGUAGE sql STABLE
AS $$
    SELECT
        s.year,
        s.gdp,
        s.gdp_per_capita,
        s.population,
        t.yoy_change_pct AS gdp_yoy_pct
    FROM mv_country_year_summary s
    LEFT JOIN mv_indicator_trends t
        ON t.country_code = s.country_code
        AND t.indicator_code = 'NY.GDP.MKTP.CD'
        AND t.year = s.year
    WHERE s.country_code = p_country
    ORDER BY s.year;
$$;

-- 2. Compare multiple countries for an indicator
CREATE OR REPLACE FUNCTION compare_countries(
    p_indicator TEXT,
    p_countries TEXT[]
)
RETURNS TABLE (
    country_code TEXT,
    country_name TEXT,
    year INT,
    value NUMERIC,
    yoy_change_pct NUMERIC
)
LANGUAGE sql STABLE
AS $$
    SELECT
        t.country_code,
        t.country_name,
        t.year,
        t.value,
        t.yoy_change_pct
    FROM mv_indicator_trends t
    WHERE t.indicator_code = p_indicator
      AND t.country_code = ANY(p_countries)
    ORDER BY t.country_code, t.year;
$$;

-- 3. Latest value per indicator per country
CREATE OR REPLACE FUNCTION get_latest_values()
RETURNS TABLE (
    country_code TEXT,
    country_name TEXT,
    region TEXT,
    indicator_code TEXT,
    indicator_name TEXT,
    year INT,
    value NUMERIC
)
LANGUAGE sql STABLE
AS $$
    SELECT DISTINCT ON (v.country_code, v.indicator_code)
        v.country_code,
        c.name AS country_name,
        c.region,
        v.indicator_code,
        i.name AS indicator_name,
        v.year,
        v.value
    FROM wb_indicator_values v
    JOIN wb_countries c ON c.code = v.country_code
    JOIN wb_indicators i ON i.code = v.indicator_code
    WHERE v.value IS NOT NULL
    ORDER BY v.country_code, v.indicator_code, v.year DESC;
$$;

-- 4. Country economic snapshot (for reports)
CREATE OR REPLACE FUNCTION get_country_snapshot(p_country TEXT)
RETURNS TABLE (
    country_name TEXT,
    region TEXT,
    income_level TEXT,
    latest_gdp NUMERIC,
    latest_gdp_per_capita NUMERIC,
    latest_population NUMERIC,
    gdp_cagr_5yr NUMERIC,
    latest_year INT
)
LANGUAGE sql STABLE
AS $$
    WITH latest AS (
        SELECT year, gdp, gdp_per_capita, population
        FROM mv_country_year_summary
        WHERE country_code = p_country AND gdp IS NOT NULL
        ORDER BY year DESC
        LIMIT 1
    ),
    five_years_ago AS (
        SELECT year, gdp
        FROM mv_country_year_summary
        WHERE country_code = p_country
          AND gdp IS NOT NULL
          AND year = (SELECT year - 5 FROM latest)
        LIMIT 1
    )
    SELECT
        c.name,
        c.region,
        c.income_level,
        l.gdp,
        l.gdp_per_capita,
        l.population,
        CASE
            WHEN f.gdp > 0 AND l.gdp > 0
            THEN ROUND((POWER(l.gdp / f.gdp, 1.0/5) - 1) * 100, 2)
        END AS gdp_cagr_5yr,
        l.year
    FROM wb_countries c
    CROSS JOIN latest l
    LEFT JOIN five_years_ago f ON true
    WHERE c.code = p_country;
$$;

-- 5. Full dashboard data (single call for the premium report)
CREATE OR REPLACE FUNCTION get_dashboard_data(
    p_countries TEXT[] DEFAULT ARRAY['IND','USA','CHN','GBR']
)
RETURNS JSON
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'latest_values', (
            SELECT json_agg(row_to_json(lv))
            FROM get_latest_values() lv
            WHERE lv.country_code = ANY(p_countries)
        ),
        'gdp_comparison', (
            SELECT json_agg(row_to_json(gc))
            FROM compare_countries('NY.GDP.MKTP.CD', p_countries) gc
        ),
        'population_comparison', (
            SELECT json_agg(row_to_json(pc))
            FROM compare_countries('SP.POP.TOTL', p_countries) pc
        ),
        'gdp_per_capita_comparison', (
            SELECT json_agg(row_to_json(gpc))
            FROM compare_countries('NY.GDP.PCAP.CD', p_countries) gpc
        ),
        'sync_status', (
            SELECT row_to_json(sr)
            FROM wb_sync_runs sr
            ORDER BY started_at DESC
            LIMIT 1
        )
    ) INTO result;

    RETURN result;
END;
$$;
