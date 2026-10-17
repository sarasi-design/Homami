-- Homami setup, part 2: profile photos
-- Paste all of this into Supabase → SQL Editor → New query, then press Run.
-- Safe to run again: it updates the folder and replaces the rules if they already exist.
--
-- What it creates
--   A photo folder called "avatars". Anyone with the link can view a photo (so it shows in the app),
--   but people can only add, replace or delete photos in their own folder.
--   Photos are limited to 2 MB and to JPEG, PNG or WebP (the app shrinks them before uploading).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "See your own photos" on storage.objects;
drop policy if exists "Add photos to your own folder" on storage.objects;
drop policy if exists "Replace your own photos" on storage.objects;
drop policy if exists "Delete your own photos" on storage.objects;

-- Each person's photos live in a folder named after their account id, e.g. avatars/<id>/photo.jpg

create policy "See your own photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Add photos to your own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Replace your own photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Delete your own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
