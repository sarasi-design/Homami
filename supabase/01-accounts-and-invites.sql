-- Homami setup, part 1: accounts and invitations
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Run it once.
--
-- What it creates
--   profiles      one row per person (filled in on the "Set up your profile" screen later)
--   invite_codes  the codes people need to sign up. Homami is invite-only.
--   A rule that runs whenever someone signs up: no valid code, no account.
--   A starter code, WELCOME-HOMAMI, that you can share with your first 20 testers.
--
-- Pets, circles and the wall get their own scripts when we build those screens.

-- 1. Profiles ------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text,
  city        text,
  bio         text check (char_length(bio) <= 300),
  avatar_url  text,
  invited_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- For now people can only see and change their own profile.
-- Seeing the profiles of people in your circle is added with the circle script.
create policy "You can see your own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "You can edit your own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 2. Invitation codes ------------------------------------------------------------
create table public.invite_codes (
  code        text primary key check (code = upper(code) and char_length(code) between 4 and 32),
  created_by  uuid references public.profiles (id) on delete cascade, -- empty for codes you make by hand
  note        text,                                                   -- e.g. "first testers"
  max_uses    int check (max_uses > 0),                               -- empty = no limit
  uses        int not null default 0,
  expires_at  timestamptz,                                            -- empty = never expires
  created_at  timestamptz not null default now()
);

alter table public.invite_codes enable row level security;

create policy "You can see the codes you made"
  on public.invite_codes for select to authenticated
  using ((select auth.uid()) = created_by);

-- 3. "Is this code OK?" — the Sign up screen asks this before creating the account,
--    so a typo gets a friendly message. It only answers yes or no; it never lists codes.
create or replace function public.is_invite_code_valid(invite text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.invite_codes c
    where c.code = upper(trim(invite))
      and (c.expires_at is null or c.expires_at > now())
      and (c.max_uses is null or c.uses < c.max_uses)
  );
$$;

grant execute on function public.is_invite_code_valid(text) to anon, authenticated;

-- 4. The sign-up rule: runs inside Supabase for every new account.
--    Uses up one go of the code and creates the person's empty profile.
--    If the code isn't valid, the account is not created.
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
  update public.invite_codes c
     set uses = c.uses + 1
   where c.code = invite
     and (c.expires_at is null or c.expires_at > now())
     and (c.max_uses is null or c.uses < c.max_uses)
  returning c.created_by into inviter;

  if not found then
    raise exception 'INVITE_INVALID: a valid invitation code is needed to sign up';
  end if;

  insert into public.profiles (id, invited_by) values (new.id, inviter);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. A starter code for your first testers (change the word or the limit if you like)
insert into public.invite_codes (code, note, max_uses)
values ('WELCOME-HOMAMI', 'first testers', 20);
