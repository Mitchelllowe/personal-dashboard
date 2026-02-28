-- Schedule weather fetch daily at 6 PM EST (23:00 UTC), same window as market data
select cron.schedule(
  'fetch-weather-data-daily',
  '0 23 * * *',
  format(
    $$ select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb) $$,
    'https://nokikpejyosizfaaklva.supabase.co/functions/v1/fetch-weather-data',
    '{"Content-Type": "application/json"}',
    '{}'
  )
);
