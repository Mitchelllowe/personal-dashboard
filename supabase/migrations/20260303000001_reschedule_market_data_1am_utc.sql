-- Reschedule market data fetch to 01:00 UTC (8 PM EST / 9 PM EDT).
-- The previous schedule (23:00 UTC) ran before UTC midnight, so Polygon's
-- /prev endpoint returned the prior UTC day's close — one trading day behind.
-- At 01:00 UTC the UTC date has rolled forward, so /prev correctly returns
-- the previous trading session's close.
select cron.unschedule('fetch-market-data-daily');

select cron.schedule(
  'fetch-market-data-daily',
  '0 1 * * *',
  format(
    $$ select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb) $$,
    'https://nokikpejyosizfaaklva.supabase.co/functions/v1/fetch-market-data',
    '{"Content-Type": "application/json"}',
    '{}'
  )
);
