-- Add energy rating to check-ins
alter table public.check_ins
  add column if not exists energy_rating integer;

-- Workout sessions (Oura-synced + manually logged)
create table if not exists public.workout_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id),  -- null for Oura-synced
  source              text not null default 'manual',  -- 'oura' | 'manual'
  day                 date not null,
  activity            text not null,
  duration_seconds    integer,
  intensity           text,
  calories            integer,
  distance_meters     numeric,
  average_heart_rate  integer,
  oura_id             text unique,
  created_at          timestamptz default now()
);

alter table public.workout_sessions enable row level security;

create policy "authenticated users can read all workout sessions"
  on public.workout_sessions for select
  to authenticated using (true);

create policy "users can insert own manual workout sessions"
  on public.workout_sessions for insert
  to authenticated
  with check (auth.uid() = user_id and source = 'manual');

create policy "service role can insert oura workout sessions"
  on public.workout_sessions for insert
  to service_role with check (true);
