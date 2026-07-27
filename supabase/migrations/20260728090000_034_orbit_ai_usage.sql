-- ============================================================
-- 034: Orbit AI usage/rate-limit table
--
-- Additive only — no existing table, column, or policy is touched.
-- Backs the orbit-ai Edge Function's rate limiting (see
-- ORBIT-AI-SETUP.md). Tracks a rolling count per identity (a logged-in
-- user's id, or a hashed IP for anonymous visitors) inside a fixed
-- time window. Only the Edge Function (via the service_role key) ever
-- reads or writes this table — no client-side code touches it, and no
-- RLS policy grants any client role access, by design: this table
-- exists purely for abuse protection bookkeeping, not user-facing data.
-- ============================================================

create table if not exists public.orbit_ai_usage (
  id uuid primary key default gen_random_uuid(),
  identity text not null,             -- auth.uid() as text, or 'anon:<hashed-ip>'
  window_start timestamptz not null,
  request_count int not null default 1,
  updated_at timestamptz not null default now()
);

create unique index if not exists orbit_ai_usage_identity_window_idx
  on public.orbit_ai_usage(identity, window_start);

alter table public.orbit_ai_usage enable row level security;
-- Deliberately NO policies for anon/authenticated — only the
-- service_role key (used exclusively inside the orbit-ai Edge Function)
-- can read or write this table, same "one legitimate server-side use of
-- the service-role key" pattern already established in
-- EMAIL-AUTOMATION-SETUP.md for mentor-application emails.

comment on table public.orbit_ai_usage is
  'Rate-limit bookkeeping for the orbit-ai Edge Function. Written only by that function via the service_role key. Not exposed to any client role.';
