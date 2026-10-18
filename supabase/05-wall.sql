-- Homami setup, part 5: the wall (pet updates)
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
--
-- What it creates
--   posts  an update from someone about their pets: text and/or a photo, optionally about one of their pets.
--   Who sees a post: the author and the people in their circle. Nobody else.
--   Only the author can delete it. Post photos go in your own folder of the "avatars" photo store.

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  pet_id      uuid references public.pets (id) on delete set null,
  body        text check (char_length(body) <= 500),
  photo_url   text,
  created_at  timestamptz not null default now(),
  check (char_length(trim(coalesce(body, ''))) > 0 or photo_url is not null)  -- not completely empty
);

create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);

alter table public.posts enable row level security;

drop policy if exists "See your posts and your circle's posts" on public.posts;
create policy "See your posts and your circle's posts"
  on public.posts for select to authenticated
  using ((select auth.uid()) = author_id or public.in_my_circle(author_id));

drop policy if exists "Post as yourself, about your own pets" on public.posts;
create policy "Post as yourself, about your own pets"
  on public.posts for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and (pet_id is null or exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = (select auth.uid())))
  );

drop policy if exists "Delete your own posts" on public.posts;
create policy "Delete your own posts"
  on public.posts for delete to authenticated
  using ((select auth.uid()) = author_id);
