-- Homami setup, part 14: pet sitters available from – to
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run scripts 06 (pet sitters) and 11 (bookings) first.
--
-- What it adds (decided with Sara, Nov 11, 2026)
--   * Pet sitters can say when they're available until, not only from when. The end date is optional.
--   * A booking has to fit in those days: it can't start before "available from" or end after
--     "available until". The app already only lets people pick those days; this makes sure of it.
--   Bookings already made stay as they are.

-- 1. The last day a sitter is available ----------------------------------------------------
alter table public.sitter_profiles add column if not exists available_until date;

alter table public.sitter_profiles drop constraint if exists sitter_profiles_available_dates_check;
alter table public.sitter_profiles add constraint sitter_profiles_available_dates_check
  check (available_until is null or available_from is null or available_until >= available_from);

-- 2. Ask for a booking: same as script 11, plus the sitter's available days ------------------
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

  -- Only on days the sitter is available (from – to)
  if s.available_from is not null and p_start < s.available_from then
    raise exception 'This sitter is available from %. Pick dates from then on.', to_char(s.available_from, 'FMDD FMMonth');
  end if;
  if s.available_until is not null and p_end > s.available_until then
    raise exception 'This sitter is available until %. Pick dates up to then.', to_char(s.available_until, 'FMDD FMMonth');
  end if;

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
