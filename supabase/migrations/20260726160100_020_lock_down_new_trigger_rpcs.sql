-- ============================================================
-- 020: Same housekeeping as migration 018 — these are trigger-only
-- functions and never need to be callable directly as an RPC endpoint.
-- ============================================================
revoke execute on function public.compute_volunteer_verification() from public, anon, authenticated;
revoke execute on function public.guard_community_post_updates() from public, anon, authenticated;
revoke execute on function public.guard_community_trust_updates() from public, anon, authenticated;
