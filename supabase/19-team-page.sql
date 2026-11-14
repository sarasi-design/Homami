-- Homami setup, part 19: the Homami team page (#/admin)
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run scripts 01–18 first.
--
-- What this changes (Sara, Nov 14, 2026; see docs/decisions.md)
--   * A list of Homami team members (public.admins). It can only be changed here, in Supabase:
--     nobody can make themselves part of the team from the app.
--   * Three functions that answer only to the team, and only read (nothing can be changed from the page):
--       admin_overview()   the numbers: members, sitters, pets, posts, requests, bookings, reviews,
--                          and the interest in "Stay in exchange for care" (script 18)
--       admin_members()    everyone who signed up: name, email, city, when they joined and last logged in,
--                          who invited them, whether they offer care, how many pets
--       admin_interest()   the latest 200 taps on "Stay in exchange for care": who, where, when
--   * Anyone else who calls them gets "This page is only for the Homami team."
--
-- After running it, add yourself to the team (once), with your own email in place of the example:
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com' on conflict do nothing;

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  added_at   timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from public, anon, authenticated;

-- Are you on the team? (The app asks this to show "Homami team" in the ≡ menu.)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'This page is only for the Homami team.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'members',          (select count(*) from public.profiles),
    'members_7_days',   (select count(*) from public.profiles p where p.created_at > now() - interval '7 days'),
    'members_30_days',  (select count(*) from public.profiles p where p.created_at > now() - interval '30 days'),
    'sitters',          (select count(*) from public.sitter_profiles),
    'pets',             (select count(*) from public.pets),
    'posts',            (select count(*) from public.posts),
    'care_requests',    (select count(*) from public.care_requests),
    'bookings',         (select count(*) from public.bookings),
    'bookings_accepted',(select count(*) from public.bookings b where b.status = 'accepted'),
    'bookings_paid',    (select count(*) from public.bookings b where b.payment_status = 'paid'),
    'reviews',          (select count(*) from public.sitter_reviews),
    'interest', coalesce((
      select jsonb_agg(jsonb_build_object('place', x.place, 'taps', x.taps, 'people', x.people) order by x.place)
      from (
        select f.place, count(*) as taps, count(distinct f.user_id) as people
        from public.feature_interest f where f.feature = 'stay_for_care' group by f.place
      ) x
    ), '[]'::jsonb),
    'interest_people', (select count(distinct f.user_id) from public.feature_interest f where f.feature = 'stay_for_care')
  );
end;
$$;
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

create or replace function public.admin_members()
returns table (
  id uuid, first_name text, email text, city text, wants text, joined_at timestamptz, last_sign_in_at timestamptz,
  invited_by_name text, offers_care boolean, pet_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'This page is only for the Homami team.' using errcode = '42501';
  end if;
  return query
    select p.id, p.first_name, u.email::text, p.city, p.wants, p.created_at, u.last_sign_in_at,
           inviter.first_name,
           exists (select 1 from public.sitter_profiles s where s.user_id = p.id),
           (select count(*) from public.pets pe where pe.owner_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profiles inviter on inviter.id = p.invited_by
    order by p.created_at desc;
end;
$$;
revoke execute on function public.admin_members() from public, anon;
grant execute on function public.admin_members() to authenticated;

create or replace function public.admin_interest()
returns table (user_id uuid, first_name text, email text, place text, tapped_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'This page is only for the Homami team.' using errcode = '42501';
  end if;
  return query
    select f.user_id, p.first_name, u.email::text, f.place, f.created_at
    from public.feature_interest f
    left join public.profiles p on p.id = f.user_id
    left join auth.users u on u.id = f.user_id
    where f.feature = 'stay_for_care'
    order by f.created_at desc
    limit 200;
end;
$$;
revoke execute on function public.admin_interest() from public, anon;
grant execute on function public.admin_interest() to authenticated;
