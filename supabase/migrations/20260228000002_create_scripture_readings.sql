create table if not exists public.scripture_readings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  read_at    timestamptz not null,
  selections jsonb not null default '[]', -- [{"book":"John","chapters":[3,4]}]
  created_at timestamptz default now()
);

alter table public.scripture_readings enable row level security;

create policy "users can read their own scripture readings"
  on public.scripture_readings for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can insert their own scripture readings"
  on public.scripture_readings for insert
  to authenticated
  with check (user_id = auth.uid());
