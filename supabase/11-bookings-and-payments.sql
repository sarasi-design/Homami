-- Homami setup, part 11: bookings and payments
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run scripts 06 (pet sitters) and 09 (chat) first.
--
-- How booking works (decided with Sara, Nov 10, 2026)
--   * A pet owner asks a sitter for a booking: a service, dates, pets. The price is worked out here, from
--     the sitter's own prices, never sent by the app, so nobody can change it on the way.
--   * The sitter accepts or declines. Nothing is charged until they accept.
--   * Paid services need the owner's card on file, and the sitter set up to be paid. Exchange services
--     ("Stay in exchange for care", "Pet sitting exchange") cost nothing and need neither.
--   * Cards and bank details live with Stripe (test mode for now). Homami only keeps Stripe's ids and
--     "Visa •••• 4242", written by the "payments" Edge Function, never by the app directly.

-- 1. Payment details: one row per person, written only by the payments function ----------
create table if not exists public.payment_profiles (
  user_id             uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id  text,                 -- you, as someone who pays
  card_brand          text,                 -- e.g. "visa"
  card_last4          text,
  card_exp            text,                 -- e.g. "12/28"
  stripe_account_id   text,                 -- you, as a sitter who gets paid
  payouts_ready       boolean not null default false,
  updated_at          timestamptz not null default now()
);

alter table public.payment_profiles enable row level security;

drop policy if exists "See your own payment details" on public.payment_profiles;
create policy "See your own payment details"
  on public.payment_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
-- No insert / update / delete rules: only the payments function (service role) writes here.

-- "Can this sitter be paid through Homami?" — without showing anyone else's payment details
create or replace function public.can_be_paid(sitter uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.payouts_ready from public.payment_profiles p where p.user_id = sitter), false);
$$;
grant execute on function public.can_be_paid(uuid) to authenticated;

-- 2. Bookings ------------------------------------------------------------------------------
create table if not exists public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  sitter_id          uuid not null references public.profiles (id) on delete cascade,
  service            text not null check (service in ('daily', 'overnight', 'walk', 'stay_for_care', 'sitting_exchange')),
  start_date         date not null,
  end_date           date not null,
  quantity           int not null check (quantity between 1 and 90),   -- days, nights or hours
  pet_ids            uuid[] not null default '{}',
  pet_count          int not null default 0 check (pet_count between 0 and 20),
  note               text check (char_length(note) <= 500),
  unit_price_cents   int not null default 0 check (unit_price_cents >= 0),
  total_cents        int not null default 0 check (total_cents >= 0),
  status             text not null default 'requested'
                     check (status in ('requested', 'accepted', 'declined', 'cancelled')),
  payment_status     text not null default 'none'
                     check (payment_status in ('none', 'paid', 'failed')),
  payment_intent_id  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint bookings_dates_check check (end_date >= start_date),
  constraint bookings_people_check check (owner_id <> sitter_id)
);

create index if not exists bookings_owner_idx on public.bookings (owner_id, start_date);
create index if not exists bookings_sitter_idx on public.bookings (sitter_id, start_date);

alter table public.bookings enable row level security;

drop policy if exists "See your own bookings" on public.bookings;
create policy "See your own bookings"
  on public.bookings for select to authenticated
  using ((select auth.uid()) in (owner_id, sitter_id));
-- No direct writes: bookings change only through the functions below and the payments function.

-- The two people in a booking can see each other's basic profile (name, photo, city, bio)
drop policy if exists "See the profiles of people you have bookings with" on public.profiles;
create policy "See the profiles of people you have bookings with"
  on public.profiles for select to authenticated
  using (exists (
    select 1 from public.bookings b
    where (b.owner_id = (select auth.uid()) and b.sitter_id = profiles.id)
       or (b.sitter_id = (select auth.uid()) and b.owner_id = profiles.id)
  ));

