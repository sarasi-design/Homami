-- Homami setup, part 16: reviewing and recommending a pet sitter
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run script 11 (bookings) first.
--
-- How reviews work (decided with Sara, Nov 13, 2026; also on Find out more → Reviews)
--   * Only someone who has really booked a sitter through Homami can review them: they need a booking
--     that was accepted, wasn't cancelled, and has reached its last day. Paid bookings and exchanges both count.
--     Nobody can review a sitter just because they know them: that keeps out reviews from friends
--     doing a favour and from made-up profiles.
--   * A review is 1 to 5 hearts, "Would you recommend them?" (yes or no) and, if you like, a few words.
--   * One review per person per sitter. After another booking you update it, so the numbers count
--     people, not bookings. You can delete your review any time.
--   * Every member sees how many reviews a sitter has, their hearts, and how many people recommend them.
--     Who wrote a review, and what they wrote, is shown only to people in the writer's circle or
--     extended circle (friends of friends). On a sitter's card: "Recommended by Anna and 12 more",
--     naming people you know first.

-- 1. Reviews ------------------------------------------------------------------------------------
create table if not exists public.sitter_reviews (
  id          uuid primary key default gen_random_uuid(),
  sitter_id   uuid not null references public.profiles (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  booking_id  uuid references public.bookings (id) on delete set null,   -- the booking it's about (the latest)
  rating      int not null check (rating between 1 and 5),
  recommend   boolean not null,
  body        text check (char_length(body) <= 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint sitter_reviews_one_each unique (sitter_id, author_id),
  constraint sitter_reviews_people_check check (sitter_id <> author_id)
);
create index if not exists sitter_reviews_sitter_idx on public.sitter_reviews (sitter_id, updated_at desc);

alter table public.sitter_reviews enable row level security;

drop policy if exists "See your own reviews" on public.sitter_reviews;
create policy "See your own reviews"
  on public.sitter_reviews for select to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists "Delete your own reviews" on public.sitter_reviews;
create policy "Delete your own reviews"
  on public.sitter_reviews for delete to authenticated
  using (author_id = (select auth.uid()));
-- No direct writes: reviews are written by review_sitter() below, which checks the booking.
-- Everyone else reads them through sitter_review_summaries() and sitter_reviews_for().

-- 2. Write or update your review ----------------------------------------------------------------
create or replace function public.review_sitter(p_sitter uuid, p_rating int, p_recommend boolean, p_body text)
returns public.sitter_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  me      uuid := (select auth.uid());
  booked  uuid;
  result  public.sitter_reviews;
begin
  if me is null then raise exception 'Please log in again.'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'Pick how many hearts first.'; end if;
  if p_recommend is null then raise exception 'Say whether you’d recommend them first.'; end if;

  select b.id into booked
    from public.bookings b
   where b.owner_id = me and b.sitter_id = p_sitter
     and b.status = 'accepted'
     and b.end_date <= (now() at time zone 'Europe/Madrid')::date
   order by b.end_date desc
   limit 1;
  if booked is null then
    raise exception 'You can review a pet sitter once a booking with them has finished.';
  end if;

  insert into public.sitter_reviews (sitter_id, author_id, booking_id, rating, recommend, body)
  values (p_sitter, me, booked, p_rating, p_recommend, nullif(btrim(left(p_body, 1000)), ''))
  on conflict (sitter_id, author_id) do update
     set booking_id = excluded.booking_id, rating = excluded.rating, recommend = excluded.recommend,
         body = excluded.body, updated_at = now()
  returning * into result;
  return result;
end;
$$;
grant execute on function public.review_sitter(uuid, int, boolean, text) to authenticated;

-- 3. The numbers, for sitter cards and profiles --------------------------------------------------
-- For each sitter: how many reviews, the average hearts, how many recommend them, and up to 3 people
-- you know who recommend them (your circle first, then friends of friends; you count too).
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
  reviews as (
    select r.*,
           case when r.author_id = (select id from me) then 0
                when r.author_id in (select fid from mine) then 1
                when exists (
                  select 1 from mine m
                  join public.circle_links l2
                    on l2.person_a = least(m.fid, r.author_id) and l2.person_b = greatest(m.fid, r.author_id)
                ) then 2
                else 3 end as closeness
    from public.sitter_reviews r
    where r.sitter_id = any (p_sitters)
  )
  select r.sitter_id,
         count(*)::int,
         round(avg(r.rating), 1),
         count(*) filter (where r.recommend)::int,
         coalesce((
           select jsonb_agg(jsonb_build_object('id', k.author_id, 'first_name', p.first_name, 'avatar_url', p.avatar_url, 'closeness', k.closeness)
                            order by k.closeness, k.updated_at desc)
           from (
             select r2.author_id, r2.closeness, r2.updated_at
             from reviews r2
             where r2.sitter_id = r.sitter_id and r2.recommend and r2.closeness < 3
             order by r2.closeness, r2.updated_at desc
             limit 3
           ) k
           join public.profiles p on p.id = k.author_id
         ), '[]'::jsonb)
  from reviews r
  group by r.sitter_id;
$$;
grant execute on function public.sitter_review_summaries(uuid[]) to authenticated;

-- 4. The reviews you may read, for a sitter's profile ---------------------------------------------
-- Yours, your circle's and your extended circle's, closest first. Others only count in the numbers above.
create or replace function public.sitter_reviews_for(p_sitter uuid)
returns table (author_id uuid, first_name text, city text, avatar_url text, closeness int,
               rating int, recommend boolean, body text, updated_at timestamptz)
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
  reviews as (
    select r.*,
           case when r.author_id = (select id from me) then 0
                when r.author_id in (select fid from mine) then 1
                when exists (
                  select 1 from mine m
                  join public.circle_links l2
                    on l2.person_a = least(m.fid, r.author_id) and l2.person_b = greatest(m.fid, r.author_id)
                ) then 2
                else 3 end as closeness
    from public.sitter_reviews r
    where r.sitter_id = p_sitter
  )
  select r.author_id, p.first_name, p.city, p.avatar_url, r.closeness, r.rating, r.recommend, r.body, r.updated_at
  from reviews r
  join public.profiles p on p.id = r.author_id
  where r.closeness < 3
  order by r.closeness, r.updated_at desc
  limit 50;
$$;
grant execute on function public.sitter_reviews_for(uuid) to authenticated;
