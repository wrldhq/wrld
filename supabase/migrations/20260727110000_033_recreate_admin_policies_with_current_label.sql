-- ============================================================
-- 033: Source-clarity pass, NOT a functional security fix — verified via
-- a live query against pg_policies before writing this migration.
--
-- Background: migrations 002-009 all call public.role_at_least('administrator'),
-- the enum label that existed before migration 010 renamed it to 'admin'.
-- This looked, on paper, like the same bug migration 030 found in
-- storage.objects' two admin-read policies (where the literal->enum cast
-- genuinely failed at runtime). Before assuming the same bug was present
-- everywhere else, this was checked directly against the live database:
--
--   select policyname, qual from pg_policies
--   where tablename = 'mentor_applications';
--   -> qual: "... OR ( SELECT role_at_least('admin'::wrld_role) ...)"
--
-- Postgres resolves a bare string literal passed to an enum-typed function
-- parameter into a bound Const *at CREATE POLICY parse time* — that Const
-- references the enum value by OID, not by label text. migration 010's
-- `alter type ... rename value 'administrator' to 'admin'` only renames
-- the label on that OID; every policy created earlier (with the
-- then-valid 'administrator' literal) kept resolving to the same OID and
-- has been displaying/evaluating as 'admin' ever since, automatically,
-- with zero functional break. The confirmation above proves this for a
-- policy that has never been touched since migration 009 — so the same
-- holds for the rest of this list. (Migration 030's storage.objects fix
-- was still a real, separately-confirmed fix — that pattern used the
-- literal in a context that forced a runtime re-cast rather than a
-- parse-time bind; the two are not the same mechanism.)
--
-- This migration is applied anyway, purely for source-code clarity: so
-- nobody reading the migrations folder in the future greps for
-- 'administrator', sees two dozen live matches, and reasonably (but
-- incorrectly) concludes the schema is full of live bugs. Every
-- definition below is copied verbatim from migration 009 (the last
-- migration to touch each policy) with only the literal spelled as
-- 'admin' — no USING/WITH CHECK logic changes, confirmed behavior-neutral.
-- ============================================================

-- profiles ---------------------------------------------------
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id or public.role_at_least('admin'))
  with check ((select auth.uid()) = id or public.role_at_least('admin'));

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using ((select public.role_at_least('admin')));

-- learner_state ------------------------------------------------
drop policy if exists "learner_state_select_own_or_admin" on public.learner_state;
create policy "learner_state_select_own_or_admin" on public.learner_state
  for select to authenticated using ((select auth.uid()) = user_id or (select public.role_at_least('admin')));

-- volunteer_entries ----------------------------------------------
drop policy if exists "volunteer_select_own_or_admin" on public.volunteer_entries;
create policy "volunteer_select_own_or_admin" on public.volunteer_entries
  for select to authenticated using ((select auth.uid()) = user_id or (select public.role_at_least('admin')));

drop policy if exists "volunteer_update_own_or_admin" on public.volunteer_entries;
create policy "volunteer_update_own_or_admin" on public.volunteer_entries
  for update to authenticated using ((select auth.uid()) = user_id or (select public.role_at_least('admin')));

drop policy if exists "volunteer_delete_own_or_admin" on public.volunteer_entries;
create policy "volunteer_delete_own_or_admin" on public.volunteer_entries
  for delete to authenticated using ((select auth.uid()) = user_id or (select public.role_at_least('admin')));

-- community_posts --------------------------------------------------
drop policy if exists "posts_select" on public.community_posts;
create policy "posts_select" on public.community_posts
  for select to authenticated
  using (status = 'approved' or (select auth.uid()) = author_id or (select public.role_at_least('admin')));

drop policy if exists "posts_update_own_or_mod" on public.community_posts;
create policy "posts_update_own_or_mod" on public.community_posts
  for update to authenticated using ((select auth.uid()) = author_id or (select public.role_at_least('admin')));

