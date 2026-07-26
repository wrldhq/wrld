-- ============================================================
-- 032: Wires the pre-existing (never-used) mentor_applications table up
-- for real, per V14 sections 12/14/15/16. The table already had the
-- right RLS shape (own-row-or-admin SELECT, own-row INSERT requiring
-- auth.uid()=user_id, admin-only UPDATE) — this migration adds the
-- structured columns become-mentor.html's real form fields need (the
-- original table only had a generic `answers jsonb` blob, which works
-- for storage but not for the Owner Dashboard's "search by expertise" /
-- "filter by submission date" requirements), plus status history and
-- internal notes. Because the existing INSERT policy requires
-- auth.uid() = user_id, become-mentor.html now requires being logged in
-- to submit (previously allowed anonymous submission) — a deliberate,
-- small tightening: it's also what makes "Associated WRLD account" a
-- real, always-populated field instead of sometimes-null, and it's what
-- makes real private file uploads possible (the mentor-applications
-- storage bucket's RLS is folder-scoped to auth.uid(), see migration 006).
-- ============================================================

alter table public.mentor_applications
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists occupation text,
  add column if not exists education text,
  add column if not exists expertise text,
  add column if not exists languages text,
  add column if not exists bio text,
  add column if not exists why text,
  add column if not exists experience text,
  add column if not exists availability text,
  add column if not exists linkedin text,
  add column if not exists portfolio text,
  add column if not exists resume_filename text,
  add column if not exists certs_path text,
  add column if not exists certs_filename text,
  add column if not exists internal_notes jsonb not null default '[]'::jsonb,
  add column if not exists owner_notification_sent_at timestamptz,
  add column if not exists applicant_receipt_sent_at timestamptz,
  add column if not exists applicant_decision_email_sent_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.mentor_applications alter column status set default 'submitted';

create index if not exists mentor_applications_status_idx on public.mentor_applications(status);
create index if not exists mentor_applications_email_idx on public.mentor_applications(email);

create table if not exists public.mentor_application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.mentor_applications(id) on delete cascade,
  previous_status text,
  new_status text not null,
  reviewer_id uuid references auth.users(id),
  reviewer_name text,
  note text,
  applicant_email_sent boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists mentor_application_status_history_app_idx on public.mentor_application_status_history(application_id);

alter table public.mentor_application_status_history enable row level security;
drop policy if exists mentor_application_status_history_select_admin on public.mentor_application_status_history;
create policy mentor_application_status_history_select_admin on public.mentor_application_status_history
  for select to authenticated using (coalesce(public.role_at_least('admin'::public.wrld_role), false));
-- No INSERT/UPDATE policy for regular clients — only the security-definer
-- function below writes history rows.

-- Submission RPC: lets become-mentor.html pass named fields instead of
-- hand-building the `answers` jsonb blob, and keeps name/email/etc.
-- validation in one place. Still respects the existing
-- mentor_apps_insert_own RLS policy (security invoker would be fine
-- here too, since the caller IS the row owner) — defined as invoker so
-- it can never be used to insert on someone else's behalf.
create or replace function public.submit_mentor_application(
  p_name text, p_email text, p_occupation text, p_education text,
  p_expertise text, p_languages text, p_bio text, p_why text,
  p_experience text, p_availability text, p_linkedin text, p_portfolio text,
  p_resume_path text, p_resume_filename text, p_certs_path text, p_certs_filename text
)
returns public.mentor_applications
language plpgsql
security invoker set search_path = public
as $$
declare
  result public.mentor_applications;
begin
  if auth.uid() is null then
    raise exception 'You need to be logged in to submit a mentor application.';
  end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_email), '') = '' then
    raise exception 'Name and email are required.';
  end if;
  insert into public.mentor_applications (
    user_id, status, answers, name, email, occupation, education, expertise, languages,
    bio, why, experience, availability, linkedin, portfolio,
    resume_file_path, resume_filename, certs_path, certs_filename
  ) values (
    auth.uid(), 'submitted', '{}'::jsonb, trim(p_name), lower(trim(p_email)), p_occupation, p_education, p_expertise, p_languages,
    p_bio, p_why, p_experience, p_availability, p_linkedin, p_portfolio,
    p_resume_path, p_resume_filename, p_certs_path, p_certs_filename
  ) returning * into result;
  return result;
end;
$$;

revoke all on function public.submit_mentor_application(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.submit_mentor_application(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated;

-- Structured status change: Administrator+ only, records history
-- atomically, and promotes the applicant's account to Mentor on approval
-- (the one real path any account ever becomes a Mentor — mirrors
-- auth.js's promoteUserRole(), done here too so it can never be skipped
-- by forgetting the separate client-side call).
create or replace function public.set_mentor_application_status(p_application_id uuid, p_new_status text, p_note text)
returns public.mentor_applications
language plpgsql
security definer set search_path = public
as $$
declare
  reviewer uuid := auth.uid();
  reviewer_row public.profiles;
  current_row public.mentor_applications;
  result public.mentor_applications;
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required.';
  end if;
  if p_new_status not in ('submitted','under_review','more_information_requested','approved','declined','withdrawn') then
    raise exception 'Invalid status.';
  end if;

  select * into current_row from public.mentor_applications where id = p_application_id;
  if current_row is null then
    raise exception 'Application not found.';
  end if;
  select * into reviewer_row from public.profiles where id = reviewer;

  update public.mentor_applications
  set status = p_new_status::public.application_status, updated_at = now()
  where id = p_application_id
  returning * into result;

  insert into public.mentor_application_status_history (application_id, previous_status, new_status, reviewer_id, reviewer_name, note)
  values (p_application_id, current_row.status::text, p_new_status, reviewer, coalesce(reviewer_row.name, 'Administrator'), p_note);

  if p_new_status = 'approved' and current_row.user_id is not null then
    update public.profiles set role = 'mentor' where id = current_row.user_id and role = 'explorer';
  end if;

  return result;
end;
$$;

revoke all on function public.set_mentor_application_status(uuid, text, text) from public, anon;
grant execute on function public.set_mentor_application_status(uuid, text, text) to authenticated;

create or replace function public.add_mentor_application_note(p_application_id uuid, p_note text)
returns public.mentor_applications
language plpgsql
security definer set search_path = public
as $$
declare
  reviewer uuid := auth.uid();
  reviewer_row public.profiles;
  result public.mentor_applications;
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required.';
  end if;
  select * into reviewer_row from public.profiles where id = reviewer;
  update public.mentor_applications
  set internal_notes = internal_notes || jsonb_build_object(
        'authorId', reviewer, 'authorName', coalesce(reviewer_row.name,'Administrator'),
        'note', p_note, 'at', now()
      ),
      updated_at = now()
  where id = p_application_id
  returning * into result;
  return result;
end;
$$;

revoke all on function public.add_mentor_application_note(uuid, text) from public, anon;
grant execute on function public.add_mentor_application_note(uuid, text) to authenticated;
