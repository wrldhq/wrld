-- ============================================================
-- 029: "Report inappropriate content" for Playbook questions/replies.
-- A reporter is never the author and shouldn't need UPDATE rights on
-- someone else's row (RLS in migration 028 correctly disallows that) —
-- reporting instead goes through one security-definer RPC that records
-- the report and, past a small threshold, holds the content for review.
-- Mirrors the existing REPORT_HOLD_THRESHOLD=3 convention already used
-- by the (localStorage) Community Commons reporting flow in app.js.
-- ============================================================

create table public.playbook_content_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.playbook_questions(id) on delete cascade,
  reply_id uuid references public.playbook_question_replies(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);
create index playbook_content_reports_question_idx on public.playbook_content_reports(question_id);
alter table public.playbook_content_reports enable row level security;

-- Only Administrator+ can read the raw report log (who reported what) —
-- regular users interact with reporting only through the RPC below.
create policy playbook_content_reports_select_admin on public.playbook_content_reports
  for select to authenticated using (coalesce(public.role_at_least('admin'::public.wrld_role), false));

create or replace function public.report_playbook_content(p_question_id uuid, p_reply_id uuid, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  reporter uuid := auth.uid();
  cnt int;
begin
  if reporter is null then
    raise exception 'You need to be logged in to report content.';
  end if;
  insert into public.playbook_content_reports (question_id, reply_id, reporter_id, reason)
  values (p_question_id, p_reply_id, reporter, p_reason);

  if p_reply_id is not null then
    select count(*) into cnt from public.playbook_content_reports where reply_id = p_reply_id;
    if cnt >= 3 then
      update public.playbook_question_replies set status = 'held' where id = p_reply_id and status = 'approved';
    end if;
  else
    select count(*) into cnt from public.playbook_content_reports where question_id = p_question_id and reply_id is null;
    if cnt >= 3 then
      update public.playbook_questions set status = 'held' where id = p_question_id and status = 'approved';
    end if;
  end if;
end;
$$;

revoke all on function public.report_playbook_content(uuid, uuid, text) from public, anon;
grant execute on function public.report_playbook_content(uuid, uuid, text) to authenticated;
