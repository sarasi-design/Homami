-- Homami setup, part 12: invite codes you make from your profile
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run script 04 (the trusted circle) first.
--
-- What it adds (Nov 11, 2026)
--   On Your profile → Invite friends, "Create an invite code" makes a new code for one person:
--   * it works once, for 30 days, then stops working;
--   * whoever signs up with it joins your circle, just like with your personal link;
--   * you can have up to 10 unused codes at a time, and delete one you no longer need.
--   Your personal link (script 04) stays as it is.

-- 1. Make a code ---------------------------------------------------------------------------
create or replace function public.create_invite_code()
returns public.invite_codes
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me     uuid := (select auth.uid());
  result public.invite_codes;
begin
  if me is null then
    raise exception 'Please log in again.';
  end if;
  if (select count(*) from public.invite_codes c
      where c.created_by = me and c.note = 'one-time' and c.uses = 0 and c.expires_at > now()) >= 10 then
    raise exception 'You already have 10 codes nobody has used yet. Share those first, or delete one.';
  end if;
  insert into public.invite_codes (code, created_by, note, max_uses, expires_at)
  values (public.new_invite_code(), me, 'one-time', 1, now() + interval '30 days')
  returning * into result;
  return result;
end;
$$;
grant execute on function public.create_invite_code() to authenticated;

-- 2. Delete a code nobody has used yet -----------------------------------------------------
drop policy if exists "Delete your unused one-time codes" on public.invite_codes;
create policy "Delete your unused one-time codes"
  on public.invite_codes for delete to authenticated
  using ((select auth.uid()) = created_by and note = 'one-time' and uses = 0);
