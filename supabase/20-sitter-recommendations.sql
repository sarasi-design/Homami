-- Homami setup, part 20: recommending pet sitters, and each sitter's own link
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run scripts 01–19 first.
--
-- What this changes (Sara, Nov 15, 2026; see docs/decisions.md)
--   * Recommend a sitter you've used, through Homami or not: which of your pets they looked after
--     (optional) and a short note, up to 300 characters (optional). One per person per sitter; you can
--     change it or take it back. Nobody can recommend themselves, and recommendations are never paid for.
--   * Recommendations are public, with the first name and photo of the person who wrote them
--     (the app says so before sending). Members also see which pets, and how they know the person.
--   * A review saying "Yes, I'd recommend" (script 16) counts as a recommendation too: each person
--     counts once. Hearts and reviews stay members-only, as before.
--   * Every pet sitter gets one personal link (…/?sitter=CODE). Anyone can open it, even without an
--     account, and sees only: photo, first name, city, bio, what they offer and their prices,
--     and their recommendations (first names, photos, notes). Never their pets or posts.
--   * Signing up from a sitter's link needs no invitation code and doesn't put anyone in a circle.
--   * When someone you invited sets up as a pet sitter, Homami asks whether you'd like to recommend them.

-- 1. Each sitter's own link ---------------------------------------------------------------------------
create or replace function public.new_share_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select substr(md5(gen_random_uuid()::text), 1, 10);
$$;
grant execute on function public.new_share_code() to authenticated;

alter table public.sitter_profiles add column if not exists share_code text;
update public.sitter_profiles set share_code = public.new_share_code() where share_code is null;
alter table public.sitter_profiles alter column share_code set default public.new_share_code();
alter table public.sitter_profiles alter column share_code set not null;
create unique index if not exists sitter_profiles_share_code on public.sitter_profiles (share_code);
alter table public.sitter_profiles drop constraint if exists sitter_profiles_share_code_check;
alter table public.sitter_profiles add constraint sitter_profiles_share_code_check check (share_code ~ '^[a-z0-9]{6,40}$');

