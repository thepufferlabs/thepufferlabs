-- ============================================================
-- Sample Analytics Queries (reference / testing)
-- Run these after data has been ingested
-- ============================================================

-- 1. GDP trend for India (2010–2024)
-- SELECT * FROM get_gdp_trend('IND');

-- 2. Compare GDP across 4 countries
-- SELECT * FROM compare_countries('NY.GDP.MKTP.CD', ARRAY['IND','USA','CHN','GBR']);

-- 3. Latest value for every indicator/country combination
-- SELECT * FROM get_latest_values();

-- 4. Full country economic snapshot
-- SELECT * FROM get_country_snapshot('IND');

-- 5. Complete dashboard payload (single call)
-- SELECT * FROM get_dashboard_data(ARRAY['IND','USA','CHN','GBR']);

-- 6. Top GDP growth years across all countries
-- SELECT country_name, year, yoy_change_pct
-- FROM mv_indicator_trends
-- WHERE indicator_code = 'NY.GDP.MKTP.CD'
--   AND yoy_change_pct IS NOT NULL
-- ORDER BY yoy_change_pct DESC
-- LIMIT 20;

-- 7. Population growth comparison (last 10 years)
-- SELECT country_code, country_name, year, value, yoy_change_pct
-- FROM mv_indicator_trends
-- WHERE indicator_code = 'SP.POP.TOTL'
--   AND year >= 2014
-- ORDER BY country_code, year;

-- 8. Countries where GDP per capita exceeded $40K
-- SELECT country_name, year, value
-- FROM mv_indicator_trends
-- WHERE indicator_code = 'NY.GDP.PCAP.CD'
--   AND value > 40000
-- ORDER BY value DESC;

-- 9. Sync run history
-- SELECT run_id, status, started_at, finished_at,
--        rows_inserted, rows_updated, error_message
-- FROM wb_sync_runs
-- ORDER BY started_at DESC
-- LIMIT 10;

-- 10. Raw observation audit trail for a specific run
-- SELECT id, request_url, page, total_pages, fetched_at
-- FROM wb_raw_observations
-- WHERE job_run_id = '<run-uuid>'
-- ORDER BY page;
