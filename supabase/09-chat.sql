-- Homami setup, part 9: chat (one-to-one messages)
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
--
-- Who can message whom (decided with Sara, Oct 28, 2026)
--   * You can start a chat with people in your circle and with anyone who offers pet sitting.
--   * Anyone you've received a message from can be answered (so a sitter can reply to a pet owner).
--   * Only the two people in a chat can read it.
--   * People you chat with can see each other's basic profile (name, photo, city, bio).

-- 1. Messages -----------------------------------------------------------------------
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  body          text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at    timestamptz not null default now(),
  read_at       timestamptz,
  check (sender_id <> recipient_id)
);

create index if not exists messages_pair_idx on public.messages (sender_id, recipient_id, created_at desc);
create index if not exists messages_unread_idx on public.messages (recipient_id, sender_id) where read_at is null;

alter table public.messages enable row level security;

-- 2. Helpers ------------------------------------------------------------------------
-- "Have this person and I ever messaged each other?"
create or replace function public.chatted_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.messages m
    where (m.sender_id = (select auth.uid()) and m.recipient_id = other)
       or (m.sender_id = other and m.recipient_id = (select auth.uid()))
  );
$$;
grant execute on function public.chatted_with(uuid) to authenticated;

-- "Can I send this person a message?" — circle, pet sitters, or someone who wrote to me
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
       or exists (select 1 from public.messages m where m.sender_id = other and m.recipient_id = (select auth.uid()))
     );
$$;
grant execute on function public.can_message(uuid) to authenticated;

-- 3. Rules --------------------------------------------------------------------------
drop policy if exists "Read your own chats" on public.messages;
create policy "Read your own chats"
  on public.messages for select to authenticated
  using ((select auth.uid()) in (sender_id, recipient_id));

drop policy if exists "Send messages to people you can message" on public.messages;
create policy "Send messages to people you can message"
  on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.can_message(recipient_id));
-- No editing or deleting messages for now. "Read" is marked through mark_chat_read below.

drop policy if exists "See the profiles of people you chat with" on public.profiles;
create policy "See the profiles of people you chat with"
  on public.profiles for select to authenticated
  using (public.chatted_with(id));

-- 4. Your chats: one row per person, newest first, with the last message and how many are unread
create or replace function public.my_chats()
returns table (
  other_id     uuid,
  first_name   text,
  avatar_url   text,
  last_body    text,
  last_at      timestamptz,
  last_from_me boolean,
  unread       int
)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select m.*,
           case when m.sender_id = (select auth.uid()) then m.recipient_id else m.sender_id end as other
    from public.messages m
    where (select auth.uid()) in (m.sender_id, m.recipient_id)
  ),
  last_one as (
    select distinct on (other) other, body, created_at, sender_id = (select auth.uid()) as from_me
    from mine
    order by other, created_at desc
  ),
  unread as (
    select other, count(*)::int as n
    from mine
    where recipient_id = (select auth.uid()) and read_at is null
    group by other
  )
  select l.other, p.first_name, p.avatar_url, l.body, l.created_at, l.from_me, coalesce(u.n, 0)
  from last_one l
  join public.profiles p on p.id = l.other
  left join unread u on u.other = l.other
  order by l.created_at desc
  limit 200;
$$;
grant execute on function public.my_chats() to authenticated;

-- 5. Mark a chat as read (when you open it)
create or replace function public.mark_chat_read(other uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages
  set read_at = now()
  where recipient_id = (select auth.uid()) and sender_id = other and read_at is null;
$$;
grant execute on function public.mark_chat_read(uuid) to authenticated;

-- 6. New messages arrive straight away (Supabase Realtime)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
