-- Allow .docx uploads to the "media" bucket alongside existing audio/video/txt/pdf types.
update storage.buckets
set allowed_mime_types = array['video/*', 'audio/*', 'text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
where id = 'media';
