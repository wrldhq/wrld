-- ============================================================
-- 035: V19 — editable names + secure mentor-application deletion
--
-- Additive only. No existing table, column, policy, or row is dropped,
-- renamed, or altered destructively.
--
-- Part A: first_name / last_name on profiles
-- The existing `name` column (used everywhere in the app today —
-- header, dashboards, Orbit, mentor listings, etc.) is preserved
-- unchanged and remains the single field every existing display reads.
-- first_name/last_name are new, nullable columns that become the
-- editable source of truth for Account Settings' name form; `name`
-- itself is recomputed from them on every save via update_own_name()
-- below, so there is exactly one place (this function) that ever
-- writes a mismatched value, and it can't happen.
--
-- Part B: update_own_name() — lets any authenticated user change their
-- own name, regardless of role. Defined explicitly rather than relying
-- on an existing profiles UPDATE policy (whose exact column-level
-- grants aren't visible in this project's available migration history)
-- so this is correct and self-contained no matter what that policy
-- does or doesn't already allow.
--
-- Part C: delete_mentor_application() — Owner-only. Deletes the
-- application's own storage objects (resume/certs, scoped to that
-- application's stored paths only) and the application row itself.
-- mentor_application_status_history rows cascade automatically (see
-- migration 032's `on delete cascade`). Never touches the applicant's
-- profiles row or role — approving/declining and account/role deletion
-- are deliberately separate actions, per spec.
-- ============================================================

-- ---------- Part A ----------
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

comment on column public.profiles.first_name is 'Editable via Account Settings. name column is recomputed from first_name+last_name on every save by update_own_name().';
comment on column public.profiles.last_name is 'Optional. Editable via Account Settings.';

-- ---------- Part B ----------
create or replace function public.update_own_name(p_first_name text, p_last_name text)
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  caller uuid := auth.uid();
  cleaned_first text := trim(coalesce(p_first_name, ''));
  cleaned_last text := nullif(trim(coalesce(p_last_name, '')), '');
  computed_name text;
  result public.profiles;
begin
  if caller is null then
    raise exception 'You need to be logged in to update your name.';
  end if;
  if cleaned_first = '' then
    raise exception 'First name cannot be empty.';
  end if;

  computed_name := cleaned_first || case when cleaned_last is not null then ' ' || cleaned_last else '' end;

  update public.profiles
  set first_name = cleaned_first,
      last_name = cleaned_last,
      name = computed_name,
      updated_at = now()
  where id = caller
  returning * into result;

  if result is null then
    raise exception 'Profile not found.';
  end if;
  return result;
end;
$$;

revoke all on function public.update_own_name(text, text) from public, anon;
grant execute on function public.update_own_name(text, text) to authenticated;

-- ---------- Part C ----------
create or replace function public.delete_mentor_application(p_application_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  caller uuid := auth.uid();
  app_row public.mentor_applications;
begin
  if not coalesce(public.role_at_least('owner'::public.wrld_role), false) then
    raise exception 'Owner access required.';
  end if;

  select * into app_row from public.mentor_applications where id = p_application_id;
  if app_row is null then
    raise exception 'Application not found.';
  end if;

  -- Remove only this application's own storage objects — scoped to the
  -- exact stored paths on this row, never a broader per-user or
  -- per-bucket sweep, so no other application's or user's file is ever
  -- touched. Both columns are nullable (an application may have no
  -- resume/certs on file), so each delete is a no-op if the path is null.
  if app_row.resume_file_path is not null then
    delete from storage.objects where bucket_id = 'mentor-applications' and name = app_row.resume_file_path;
  end if;
  if app_row.certs_path is not null then
    delete from storage.objects where bucket_id = 'mentor-applications' and name = app_row.certs_path;
  end if;

  -- mentor_application_status_history rows for this application cascade
  -- automatically (see migration 032). The applicant's profiles row and
  -- role are never touched here — role removal, if ever wanted, is a
  -- deliberate, separate action from the Users tab.
  delete from public.mentor_applications where id = p_application_id;

  return true;
end;
$$;

revoke all on function public.delete_mentor_application(uuid) from public, anon;
grant execute on function public.delete_mentor_application(uuid) to authenticated;
