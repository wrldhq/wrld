-- ============================================================
-- 011: role_at_least()'s body hardcoded the old 'administrator' label in
-- its CASE branches. Confirmed via direct testing after 010 that this
-- throws "invalid input value for enum" until fixed — recreate it with
-- the renamed 'admin' label. (create or replace preserves the REVOKE
-- from migration 007/008, so no re-grant is needed here.)
-- ============================================================
create or replace function public.role_at_least(min_role public.wrld_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when min_role = 'explorer' then public.current_role() in ('explorer','mentor','admin','owner')
    when min_role = 'mentor' then public.current_role() in ('mentor','admin','owner')
    when min_role = 'admin' then public.current_role() in ('admin','owner')
    when min_role = 'owner' then public.current_role() = 'owner'
    else false
  end;
$$;
