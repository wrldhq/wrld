-- ============================================================
-- 041: V25.2 — Live Learning sessions: real Supabase persistence +
-- public visibility.
--
-- ROOT CAUSE (confirmed by reading app.js, not guessed): getLiveSessions()
-- / saveLiveSessions() / publishLiveSession() / cancelLiveSession() /
-- upcomingLiveSessions() have, since this table was created (migration
-- 004), been a 100%-localStorage-only store — `wrld_live_sessions_v1` in
-- the browser's localStorage. They never call Supabase at all. That is
-- why a published session was only ever visible in the publishing
-- mentor's own browser: it never left that browser to begin with. This
-- table + its RLS have existed the whole time with zero rows in
-- production (confirmed: 0 rows) because nothing ever wrote to it.
--
-- Secondary, real gap this migration also fixes: even once app.js is
-- corrected to write here (done in this same release, see app.js), the
-- table's only SELECT policy was `to authenticated using (true)` — no
-- `anon` access at all, so a logged-out visitor could never see a
-- session even after it started persisting correctly. Fixed below with
-- a narrowly-scoped additive policy (published + future rows only) that
-- covers both anon and authenticated, without touching the existing
-- insert/update/delete policies (mentor-owns-own-session, admin-can-
-- manage-any) at all, and without disabling RLS anywhere.
--
-- New columns needed because the client previously stored this same
-- information in the localStorage session object instead:
--   status       - draft | published | cancelled. Every session the
--                  Mentor Studio form creates today is inserted directly
--                  as 'published' (there's no separate "save as draft"
--                  step in the current UI); 'draft' only exists so a
--                  future draft-saving feature — or any row not yet
--                  explicitly published — never has to be exposed
--                  publicly by default (fails closed).
--   program_id   - which WRLD Program (client-side PROGRAMS list) this
--                  session belongs to. Was already in the localStorage
--                  object; had no column.
--   platform     - meeting platform label. Same as above.
--   mentor_name  - denormalized on write. public.profiles SELECT is
--                  locked to (own row OR admin) — see migration 012 —
--                  so a public/anon reader could never join profiles to
--                  get the mentor's display name even if we wanted to.
--                  community_posts.author_name and
--                  playbook_questions.author_name already use this exact
--                  denormalization pattern for the same reason.
-- Cancelling a session now sets status='cancelled' (soft) instead of
-- deleting the row outright — safer (keeps history/capacity data), and
-- is what actually satisfies "cancelled sessions must stay hidden" (they
-- still exist, they're just excluded from every public/consumer query).
-- ============================================================

alter table public.live_sessions
  add column if not exists status text not null default 'draft',
  add column if not exists program_id text,
  add column if not exists platform text,
  add column if not exists mentor_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'live_sessions_status_check'
  ) then
    alter table public.live_sessions
      add constraint live_sessions_status_check
      check (status in ('draft','published','cancelled'));
  end if;
end $$;

create index if not exists live_sessions_public_feed_idx
  on public.live_sessions (status, starts_at)
  where status = 'published';

-- Replace the authenticated-only, unconditional SELECT policy with one
-- that additionally allows anon (and any authenticated visitor who isn't
-- the mentor or an admin) to read only published, future sessions.
-- Mentors keep full visibility of their own sessions (any status, past
-- or future, for their "Your Scheduled Sessions" list); admins keep full
-- visibility of everything, unchanged from before.
drop policy if exists "live_sessions_select_all" on public.live_sessions;

create policy "live_sessions_select_public_or_own_or_admin" on public.live_sessions
  for select
  to public
  using (
    (status = 'published' and starts_at > now())
    or mentor_id = auth.uid()
    or public.role_at_least('admin'::wrld_role)
  );

-- Registration itself continues to require a real account — this
-- migration only ever grants anon *read* access to already-published,
-- future session listings, never insert/update/delete (those policies,
-- and their mentor/admin-only scoping, are untouched by this migration).
