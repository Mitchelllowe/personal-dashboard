-- Update schedule to 6 PM EST (23:00 UTC)
-- Note: during daylight saving time (EDT) this fires at 7 PM local — market is still closed
select cron.unschedule('fetch-market-data-daily');

select cron.schedule(
  'fetch-market-data-daily',
  '0 23 * * *',
  format(
    $$ select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb) $$,
    'https://nokikpejyosizfaaklva.supabase.co/functions/v1/fetch-market-data',
    '{"Content-Type": "application/json"}',
    '{}'
  )
);
