-- Homami setup, part 3: pets
-- Paste all of this into Supabase → SQL Editor → New query, then press Run.
-- Safe to run again.
--
-- What it creates
--   pets  one row per pet: dog or cat, name, age, a short description and a photo.
--   For now only the owner can see and change their pets.
--   Letting your circle see them is added with the circle script.
--   Pet photos go in the same "avatars" photo folder as profile pictures (your own folder only).

create table if not exists public.pets (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind         text not null check (kind in ('dog', 'cat')),
  name         text not null check (char_length(name) between 1 and 40),
  age          text check (char_length(age) <= 30),          -- as people write it, e.g. "9" or "4 months"
  description  text check (char_length(description) <= 300),
  photo_url    text,
  created_at   timestamptz not null default now()
);

create index if not exists pets_owner_id_idx on public.pets (owner_id);

alter table public.pets enable row level security;

drop policy if exists "See your own pets" on public.pets;
drop policy if exists "Add your own pets" on public.pets;
drop policy if exists "Edit your own pets" on public.pets;
drop policy if exists "Remove your own pets" on public.pets;

create policy "See your own pets"
  on public.pets for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Add your own pets"
  on public.pets for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Edit your own pets"
  on public.pets for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Remove your own pets"
  on public.pets for delete to authenticated
  using ((select auth.uid()) = owner_id);
