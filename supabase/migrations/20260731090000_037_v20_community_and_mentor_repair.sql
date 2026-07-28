-- ============================================================
-- 037: V20 — Community Commons + Mentor Application repair pass
--
-- Part A: Community Commons.
-- Migration 036 (community_tables_and_deletion_repair) was written
-- against a stale/parallel schema design (a separate
-- public.community_replies table, a free-text `category` column, and
-- post_status values approved/held/removed/edits_requested) and was
-- NEVER applied to this project — `list_migrations` confirms the live
-- history stops at 035. The REAL live public.community_posts table (in
-- production since migration 003, not present in this repo's history)
-- already has real semantics: replies are just rows with `parent_id`
-- set, `category` is the real `post_category` enum that
-- COMMONS_CATEGORIES in data.js already matches exactly, and
-- `post_status` is `approved/held/blocked`. This migration extends that
-- REAL schema instead of creating a disconnected, empty
-- community_replies table. Client code (app.js) has been rewritten to
-- match; this migration closes the remaining gaps that only a
-- migration can close.
--
-- Part B: Mentor applications.
-- 1) application_status was missing the 'declined' label that
--    set_mentor_application_status() already accepts as valid input
--    (its own p_new_status check has always included 'declined') — the
--    enum only ever had 'rejected', so every Decline click has been
--    failing at the final `::application_status` cast. Adding the
--    missing label, additively, fixes Decline without touching any
--    function body.
-- 2) delete_mentor_application() was Owner-only. The V20 spec is
--    explicit: "Users with permission to manage mentor applications
--    (Owner/Admin) must be able to permanently delete mentor
--    applications" — widened to Administrator+, matching
--    role_at_least('admin') the same way every other admin-facing RPC
--    in this project already does.
-- ============================================================

