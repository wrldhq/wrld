# WRLD Website V19 — Deployment, Migration & Environment Guide

## 1. Apply the new migration

```bash
supabase db push
```

Or apply `supabase/migrations/20260729080000_035_name_editing_and_application_deletion.sql`
through the Dashboard SQL Editor / MCP `apply_migration`, same as any
other migration in this project.

**What it does (fully additive, nothing dropped or altered):**
- Adds `first_name` and `last_name` columns to `public.profiles` (both
  nullable — no existing row is affected).
- Adds `update_own_name(p_first_name, p_last_name)` — a `security
  definer` RPC any authenticated user can call to change their own name.
- Adds `delete_mentor_application(p_application_id)` — a `security
  definer` RPC, Owner-only, that deletes an application's own storage
  files and row.

**A note on this project's migration history:** migration `001` (which
originally creates `public.profiles` and the `handle_new_user()` trigger)
was never included in any upload of this project, so its exact column
list and existing RLS policies aren't fully visible here. This migration
was written defensively to not depend on anything from that file beyond
what's demonstrably true from how the rest of the app already uses
`profiles` (a `name` text column, a `role public.wrld_role` column) — see
`update_own_name()`'s use of `security definer` specifically so it works
correctly regardless of what the existing (unseen) `profiles` UPDATE
policy does or doesn't already allow.

## 2. Deploy the new Edge Function

```bash
supabase functions deploy delete-user
```

`verify_jwt = true` (see `supabase/config.toml`) — the Supabase JS SDK
already attaches the caller's session JWT automatically when the client
calls `sbClient.functions.invoke('delete-user', ...)`, so no extra
client-side auth wiring was needed.

**No new environment variables are required for this function beyond
what mentor-application emails and Orbit AI already use:**

```text
SUPABASE_URL=                # already set for the other functions
SUPABASE_SERVICE_ROLE_KEY=   # already set for the other functions
```

This is the same service-role key already used by
`mentor-application-submitted` and `orbit-ai` — no new secret to
generate. **This key must never appear in any file in this repo, any
frontend JS, or any client-visible configuration** — it lives only in
Edge Function secrets, exactly as documented in
`AUTH-SECURITY-SETUP.md`'s secret table.

## 3. No other secrets or configuration changes

- `delete_mentor_application()` is a Postgres RPC (not an Edge
  Function) — it needs no new secret. Its `security definer` privilege
  is scoped by the migration itself, not by any key.
- `update_own_name()` is the same — a plain RPC, no new secret.
- Nothing about Orbit AI, mentor-application emails, or any V18
  configuration changed in this pass.

## 4. Rollback

- **Frontend**: redeploy the V18 files — since there's no build step,
  this is just serving the older files again. The new
  `administrator-dashboard.html` and modified `owner-dashboard.html`/
  `account-settings.html`/`auth.js`/`app.js` would simply stop being
  served; nothing about them requires a database rollback to be safe to
  remove.
- **Database**: migration `035` is purely additive (new columns, new
  functions) — rolling back the frontend alone is safe without touching
  the schema. If you do want to fully revert it: `drop function
  public.update_own_name(text,text); drop function
  public.delete_mentor_application(uuid); alter table public.profiles
  drop column first_name, drop column last_name;` — write this as a new
  forward migration rather than editing/deleting migration `035`
  itself, matching this project's existing "no destructive resets,
  ordered clearly" convention.
- **Edge Function**: `supabase functions delete delete-user` (or simply
  stop calling it — the button that calls it is the only caller).

## 5. Testing before calling this done

See `TESTING-SUMMARY-V19.md` for the full checklist. At minimum, verify
in a staging project first: migration applies cleanly, `delete-user`
function deploys and returns a 403 for a non-Owner caller, and
`update_own_name` rejects an empty first name.
