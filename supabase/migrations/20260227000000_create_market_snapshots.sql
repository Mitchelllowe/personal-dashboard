create table if not exists public.market_snapshots (
  id          uuid primary key default gen_random_uuid(),
  date        date    not null,
  symbol      text    not null,
  open        numeric,
  high        numeric,
  low         numeric,
  close       numeric not null,
  volume      bigint,
  created_at  timestamptz default now(),

  unique (date, symbol)
);

alter table public.market_snapshots enable row level security;

-- Authenticated users can read market data
create policy "authenticated users can read market snapshots"
  on public.market_snapshots
  for select
  to authenticated
  using (true);