-- ---------- Part A1: store the display name at post time ----------
-- Matches the documented product decision (CHANGES-V19.2.md "Display
-- names") — a post/reply still shows a sensible name after the
-- author's account is deleted and author_id is anonymized to null by
-- delete-user.
alter table public.community_posts add column if not exists author_name text;

-- ---------- Part A2: extend post_status ----------
-- moderation-dashboard.html and administrator-dashboard.html already
-- ship real "Request Edits" / "Remove" buttons wired to these exact
-- status strings; the live enum only had approved/held/blocked. Adding
-- enum values must be committed before any statement in this same
-- migration file tries to *use* them in an ordinary query — the two
-- function bodies below only reference them inside quoted plpgsql text
-- (parsed, not executed, at CREATE time), so that restriction doesn't
-- apply here.
alter type public.post_status add value if not exists 'edits_requested';
alter type public.post_status add value if not exists 'removed';

-- ---------- Part A3: logged-out (anon) visibility ----------
-- Every existing SELECT policy on community_posts is scoped
-- `to authenticated` only — anon has no matching policy, so RLS
-- silently returns zero rows for logged-out visitors today. This is
-- the actual database-level fix for "logged-out visibility."
drop policy if exists posts_select_anon on public.community_posts;
create policy posts_select_anon on public.community_posts
  for select to anon
  using (status = 'approved'::post_status);

-- ---------- Part A4: rework the "force held" guard trigger ----------
-- Previously this unconditionally forced status='held' on every
-- non-admin write, including a clean INSERT with zero client-side
-- flags — silently breaking the "clean content publishes immediately"
-- flow community.html's copy and createCommunityPost()/
-- addCommunityReply() both promise, and making the entire Community
-- Commons feel broken (everything from a real member sits invisible
-- until a moderator manually approves it). This preserves the actual
-- security property — a non-admin can never self-approve something the
-- client's own moderateContent() flagged, can never forge
-- report_count, and can never resurrect held/blocked/removed content
-- via a later self-UPDATE — while letting a clean insert through as
-- 'approved' immediately, matching what the product has always claimed.
create or replace function public.guard_community_post_updates()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare is_admin boolean;
begin
  is_admin := coalesce(public.role_at_least('admin'::public.wrld_role), false);
  if auth.uid() is null or is_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.report_count := 0;
    if new.flags is null then
      new.flags := '[]'::jsonb;
    end if;
    -- Trust the client's own pre-screen result the same way the rest of
    -- this project already treats client-side moderateContent() as a
    -- courtesy check, not the security boundary: no flags -> publishes
    -- immediately as approved; any flag -> held for human review. A
    -- non-admin can never insert directly as blocked/removed/
    -- edits_requested/anything else.
    if jsonb_array_length(new.flags) = 0 then
      new.status := 'approved';
    else
      new.status := 'held';
    end if;
    return new;
  else
    -- A non-admin editing their own row (if that's ever wired up later)
    -- can never change its moderation state themselves.
    new.status := old.status;
    new.flags := old.flags;
    new.report_count := old.report_count;
    return new;
  end if;
end;
$$;

-- ---------- Part A5: moderation status changes ----------
-- app.js's moderationSetStatus() already calls this exact RPC
-- name/signature (moderation-dashboard.html / administrator-
-- dashboard.html's Approve/Request Edits/Remove buttons) — it just
-- never existed live. Administrator+ only, enforced server-side.
create or replace function public.moderation_set_community_status(p_post_id uuid, p_reply_id uuid, p_status text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare target_id uuid := coalesce(p_reply_id, p_post_id);
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required.';
  end if;
  if p_status not in ('approved','held','blocked','removed','edits_requested') then
    raise exception 'Invalid status.';
  end if;
  update public.community_posts set status = p_status::post_status, updated_at = now() where id = target_id;
  return true;
end;
$$;
revoke all on function public.moderation_set_community_status(uuid, uuid, text) from public, anon;
grant execute on function public.moderation_set_community_status(uuid, uuid, text) to authenticated;

-- ---------- Part A6: reporting ----------
-- app.js's reportCommunityItem() already calls this exact RPC
-- name/signature — it just never existed live. Mirrors the existing
-- report_playbook_content() pattern (migration 029) for consistency:
-- insert into the real reports table, then auto-hold at the same
-- threshold (3) the pre-V19.2 local implementation used.
-- community_reports has no reply_id column because a reply *is* a
-- community_posts row (parent_id set) — post_id covers both.
create or replace function public.report_community_content(p_post_id uuid, p_reply_id uuid, p_reason text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  target_id uuid := coalesce(p_reply_id, p_post_id);
  reporter uuid := auth.uid();
  cnt int;
begin
  if reporter is null then
    raise exception 'You need to be logged in to report something.';
  end if;
  insert into public.community_reports (post_id, reporter_id, reason) values (target_id, reporter, p_reason);

  update public.community_posts set report_count = report_count + 1 where id = target_id
  returning report_count into cnt;

  if cnt >= 3 then
    update public.community_posts set status = 'held' where id = target_id and status = 'approved';
  end if;
  return true;
end;
$$;
revoke all on function public.report_community_content(uuid, uuid, text) from public, anon;
grant execute on function public.report_community_content(uuid, uuid, text) to authenticated;

-- ---------- Part A7: realtime ----------
-- The supabase_realtime publication existed but had zero tables in it
-- project-wide — no cross-tab/cross-device "someone else just posted"
-- update ever happened without a manual refresh. Additive, low-risk.
alter publication supabase_realtime add table public.community_posts;

-- ---------- Part B1: fix the Decline button ----------
alter type public.application_status add value if not exists 'declined';

-- ---------- Part B2: widen mentor-application deletion to Admin+ ----------
create or replace function public.delete_mentor_application(p_application_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  caller uuid := auth.uid();
  app_row public.mentor_applications;
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required to permanently delete a mentor application.';
  end if;

  select * into app_row from public.mentor_applications where id = p_application_id;
  if app_row is null then
    raise exception 'Application not found.';
  end if;

  if app_row.resume_file_path is not null then
    delete from storage.objects where bucket_id = 'mentor-applications' and name = app_row.resume_file_path;
  end if;
  if app_row.certs_path is not null then
    delete from storage.objects where bucket_id = 'mentor-applications' and name = app_row.certs_path;
  end if;

  delete from public.mentor_applications where id = p_application_id;

  return true;
end;
$$;
revoke all on function public.delete_mentor_application(uuid) from public, anon;
grant execute on function public.delete_mentor_application(uuid) to authenticated;

notify pgrst, 'reload schema';
