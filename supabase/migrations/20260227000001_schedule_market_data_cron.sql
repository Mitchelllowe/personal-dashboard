-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Schedule the market data fetch daily at midnight UTC (7–8 PM ET)
-- verify_jwt is disabled on the function so no auth header is needed
select cron.schedule(
  'fetch-market-data-daily',
  '0 0 * * *',
  format(
    $$ select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb) $$,
    'https://nokikpejyosizfaaklva.supabase.co/functions/v1/fetch-market-data',
    '{"Content-Type": "application/json"}',
    '{}'
  )
);
