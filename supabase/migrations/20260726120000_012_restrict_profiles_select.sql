-- ============================================================
-- 012: profiles_select_authenticated allowed ANY logged-in user to read
-- EVERY profile row (email, suspension/ban status, role, warnings, etc.)
-- via a plain `select * from profiles` REST call — far too broad for
-- production. Restrict to: your own row, OR an Administrator/Owner
-- reading any row (needed for the Owner Dashboard's real user list,
-- Community's public mentor directory needs only name/role/tagline,
-- which mentor_profiles already exposes separately with its own policy).
-- ============================================================
drop policy if exists profiles_select_authenticated on public.profiles;

create policy profiles_select_own_or_admin
on public.profiles for select
to authenticated
using ( (select auth.uid()) = id or (select public.role_at_least('admin'::public.wrld_role)) );
