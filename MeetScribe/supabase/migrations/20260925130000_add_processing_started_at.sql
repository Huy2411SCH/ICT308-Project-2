-- Records when the current transcription attempt started, so the UI can offer
-- a retry for files stuck in 'processing' (e.g. the backend restarted
-- mid-job). created_at can't be used because a retry doesn't change it.
alter table files add column if not exists processing_started_at timestamptz;
update files set processing_started_at = created_at where processing_started_at is null;
alter table files alter column processing_started_at set default now();
