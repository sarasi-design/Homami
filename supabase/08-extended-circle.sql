-- Homami setup, part 8: your extended circle (friends of friends)
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
--
-- Your extended circle = people in the circles of the people in your circle (not you, not your own circle).
-- You can see their basic profile (name, photo, city, bio) and how many people you both know.
-- Their pets and posts stay visible to their own circle only.

-- "Is this person in my extended circle?"
create or replace function public.in_my_extended_circle(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select case when l.person_a = (select auth.uid()) then l.person_b else l.person_a end as fid
    from public.circle_links l
    where (select auth.uid()) in (l.person_a, l.person_b)
  )
  select other <> (select auth.uid())
     and not exists (select 1 from mine where fid = other)
     and exists (
       select 1 from mine m
       join public.circle_links l2
         on (l2.person_a = least(m.fid, other) and l2.person_b = greatest(m.fid, other))
     );
$$;
grant execute on function public.in_my_extended_circle(uuid) to authenticated;

drop policy if exists "See your extended circle's profiles" on public.profiles;
create policy "See your extended circle's profiles"
  on public.profiles for select to authenticated
  using (public.in_my_extended_circle(id));

-- "Who's in my extended circle?" — with how many of your circle know them
create or replace function public.my_extended_circle()
returns table (id uuid, first_name text, city text, avatar_url text, shared_count int)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select case when l.person_a = (select auth.uid()) then l.person_b else l.person_a end as fid
    from public.circle_links l
    where (select auth.uid()) in (l.person_a, l.person_b)
  ),
  theirs as (
    select case when l.person_a = m.fid then l.person_b else l.person_a end as pid
    from mine m
    join public.circle_links l on m.fid in (l.person_a, l.person_b)
  )
  select p.id, p.first_name, p.city, p.avatar_url, count(*)::int as shared_count
  from theirs t
  join public.profiles p on p.id = t.pid
  where t.pid <> (select auth.uid())
    and t.pid not in (select fid from mine)
  group by p.id, p.first_name, p.city, p.avatar_url
  order by count(*) desc, p.first_name
  limit 200;
$$;
grant execute on function public.my_extended_circle() to authenticated;
