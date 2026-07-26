-- ============================================================
-- 014: volunteer_entries was missing a few fields the existing app.js
-- entry shape actually has (role, the full verification heuristic
-- detail object with its reasons/evaluatedAt/manualOverride, and a
-- denormalized verified_badge for cheap querying) — add them rather
-- than lose fidelity when this table starts being synced to for real.
-- ============================================================
alter table public.volunteer_entries
  add column if not exists role text,
  add column if not exists verification jsonb,
  add column if not exists verified_badge boolean not null default false;
