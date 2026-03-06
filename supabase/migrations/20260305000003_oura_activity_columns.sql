alter table public.oura_snapshots
  add column if not exists activity_score        integer,
  add column if not exists steps                 integer,
  add column if not exists active_calories       integer,
  add column if not exists high_activity_seconds integer,
  add column if not exists medium_activity_seconds integer,
  add column if not exists sedentary_seconds     integer;
