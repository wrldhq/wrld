# WRLD Website V20.6.1 — Live Onboarding Flow Repair and Verification

Source of truth: the completed **WRLD Website V20.6** project. This release investigates and repairs why the new-user onboarding flow was still bypassed in the real, deployed site even after V20.6, using **direct, live inspection of the connected `WRLD-production` Supabase project** (`hnmpcjdlhuhetgkzgdgl`) — not static code review alone.

This release touches exactly **1 file**: `app.js`. No HTML, no CSS, no image, no other JS file, and no database schema/table/migration/Edge Function were changed. **No migration was required** — see "Why no migration" below.

---

## Why the V20.6 fix didn't fix the live symptom

V20.6 correctly repaired the routing logic (`signUp()` keeping its session, `postAuthDestination()` being used consistently). That logic was never the problem in production — it was working exactly as written. The live bug was one level lower: **the *input* to that routing logic (`needsOnboarding()`'s read of `getState().assessment`) was already wrong by the time routing ran**, because of a real, confirmed data-integrity bug in how local progress is cached, described below. No amount of correcting the routing logic on top of a corrupted input could have fixed this — which is exactly why static code review of the routing functions alone (V20.6) missed it, and why this release required inspecting live data instead.

## Root cause, confirmed against the live database

### What was inspected

Using the connected Supabase project directly (read-only inspection: `list_tables`, `execute_sql`, `get_logs` — no data was modified during investigation):

- `public.profiles` schema and live rows
- `public.learner_state` schema and live rows
- `auth.users` live rows (`created_at`, `confirmed_at`, `email_confirmed_at`, `confirmation_sent_at`, `last_sign_in_at`)
- The `handle_new_user()` trigger function source (the trigger that fires on every real signup)
- A full column-name search across every `public` table for anything resembling an onboarding/assessment flag

### What the live data actually showed

Two real accounts exist in the production project. The relevant one is a test Explorer account (`test@gmail.com`) created during live testing of V20.6:

| Field | Owner account (`hello@ourwrld.org`) | New test account (`test@gmail.com`) |
|---|---|---|
| `auth.users.created_at` | 2026-07-26 16:26:59 | **2026-07-28 14:40:02** |
| `auth.users.last_sign_in_at` | **2026-07-28 14:38:58** (~64s before the new signup) | 2026-07-28 14:40:02 |
| `learner_state.updated_at` | 2026-07-28 14:39:30 | **2026-07-28 14:40:03** (1 second after signup) |
| `learner_state.assessment.completedAt` | 2026-07-26T23:14:05.080Z | **2026-07-26T23:14:05.080Z — identical, down to the millisecond** |

A brand-new account, one second after it was created, already had a `learner_state` row containing a fully completed Adulting Readiness Assessment — with a completion timestamp from **two days before the account existed**, and identical in every field to the Owner account that had been signed in on the same browser about a minute earlier. This is conclusive, not circumstantial: `needsOnboarding()` (`auth.js`) checks exactly this field, and it was populated with someone else's data before the new user ever saw an onboarding screen.

### The actual mechanism (confirmed by reading `app.js` against this evidence)

`getState()`/`setState()` cache learner progress under a single `localStorage` key, `wrld_state_v1` — **not namespaced by account**. `pullLearnerStateFromSupabase()` runs automatically right after every session resolves (`supabase-client.js`'s `wrldRefreshSessionCache()`), and its documented, intentional behavior for "this account has no `learner_state` row yet" is to push whatever is currently cached in `wrld_state_v1` up to the server — this is what makes a guest's pre-signup progress carry into their new account, a real, intentional feature.

The bug: that same "push local cache up" logic ran identically regardless of *whose* progress was actually sitting in that cache. On a browser that had already been used to sign in as one account (in the reproduction: the Owner, testing V20.6), the leftover `wrld_state_v1` cache from that session was still present in `localStorage`. Creating a second, brand-new account on that same browser triggered `pullLearnerStateFromSupabase()` for the new account, found no server row yet, and pushed the **Owner's** cached assessment up as if it were the new account's own — because nothing distinguished "this is genuinely this account's own carried-over progress" from "this is a completely different account's leftover session data."

Once that write completed, `needsOnboarding()` read `getState().assessment`, found a (foreign) completed assessment, and correctly-by-its-own-logic concluded onboarding was already done — sending the new user straight to the dashboard, skipping Orbit and the assessment, exactly as reported.

### Confirmed NOT the cause (ruled out with direct evidence, not assumed)

- **Not a missing/wrong column.** A full search of every `public` schema column name for `%onboard%`/`%assessment%` found exactly one match: `learner_state.assessment` — the same field `needsOnboarding()` already reads. No `onboarding_completed` column exists anywhere, and none was expected to.
- **Not a defaulting-to-complete field.** `learner_state` has no default row created per signup at all — confirmed by reading `handle_new_user()`'s actual source directly from `pg_proc`: it inserts only into `public.profiles` (`id`, `name`, `email`, `email_verified`) and never touches `learner_state`. A genuinely fresh account has *no* `learner_state` row until the client creates one.
- **Not a wrong table/wrong query.** The client already queries `learner_state` by the correct `user_id`, via the correct table.
- **Not a silently-failing query falling back to "complete."** `pullLearnerStateFromSupabase()`'s error branch only logs a warning and returns — it does not touch `needsOnboarding()`'s input at all on failure.
- **Not a missing migration.** No schema change was ever required for the onboarding decision itself — see "Why no migration" below.
- **Not the routing logic added in V20.6.** `signUp()`/`postAuthDestination()`/`requireAuth()` all behaved exactly as designed once handed a correct `needsOnboarding()` result; the input was the problem, not the decision logic.

---

## The fix

`app.js` — three functions, one new small localStorage marker (`wrld_state_owner_v1`):

1. **`setState(state)`** now also stamps `wrld_state_owner_v1` with the id of whoever is currently signed in (or `''` for a logged-out guest) every time local progress is written. This keeps the marker honestly in sync with whichever account (or no account) is actually producing the cached data, self-healing on every write.
2. **`pullLearnerStateFromSupabase()`**, in its pull-down branch (server already has a row for this account), also stamps the marker with that account's id.
3. **`pullLearnerStateFromSupabase()`**, in its push-up branch (no server row yet for this account), now checks the marker first:
   - If the cache belongs to **no one yet** (`''` — a guest's pre-signup progress) or **this same account**, the existing push-up behavior runs unchanged — this preserves the real, intentional "sign up and your existing local progress carries over" feature.
   - If the cache belongs to a **different** account, the local cache is reset to a genuinely fresh, empty state for this new account instead of being pushed up — so a brand-new signup on a browser previously used by someone else starts clean, with `needsOnboarding()` correctly seeing no assessment.

No other file needed to change. `needsOnboarding()`, `postAuthDestination()`, `requireAuth()`, `signUp()`, `signup.html`, `welcome.html`, `assessment.html`, `dashboard.html`, `login.html`, and `email-verified.html` — all the routing logic from V20.6 — are untouched and correct once their input is trustworthy.

## Why no migration

The persistent, server-side source of truth for onboarding completion is unchanged and was never the problem: `learner_state.assessment`, already correctly wired, already correctly defaulting to nothing (no row) for a new account, already correctly read by `needsOnboarding()`. This release's bug and fix are both entirely client-side (a `localStorage` caching defect), so no table, column, RLS policy, trigger, or Edge Function needed to change. **If you deploy this release, there is nothing to run in the Supabase dashboard or CLI — copying the updated `app.js` to your hosting is the entire deployment.** (Reminder, as with any static-site release: committing these files to GitHub does not, by itself, update Supabase in any way — there was nothing to update there this time, but this note is kept for consistency with prior releases that did require a migration step.)

## Existing users — unaffected

- **Owners/Administrators/Mentors**: `needsOnboarding()` still only ever evaluates Explorer accounts — untouched.
- **Existing Explorers with a completed assessment**: their `learner_state` row already exists server-side, so `pullLearnerStateFromSupabase()` takes the pull-down branch (unaffected by this fix, which only changes the no-row-yet branch) and their real assessment result is loaded and preserved exactly as before.
- **Existing WRLD Passport / progress data**: not read, written, or touched by this fix.
- **Broken-period accounts** (created without a real assessment, whether from the original bug or from this newly-discovered leakage bug): still correctly detected as onboarding-incomplete on their next authenticated session, per the unchanged `needsOnboarding()` logic — once the leaked/foreign local cache from this fix stops occurring for future signups, existing broken-period accounts (server-side, genuinely empty `learner_state`) are unaffected either way.

## A note on the existing live test data (not modified)

The `test@gmail.com` account described above still has the Owner's leaked assessment data in its live `learner_state` row in the connected Supabase project — this was **not** modified or deleted as part of this release, since altering or removing account data wasn't requested and this appears to be your own manual test account. If you'd like it reset or removed, let me know and I can do that as an explicit, separate action; otherwise it's safe to leave as an artifact of this investigation, or delete by hand.

## Full changed-file inventory

| File | Change |
|---|---|
| `app.js` | New `STATE_OWNER_KEY` marker; `setState()` stamps it on every write; `pullLearnerStateFromSupabase()` stamps it on pull-down and checks it before ever pushing local data up as a brand-new account's own progress |

No other file in the project differs from V20.6 — verified with a full recursive diff (`diff -rq`) against the V20.6 working tree.