-- 3. Ask for a booking -----------------------------------------------------------------------
-- The price: daily rate × days, overnight rate × nights, walking rate × hours; exchanges are free.
create or replace function public.request_booking(
  p_sitter uuid, p_service text, p_start date, p_end date, p_hours int, p_pet_ids uuid[], p_note text
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.sitter_profiles;
  qty int;
  unit numeric;
  result public.bookings;
begin
  if (select auth.uid()) is null then raise exception 'Please log in again.'; end if;
  if p_sitter = (select auth.uid()) then raise exception 'You can’t book yourself.'; end if;
  if p_end < p_start then raise exception 'The last day can’t be before the first.'; end if;
  if p_start < current_date then raise exception 'Pick dates from today on.'; end if;

  select * into s from public.sitter_profiles where user_id = p_sitter;
  if not found then raise exception 'This person doesn’t offer pet sitting any more.'; end if;

  if p_service = 'daily' then
    unit := s.daily_rate; qty := p_end - p_start + 1;
  elsif p_service = 'overnight' then
    unit := s.overnight_rate; qty := greatest(p_end - p_start, 1);
  elsif p_service = 'walk' then
    unit := s.walk_rate; qty := coalesce(p_hours, 1);
  elsif p_service = 'stay_for_care' and s.stay_for_care then
    unit := 0; qty := p_end - p_start + 1;
  elsif p_service = 'sitting_exchange' and s.sitting_exchange then
    unit := 0; qty := p_end - p_start + 1;
  else
    raise exception 'This sitter doesn’t offer that service.';
  end if;

  if unit is null then raise exception 'This sitter hasn’t set a price for that service.'; end if;
  if qty < 1 or qty > 90 then raise exception 'That’s too long for one booking. Try fewer days.'; end if;

  if unit > 0 then
    if not exists (select 1 from public.payment_profiles p where p.user_id = (select auth.uid()) and p.card_last4 is not null) then
      raise exception 'Add a card in Payment details first.';
    end if;
    if not public.can_be_paid(p_sitter) then
      raise exception 'This sitter can’t be paid through Homami yet. Ask them in a message, or pick an exchange.';
    end if;
  end if;

  insert into public.bookings (owner_id, sitter_id, service, start_date, end_date, quantity, pet_ids, pet_count, note, unit_price_cents, total_cents)
  values ((select auth.uid()), p_sitter, p_service, p_start, p_end, qty, coalesce(p_pet_ids, '{}'), coalesce(cardinality(p_pet_ids), 0),
          nullif(btrim(p_note), ''), round(unit * 100)::int, round(unit * 100)::int * qty)
  returning * into result;
  return result;
end;
$$;
grant execute on function public.request_booking(uuid, text, date, date, int, uuid[], text) to authenticated;

-- 4. Answer a booking ----------------------------------------------------------------------
-- Owner: cancel a request that hasn't been answered yet.
create or replace function public.cancel_booking(booking uuid)
returns public.bookings
language sql
security definer
set search_path = ''
as $$
  update public.bookings set status = 'cancelled', updated_at = now()
  where id = booking and owner_id = (select auth.uid()) and status = 'requested'
  returning *;
$$;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- Sitter: say no.
create or replace function public.decline_booking(booking uuid)
returns public.bookings
language sql
security definer
set search_path = ''
as $$
  update public.bookings set status = 'declined', updated_at = now()
  where id = booking and sitter_id = (select auth.uid()) and status = 'requested'
  returning *;
$$;
grant execute on function public.decline_booking(uuid) to authenticated;

-- Sitter: say yes to a free (exchange) booking. Paid ones are accepted through the payments function,
-- which takes the payment at the same moment.
create or replace function public.accept_free_booking(booking uuid)
returns public.bookings
language sql
security definer
set search_path = ''
as $$
  update public.bookings set status = 'accepted', updated_at = now()
  where id = booking and sitter_id = (select auth.uid()) and status = 'requested' and total_cents = 0
  returning *;
$$;
grant execute on function public.accept_free_booking(uuid) to authenticated;

-- 5. People in a booking can message each other ----------------------------------------------
-- Replaces can_message from script 10 with one more case. Everything else stays the same.
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
       or exists (select 1 from public.bookings b
                  where (b.owner_id = (select auth.uid()) and b.sitter_id = other)
                     or (b.sitter_id = (select auth.uid()) and b.owner_id = other))
       or exists (select 1 from public.messages m where m.sender_id = other and m.recipient_id = (select auth.uid()))
     );
$$;
grant execute on function public.can_message(uuid) to authenticated;
