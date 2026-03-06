-- Move Oura fetch cron from 6 PM EST to 8 AM EST (13:00 UTC) as a morning fallback
select cron.unschedule('fetch-oura-data-daily');

select cron.schedule(
  'fetch-oura-data-daily',
  '0 13 * * *',
  format(
    $$ select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb) $$,
    'https://nokikpejyosizfaaklva.supabase.co/functions/v1/fetch-oura-data',
    '{"Content-Type": "application/json"}',
    '{"days": 1}'
  )
);
