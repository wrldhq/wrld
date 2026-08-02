-- ============================================================
-- 040: V25.2 — Display name safety filtering
--
-- Root of the requirement: public.profiles.name is the single field the
-- whole app already reads for a person's public display name (header,
-- Community Commons, mentor listings, Playbook discussion, etc. — see
-- migration 035's own header comment: "the single field every existing
-- display reads"). Two paths write it today:
--   - public.handle_new_user() (signup trigger on auth.users) — NOT
--     modified here; it is explicitly locked ("Signup" is on the
--     do-not-modify list).
--   - public.update_own_name() (Account Settings RPC, migration 035) —
--     NOT modified here either, for the same reason.
--
-- Rather than touching either of those, this migration adds a BEFORE
-- INSERT OR UPDATE trigger directly on public.profiles. A trigger fires
-- no matter which function performs the write, so it transparently
-- covers both existing paths above AND any future one, without any
-- change to locked signup/account-settings logic. If the trigger raises,
-- the whole calling transaction rolls back — for signup specifically,
-- that means the handle_new_user() insert into profiles fails inside the
-- same transaction as the auth.users insert, so Supabase Auth's signUp()
-- call fails and NO account (auth.users row or profiles row) is ever
-- created — satisfying "if validation fails, do not create the account,
-- never create a partial profile."
--
-- The trigger only re-validates when the name is actually changing
-- (INSERT, or UPDATE where name IS DISTINCT FROM the old value) — not on
-- every unrelated profile update (avatar_url, settings, login_count,
-- last_login_at on every login, etc.) — so an existing, already-approved
-- name can never retroactively block an unrelated future update just
-- because a later-expanded blocklist would now flag it. Existing users
-- are never auto-renamed; this only ever blocks a *new* value being
-- written.
-- ============================================================

create extension if not exists unaccent with schema extensions;

-- ---------- normalization ----------
-- Folds accents, substitutes common leetspeak digits/symbols, strips
-- every non-alphanumeric character, and collapses 3+ repeated characters
-- to one. Turns "s.l.u.r", "s___lur", "$1ur", "SLUR" all into "slur" for
-- comparison only — never used for the stored/displayed name. one_as_l
-- toggles whether digit '1' folds to 'l' or 'i' (both common leetspeak
-- readings); callers check both passes since only one mapping can apply
-- per pass. 3+ (not 2+) repeats are collapsed specifically so ordinary
-- double letters in real names (Anna, Emma, Hannah) are never altered —
-- only deliberate elongation ("sssluuurrr") is affected.
create or replace function public.wrld_tight_normalize(input text, one_as_l boolean)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select regexp_replace(
    regexp_replace(
      translate(
        lower(coalesce(extensions.unaccent(input), input, '')),
        '0134578$@!',
        case when one_as_l then 'oleastbsai' else 'oieastbsai' end
      ),
      '[^a-z0-9]', '', 'g'
    ),
    '(.)\1{2,}', '\1', 'g'
  )
$$;

