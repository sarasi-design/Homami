-- Homami setup, part 7: "I travel to pet owners" for pet sitters
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run again.
--
-- travels  on: the sitter goes to the owner's home, up to radius_km away
--          off: the sitter doesn't travel — pets come to them (radius is then left empty)
alter table public.sitter_profiles add column if not exists travels boolean not null default true;
