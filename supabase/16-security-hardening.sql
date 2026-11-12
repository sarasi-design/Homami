-- Homami setup, part 16: keeping post photos private, and a few safety fixes
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run scripts 01–15 first. Then update the "payments" Edge Function too (supabase/functions/payments/index.ts).
--
-- What this changes (decided with Sara, Nov 12, 2026; see docs/decisions.md)
--   * Post photos go in their own private folder ("post-photos"). Only the person who posted and
--     their circle can open them, through links that stop working after an hour. Before, post photos
--     sat in the public "avatars" folder: anyone with the link could open them.
--     Profile photos and pet photos stay where they are for now.
--   * A post's photo can only come from your own folder, so nobody can show someone else's photo
--     or a picture from another website in a post.
--   * Free bookings (exchanges) can't be accepted once their first day has passed.
--     (Paid bookings get the same rule in the payments function.)
--   * Database actions that need a login can't be called without one any more.
--     Only "is this invitation code valid?" stays open, because sign-up needs it.

-- 1. A private folder for post photos ----------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Post photos: add to your own folder" on storage.objects;
drop policy if exists "Post photos: you and your circle can see them" on storage.objects;
drop policy if exists "Post photos: delete your own" on storage.objects;

-- Every photo lives in a folder named after the person who posted it: <their id>/<random name>.jpg
create policy "Post photos: add to your own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Post photos: you and your circle can see them"
  on storage.objects for select to authenticated
  using (
    -- "case" makes sure only post photos are looked at here (their folder names are always ids)
    case when bucket_id = 'post-photos' then
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.in_my_circle(((storage.foldername(name))[1])::uuid)
    else false end
  );

create policy "Post photos: delete your own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 2. A post's photo has to be yours -------------------------------------------------------------
-- New posts store the photo's place in the private folder ("<your id>/<name>.jpg").
-- Older posts kept a public link to your own photo in "avatars"; those still work.
drop policy if exists "Post as yourself, about your own pets" on public.posts;
create policy "Post as yourself, about your own pets"
  on public.posts for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and (pet_id is null or exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = (select auth.uid())))
    and (
      photo_url is null
      or photo_url like (select auth.uid())::text || '/%'
      or photo_url like '%/storage/v1/object/public/avatars/' || (select auth.uid())::text || '/%'
    )
  );

-- 3. Free bookings can't be accepted after their first day ---------------------------------------
create or replace function public.accept_free_booking(booking uuid)
returns public.bookings
language sql
security definer
set search_path = ''
as $$
  update public.bookings set status = 'accepted', updated_at = now()
  where id = booking
    and sitter_id = (select auth.uid())
    and status = 'requested'
    and total_cents = 0
    and start_date >= (now() at time zone 'Europe/Madrid')::date
  returning *;
$$;
grant execute on function public.accept_free_booking(uuid) to authenticated;

-- 4. Actions that need a login: not open to visitors who aren't logged in --------------------------
-- Supabase lets anyone call database functions unless told otherwise. These only make sense with a
-- login, so visitors without one are turned away. Functions from scripts you haven't run are skipped.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.in_my_circle(uuid)',
    'public.in_my_extended_circle(uuid)',
    'public.invite_owner(text)',
    'public.join_circle(text)',
    'public.my_circle()',
    'public.my_extended_circle()',
    'public.new_invite_code()',
    'public.create_invite_code()',
    'public.chatted_with(uuid)',
    'public.can_message(uuid)',
    'public.my_chats()',
    'public.mark_chat_read(uuid)',
    'public.can_be_paid(uuid)',
    'public.request_booking(uuid, text, date, date, integer, uuid[], text)',
    'public.cancel_booking(uuid)',
    'public.decline_booking(uuid)',
    'public.accept_free_booking(uuid)',
    'public.cancel_booking_with_reason(uuid, text, text)'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('revoke execute on function %s from public, anon', f);
    end if;
  end loop;
end $$;

-- Only Homami's own setup makes invite codes; nobody calls this directly
do $$
begin
  if to_regprocedure('public.new_invite_code()') is not null then
    revoke execute on function public.new_invite_code() from authenticated;
  end if;
end $$;
