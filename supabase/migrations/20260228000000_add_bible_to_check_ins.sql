alter table public.check_ins
  add column if not exists bible_read       boolean,
  add column if not exists bible_selections jsonb; -- [{"book":"John","chapters":[3,4]}]
