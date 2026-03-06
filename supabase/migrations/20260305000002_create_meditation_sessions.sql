create table if not exists public.meditation_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id),
  logged_at         timestamptz not null,
  duration_minutes  integer not null check (duration_minutes > 0),
  created_at        timestamptz default now()
);

alter table public.meditation_sessions enable row level security;

create policy "users can manage own meditation sessions"
  on public.meditation_sessions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
