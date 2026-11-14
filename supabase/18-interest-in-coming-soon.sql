-- Homami setup, part 18: counting interest in "Stay in exchange for care" before it's built
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run scripts 01–17 first.
--
-- What this changes (Sara, Nov 14, 2026; see docs/decisions.md)
--   * "Stay in exchange for care" isn't available yet. When someone picks it (setting up as a sitter,
--     booking a sitter, or writing a care request) Homami says it's coming soon, and notes it here:
--     who, which feature, where in the app, and when.
--   * Members can only add their own clicks. Nobody can read them from the app: Sara reads them in
--     Supabase (Table Editor → feature_interest, or the query at the bottom).
--   * At most 50 a day per person, so one person tapping again and again doesn't skew the count much.

create table if not exists public.feature_interest (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  feature    text not null check (feature in ('stay_for_care')),
  place      text not null check (place in ('sitter_setup', 'book', 'care_request')),
  created_at timestamptz not null default now()
);
create index if not exists feature_interest_feature on public.feature_interest (feature, created_at);

alter table public.feature_interest enable row level security;

drop policy if exists "Members note their own interest" on public.feature_interest;
create policy "Members note their own interest" on public.feature_interest
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on public.feature_interest from public, anon, authenticated;
grant insert (feature, place) on public.feature_interest to authenticated;

create or replace function public.limit_feature_interest()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.feature_interest f
      where f.user_id = new.user_id and f.created_at > now() - interval '1 day') >= 50 then
    raise exception 'That’s plenty for today, thank you!';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_feature_interest() from public, anon, authenticated;

drop trigger if exists limit_feature_interest on public.feature_interest;
create trigger limit_feature_interest before insert on public.feature_interest
  for each row execute function public.limit_feature_interest();

-- To see the numbers (run on its own whenever you like):
--   select place, count(*) as clicks, count(distinct user_id) as people, max(created_at) as latest
--   from public.feature_interest where feature = 'stay_for_care' group by place;
