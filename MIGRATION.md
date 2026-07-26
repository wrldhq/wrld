# WRLD — Demo/localStorage Account Migration Strategy

## The situation

Before this revision, WRLD's "accounts" were plain JavaScript objects stored in each visitor's own browser (`localStorage` key `wrld_users_v1`). There was never a real, shared user table anywhere — every visitor's demo account existed only in that one browser, on that one device. Passwords were an unsalted client-side SHA-256 hash, generated and checked entirely in the browser.

As of this revision, real accounts live in Supabase Auth + `public.profiles`. This is a genuine backend for the first time, not another localStorage variant.

## Why there's no bulk data migration to run

A traditional "migration" moves rows from an old database to a new one. That doesn't apply here, because:

1. **There is no old database.** Old accounts are scattered across an unknown number of individual visitors' browsers — WRLD's own servers (there weren't any) never saw them.
2. **Passwords can't be migrated even in principle.** The old hash (unsalted SHA-256) isn't something Supabase Auth can import, and even if it were, carrying forward a weak hash into a real auth system would be a security regression, not a migration.

So there is no `migrate.sql` script to run against a legacy database — there's nothing to point it at.

## What actually happens for a returning visitor

1. They open WRLD in the same browser they used before. `wrld_users_v1` is still sitting in `localStorage` (nothing in this revision deletes it automatically).
2. `checkLegacyAccountNotice()` (`auth.js`) detects that stale key and — only if they're not currently logged in — replaces Orbit's contextual line with a plain explanation: *"WRLD upgraded its account system — old logins from before this update no longer work, sorry! Sign up again with the same email and your saved progress will carry over automatically."*
3. They go to `signup.html` and create a real account, ideally with the same email they used before.
4. On that first real login, `pullLearnerStateFromSupabase()` / `pullVolunteerEntriesFromSupabase()` (`app.js`) check Supabase for a `learner_state` / `volunteer_entries` row for the new account. There isn't one yet (brand new account) — so instead of pulling, they **push whatever progress is already sitting in that browser's `localStorage`** (`wrld_state_v1`, `wrld_volunteer_log_v1`) up to Supabase automatically.
5. From that point on, their progress is real, persistent, and synced across devices — even though the *account* itself had to be re-created, the *progress* effectively migrated itself, for free, as a side effect of the existing sync architecture. No separate migration tooling was needed for this part.

**Net effect:** re-signing up is required (one-time, unavoidable given the password constraint above); re-doing their learning progress is not.

## What does NOT carry over automatically

- **Community posts, mentor applications/profiles, live sessions** — these stores haven't been wired to Supabase yet (see CLAUDE.md's "Authentication & Backend (Supabase)" section for what's still pending). They'll keep working locally exactly as before until that follow-up work happens, but won't sync to a new account today.
- **Role** (Mentor/Administrator/Owner) — a fresh signup is always an Explorer, by design (see "Account System & Roles" in CLAUDE.md). If someone genuinely held a Mentor or Administrator role before this revision, an existing Administrator/Owner needs to manually re-promote their new account from the Owner Dashboard, the same way that promotion has always worked.
- **The old `wrld_users_v1` entry itself.** It's left alone (not auto-deleted) so `checkLegacyAccountNotice()` can keep explaining the situation until the visitor re-signs-up in that browser. It's inert — nothing in the codebase reads it anymore — so leaving it doesn't cause any harm.

## If you have real historical user data to recover

If, unlike the demo state this project shipped in, a real deployment of the old localStorage version was actually collecting emails/names from real users (e.g. you exported `wrld_users_v1` from a live site's browsers somehow, or logged signups elsewhere), you can pre-seed real Supabase accounts for them without them re-typing a password immediately:

1. For each known user, call `sbClient.auth.admin.inviteUserByEmail(email)` **from a trusted server context only** (this requires the `service_role` key — never run this from the browser or commit that key anywhere in this repo). This sends them a real "set your password" email and creates their `auth.users` row.
2. The `handle_new_user()` trigger (migration `001`) creates their matching `public.profiles` row automatically, as an Explorer, the same as any other signup.
3. If you know their prior role, promote them from the Owner Dashboard after they've completed setup, same as step "Role" above.
4. Their learning progress still can't be pre-seeded this way (it lives in their browser, not in any data you'd have access to) — they'll get the same automatic local→Supabase push described above the first time they log in from the browser that has their old progress in it.

This is a manual, one-off script an administrator would run once (with real access to the Supabase project and a real list of emails) — not something built into the WRLD codebase, since the current project has no such legacy user list to run it against.
