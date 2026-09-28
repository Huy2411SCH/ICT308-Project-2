-- Media is auto-deleted 7 days after upload by the cleanup-expired-media Edge
-- Function; the row (transcript, summary) is kept. This flag lets the UI
-- explain why the recording is gone.
alter table files add column if not exists media_expired boolean not null default false;

-- Speeds up the cleanup job's "old files that still have media" lookup.
create index if not exists files_media_cleanup_idx
  on files (created_at) where media_url is not null;
