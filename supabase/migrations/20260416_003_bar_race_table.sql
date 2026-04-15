-- ============================================================
-- Bar Race Aggregation: Top 30 countries per indicator per year
-- Pre-joined with country names, ready for frontend
-- ============================================================

CREATE TABLE IF NOT EXISTS wb_bar_race (
    indicator_code TEXT NOT NULL,
    year           INT NOT NULL,
    rank           INT NOT NULL,
    country_code   TEXT NOT NULL,
    country_name   TEXT NOT NULL,
    value          NUMERIC NOT NULL,

    PRIMARY KEY (indicator_code, year, country_code)
);

CREATE INDEX IF NOT EXISTS idx_wbr_indicator_year ON wb_bar_race (indicator_code, year);

ALTER TABLE wb_bar_race ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read wb_bar_race" ON wb_bar_race;
CREATE POLICY "Public read wb_bar_race" ON wb_bar_race FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write wb_bar_race" ON wb_bar_race;
CREATE POLICY "Service write wb_bar_race" ON wb_bar_race FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Refresh function
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_wb_bar_race()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    TRUNCATE wb_bar_race;

    INSERT INTO wb_bar_race (indicator_code, year, rank, country_code, country_name, value)
    SELECT
        ranked.indicator_code,
        ranked.year,
        ranked.rnk,
        ranked.country_code,
        ranked.country_name,
        ranked.value
    FROM (
        SELECT
            v.indicator_code,
            v.year,
            v.country_code,
            COALESCE(c.name, v.country_code) AS country_name,
            v.value,
            ROW_NUMBER() OVER (
                PARTITION BY v.indicator_code, v.year
                ORDER BY v.value DESC
            ) AS rnk
        FROM wb_indicator_values v
        LEFT JOIN wb_countries c ON c.code = v.country_code
        WHERE v.value IS NOT NULL
          AND v.indicator_code IN (
              'NY.GDP.MKTP.CD', 'NY.GDP.PCAP.CD', 'SP.POP.TOTL',
              'NY.GDP.MKTP.KD.ZG', 'FP.CPI.TOTL.ZG', 'SL.UEM.TOTL.ZS',
              'IT.NET.USER.ZS', 'SP.DYN.LE00.IN', 'NE.TRD.GNFS.ZS'
          )
    ) ranked
    WHERE ranked.rnk <= 30;
END;
$$;

COMMENT ON FUNCTION refresh_wb_bar_race() IS
    'Rebuilds wb_bar_race with top 30 countries per indicator per year. Call after data sync.';
