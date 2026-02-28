create table if not exists public.check_ins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date    not null,
  type        text    not null check (type in ('morning', 'evening')),
  mood_rating integer not null check (mood_rating between 1 and 10),
  created_at  timestamptz default now(),

  unique (user_id, date, type)
);

alter table public.check_ins enable row level security;

create policy "users can read their own check-ins"
  on public.check_ins for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can insert their own check-ins"
  on public.check_ins for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can update their own check-ins"
  on public.check_ins for update
  to authenticated
  using (user_id = auth.uid());
