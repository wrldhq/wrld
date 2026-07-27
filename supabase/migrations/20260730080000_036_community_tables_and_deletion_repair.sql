-- ============================================================
-- 036: V19.2 — backend repair pass
--
-- Part A: re-affirm delete_mentor_application() with an explicit
-- PostgREST schema-cache reload. The function was defined correctly in
-- migration 035, but the reported error ("Could not find the function
-- ... in the schema cache") is the exact, well-known symptom of a
-- migration that was committed to the repo but never actually applied
-- to the live Supabase project (see V19.2-BACKEND-SETUP.md — this is a
-- deployment-application issue, not a code defect). This migration is
-- `create or replace`, safe to re-apply, and ends with an explicit
-- `NOTIFY pgrst, 'reload schema'` so that even a direct SQL Editor
-- paste (which doesn't go through the CLI's automatic reload) forces
-- PostgREST to recognize the function immediately.
--
-- Part B: real, shared, public Community tables — community_posts and
-- community_replies. Previously this data lived only in
-- `localStorage` (`wrld_community_posts_v1` in app.js) — genuinely
-- per-browser, never shared across users or devices, exactly the bug
-- reported. These are brand-new, additive tables; no existing data is
-- touched. Column names mirror the existing local post/reply shape
-- (authorId/authorName/body/status/reportCount) so app.js's rewritten
-- functions map onto them with minimal shape change.
-- ============================================================

-- ---------- Part A ----------
create or replace function public.delete_mentor_application(p_application_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  caller uuid := auth.uid();
  app_row public.mentor_applications;
begin
  if caller is null then
    raise exception 'You need to be signed in to do that.';
  end if;
  if not coalesce(public.role_at_least('owner'::public.wrld_role), false) then
    raise exception 'Only the Owner can permanently delete a mentor application.';
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

-- Forces PostgREST to reload its schema cache immediately so the
-- function above is recognized without waiting for the next deploy
-- cycle or manual dashboard "Reload schema" click. Safe to run on every
-- apply of this migration.
notify pgrst, 'reload schema';

-- ---------- Part B ----------
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete set null,
  category text,
  body text not null,
  status text not null default 'approved' check (status in ('approved','held','removed','edits_requested')),
  flags text[] not null default '{}',
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_category_idx on public.community_posts(category);
create index if not exists community_posts_author_idx on public.community_posts(author_id);
create index if not exists community_posts_status_idx on public.community_posts(status);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete set null,
  body text not null,
  status text not null default 'approved' check (status in ('approved','held','removed','edits_requested')),
  flags text[] not null default '{}',
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_replies_post_idx on public.community_replies(post_id);
create index if not exists community_replies_author_idx on public.community_replies(author_id);

alter table public.community_posts enable row level security;
alter table public.community_replies enable row level security;

-- Public read: anyone (including logged-out visitors, via the anon key)
-- can see published, non-removed content — this is the actual fix for
-- "logged-out visitors and other devices must see the same content."
drop policy if exists community_posts_select_public on public.community_posts;
create policy community_posts_select_public on public.community_posts
  for select
  using (status = 'approved' or (select auth.uid()) = author_id or coalesce(public.role_at_least('admin'::public.wrld_role), false));

drop policy if exists community_replies_select_public on public.community_replies;
create policy community_replies_select_public on public.community_replies
  for select
  using (status = 'approved' or (select auth.uid()) = author_id or coalesce(public.role_at_least('admin'::public.wrld_role), false));

-- Authenticated insert, always as yourself — never another author.
drop policy if exists community_posts_insert_own on public.community_posts;
create policy community_posts_insert_own on public.community_posts
  for insert to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists community_replies_insert_own on public.community_replies;
create policy community_replies_insert_own on public.community_replies
  for insert to authenticated
  with check ((select auth.uid()) = author_id);

-- Delete: the author of their own content, or an Administrator/Owner
-- for moderation. Nobody may update another author's content, and there
-- is deliberately no general UPDATE policy for authors themselves —
-- moderation status changes go through moderation_set_community_status()
-- below, matching the security-definer pattern already established for
-- mentor-application status changes.
drop policy if exists community_posts_delete_own_or_admin on public.community_posts;
create policy community_posts_delete_own_or_admin on public.community_posts
  for delete to authenticated
  using ((select auth.uid()) = author_id or coalesce(public.role_at_least('admin'::public.wrld_role), false));

drop policy if exists community_replies_delete_own_or_admin on public.community_replies;
create policy community_replies_delete_own_or_admin on public.community_replies
  for delete to authenticated
  using ((select auth.uid()) = author_id or coalesce(public.role_at_least('admin'::public.wrld_role), false));

-- Moderation status change (approve / hold / remove) — Administrator+
-- only, since there's no general UPDATE policy for regular authors.
create or replace function public.moderation_set_community_status(p_post_id uuid, p_reply_id uuid, p_status text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required.';
  end if;
  if p_status not in ('approved','held','removed','edits_requested') then
    raise exception 'Invalid status.';
  end if;
  if p_reply_id is not null then
    update public.community_replies set status = p_status, updated_at = now() where id = p_reply_id;
  else
    update public.community_posts set status = p_status, updated_at = now() where id = p_post_id;
  end if;
  return true;
end;
$$;
revoke all on function public.moderation_set_community_status(uuid, uuid, text) from public, anon;
grant execute on function public.moderation_set_community_status(uuid, uuid, text) to authenticated;

-- Reporting: any authenticated visitor can report a post/reply they
-- don't own (a reporter never has UPDATE rights under RLS, so this
-- needs a security-definer function — same pattern as
-- report_playbook_content() in migration 029). Auto-holds at the same
-- threshold (3) the local implementation used.
create or replace function public.report_community_content(p_post_id uuid, p_reply_id uuid, p_reason text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  new_count int;
begin
  if auth.uid() is null then
    raise exception 'You need to be signed in to report something.';
  end if;
  if p_reply_id is not null then
    update public.community_replies set report_count = report_count + 1 where id = p_reply_id returning report_count into new_count;
    if new_count >= 3 then
      update public.community_replies set status = 'held' where id = p_reply_id and status = 'approved';
    end if;
  else
    update public.community_posts set report_count = report_count + 1 where id = p_post_id returning report_count into new_count;
    if new_count >= 3 then
      update public.community_posts set status = 'held' where id = p_post_id and status = 'approved';
    end if;
  end if;
  return true;
end;
$$;
revoke all on function public.report_community_content(uuid, uuid, text) from public, anon;
grant execute on function public.report_community_content(uuid, uuid, text) to authenticated;

notify pgrst, 'reload schema';
