-- Lets the transcription backend record a failed job instead of leaving a
-- file's status stuck at 'processing' forever when AssemblyAI, Gemini, or
-- the follow-up DB write fails.
alter type file_status add value if not exists 'error';