-- ---------- blocklist check ----------
-- Not a table on purpose: a table is a surface that could someday be
-- exposed to a client via a misconfigured RLS policy; a hardcoded array
-- inside a locked-down function cannot be queried by anyone. This is a
-- small, representative seed list (profanity, sexual-explicit language,
-- slurs/hate speech, threats/harassment, WRLD-staff impersonation) — not
-- exhaustive. WRLD's Trust & Safety team should extend this list (and
-- the mirrored client-side list in app.js) over time.
--
-- Tiered, whole-word-based matching (never short-substring containment)
-- to avoid false positives on legitimate names:
--   1. exact whole-word match on lightly-normalized (accent/case-folded
--      only) words — catches "SLUR" used as a standalone name/word.
--   2. per-word tight-normalized match — catches punctuation/leetspeak
--      disguises ("s.l.u.r", "s___lur", "$1ur").
--   3. all-tokens-concatenated tight match, gated on every token being
--      suspiciously short — catches "s l u r" spaced-out-letter
--      disguises without misfiring on ordinary multi-word names.
-- A name containing no letters or digits at all (symbols/emoji only) is
-- also rejected structurally.
create or replace function public.is_display_name_blocked(input_name text)
returns boolean
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  terms text[] := array[
    'fuck','shit','bitch','cunt','asshole','bastard','whore','slut','douchebag','motherfucker','dumbass','jackass',
    'sex','porn','anal','blowjob','handjob','dildo','vagina','penis','boobs','xxx',
    'nigger','nigga','faggot','fag','retard','tranny','spic','chink','gook','kike','wetback','coon',
    'kill','rape','murder','terrorist','nazi','hitler',
    'admin','administrator','moderator','wrldstaff','wrldteam','wrldsupport','wrldofficial','official','staff','support'
  ];
  raw text := trim(coalesce(input_name, ''));
  stripped_alnum text;
  words text[];
  w text;
  light text;
  avg_len numeric;
  joined text;
begin
  if raw = '' then
    return false; -- emptiness is handled by existing required-field validation
  end if;

  stripped_alnum := regexp_replace(raw, '[^a-zA-Z0-9]', '', 'g');
  if stripped_alnum = '' then
    return true; -- symbol-only name
  end if;

  words := regexp_split_to_array(raw, '\s+');

  -- Tier 1
  foreach w in array words loop
    light := lower(coalesce(extensions.unaccent(w), w));
    if light = any(terms) then
      return true;
    end if;
  end loop;

  -- Tier 2
  foreach w in array words loop
    if public.wrld_tight_normalize(w, true) = any(terms) then
      return true;
    end if;
    if public.wrld_tight_normalize(w, false) = any(terms) then
      return true;
    end if;
  end loop;

  -- Tier 3
  if array_length(words, 1) > 1 then
    avg_len := (
      select avg(length(regexp_replace(x, '[^a-zA-Z0-9]', '', 'g')))
      from unnest(words) as x
    );
    if avg_len <= 2 then
      joined := array_to_string(words, '');
      if public.wrld_tight_normalize(joined, true) = any(terms) then
        return true;
      end if;
      if public.wrld_tight_normalize(joined, false) = any(terms) then
        return true;
      end if;
    end if;
  end if;

  return false;
end;
$$;

-- Neither helper needs to be, or should be, callable as a public RPC —
-- they only ever run inside the trigger below. Revoking the default
-- PostgREST-exposed grant prevents anyone from probing the blocklist by
-- calling is_display_name_blocked('candidate') directly, and matches the
-- established convention for trigger-only functions (see migration 018).
revoke all on function public.wrld_tight_normalize(text, boolean) from public, anon, authenticated;
revoke all on function public.is_display_name_blocked(text) from public, anon, authenticated;

-- ---------- trigger ----------
create or replace function public.validate_profile_display_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') or (new.name is distinct from old.name) then
    if public.is_display_name_blocked(new.name) then
      -- PostgREST (and therefore auth.js's existing `error.message ||
      -- fallback` pattern used by updateOwnName()) passes this exact
      -- text straight through to the client with no modification, so the
      -- Account Settings path shows this precise, non-technical copy
      -- automatically — no auth.js change needed. The signup path goes
      -- through Supabase Auth's signUp() instead, which may wrap this
      -- message more generically depending on project configuration;
      -- signup.html's client-side pre-check (app.js's
      -- wrldDisplayNameBlocked()) is what guarantees this exact copy is
      -- shown there, since it runs before this trigger is ever reached.
      raise exception 'That display name doesn''t meet WRLD''s community guidelines. Please choose another name.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_profile_display_name() from public, anon, authenticated;

drop trigger if exists profiles_validate_display_name on public.profiles;
create trigger profiles_validate_display_name
  before insert or update on public.profiles
  for each row execute function public.validate_profile_display_name();
