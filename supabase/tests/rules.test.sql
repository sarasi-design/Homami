-- Homami's database rules, tried as pretend people on a throwaway local database.
-- Run with: npm run test:db (scripts/test-database.sh). Each check prints "✓ …"; the first one that fails stops the run.
--
--   Alice  has a pet, posts, and books a sitter
--   Bea    is in Alice's circle
--   Carl   is a stranger to everyone
--   Dani   is a pet sitter (a stranger to Alice), set up to be paid
--   a visitor who isn't logged in

\set ON_ERROR_STOP 1
set client_min_messages = notice;

-- Helpers ------------------------------------------------------------------------------------------
create schema test;
grant usage on schema test to anon, authenticated;

create function test.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception '✗ %', what; end if;
  raise notice '✓ %', what;
end $$;

-- True when the database refuses to do it
create function test.refused(statement text) returns boolean language plpgsql as $$
begin
  execute statement;
  return false;
exception when others then
  return true;
end $$;

-- How many rows a statement touched (a rule can quietly skip rows instead of refusing)
create function test.rows(statement text) returns int language plpgsql as $$
declare n int;
begin
  execute statement;
  get diagnostics n = row_count;
  return n;
end $$;

create function test.id(person text) returns uuid language sql immutable as $$
  select case person
    when 'alice' then 'a0000000-0000-0000-0000-00000000000a'
    when 'bea'   then 'b0000000-0000-0000-0000-00000000000b'
    when 'carl'  then 'c0000000-0000-0000-0000-00000000000c'
    when 'dani'  then 'd0000000-0000-0000-0000-00000000000d'
  end::uuid
$$;

-- Become someone: a member (logged in) or a visitor (no login)
create function test.login(person text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(test.id(person)::text, ''), false);
$$;
grant execute on all functions in schema test to anon, authenticated;

-- The pretend people ---------------------------------------------------------------------------------
insert into auth.users (id, email) values
  (test.id('alice'), 'alice@example.com'),
  (test.id('bea'), 'bea@example.com'),
  (test.id('carl'), 'carl@example.com'),
  (test.id('dani'), 'dani@example.com');
update public.profiles set first_name = initcap(split_part((select email from auth.users u where u.id = profiles.id), '@', 1));
select public.link_people(test.id('alice'), test.id('bea'));
insert into public.pets (owner_id, kind, name) values (test.id('alice'), 'dog', 'Luna');
insert into public.sitter_profiles (user_id, offers, daily_rate, overnight_rate, walk_rate, sitting_exchange)
  values (test.id('dani'), '{dog_walking}', 20, 25.50, 9.50, true);
insert into public.payment_profiles (user_id, card_last4, payouts_ready) values
  (test.id('alice'), '4242', false),
  (test.id('dani'), null, true);

select test.check((select count(*) = 4 from public.invite_codes where note = 'personal'), 'Signing up gives everyone their own invite code');

-- Profiles ------------------------------------------------------------------------------------------
set role authenticated;
select test.login('alice');
select test.check((select count(*) = 1 from public.profiles where id = test.id('bea')), 'Alice sees the profile of Bea (her circle)');
select test.check((select count(*) = 0 from public.profiles where id = test.id('carl')), 'Alice doesn’t see Carl’s profile (a stranger)');
select test.check((select count(*) = 1 from public.profiles where id = test.id('dani')), 'Alice sees Dani’s profile (pet sitters are visible to all members)');
select test.check(test.rows($$update public.profiles set first_name = 'Hacked' where id = test.id('bea')$$) = 0, 'Alice can’t change Bea’s profile');
select test.check(test.rows($$update public.profiles set city = 'Málaga' where id = test.id('alice')$$) = 1, 'Alice can change her own profile');

-- Pets ----------------------------------------------------------------------------------------------
select test.login('bea');
select test.check((select count(*) = 1 from public.pets where owner_id = test.id('alice')), 'Bea sees Alice’s pet (circle)');
select test.login('carl');
select test.check((select count(*) = 0 from public.pets where owner_id = test.id('alice')), 'Carl doesn’t see Alice’s pet');
select test.check(test.refused($$insert into public.pets (owner_id, kind, name) values (test.id('alice'), 'cat', 'Fake')$$), 'Carl can’t add a pet to Alice’s profile');
select test.check(test.rows($$delete from public.pets where owner_id = test.id('alice')$$) = 0, 'Carl can’t remove Alice’s pet');

