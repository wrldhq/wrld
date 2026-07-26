-- ============================================================
-- 005: Owner Dashboard "Content"/"Organization" tabs — replaces
-- wrld_feature_toggles_v1, wrld_announcements_v1, wrld_featured_v1.
-- These are site-wide singletons/lists, not per-user.
-- ============================================================

create table public.feature_toggles (
  id boolean primary key default true,   -- single-row table, id always true
  study_groups boolean not null default false,
  accountability_partners boolean not null default false,
  constraint feature_toggles_single_row check (id)
);
insert into public.feature_toggles (id) values (true);

alter table public.feature_toggles enable row level security;

create policy "toggles_select_all" on public.feature_toggles
  for select to authenticated using (true);

create policy "toggles_update_admin" on public.feature_toggles
  for update to authenticated using (public.role_at_least('administrator'));

-- ------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements_select_all" on public.announcements
  for select to authenticated using (true);

create policy "announcements_insert_admin" on public.announcements
  for insert to authenticated with check (public.role_at_least('administrator'));

create policy "announcements_delete_admin" on public.announcements
  for delete to authenticated using (public.role_at_least('administrator'));

-- ------------------------------------------------------------
create table public.featured_picks (
  id boolean primary key default true,
  playbook_slug text,
  mentor_user_id uuid references auth.users(id),
  constraint featured_picks_single_row check (id)
);
insert into public.featured_picks (id) values (true);

alter table public.featured_picks enable row level security;

create policy "featured_select_all" on public.featured_picks
  for select to authenticated using (true);

create policy "featured_update_admin" on public.featured_picks
  for update to authenticated using (public.role_at_least('administrator'));
