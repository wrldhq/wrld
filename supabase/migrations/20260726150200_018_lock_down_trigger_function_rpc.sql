-- ============================================================
-- 018: guard_profile_updates() is a trigger function — it only ever
-- needs to fire as part of an UPDATE on profiles (which doesn't require
-- an EXECUTE grant; triggers fire regardless), never called directly as
-- an RPC endpoint (it would just error outside trigger context anyway,
-- since it reads NEW/OLD). Revoke the default RPC-callable grant so it
-- doesn't show up as a public API surface for no reason.
-- ============================================================
revoke execute on function public.guard_profile_updates() from public, anon, authenticated;
