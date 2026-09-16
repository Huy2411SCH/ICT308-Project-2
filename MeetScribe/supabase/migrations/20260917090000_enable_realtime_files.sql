-- Without this, the `files` row's status/transcript updates never reach
-- subscribed clients (Dashboard, Files, FileDetail) — they'd need a manual
-- reload to see 'processing' flip to 'ready'.
alter publication supabase_realtime add table public.files;
