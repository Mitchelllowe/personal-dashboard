create table personal_checkins (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users not null default auth.uid(),
  date       date        not null default current_date,
  value      boolean     not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table personal_checkins enable row level security;

create policy "Users can manage own personal checkins"
  on personal_checkins
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