-- 2. Recommendations ----------------------------------------------------------------------------------
create table if not exists public.sitter_recommendations (
  id          uuid primary key default gen_random_uuid(),
  sitter_id   uuid not null references public.profiles (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  pet_ids     uuid[] not null default '{}',             -- the author's pets the sitter looked after
  note        text check (char_length(note) <= 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint sitter_recommendations_one_each unique (sitter_id, author_id),
  constraint sitter_recommendations_people_check check (sitter_id <> author_id)
);
create index if not exists sitter_recommendations_sitter_idx on public.sitter_recommendations (sitter_id, updated_at desc);
create index if not exists sitter_recommendations_author_idx on public.sitter_recommendations (author_id, created_at desc);

alter table public.sitter_recommendations enable row level security;
revoke all on public.sitter_recommendations from public, anon, authenticated;
grant select, delete on public.sitter_recommendations to authenticated;

drop policy if exists "See your own recommendations" on public.sitter_recommendations;
create policy "See your own recommendations"
  on public.sitter_recommendations for select to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists "Take back your own recommendations" on public.sitter_recommendations;
create policy "Take back your own recommendations"
  on public.sitter_recommendations for delete to authenticated
  using (author_id = (select auth.uid()));
-- No direct writes: recommend_sitter() below checks everything.

-- Write or change your recommendation
create or replace function public.recommend_sitter(p_sitter uuid, p_pet_ids uuid[], p_note text)
returns public.sitter_recommendations
language plpgsql
security definer
set search_path = ''
as $$
declare
  me      uuid := (select auth.uid());
  my_pets uuid[] := coalesce(p_pet_ids, '{}');
  result  public.sitter_recommendations;
begin
  if me is null then raise exception 'Please log in again.'; end if;
  if p_sitter = me then raise exception 'You can’t recommend yourself.'; end if;
  if not exists (select 1 from public.sitter_profiles s where s.user_id = p_sitter) then
    raise exception 'They don’t offer pet sitting at the moment.';
  end if;
  if char_length(btrim(coalesce(p_note, ''))) > 300 then raise exception 'Keep the note under 300 characters.'; end if;
  if exists (select 1 from unnest(my_pets) x where not exists (select 1 from public.pets p where p.id = x and p.owner_id = me)) then
    raise exception 'Pick from your own pets.';
  end if;
  if not exists (select 1 from public.sitter_recommendations r where r.sitter_id = p_sitter and r.author_id = me)
     and (select count(*) from public.sitter_recommendations r where r.author_id = me and r.created_at > now() - interval '1 day') >= 20 then
    raise exception 'That’s a lot of recommendations for one day. Please try again tomorrow.';
  end if;

  insert into public.sitter_recommendations (sitter_id, author_id, pet_ids, note)
  values (p_sitter, me, (select coalesce(array_agg(distinct x), '{}') from unnest(my_pets) x), nullif(btrim(p_note), ''))
  on conflict (sitter_id, author_id) do update
     set pet_ids = excluded.pet_ids, note = excluded.note, updated_at = now()
  returning * into result;
  return result;
end;
$$;
revoke execute on function public.recommend_sitter(uuid, uuid[], text) from public, anon;
grant execute on function public.recommend_sitter(uuid, uuid[], text) to authenticated;

-- 3. Recommendations on a sitter's profile, for members -------------------------------------------------
-- Everyone who recommended them, people you know first: you (0), your circle (1), friends of friends (2), others (3).
create or replace function public.sitter_recommendations_for(p_sitter uuid)
returns table (author_id uuid, first_name text, avatar_url text, closeness int, pet_names text[], note text,
               created_at timestamptz, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as id),
  mine as (
    select case when l.person_a = me.id then l.person_b else l.person_a end as fid
    from public.circle_links l, me
    where me.id in (l.person_a, l.person_b)
  )
  select r.author_id, p.first_name, p.avatar_url,
         case when r.author_id = (select id from me) then 0
              when r.author_id in (select fid from mine) then 1
              when exists (
                select 1 from mine m
                join public.circle_links l2
                  on l2.person_a = least(m.fid, r.author_id) and l2.person_b = greatest(m.fid, r.author_id)
              ) then 2
              else 3 end as closeness,
         coalesce((select array_agg(pe.name order by pe.name) from public.pets pe
                   where pe.id = any (r.pet_ids) and pe.owner_id = r.author_id), '{}'),
         r.note, r.created_at, r.updated_at
  from public.sitter_recommendations r
  join public.profiles p on p.id = r.author_id
  where r.sitter_id = p_sitter and (select id from me) is not null
  order by 4, r.updated_at desc
  limit 100;
$$;
revoke execute on function public.sitter_recommendations_for(uuid) from public, anon;
grant execute on function public.sitter_recommendations_for(uuid) to authenticated;

-- 4. The numbers on sitter cards and profiles (replaces script 16's version) ----------------------------
-- Who recommends a sitter: a recommendation, or a review saying "Yes, I'd recommend". Each person counts once.
create or replace function public.sitter_review_summaries(p_sitters uuid[])
returns table (sitter_id uuid, review_count int, rating_avg numeric, recommend_count int, known_recommenders jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as id),
  mine as (
    select case when l.person_a = me.id then l.person_b else l.person_a end as fid
    from public.circle_links l, me
    where me.id in (l.person_a, l.person_b)
  ),
  recommenders as (
    select r.sitter_id, r.author_id, r.updated_at from public.sitter_reviews r
     where r.sitter_id = any (p_sitters) and r.recommend
    union all
    select s.sitter_id, s.author_id, s.updated_at from public.sitter_recommendations s
     where s.sitter_id = any (p_sitters)
  ),
  people as (
    select x.sitter_id, x.author_id, max(x.updated_at) as updated_at,
           case when x.author_id = (select id from me) then 0
                when x.author_id in (select fid from mine) then 1
                when exists (
                  select 1 from mine m
                  join public.circle_links l2
                    on l2.person_a = least(m.fid, x.author_id) and l2.person_b = greatest(m.fid, x.author_id)
                ) then 2
                else 3 end as closeness
    from recommenders x
    group by x.sitter_id, x.author_id
  ),
  sitters as (select distinct unnest(p_sitters) as sitter_id)
  select s.sitter_id,
         (select count(*)::int from public.sitter_reviews r where r.sitter_id = s.sitter_id),
         coalesce((select round(avg(r.rating), 1) from public.sitter_reviews r where r.sitter_id = s.sitter_id), 0),
         (select count(*)::int from people pp where pp.sitter_id = s.sitter_id),
         coalesce((
           select jsonb_agg(jsonb_build_object('id', k.author_id, 'first_name', p.first_name, 'avatar_url', p.avatar_url, 'closeness', k.closeness)
                            order by k.closeness, k.updated_at desc)
           from (
             select pp.author_id, pp.closeness, pp.updated_at
             from people pp
             where pp.sitter_id = s.sitter_id and pp.closeness < 3
             order by pp.closeness, pp.updated_at desc
             limit 3
           ) k
           join public.profiles p on p.id = k.author_id
         ), '[]'::jsonb)
  from sitters s
  where exists (select 1 from public.sitter_reviews r where r.sitter_id = s.sitter_id)
     or exists (select 1 from people pp where pp.sitter_id = s.sitter_id);
$$;
revoke execute on function public.sitter_review_summaries(uuid[]) from public, anon;
grant execute on function public.sitter_review_summaries(uuid[]) to authenticated;

-- 5. A sitter's public page (their link), for anyone ------------------------------------------------------
-- Only what the sitter shares publicly. Never their pets, posts, reviews, email, or who recommended them by surname.
create or replace function public.public_sitter_page(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'avatar_url', p.avatar_url,
    'city', p.city,
    'bio', p.bio,
    'sitter', jsonb_build_object(
      'offers', s.offers, 'available_from', s.available_from, 'available_until', s.available_until,
      'area', s.area, 'radius_km', s.radius_km, 'travels', s.travels,
      'daily_rate', s.daily_rate, 'overnight_rate', s.overnight_rate, 'walk_rate', s.walk_rate,
      'stay_for_care', s.stay_for_care, 'sitting_exchange', s.sitting_exchange
    ),
    'recommendations', coalesce((
      select jsonb_agg(jsonb_build_object('first_name', a.first_name, 'avatar_url', a.avatar_url, 'note', r.note, 'created_at', r.created_at)
                       order by r.updated_at desc)
      from (select * from public.sitter_recommendations r0 where r0.sitter_id = s.user_id order by r0.updated_at desc limit 50) r
      join public.profiles a on a.id = r.author_id
    ), '[]'::jsonb),
    'recommend_count', (select count(*) from public.sitter_recommendations r where r.sitter_id = s.user_id)
  )
  from public.sitter_profiles s
  join public.profiles p on p.id = s.user_id
  where s.share_code = lower(btrim(p_code));
$$;
revoke execute on function public.public_sitter_page(text) from public;
grant execute on function public.public_sitter_page(text) to anon, authenticated;

-- 6. "Dani is on Homami now: recommend them?" ---------------------------------------------------------------
-- Pet sitters who signed up with your invite and you haven't recommended yet.
create or replace function public.sitters_to_recommend()
returns table (id uuid, first_name text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.first_name, p.avatar_url
  from public.profiles p
  join public.sitter_profiles s on s.user_id = p.id
  where p.invited_by = (select auth.uid())
    and not exists (select 1 from public.sitter_recommendations r where r.sitter_id = p.id and r.author_id = (select auth.uid()))
  order by s.created_at desc
  limit 5;
$$;
revoke execute on function public.sitters_to_recommend() from public, anon;
grant execute on function public.sitters_to_recommend() to authenticated;
