-- ============================================================
-- 023: `grant execute ... to authenticated` on the migration-022 functions
-- means ANY logged-in Explorer could call admin_user_list() etc. directly
-- via the client SDK and read every user's email, role, moderation
-- status, and progress data — `security definer` bypasses RLS entirely,
-- and `language sql` functions have no way to check the caller's role
-- before running. Rewriting as `plpgsql` so each function can check
-- role_at_least('admin') itself and raise an exception otherwise, the
-- same pattern already used by get_mentor_directory() (migration 013)
-- and every guard trigger from 016/019.
-- ============================================================

create or replace function public.admin_platform_overview()
returns table (
  total_users bigint,
  active_users_30d bigint,
  new_today bigint,
  new_week bigint,
  new_month bigint,
  verified_count bigint,
  verified_pct numeric,
  online_now bigint,
  total_volunteer_hours numeric,
  total_playbooks_completed bigint,
  avg_completed_per_user numeric
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required.';
  end if;
  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where last_login_at >= now() - interval '30 days'),
    (select count(*) from public.profiles where created_at >= date_trunc('day', now())),
    (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    (select count(*) from public.profiles where created_at >= now() - interval '30 days'),
    (select count(*) from public.profiles where email_verified),
    (select case when count(*)=0 then 0 else round(100.0 * count(*) filter (where email_verified) / count(*), 1) end from public.profiles),
    (select count(*) from public.profiles where last_login_at >= now() - interval '15 minutes'),
    (select coalesce(sum(hours),0) from public.volunteer_entries),
    (select coalesce(sum(jsonb_array_length(completed)),0) from public.learner_state),
    (select case when count(*)=0 then 0 else round(avg(jsonb_array_length(completed)), 2) end from public.learner_state);
end;
$$;

create or replace function public.admin_most_popular_playbooks(limit_n int default 5)
returns table (slug text, completions bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required.';
  end if;
  return query
  select value as slug, count(*) as completions
  from public.learner_state, jsonb_array_elements_text(completed) as value
  group by value
  order by completions desc, slug asc
  limit limit_n;
end;
$$;

create or replace function public.admin_most_active_users(limit_n int default 5)
returns table (user_id uuid, name text, completed_count bigint, volunteer_hours numeric, activity_score numeric)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required.';
  end if;
  return query
  select
    p.id, p.name,
    coalesce(jsonb_array_length(ls.completed), 0),
    coalesce(v.total_hours, 0),
    coalesce(jsonb_array_length(ls.completed), 0)::numeric + coalesce(v.total_hours, 0)
  from public.profiles p
  left join public.learner_state ls on ls.user_id = p.id
  left join (select user_id, sum(hours) as total_hours from public.volunteer_entries group by user_id) v on v.user_id = p.id
  order by 5 desc, p.created_at asc
  limit limit_n;
end;
$$;

create or replace function public.admin_user_list(
  search text default '',
  role_filter text default '',
  status_filter text default '',
  verified_filter text default '',
  sort_by text default 'newest',
  page_limit int default 25,
  page_offset int default 0
)
returns table (
  id uuid, name text, email text, role public.wrld_role,
  suspended boolean, deactivated boolean, banned boolean,
  warnings int, violations int, email_verified boolean,
  created_at timestamptz, last_login_at timestamptz, login_count int,
  completed_count bigint, bookmarks_count bigint, streak int,
  volunteer_hours numeric, volunteer_verified_count bigint,
  total_count bigint
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not coalesce(public.role_at_least('admin'::public.wrld_role), false) then
    raise exception 'Administrator access required.';
  end if;
  return query
  select
    p.id, p.name, p.email, p.role,
    p.suspended, p.deactivated, p.banned,
    p.warnings, p.violations, p.email_verified,
    p.created_at, p.last_login_at, p.login_count,
    coalesce(jsonb_array_length(ls.completed), 0) as completed_count,
    coalesce(jsonb_array_length(ls.bookmarks), 0) as bookmarks_count,
    coalesce(ls.streak, 0) as streak,
    coalesce(v.hours, 0) as volunteer_hours,
    coalesce(v.verified_count, 0) as volunteer_verified_count,
    count(*) over() as total_count
  from public.profiles p
  left join public.learner_state ls on ls.user_id = p.id
  left join (
    select user_id, sum(hours) as hours, count(*) filter (where status='verified') as verified_count
    from public.volunteer_entries group by user_id
  ) v on v.user_id = p.id
  where
    (search = '' or p.name ilike '%'||search||'%' or p.email ilike '%'||search||'%')
    and (role_filter = '' or p.role::text = role_filter)
    and (
      status_filter = '' or
      (status_filter = 'active' and not p.suspended and not p.deactivated and not p.banned) or
      (status_filter = 'suspended' and p.suspended and not p.banned) or
      (status_filter = 'deactivated' and p.deactivated) or
      (status_filter = 'banned' and p.banned)
    )
    and (
      verified_filter = '' or
      (verified_filter = 'verified' and p.email_verified) or
      (verified_filter = 'unverified' and not p.email_verified)
    )
  order by
    case when sort_by = 'newest' then p.created_at end desc,
    case when sort_by = 'oldest' then p.created_at end asc,
    case when sort_by = 'active' then coalesce(jsonb_array_length(ls.completed),0) + coalesce(v.hours,0) end desc,
    case when sort_by = 'alpha' then p.name end asc,
    p.created_at desc
  limit page_limit offset page_offset;
end;
$$;
