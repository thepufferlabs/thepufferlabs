-- ============================================================
-- Cron Scheduling for World Bank Data Sync
-- Requires pg_cron extension (enabled in Supabase dashboard)
-- ============================================================

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily sync at 2:00 AM UTC
SELECT cron.schedule(
    'wb-daily-sync',
    '0 2 * * *',   -- Daily at 02:00 UTC
    $$
    SELECT
        net.http_post(
            url := current_setting('app.settings.supabase_url') || '/functions/v1/wb-sync',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"countries":["IND","USA","CHN","GBR"],"indicators":["NY.GDP.MKTP.CD","NY.GDP.PCAP.CD","SP.POP.TOTL"]}'::jsonb
        );
    $$
);

-- Verify cron is scheduled
-- SELECT * FROM cron.job;
