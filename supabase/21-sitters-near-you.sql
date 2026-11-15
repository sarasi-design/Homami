-- Homami setup, part 21: your rough location, and pet sitters near you on a map
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run scripts 01–20 first.
--
-- What this changes (Sara, Nov 15, 2026; see docs/decisions.md)
--   * Tapping the pin ("Use my location") saves where you are, rounded to about 1 km
--     (two decimal places). Your exact position is never saved.
--   * Your own location is private: nobody can read it, only you. It is used to work out
--     how far pet sitters are from you.
--   * Pet sitters who have added their location show on the members' map at that rough spot
--     (never their address), with how far they are from you.
--   * "Near you": within 10 km, or further if the sitter travels further than that.
--   * Visitors who aren't logged in can't see the map or anyone's location.

-- 1. Your rough location -----------------------------------------------------------------------------
create table if not exists public.member_locations (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  lat         numeric(5, 2) not null check (lat between -90 and 90),
  lng         numeric(5, 2) not null check (lng between -180 and 180),
  updated_at  timestamptz not null default now()
);

alter table public.member_locations enable row level security;

drop policy if exists "You can see your own location" on public.member_locations;
create policy "You can see your own location"
  on public.member_locations for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "You can remove your own location" on public.member_locations;
create policy "You can remove your own location"
  on public.member_locations for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Saving always goes through set_my_location, which rounds it first
revoke all on public.member_locations from public, anon, authenticated;
grant select, delete on public.member_locations to authenticated;

create or replace function public.set_my_location(p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Log in first'; end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'That location doesn’t look right';
  end if;
  insert into public.member_locations (user_id, lat, lng, updated_at)
  values (me, round(p_lat::numeric, 2), round(p_lng::numeric, 2), now())
  on conflict (user_id) do update set lat = excluded.lat, lng = excluded.lng, updated_at = now();
end $$;
revoke execute on function public.set_my_location(double precision, double precision) from public, anon;
grant execute on function public.set_my_location(double precision, double precision) to authenticated;

-- 2. Distance in km between two points ----------------------------------------------------------------
create or replace function public.km_between(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select 6371 * 2 * asin(least(1, sqrt(
    power(sin(radians((lat2 - lat1)::float8) / 2), 2)
    + cos(radians(lat1::float8)) * cos(radians(lat2::float8)) * power(sin(radians((lng2 - lng1)::float8) / 2), 2)
  )));
$$;

-- 3. Pet sitters on the map, nearest first --------------------------------------------------------------
-- Every pet sitter who has added a location (except you): their rough spot, how far they are from you
-- (whole km, at least 1; empty if you haven't added yours) and whether they count as near you.
create or replace function public.sitters_near_me()
returns table (sitter_id uuid, lat numeric, lng numeric, distance_km int, near boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select l.lat, l.lng from public.member_locations l where l.user_id = (select auth.uid())
  ), placed as (
    select s.user_id, l.lat, l.lng, s.travels, s.radius_km,
           (select public.km_between(me.lat, me.lng, l.lat, l.lng) from me) as km
    from public.sitter_profiles s
    join public.member_locations l on l.user_id = s.user_id
    join public.profiles p on p.id = s.user_id
    where s.user_id <> (select auth.uid())
      and p.first_name is not null
  )
  select user_id, lat, lng,
         case when km is null then null else greatest(1, round(km))::int end,
         coalesce(km <= greatest(10, case when travels then coalesce(radius_km, 0) else 0 end), false)
  from placed
  order by km nulls last
  limit 200;
$$;
revoke execute on function public.sitters_near_me() from public, anon;
grant execute on function public.sitters_near_me() to authenticated;