-- Posts and post photos (script 16) -------------------------------------------------------------------
select test.login('alice');
select test.check(not test.refused($$insert into storage.objects (bucket_id, name) values ('post-photos', 'a0000000-0000-0000-0000-00000000000a/walk.jpg')$$), 'Alice can upload a post photo to her own folder');
select test.check(test.refused($$insert into storage.objects (bucket_id, name) values ('post-photos', 'b0000000-0000-0000-0000-00000000000b/fake.jpg')$$), 'Alice can’t upload into Bea’s folder');
select test.check(not test.refused($$insert into public.posts (body, photo_url) values ('Walk in the park', 'a0000000-0000-0000-0000-00000000000a/walk.jpg')$$), 'Alice can post with her own photo');
select test.check(test.refused($$insert into public.posts (body, photo_url) values ('x', 'b0000000-0000-0000-0000-00000000000b/fake.jpg')$$), 'Alice can’t post someone else’s photo');
select test.check(test.refused($$insert into public.posts (body, photo_url) values ('x', 'https://tracker.example/pixel.gif')$$), 'Alice can’t post a picture from another website');
select test.check(test.refused($$insert into public.posts (author_id, body) values (test.id('bea'), 'Pretending to be Bea')$$), 'Alice can’t post as Bea');

select test.login('bea');
select test.check((select count(*) = 1 from public.posts where author_id = test.id('alice')), 'Bea sees Alice’s post (circle)');
select test.check((select count(*) = 1 from storage.objects where bucket_id = 'post-photos'), 'Bea can open Alice’s post photo (circle)');
select test.login('carl');
select test.check((select count(*) = 0 from public.posts where author_id = test.id('alice')), 'Carl doesn’t see Alice’s post');
select test.check((select count(*) = 0 from storage.objects where bucket_id = 'post-photos'), 'Carl can’t open Alice’s post photo');
select test.check(test.rows($$delete from public.posts$$) = 0, 'Carl can’t delete Alice’s post');
select test.check(test.rows($$delete from storage.objects where bucket_id = 'post-photos'$$) = 0, 'Carl can’t delete Alice’s photo');

-- Chat ----------------------------------------------------------------------------------------------
select test.check(test.refused($$insert into public.messages (sender_id, recipient_id, body) values (test.id('carl'), test.id('alice'), 'Hi')$$), 'Carl can’t message Alice (not in her circle, not a sitter)');
select test.check(not test.refused($$insert into public.messages (sender_id, recipient_id, body) values (test.id('carl'), test.id('dani'), 'Are you free?')$$), 'Carl can message Dani (a pet sitter)');
select test.check(test.refused($$insert into public.messages (sender_id, recipient_id, body) values (test.id('alice'), test.id('dani'), 'Pretending to be Alice')$$), 'Carl can’t send a message as Alice');
select test.login('dani');
select test.check(not test.refused($$insert into public.messages (sender_id, recipient_id, body) values (test.id('dani'), test.id('carl'), 'Yes!')$$), 'Dani can answer Carl');
select test.login('bea');
select test.check((select count(*) = 0 from public.messages), 'Bea can’t read Carl and Dani’s chat');

-- Bookings and prices ----------------------------------------------------------------------------------
-- The database works out the price; the app shows the same sum beforehand (src/lib/bookings.test.ts).
select test.login('alice');
select test.check(
  (select total_cents = 6000 and quantity = 3 from public.request_booking(test.id('dani'), 'daily', current_date + 20, current_date + 22, null, null, null)),
  'Booking 3 days at 20 € costs 60 €');
select test.check(
  (select total_cents = 7650 and quantity = 3 from public.request_booking(test.id('dani'), 'overnight', current_date + 20, current_date + 23, null, null, null)),
  'Booking 3 nights at 25.50 € costs 76.50 €');
select test.check(
  (select total_cents = 1900 from public.request_booking(test.id('dani'), 'walk', current_date + 5, current_date + 5, 2, null, null)),
  'Booking 2 hours of dog walking at 9.50 € costs 19 €');
select test.check(test.rows($$update public.bookings set total_cents = 1$$) = 0, 'Alice can’t change the price of a booking');
select test.check(test.refused($$select public.request_booking(test.id('dani'), 'daily', current_date - 1, current_date, null, null, null)$$), 'Bookings can’t start in the past');
select test.check(test.refused($$select public.request_booking(test.id('alice'), 'daily', current_date + 1, current_date + 1, null, null, null)$$), 'Nobody can book themselves');
select test.check(test.refused($$select public.request_booking(test.id('dani'), 'daily', current_date + 1, current_date + 200, null, null, null)$$), 'A booking can’t be longer than 90 days');
select test.login('carl');
select test.check(test.refused($$select public.request_booking(test.id('dani'), 'daily', current_date + 1, current_date + 1, null, null, null)$$), 'Carl can’t book a paid service without a card');
select test.check((select count(*) = 0 from public.bookings), 'Carl doesn’t see Alice’s bookings');

-- Free bookings can't be accepted once their first day has passed (script 16)
reset role;
insert into public.bookings (id, owner_id, sitter_id, service, start_date, end_date, quantity) values
  ('e0000000-0000-0000-0000-000000000001', test.id('alice'), test.id('dani'), 'sitting_exchange', current_date - 3, current_date - 1, 3),
  ('e0000000-0000-0000-0000-000000000002', test.id('alice'), test.id('dani'), 'sitting_exchange', current_date + 3, current_date + 5, 3);
