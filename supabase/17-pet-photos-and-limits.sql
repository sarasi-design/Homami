-- Homami setup, part 17: private pet photos, and limits against spam
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run scripts 01–16 first.
--
-- What this changes (Sara, Nov 13, 2026; see docs/decisions.md)
--   * Pet photos go in their own private folder ("pet-photos"), like post photos (script 16): only the owner
--     and their circle can open them, through links that stop working after an hour. Pets were already
--     circle-only; now their photos are too. Photos added before this stay where they were until replaced.
--   * A pet's photo can only come from your own folder.
--   * Limits against spam, high enough that nobody using Homami normally will meet them:
--       messages          20 a minute, 500 a day
--       booking requests  10 a day
--     The person sees a short message asking them to wait.
--   * Reviews (script 16, sitter reviews) need a login too, like every other members-only action since
--     the security script (16, security hardening): visitors can't read review numbers or write reviews.

-- 1. A private folder for pet photos -----------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Pet photos: add to your own folder" on storage.objects;
drop policy if exists "Pet photos: you and your circle can see them" on storage.objects;
drop policy if exists "Pet photos: delete your own" on storage.objects;

-- Every photo lives in a folder named after its owner: <their id>/<random name>.jpg
create policy "Pet photos: add to your own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Pet photos: you and your circle can see them"
  on storage.objects for select to authenticated
  using (
    -- "case" makes sure only pet photos are looked at here (their folder names are always ids)
    case when bucket_id = 'pet-photos' then
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.in_my_circle(((storage.foldername(name))[1])::uuid)
    else false end
  );

create policy "Pet photos: delete your own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 2. A pet's photo has to be yours -------------------------------------------------------------
-- New photos: where it lives in the private folder ("<your id>/<name>.jpg").
-- Older photos kept a public link to your own folder in "avatars"; those still work.
create or replace function public.is_own_photo(photo text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select photo is null
    or photo like (select auth.uid())::text || '/%'
    or photo like '%/storage/v1/object/public/avatars/' || (select auth.uid())::text || '/%';
$$;
revoke execute on function public.is_own_photo(text) from public, anon;
grant execute on function public.is_own_photo(text) to authenticated;

drop policy if exists "Add your own pets" on public.pets;
create policy "Add your own pets"
  on public.pets for insert to authenticated
  with check ((select auth.uid()) = owner_id and public.is_own_photo(photo_url));

drop policy if exists "Edit your own pets" on public.pets;
create policy "Edit your own pets"
  on public.pets for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id and public.is_own_photo(photo_url));

-- 3. Limits against spam -----------------------------------------------------------------------
create index if not exists messages_sender_time on public.messages (sender_id, created_at desc);
create index if not exists bookings_owner_time on public.bookings (owner_id, created_at desc);

create or replace function public.limit_messages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.messages m where m.sender_id = new.sender_id and m.created_at > now() - interval '1 minute') >= 20 then
    raise exception 'You’re sending messages very quickly. Please wait a minute and try again.';
  end if;
  if (select count(*) from public.messages m where m.sender_id = new.sender_id and m.created_at > now() - interval '1 day') >= 500 then
    raise exception 'You’ve sent a lot of messages today. Please try again tomorrow.';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_messages() from public, anon, authenticated;

drop trigger if exists limit_messages on public.messages;
create trigger limit_messages before insert on public.messages
  for each row execute function public.limit_messages();

create or replace function public.limit_booking_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.bookings b where b.owner_id = new.owner_id and b.created_at > now() - interval '1 day') >= 10 then
    raise exception 'You’ve sent a lot of booking requests today. Please try again tomorrow.';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_booking_requests() from public, anon, authenticated;

drop trigger if exists limit_booking_requests on public.bookings;
create trigger limit_booking_requests before insert on public.bookings
  for each row execute function public.limit_booking_requests();

-- 4. Reviews are for members only -------------------------------------------------------------
-- (Skipped if the sitter reviews script hasn't been run yet.)
do $$
declare f text;
begin
  foreach f in array array[
    'public.review_sitter(uuid, integer, boolean, text)',
    'public.sitter_review_summaries(uuid[])',
    'public.sitter_reviews_for(uuid)'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('revoke execute on function %s from public, anon', f);
      execute format('grant execute on function %s to authenticated', f);
    end if;
  end loop;
end $$;
