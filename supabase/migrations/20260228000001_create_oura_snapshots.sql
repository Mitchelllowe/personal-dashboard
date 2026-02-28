create table if not exists public.oura_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  date                  date not null unique,
  sleep_score           integer,
  total_sleep_seconds   integer,
  deep_sleep_seconds    integer,
  rem_sleep_seconds     integer,
  light_sleep_seconds   integer,
  average_hrv           numeric,
  average_heart_rate    numeric,
  sleep_efficiency      integer,
  readiness_score       integer,
  temperature_deviation numeric,
  stress_high_minutes   integer,
  recovery_high_minutes integer,
  day_summary           text,
  created_at            timestamptz default now()
);

alter table public.oura_snapshots enable row level security;

create policy "authenticated users can read oura snapshots"
  on public.oura_snapshots for select
  to authenticated
  using (true);

-- Schedule Oura fetch daily at 6 PM EST (23:00 UTC)
select cron.schedule(
  'fetch-oura-data-daily',
  '0 23 * * *',
  format(
    $$ select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb) $$,
    'https://nokikpejyosizfaaklva.supabase.co/functions/v1/fetch-oura-data',
    '{"Content-Type": "application/json"}',
    '{}'
  )
);
