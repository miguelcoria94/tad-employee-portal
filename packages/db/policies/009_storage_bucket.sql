-- Storage bucket for Updates & Events media uploads. Public read; writes are
-- proxied through the API using the service role, so we don't need to grant
-- write permission on storage.objects to any role here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'updates-media',
  'updates-media',
  true,
  10485760, -- 10 MB
  array['image/png','image/jpeg','image/gif','image/webp','image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for anything in this bucket (objects are HTML-embedded images
-- so they need to be fetchable by anyone with the URL).
drop policy if exists "updates_media_public_read" on storage.objects;
create policy "updates_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'updates-media');
