-- Without this, the `files` row's status/transcript updates never reach
-- subscribed clients (Dashboard, Files, FileDetail) — they'd need a manual
-- reload to see 'processing' flip to 'ready'.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'files'
  ) then
    alter publication supabase_realtime add table public.files;
  end if;
end $$;

