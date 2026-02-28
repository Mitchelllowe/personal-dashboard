-- User-specific settings (zip code, resolved lat/lon)
create table if not exists public.user_settings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null unique,
  zip_code   text,
  lat        numeric,
  lon        numeric,
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "users can read their own settings"
  on public.user_settings for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can upsert their own settings"
  on public.user_settings for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can update their own settings"
  on public.user_settings for update
  to authenticated
  using (user_id = auth.uid());

-- Daily weather snapshots (no user_id — same weather for all users)
create table if not exists public.weather_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  date               date not null unique,
  feels_like_max_f   numeric,
  feels_like_min_f   numeric,
  precipitation_in   numeric,
  sunrise            text,   -- local time string, e.g. "2026-02-27T06:45"
  sunset             text,   -- local time string, e.g. "2026-02-27T17:52"
  daylight_hours     numeric,
  weather_code       integer,
  created_at         timestamptz default now()
);

alter table public.weather_snapshots enable row level security;

create policy "authenticated users can read weather snapshots"
  on public.weather_snapshots for select
  to authenticated
  using (true);
