# WRLD Website V19.2 — Testing Summary

Same honesty framing as every prior pass: this is code-level
verification, not live-account testing against a connected Supabase
project (none exist in this conversation). Three distinct levels apply
here specifically, since the spec asked for them explicitly:

## Level 1 — Code-level validation (done, this pass)

- `node --check` on `app.js` and every inline `<script>` across all 32
  HTML pages — all pass.
- `tsc` type-checked `delete-user/index.ts` against Deno-runtime stubs —
  zero real errors.
- Structural check (balanced parens/dollar-quoting) on the new migration
  SQL.
- Traced every caller of every function converted from synchronous
  `localStorage` to async Supabase (`getCommunityPosts`,
  `getModerationQueue`, `getReportedItems`, `moderationSetStatus`,
  `computeCommunityBadges`, `getRecentActivityFeed`, `getSystemAlerts`)
  across `community.html`, `owner-dashboard.html`,
  `administrator-dashboard.html`, `moderation-dashboard.html`, and
  `journey-passport.html` — confirmed each now `await`s correctly. This
  process caught and fixed two rounds of leftover/duplicate code from an
  earlier multi-step edit, verified by `node --check` failing loudly
  each time until clean.
- Confirmed the RLS policies in migration `036` reference the correct,
  already-established `role_at_least()` function and enum
  (`public.wrld_role`) rather than inventing a new authorization
  mechanism.
- Confirmed `delete_mentor_application`'s client call
  (`sbClient.rpc('delete_mentor_application', { p_application_id: id })`)
  and the migration's function signature
  (`delete_mentor_application(p_application_id uuid)`) match exactly —
  name, argument name, and type.
- Confirmed `delete-user`'s client call
  (`sbClient.functions.invoke('delete-user', ...)`) and the deployed
  function's folder name (`supabase/functions/delete-user/`) match
  exactly.

## Level 2 — Connected Supabase validation (NOT performed — requires your project)

Nothing in this list was run against a real Supabase project, because no
project credentials exist anywhere in this conversation. **You must run
these** — see `V19.2-BACKEND-SETUP.md` sections 5–8 for exact steps:

- Confirming `pg_proc`/`information_schema.tables` actually shows the
  new function/tables after applying migration `036`.
- Confirming `supabase functions list` shows `delete-user` deployed.
- An actual Delete User call against a real test account.
- An actual Delete Mentor Application call against a real test
  application.
- An actual cross-device/cross-browser Community post visibility test.

## Level 3 — Physical live-site validation (NOT performed — requires your deployed domain)

Real end-user testing on `ourwrld.org` (or wherever this is deployed),
across real devices, real browsers, real accounts. Not performed here,
same as every prior pass's mobile/device testing.

## What was specifically re-verified given the reported errors

| Reported error | Confirmed cause | Fix applied |
|---|---|---|
| "Failed to send a request to the Edge Function" | Function not deployed (code was already correct) | CORS hardening + exact deployment docs + friendly client-side message |
| "Could not find the function public.delete_mentor_application(p_application_id) in the schema cache" | Migration not applied / PostgREST cache not refreshed (code was already correct) | Re-declared function + explicit `notify pgrst, 'reload schema'` + friendly client-side message |
| Community posts only visible to the posting browser | Confirmed real bug — no Supabase table ever existed | New tables + RLS + full async rewrite of the client |

## Recommended pre-launch checklist

See the spec's own "Testing Requirements" section — every item there
(Delete User's 10 checks, Delete Mentor Application's 9 checks,
Community publishing's 10 checks, Community deletion's 9 checks,
regression's 11 checks) should be run against a real, connected staging
project before this is considered production-verified. This document
doesn't repeat that full list — it's reproduced faithfully in the
original request and nothing here should be read as claiming those
checks were already performed against live data.
