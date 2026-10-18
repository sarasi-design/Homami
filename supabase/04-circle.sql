-- Homami setup, part 4: the trusted circle
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
--
-- How the circle works (decided Oct 18, 2026)
--   * A circle is between people: if you're in my circle, I'm in yours.
--   * Everyone gets a personal invite code. Their invite link is homami-sepia.vercel.app/?invite=CODE
--   * Signing up with someone's personal code puts you in each other's circle automatically.
--   * Someone who already has an account can open the link and accept "Add Sara to your circle?".
--   * People in your circle can see your profile and your pets. Nobody else can.

-- 1. Circle connections ------------------------------------------------------------
create table if not exists public.circle_links (
  person_a    uuid not null references public.profiles (id) on delete cascade,
  person_b    uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (person_a, person_b),
  check (person_a < person_b)   -- each pair is stored once
);

create index if not exists circle_links_person_b_idx on public.circle_links (person_b);

alter table public.circle_links enable row level security;

drop policy if exists "See your own circle connections" on public.circle_links;
create policy "See your own circle connections"
  on public.circle_links for select to authenticated
  using ((select auth.uid()) in (person_a, person_b));

drop policy if exists "Leave a circle connection" on public.circle_links;
create policy "Leave a circle connection"
  on public.circle_links for delete to authenticated
  using ((select auth.uid()) in (person_a, person_b));
-- New connections are only made through the invite rules below, never directly.

-- 2. Helpers ------------------------------------------------------------------------
create or replace function public.link_people(x uuid, y uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.circle_links (person_a, person_b)
  values (least(x, y), greatest(x, y))
  on conflict do nothing;
$$;
revoke execute on function public.link_people(uuid, uuid) from public, anon, authenticated;

-- "Is this person in my circle?"
create or replace function public.in_my_circle(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.circle_links l
    where (l.person_a = (select auth.uid()) and l.person_b = other)
       or (l.person_b = (select auth.uid()) and l.person_a = other)
  );
$$;
grant execute on function public.in_my_circle(uuid) to authenticated;

-- A new personal code: 8 letters and numbers, without look-alikes (no O/0, I/1)
create or replace function public.new_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.invite_codes c where c.code = candidate);
  end loop;
  return candidate;
end;
$$;

-- 3. Who can see what: your own things, plus the people in your circle -------------
drop policy if exists "You can see your own profile" on public.profiles;
drop policy if exists "See your own profile and your circle" on public.profiles;
create policy "See your own profile and your circle"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.in_my_circle(id));

drop policy if exists "See your own pets" on public.pets;
drop policy if exists "See your pets and your circle's pets" on public.pets;
create policy "See your pets and your circle's pets"
  on public.pets for select to authenticated
  using ((select auth.uid()) = owner_id or public.in_my_circle(owner_id));

-- 4. Sign-up rule, updated: also gives the new person their own code,
--    and puts them in the circle of whoever invited them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite  text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
  inviter uuid;
begin
  update public.invite_codes c
     set uses = c.uses + 1
   where c.code = invite
     and (c.expires_at is null or c.expires_at > now())
     and (c.max_uses is null or c.uses < c.max_uses)
  returning c.created_by into inviter;

  if not found then
    raise exception 'INVITE_INVALID: a valid invitation code is needed to sign up';
  end if;

  insert into public.profiles (id, invited_by) values (new.id, inviter);
  insert into public.invite_codes (code, created_by, note) values (public.new_invite_code(), new.id, 'personal');
  if inviter is not null then
    perform public.link_people(inviter, new.id);
  end if;
  return new;
end;
$$;

-- People who joined before today get their personal code now
insert into public.invite_codes (code, created_by, note)
select public.new_invite_code(), p.id, 'personal'
from public.profiles p
where not exists (select 1 from public.invite_codes c where c.created_by = p.id and c.note = 'personal');

-- 5. Things the app asks --------------------------------------------------------------

-- "Whose link is this?" — for the "Add Sara to your circle?" question
create or replace function public.invite_owner(invite text)
returns table (id uuid, first_name text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.first_name, p.avatar_url
  from public.invite_codes c
  join public.profiles p on p.id = c.created_by
  where c.code = upper(trim(invite))
    and (c.expires_at is null or c.expires_at > now())
    and (c.max_uses is null or c.uses < c.max_uses);
$$;
grant execute on function public.invite_owner(text) to authenticated;

-- "Yes, add them" — for people who already have an account
create or replace function public.join_circle(invite text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me    uuid := (select auth.uid());
  owner uuid;
begin
  if me is null then
    raise exception 'NOT_LOGGED_IN';
  end if;
  update public.invite_codes c
     set uses = c.uses + 1
   where c.code = upper(trim(invite))
     and c.created_by is not null
     and (c.expires_at is null or c.expires_at > now())
     and (c.max_uses is null or c.uses < c.max_uses)
  returning c.created_by into owner;
  if owner is null then
    raise exception 'INVITE_INVALID';
  end if;
  if owner = me then
    raise exception 'OWN_INVITE';
  end if;
  perform public.link_people(me, owner);
  return owner;
end;
$$;
grant execute on function public.join_circle(text) to authenticated;

-- "Who's in my circle?" — with how many people you both know
create or replace function public.my_circle()
returns table (id uuid, first_name text, city text, avatar_url text, shared_count int, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with friends as (
    select case when l.person_a = (select auth.uid()) then l.person_b else l.person_a end as fid,
           l.created_at
    from public.circle_links l
    where (select auth.uid()) in (l.person_a, l.person_b)
  )
  select p.id, p.first_name, p.city, p.avatar_url,
         (select count(*)::int
            from friends f2
            join public.circle_links l2
              on (l2.person_a = least(f2.fid, p.id) and l2.person_b = greatest(f2.fid, p.id))
           where f2.fid <> p.id) as shared_count,
         f.created_at as joined_at
  from friends f
  join public.profiles p on p.id = f.fid
  order by f.created_at desc;
$$;
grant execute on function public.my_circle() to authenticated;
