-- Homami setup, part 13: sign up without an invitation code
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
-- Run script 04 (the trusted circle) first: this replaces its sign-up rule.
--
-- What changes (decided with Sara, Nov 11, 2026)
--   * Anyone can create an account. The invitation code is optional.
--   * Signing up with someone's code or link still puts you straight into their circle.
--   * A code that's filled in but doesn't work (a typo, used up, expired) still stops the sign-up,
--     so nobody misses joining their friend's circle by accident. The app says so clearly, and
--     clearing the field lets you sign up without it.
--   * Everyone still gets their own personal code to invite others.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite  text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
  inviter uuid;
begin
  if invite <> '' then
    update public.invite_codes c
       set uses = c.uses + 1
     where c.code = invite
       and (c.expires_at is null or c.expires_at > now())
       and (c.max_uses is null or c.uses < c.max_uses)
    returning c.created_by into inviter;

    if not found then
      raise exception 'INVITE_INVALID: that invitation code doesn''t work';
    end if;
  end if;

  insert into public.profiles (id, invited_by) values (new.id, inviter);
  insert into public.invite_codes (code, created_by, note) values (public.new_invite_code(), new.id, 'personal');
  if inviter is not null then
    perform public.link_people(inviter, new.id);
  end if;
  return new;
end;
$$;
