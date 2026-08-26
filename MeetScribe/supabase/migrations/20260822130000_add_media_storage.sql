-- Create the private "media" bucket (also declared in config.toml for local dev).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  524288000,
  array['video/*', 'audio/*', 'text/plain', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored under `{user_id}/...`, so ownership is derived from the path.
create policy "Users manage their own media"
  on storage.objects for all
  using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);

alter table files add column summary text;

-- RLS policies alone don't expose a table through the Data API on this CLI version;
-- the role also needs explicit table privileges (RLS then restricts it to owned rows).
grant select, insert, update, delete on public.files to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
