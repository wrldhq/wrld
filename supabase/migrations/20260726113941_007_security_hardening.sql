-- ============================================================
-- 007: Hardening — fixes from Supabase's security advisor lints run
-- after 001-006.
-- ============================================================

-- 1) Pin search_path on the trigger helper (was mutable).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) The `avatars` bucket is already public:true, so individual objects
-- are servable by URL without any storage.objects SELECT policy at all.
-- A broad SELECT policy here would only enable bucket *listing* via the
-- REST API, which is more exposure than intended — don't add one.
drop policy if exists "avatars_public_read" on storage.objects;

-- 3) These helper functions back RLS policies, which evaluate inside
-- Postgres directly — they don't need to be callable as public RPC
-- endpoints (/rest/v1/rpc/...), and handle_new_user should only ever run
-- as the auth.users trigger. Revoke public/authenticated EXECUTE.
revoke execute on function public.current_role() from public, anon, authenticated;
revoke execute on function public.role_at_least(public.wrld_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
