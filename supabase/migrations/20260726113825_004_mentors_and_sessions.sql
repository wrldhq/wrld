-- ============================================================
-- 004: Mentor system — replaces wrld_mentor_profiles_v1,
-- wrld_mentor_applications_v1, wrld_live_sessions_v1.
-- ============================================================

create table public.mentor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tagline text,
  bio text,
  expertise jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger mentor_profiles_touch_updated_at
  before update on public.mentor_profiles
  for each row execute function public.touch_updated_at();

alter table public.mentor_profiles enable row level security;

-- Public mentor directory (community.html) reads every mentor profile.
create policy "mentor_profiles_select_all" on public.mentor_profiles
  for select to authenticated using (true);

create policy "mentor_profiles_upsert_own" on public.mentor_profiles
  for insert to authenticated with check (user_id = auth.uid());

create policy "mentor_profiles_update_own_or_admin" on public.mentor_profiles
  for update to authenticated using (user_id = auth.uid() or public.role_at_least('administrator'));

-- ------------------------------------------------------------
create type public.application_status as enum ('pending','approved','rejected');

create table public.mentor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.application_status not null default 'pending',
  answers jsonb not null default '{}'::jsonb,        -- application form responses
  resume_file_path text,                              -- storage object path
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index mentor_applications_user_idx on public.mentor_applications(user_id);

alter table public.mentor_applications enable row level security;

create policy "mentor_apps_select_own_or_admin" on public.mentor_applications
  for select to authenticated using (user_id = auth.uid() or public.role_at_least('administrator'));

create policy "mentor_apps_insert_own" on public.mentor_applications
  for insert to authenticated with check (user_id = auth.uid());

create policy "mentor_apps_update_admin" on public.mentor_applications
  for update to authenticated using (public.role_at_least('administrator'));

-- ------------------------------------------------------------
-- Live sessions (published by Mentors, read by events.html) — replaces
-- wrld_live_sessions_v1. Never seeded with fake sessions.
-- ------------------------------------------------------------
create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  duration_minutes int not null default 60,
  meeting_link text,
  capacity int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger live_sessions_touch_updated_at
  before update on public.live_sessions
  for each row execute function public.touch_updated_at();

alter table public.live_sessions enable row level security;

create policy "live_sessions_select_all" on public.live_sessions
  for select to authenticated using (true);

create policy "live_sessions_insert_mentor" on public.live_sessions
  for insert to authenticated with check (mentor_id = auth.uid() and public.role_at_least('mentor'));

create policy "live_sessions_update_own_or_admin" on public.live_sessions
  for update to authenticated using (mentor_id = auth.uid() or public.role_at_least('administrator'));

create policy "live_sessions_delete_own_or_admin" on public.live_sessions
  for delete to authenticated using (mentor_id = auth.uid() or public.role_at_least('administrator'));