drop policy if exists "posts_delete_own_or_mod" on public.community_posts;
create policy "posts_delete_own_or_mod" on public.community_posts
  for delete to authenticated using ((select auth.uid()) = author_id or (select public.role_at_least('admin')));

-- community_reports --------------------------------------------------
drop policy if exists "reports_select_admin" on public.community_reports;
create policy "reports_select_admin" on public.community_reports
  for select to authenticated using ((select public.role_at_least('admin')));

-- moderation_log --------------------------------------------------
drop policy if exists "modlog_select_admin" on public.moderation_log;
create policy "modlog_select_admin" on public.moderation_log
  for select to authenticated using ((select public.role_at_least('admin')));

drop policy if exists "modlog_insert_admin" on public.moderation_log;
create policy "modlog_insert_admin" on public.moderation_log
  for insert to authenticated with check ((select public.role_at_least('admin')) or actor_id is null);

-- community_trust --------------------------------------------------
drop policy if exists "trust_select_own_or_admin" on public.community_trust;
create policy "trust_select_own_or_admin" on public.community_trust
  for select to authenticated using ((select auth.uid()) = user_id or (select public.role_at_least('admin')));

-- mentor_profiles --------------------------------------------------
drop policy if exists "mentor_profiles_update_own_or_admin" on public.mentor_profiles;
create policy "mentor_profiles_update_own_or_admin" on public.mentor_profiles
  for update to authenticated using ((select auth.uid()) = user_id or (select public.role_at_least('admin')));

-- mentor_applications --------------------------------------------------
-- (this is the exact policy queried against pg_policies above to confirm
-- the whole class was already fine — the V14 Owner Dashboard Mentors tab
-- reads this table as the signed-in Administrator/Owner's own session,
-- so it was worth confirming directly rather than assuming.)
drop policy if exists "mentor_apps_select_own_or_admin" on public.mentor_applications;
create policy "mentor_apps_select_own_or_admin" on public.mentor_applications
  for select to authenticated using ((select auth.uid()) = user_id or (select public.role_at_least('admin')));

drop policy if exists "mentor_apps_update_admin" on public.mentor_applications;
create policy "mentor_apps_update_admin" on public.mentor_applications
  for update to authenticated using ((select public.role_at_least('admin')));

-- live_sessions --------------------------------------------------
drop policy if exists "live_sessions_update_own_or_admin" on public.live_sessions;
create policy "live_sessions_update_own_or_admin" on public.live_sessions
  for update to authenticated using ((select auth.uid()) = mentor_id or (select public.role_at_least('admin')));

drop policy if exists "live_sessions_delete_own_or_admin" on public.live_sessions;
create policy "live_sessions_delete_own_or_admin" on public.live_sessions
  for delete to authenticated using ((select auth.uid()) = mentor_id or (select public.role_at_least('admin')));

-- feature_toggles / announcements / featured_picks ----------------
drop policy if exists "toggles_update_admin" on public.feature_toggles;
create policy "toggles_update_admin" on public.feature_toggles
  for update to authenticated using ((select public.role_at_least('admin')));

drop policy if exists "announcements_insert_admin" on public.announcements;
create policy "announcements_insert_admin" on public.announcements
  for insert to authenticated with check ((select public.role_at_least('admin')));

drop policy if exists "announcements_delete_admin" on public.announcements;
create policy "announcements_delete_admin" on public.announcements
  for delete to authenticated using ((select public.role_at_least('admin')));

drop policy if exists "featured_update_admin" on public.featured_picks;
create policy "featured_update_admin" on public.featured_picks
  for update to authenticated using ((select public.role_at_least('admin')));

-- Note: storage.objects' "mentor_uploads_owner_or_admin_read" and
-- "volunteer_proof_owner_or_admin_read" are NOT repeated here — migration
-- 030 already recreated both with the 'admin' label.
