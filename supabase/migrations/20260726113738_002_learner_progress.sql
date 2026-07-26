-- ============================================================
-- 002: learner progress — replaces wrld_state_v1 (localStorage) with a
-- real per-user row, so progress survives cleared cache / new devices.
-- ============================================================

create table public.learner_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bookmarks jsonb not null default '[]'::jsonb,      -- string[] of playbook slugs
  completed jsonb not null default '[]'::jsonb,       -- string[] of playbook slugs
  checklists jsonb not null default '{}'::jsonb,      -- {[checklistId]: string[] checked item ids}
  quiz_scores jsonb not null default '{}'::jsonb,      -- {[slug]: {score,total,at}}
  streak int not null default 0,
  last_visit date,
  recently_viewed jsonb not null default '[]'::jsonb, -- string[] of slugs, most-recent-first
  guidelines_accepted_at timestamptz,
  assessment jsonb,                                    -- {sectionScores, stage, completedAt, ...}
  updated_at timestamptz not null default now()
);

create trigger learner_state_touch_updated_at
  before update on public.learner_state
  for each row execute function public.touch_updated_at();

alter table public.learner_state enable row level security;

create policy "learner_state_select_own_or_admin" on public.learner_state
  for select to authenticated using (user_id = auth.uid() or public.role_at_least('administrator'));

create policy "learner_state_upsert_own" on public.learner_state
  for insert to authenticated with check (user_id = auth.uid());

create policy "learner_state_update_own" on public.learner_state
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Volunteer log — replaces wrld_volunteer_log_v1. evaluateVolunteerProof()
-- stays a client/edge heuristic (see app.js); this table just persists the
-- entries + verification state it produces.
-- ------------------------------------------------------------
create type public.volunteer_status as enum ('verified','pending_review','needs_info');
create type public.volunteer_confidence as enum ('high','medium','low');

create table public.volunteer_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization text not null,
  hours numeric(6,2) not null,
  date_start date,
  date_end date,
  reflection text,
  skill_badges jsonb not null default '[]'::jsonb,
  proof_file_path text,          -- storage object path in the volunteer-proof bucket
  confidence public.volunteer_confidence not null default 'low',
  status public.volunteer_status not null default 'pending_review',
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index volunteer_entries_user_idx on public.volunteer_entries(user_id);
create trigger volunteer_entries_touch_updated_at
  before update on public.volunteer_entries
  for each row execute function public.touch_updated_at();

alter table public.volunteer_entries enable row level security;

create policy "volunteer_select_own_or_admin" on public.volunteer_entries
  for select to authenticated using (user_id = auth.uid() or public.role_at_least('administrator'));

create policy "volunteer_insert_own" on public.volunteer_entries
  for insert to authenticated with check (user_id = auth.uid());

create policy "volunteer_update_own_or_admin" on public.volunteer_entries
  for update to authenticated using (user_id = auth.uid() or public.role_at_least('administrator'));

create policy "volunteer_delete_own_or_admin" on public.volunteer_entries
  for delete to authenticated using (user_id = auth.uid() or public.role_at_least('administrator'));
