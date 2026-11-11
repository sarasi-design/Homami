-- Homami setup, part 10: pet care requests
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run script 09 (chat) first: this one updates its "who can I message" rule.
--
-- What it adds (Nov 10, 2026)
--   care_requests  "I need someone for my pets": what kind of care, which dates, where, and which pets.
--   Every member can see requests, so pet sitters outside your circle can find them
--   (Figma: "Need a sitter is visible to everyone first"). Only you can change or remove yours.
--   Your pets themselves stay visible to your circle only: others see how many pets, not who they are.

-- 1. Requests ---------------------------------------------------------------------------
create table if not exists public.care_requests (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  needs       text[] not null
              check (cardinality(needs) > 0
                     and needs <@ array['accommodation_exchange', 'live_in', 'dog_walking', 'grooming', 'boarding', 'training']::text[]),
  start_date  date not null,
  end_date    date not null,
  area        text check (char_length(area) <= 60),               -- e.g. "Torremolinos, Málaga"
  pet_ids     uuid[] not null default '{}',
  pet_count   int not null default 0 check (pet_count between 0 and 20),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint care_requests_dates_check check (end_date >= start_date)
);

create index if not exists care_requests_owner_idx on public.care_requests (owner_id);
create index if not exists care_requests_end_idx on public.care_requests (end_date);

alter table public.care_requests enable row level security;

drop policy if exists "Everyone can see care requests" on public.care_requests;
create policy "Everyone can see care requests"
  on public.care_requests for select to authenticated
  using (true);

drop policy if exists "Create your own care requests" on public.care_requests;
create policy "Create your own care requests"
  on public.care_requests for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Edit your own care requests" on public.care_requests;
create policy "Edit your own care requests"
  on public.care_requests for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Remove your own care requests" on public.care_requests;
create policy "Remove your own care requests"
  on public.care_requests for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- 2. People asking for care can be found -------------------------------------------------
-- Like pet sitters (script 06): someone with an open request shows their basic profile
-- (name, photo, city, bio) to every member, so a sitter can see who's asking and message them.
drop policy if exists "Everyone can see people asking for pet care" on public.profiles;
create policy "Everyone can see people asking for pet care"
  on public.profiles for select to authenticated
  using (exists (select 1 from public.care_requests r where r.owner_id = profiles.id and r.end_date >= current_date));

-- 3. Pet sitters can message people asking for care --------------------------------------
-- Replaces can_message from script 09 with one more case: someone with an open request.
-- Everything else stays the same (circle, pet sitters, or someone who wrote to you first).
create or replace function public.can_message(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select other <> (select auth.uid())
     and (
       public.in_my_circle(other)
       or exists (select 1 from public.sitter_profiles s where s.user_id = other)
       or exists (select 1 from public.care_requests r where r.owner_id = other and r.end_date >= current_date)
       or exists (select 1 from public.messages m where m.sender_id = other and m.recipient_id = (select auth.uid()))
     );
$$;
grant execute on function public.can_message(uuid) to authenticated;
