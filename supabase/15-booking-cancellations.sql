-- Homami setup, part 15: cancelling a booking, saying why, and getting money back
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run script 11 (bookings and payments) first. Then update the "payments" Edge Function too:
-- paid bookings are cancelled and refunded there (supabase/functions/payments/index.ts).
--
-- How cancelling works (decided with Sara, Nov 12, 2026; also on Find out more → Cancelling a booking)
--   * The pet owner or the sitter can cancel a booking that's been accepted, up to and including its
--     first day. Once it has started, they talk in the chat instead.
--   * Whoever cancels says why (a reason from a short list, and a message if they like).
--     The other person gets it in their chat.
--   * Money back for paid bookings, counted from the first day of the booking:
--       the owner cancels 14 days or more before   → 100% back
--       the owner cancels 7 to 13 days before      → 50% back
--       the owner cancels less than 7 days before  → 20% back
--       the sitter cancels, at any time            → 100% back to the owner
--     The sitter keeps the rest. Homami's fee is given back in the same share.
--   * Free bookings (exchanges) are cancelled the same way, with nothing to pay back.
--   "Today" means today in Spain (Europe/Madrid).

-- 1. What happened when a booking was cancelled -------------------------------------------------
alter table public.bookings add column if not exists cancelled_by  uuid references public.profiles (id) on delete set null;
alter table public.bookings add column if not exists cancelled_at  timestamptz;
alter table public.bookings add column if not exists cancel_reason text;
alter table public.bookings add column if not exists cancel_note   text;
alter table public.bookings add column if not exists refund_cents  int not null default 0;
alter table public.bookings add column if not exists refund_id     text;   -- Stripe's refund id

alter table public.bookings drop constraint if exists bookings_cancel_reason_check;
alter table public.bookings add constraint bookings_cancel_reason_check
  check (cancel_reason is null or cancel_reason in (
    'plans_changed', 'pet_unwell', 'other_care',          -- the pet owner
    'cant_make_it', 'feeling_unwell', 'emergency',        -- the sitter
    'something_else'));
alter table public.bookings drop constraint if exists bookings_cancel_note_check;
alter table public.bookings add constraint bookings_cancel_note_check check (char_length(cancel_note) <= 500);
alter table public.bookings drop constraint if exists bookings_refund_check;
alter table public.bookings add constraint bookings_refund_check check (refund_cents >= 0 and refund_cents <= total_cents);

-- A paid booking can now be refunded, all of it or part of it
alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check
  check (payment_status in ('none', 'paid', 'failed', 'refunded', 'partly_refunded'));

-- 2. Cancel a booking with nothing paid ----------------------------------------------------------
-- Owners: a request that hasn't been answered yet. Owners and sitters: an accepted free booking,
-- up to and including its first day. Paid bookings go through the payments function, which refunds them.
create or replace function public.cancel_booking_with_reason(booking uuid, reason text, note text)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  me     uuid := (select auth.uid());
  b      public.bookings;
  result public.bookings;
begin
  if me is null then raise exception 'Please log in again.'; end if;
  select * into b from public.bookings where id = booking and me in (owner_id, sitter_id);
  if not found then raise exception 'This booking isn’t yours to cancel.'; end if;
  if b.status in ('cancelled', 'declined') then raise exception 'This booking has already been cancelled.'; end if;
  if b.status = 'requested' and me <> b.owner_id then raise exception 'You can decline this request instead.'; end if;
  if b.status = 'accepted' and b.payment_status = 'paid' then
    raise exception 'Paid bookings are cancelled with a refund. Please update the app and try again.';
  end if;
  if b.status = 'accepted' and b.start_date < (now() at time zone 'Europe/Madrid')::date then
    raise exception 'This booking has already started. Send a message to sort it out together.';
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_by = me, cancelled_at = now(),
         cancel_reason = coalesce(reason, 'something_else'), cancel_note = nullif(btrim(note), ''),
         updated_at = now()
   where id = b.id
  returning * into result;
  return result;
end;
$$;
grant execute on function public.cancel_booking_with_reason(uuid, text, text) to authenticated;
