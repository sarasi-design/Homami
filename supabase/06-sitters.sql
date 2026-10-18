-- Homami setup, part 6: pet sitters
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
--
-- What it adds (decided Oct 18, 2026)
--   profiles.wants   the answer to "How will you use Homami?": care (needs care), offer (offers care) or both
--   sitter_profiles  one per pet sitter: what they offer, from when, where, prices and exchange options
--   Every member can see pet sitters: their sitter profile and their basic profile (name, photo, city, bio).
--   Their pets and posts stay visible to their circle only.

-- 1. "How will you use Homami?" --------------------------------------------------------
alter table public.profiles add column if not exists wants text;
alter table public.profiles drop constraint if exists profiles_wants_check;
alter table public.profiles add constraint profiles_wants_check check (wants in ('care', 'offer', 'both'));

-- 2. Sitter profiles -------------------------------------------------------------------
create table if not exists public.sitter_profiles (
  user_id           uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  offers            text[] not null default '{}'
                    check (offers <@ array['accommodation_exchange', 'live_in', 'dog_walking', 'grooming', 'boarding', 'training']::text[]),
  available_from    date,
  area              text check (char_length(area) <= 60),         -- e.g. "Málaga Centro"
  radius_km         int check (radius_km between 1 and 200),       -- how far they'll travel
  daily_rate        numeric(7, 2) check (daily_rate >= 0),         -- € per day, daytime only
  overnight_rate    numeric(7, 2) check (overnight_rate >= 0),     -- € per night
  walk_rate         numeric(7, 2) check (walk_rate >= 0),          -- € per hour, walks or home visits
  stay_for_care     boolean not null default false,                -- stays at your place in exchange for care
  sitting_exchange  boolean not null default false,                -- you look after mine, I look after yours
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.sitter_profiles enable row level security;

drop policy if exists "Everyone can see pet sitters" on public.sitter_profiles;
create policy "Everyone can see pet sitters"
  on public.sitter_profiles for select to authenticated
  using (true);

drop policy if exists "Create your own sitter profile" on public.sitter_profiles;
create policy "Create your own sitter profile"
  on public.sitter_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Edit your own sitter profile" on public.sitter_profiles;
create policy "Edit your own sitter profile"
  on public.sitter_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Remove your own sitter profile" on public.sitter_profiles;
create policy "Remove your own sitter profile"
  on public.sitter_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 3. Pet sitters' basic profiles are visible to every member ------------------------------
drop policy if exists "Everyone can see pet sitters' profiles" on public.profiles;
create policy "Everyone can see pet sitters' profiles"
  on public.profiles for select to authenticated
  using (exists (select 1 from public.sitter_profiles s where s.user_id = profiles.id));