set role authenticated;
select test.login('dani');
select test.check((select status is null from public.accept_free_booking('e0000000-0000-0000-0000-000000000001')), 'A free booking can’t be accepted after its first day');
select test.check((select status = 'accepted' from public.accept_free_booking('e0000000-0000-0000-0000-000000000002')), 'A free booking can be accepted before its first day');
select test.login('carl');
select test.check(test.refused($$select public.cancel_booking_with_reason('e0000000-0000-0000-0000-000000000002', 'something_else', '')$$)
  or (select status from public.bookings where id = 'e0000000-0000-0000-0000-000000000002') is null, 'Carl can’t cancel someone else’s booking');

-- Payment details ------------------------------------------------------------------------------------
select test.login('bea');
select test.check((select count(*) = 0 from public.payment_profiles), 'Bea can’t see anyone else’s payment details');
select test.check(test.refused($$insert into public.payment_profiles (user_id, payouts_ready) values (test.id('bea'), true)$$), 'Bea can’t mark herself as ready to be paid (only the payments function can)');

-- Joining a circle with an invite ---------------------------------------------------------------------
-- Alice shares her personal code with Carl (read here as the database owner: members only see their own codes)
reset role;
select code as alice_code from public.invite_codes where created_by = test.id('alice') and note = 'personal' limit 1 \gset
set role authenticated;
select test.login('carl');
select test.check((select count(*) = 0 from public.invite_codes where created_by = test.id('alice')), 'Carl can’t look up Alice’s invite codes');
select public.join_circle(:'alice_code');
select test.check(public.in_my_circle(test.id('alice')), 'Carl joins Alice’s circle with her invite code');
select test.check((select count(*) = 1 from public.posts where author_id = test.id('alice')), 'Now Carl sees Alice’s post');

-- Pet photos (script 17) ----------------------------------------------------------------------------
select test.login('alice');
select test.check(not test.refused($$insert into storage.objects (bucket_id, name) values ('pet-photos', 'a0000000-0000-0000-0000-00000000000a/luna.jpg')$$), 'Alice can upload a pet photo to her own folder');
select test.check(test.rows($$update public.pets set photo_url = 'a0000000-0000-0000-0000-00000000000a/luna.jpg' where name = 'Luna'$$) = 1, 'Alice can give Luna her photo');
select test.check(test.refused($$update public.pets set photo_url = 'b0000000-0000-0000-0000-00000000000b/x.jpg' where name = 'Luna'$$), 'Alice can’t give Luna someone else’s photo');
select test.check(test.refused($$insert into public.pets (kind, name, photo_url) values ('cat', 'Tom', 'https://tracker.example/pixel.gif')$$), 'A pet’s photo can’t come from another website');
select test.login('bea');
select test.check((select count(*) = 1 from storage.objects where bucket_id = 'pet-photos'), 'Bea can open Luna’s photo (circle)');
select test.login('dani');
select test.check((select count(*) = 0 from storage.objects where bucket_id = 'pet-photos'), 'Dani can’t open Luna’s photo (not in Alice’s circle)');

-- Limits against spam (script 17) ----------------------------------------------------------------------
select test.login('carl');
select test.check(
  (select bool_and(not test.refused(format($$insert into public.messages (sender_id, recipient_id, body) values (test.id('carl'), test.id('dani'), 'Hello %s')$$, n)))
     from generate_series(1, 19) n),
  'Carl can send 20 messages in a minute');
select test.check(test.refused($$insert into public.messages (sender_id, recipient_id, body) values (test.id('carl'), test.id('dani'), 'One too many')$$), 'The 21st message in a minute has to wait');
select test.login('dani');
select test.check(not test.refused($$insert into public.messages (sender_id, recipient_id, body) values (test.id('dani'), test.id('carl'), 'Slow down!')$$), 'Dani can still answer (the limit is per person)');

select test.login('alice');
select test.check(
  (select bool_and(not test.refused($$select public.request_booking(test.id('dani'), 'sitting_exchange', current_date + 30, current_date + 31, null, null, null)$$))
     from generate_series(1, 5)),
  'Alice can send 10 booking requests in a day');
select test.check(test.refused($$select public.request_booking(test.id('dani'), 'sitting_exchange', current_date + 30, current_date + 31, null, null, null)$$), 'The 11th booking request in a day has to wait');

-- Visitors who aren't logged in (script 16) ---------------------------------------------------------------
reset role;
set role anon;
select test.login('visitor');
select test.check(public.is_invite_code_valid('WELCOME-HOMAMI') is not null, 'A visitor can check an invitation code (needed to sign up)');
select test.check(test.refused($$select * from public.invite_owner('WELCOME-HOMAMI')$$), 'A visitor can’t see who an invite code belongs to');
select test.check(test.refused($$select * from public.my_circle()$$), 'A visitor can’t use members-only actions');
select test.check(test.refused($$select public.request_booking(test.id('dani'), 'daily', current_date + 1, current_date + 1, null, null, null)$$), 'A visitor can’t book');
select test.check((select count(*) = 0 from public.profiles), 'A visitor can’t see any profiles');
select test.check((select count(*) = 0 from public.posts), 'A visitor can’t see any posts');
reset role;

select test.check(true, 'All database rules checked');
