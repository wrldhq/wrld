# WRLD Website V20.6.2 — Account-Scoped Browser State and Cache-Stability Repair

Source of truth: the attached **WRLD Website V20.6.1** project ZIP. Every claim below was verified by reading that project's actual code (`app.js`, `auth.js`, `supabase-client.js`, and every HTML page listed in the inventory) — nothing here is inferred from an earlier conversation, an earlier WRLD version, or a demo build.

This release fixes exactly **one** issue: old WRLD learner/assessment/onboarding/progress data cached in a browser could be reused across different accounts on the same device. It does not redesign, restyle, or functionally change anything else. See the Preservation section at the end for what was explicitly left untouched.

---

## Root cause (confirmed by reading the code, not assumed)

V20.6.1 (`CHANGES-V20.6.1.md`) had already fixed one specific symptom of this bug — a brand-new signup inheriting a *previous* account's completed Adulting Readiness Assessment — by adding a side-marker, `wrld_state_owner_v1`, next to the single shared `wrld_state_v1` key, and teaching `pullLearnerStateFromSupabase()` to check it before ever pushing local data to Supabase as a new account's own.

Reading the actual V20.6.1 code turned up three ways the underlying bug was still live:

1. **`getState()` itself never checked the marker.** It read `wrld_state_v1` unconditionally. The marker only protected the one call site that pushed data *to Supabase* on a brand-new account's first sync — nothing stopped `getState()` from handing back a different account's cached progress to the dashboard greeting, the Programs recommendation engine, the assessment "already completed" banner, etc., in the window before (or if) that one sync ran or updated the marker.
2. **`wrld_volunteer_log_v1` (Volunteer Hours Tracker) had no ownership marker at all, ever.** `pullVolunteerEntriesFromSupabase()`'s "no rows yet for this account" branch unconditionally pushed whatever was cached locally up to Supabase under the *current* account's `user_id` — so a browser previously used by one account, followed by a brand-new second account's first login, would silently write the **first account's volunteer hours into the second account's real database row**. This is worse than the assessment bug: it doesn't just misdisplay the wrong data locally, it corrupts a different account's actual Supabase record.
3. **`wrld_assessment_v1` (the in-progress assessment draft, `assessment.html`) had no ownership marker and was never routed through any account check at all** — a logged-out visitor, or a different signed-in account, opening `assessment.html` on a browser where someone else had a saved-in-progress or just-finished assessment would see *their* answers/results.

Separately, `signup.html` and `login.html` both called the same shared `postAuthDestination()` helper, which decides "welcome.html (onboarding) vs. dashboard" purely by inferring it from `getState().assessment` — i.e., from whatever happens to be cached locally. That is exactly the kind of inference that can go wrong if the underlying cache is ever wrong for the reasons above, and it also meant Create Account and Log In were not truly separate, independently-correct code paths.

## Fix

**Real, structural namespacing**, not a smarter check on a shared key. Every account-specific browser-storage key that used to be one flat, global key is now one separate key per Supabase user id (or a single, clearly separate guest bucket for logged-out/pre-signup browsing). A different account's data physically cannot be read from another account's key — there is no shared location left to misread.

### Storage keys found and their new account-scoped format

| Purpose | Old key (V20.6.1) | New key (V20.6.2) | Ownership marker (V20.6.1) | Ownership marker (V20.6.2) |
|---|---|---|---|---|
| Learner progress (bookmarks, completed Playbooks, checklists, quiz scores, streak, recently viewed, guidelines acceptance, **committed** assessment result) | `wrld_state_v1` (one global key) | `wrld_state_v2:<supabase_user_id>` (authenticated), `wrld_state_v2:guest` (logged-out/pre-signup) | Side-key `wrld_state_owner_v1`, checked only by the Supabase push-up path | Namespacing itself (structural) **+** an embedded `{ownerUserId, version:2, data:{...}}` wrapper checked by every read, as defense in depth |
| Volunteer hours log | `wrld_volunteer_log_v1` (one global key) | `wrld_volunteer_log_v2:<supabase_user_id>` (Volunteer Tracker is authenticated-only — no guest bucket needed) | **None — this was the worst gap** | Namespacing + `{ownerUserId, version:2, data:[...]}` wrapper |
| In-progress assessment draft (answers not yet submitted) | `wrld_assessment_v1` (one global key) | `wrld_assessment_v2:<supabase_user_id>` or `wrld_assessment_v2:guest` | None | Namespacing + `{ownerUserId, version:2, data:{...}}` wrapper |
| "Which account does the cached data in this browser currently belong to" pointer | `wrld_state_owner_v1` | `wrld_state_owner_v2` — repurposed as the durable, synchronously-readable **active-account pointer** every namespaced read/write consults to pick the right bucket (see "Timing safety" below) | n/a | n/a |
| One-time migration-completed flag | *(none existed)* | `wrld_v2_migration_done` | n/a | n/a |

Other browser-storage keys in the project were inspected and deliberately left untouched because they are not per-account learner state:

- `wrld_remember_me`, Supabase's own session token storage, `wrld_orbit_dismissed_v1`, `wrld_orbit_legacy_notice_shown_v1` — session/UI preferences, not learner data, already scoped correctly (per-tab or genuinely global by design).
- `wrld_trust_v1` (Community Commons posting-rate limits) — reviewed and judged out of scope: it isn't named in the reported bug, isn't part of any required test scenario, and is more of a device-level anti-abuse throttle than learner progress; changing it wasn't "genuinely required" for this repair.
- `wrld_live_sessions_v1`, `wrld_mentor_profiles_v1`, `wrld_moderation_log_v1`, `wrld_feature_toggles_v1`, `wrld_announcements_v1`, `wrld_featured_v1` — platform-wide directories/config (mentor directory, feature flags, announcements), correctly shared across all visitors already, not a single account's private state.
- `wrld_mentor_applications_v1` — legacy, effectively dead for reads (the real data already lives in `public.mentor_applications`); not touched.
- `wrld_users_v1` — pre-Supabase demo-account artifact, already handled by the existing `checkLegacyAccountNotice()`, unrelated to this bug.

### Ownership marker

Every namespaced record is stored as:

```json
{ "ownerUserId": "<supabase-user-id-or-null-for-guest>", "version": 2, "data": { /* the actual learner state / volunteer entries / assessment draft */ } }
```

`getState()`, `getVolunteerEntries()`, and `assessment.html`'s `getAssessState()` all refuse to return a record whose own `ownerUserId` disagrees with the key it was read from — belt-and-suspenders on top of namespacing, which already makes cross-account reads structurally impossible in normal operation.

### Timing safety — why this doesn't regress Programs, the dashboard, etc.

Several pages (`programs.html`'s recommended-programs render, `assessment.html`'s resume-in-progress check) read progress **synchronously, before that page's own `window.wrldAuthReady` has resolved** — a pre-existing, documented property of this codebase's sync-`getCurrentUser()`/async-Supabase bridge. Under the old single-key scheme this didn't matter (there was only one bucket to read regardless of timing); naively namespacing by `getCurrentUser()?.id` would have made those pages briefly read the **guest** bucket instead, a real regression.

The fix: `wrld_state_owner_v2` is now a durable, synchronously-readable pointer to "whichever account this browser most recently, authoritatively confirmed is signed in," set **only** by a new `wrldSetActiveStateOwner()` call inside `supabase-client.js`'s `wrldRefreshSessionCache()` — the one real place Supabase Auth resolution happens (login, logout, signup, session restore, token refresh). `wrldResolveStateOwnerId()` (the function `getState()`/`setState()`/the volunteer functions/`assessment.html` all use to pick a key) prefers a live, already-resolved `getCurrentUser()` when available, and falls back to this pointer otherwise — so a page that reads progress before its own auth promise settles still gets the *correct* account's bucket, because the pointer already reflects the last confirmed sign-in from this or an earlier page in the same browser. This was verified directly in a simulation harness (see the testing document) rather than assumed.

### New account behavior (signup)

`signUp()` (`auth.js`) is unchanged in how it creates the Supabase account, but its post-signup routing now goes through `postAuthDestination(next, 'signup')` (see below) instead of the old, shared, inference-based call. A brand-new account's own namespaced bucket (`wrld_state_v2:<new-user-id>`) never existed before this exact signup, so `pullLearnerStateFromSupabase()`'s "no server row yet" branch has nothing of a *different* account to ever consider — the only thing it can find is either (a) this exact account's own bucket, if this function has already run once for it, or (b) the separate guest bucket, for the existing, intentional "your pre-signup browsing carries into your new account" feature. A different account's cached data is structurally never in the running.

### Returning-user behavior (login)

`logIn()` is unchanged. Its routing now goes through `postAuthDestination(next, 'login')`. `wrldRefreshSessionCache()` (unchanged call sequence) still pulls this account's own `learner_state`/`volunteer_entries` rows down and overwrites this account's own namespaced local bucket, restoring progress exactly as before — just under the correctly-namespaced key instead of the one shared one.

### Logout

`logOut()` (`auth.js`) is unchanged (`sbClient.auth.signOut()` then `wrldRefreshSessionCache(null)`). `wrldRefreshSessionCache(null)` already clears the in-memory session/profile cache (`_wrldSessionCache`/`_wrldProfileCache` → `null`, making `getCurrentUser()` return `null` immediately) and now also calls `wrldSetActiveStateOwner(null)`, stamping the pointer to `''` (guest) — so nothing on this browser can read the just-logged-out account's bucket as "the active one" afterward. Each account's own namespaced bucket is **not** deleted on logout (matches "do not erase account-specific local state unless the product intentionally clears it" — it's simply no longer the active one, ready to be restored correctly the next time that same account logs back in).

### Guest state

Guest (logged-out) browsing and pre-signup progress live under the fixed `wrld_state_v2:guest` key — structurally separate from any authenticated account's key. The existing, intentional "guest progress carries into a brand-new signup" feature is preserved (see "New account behavior" above); it is never attached to an account that already has its own server-side `learner_state` row, and it is never attached to a *different* authenticated account's local bucket.

### Legacy migration

Runs at most once per browser, ever, guarded by `wrld_v2_migration_done` and executed unconditionally at the top of `app.js` (so it always finishes before anything else on the page — including that same page's own inline script — can call `getState()`/`getVolunteerEntries()`):

- **`wrld_state_v1` + `wrld_state_owner_v1`** — the one legacy store that already carried a real, self-healing ownership marker (V20.6.1). Ownership **can** be verified here, so it's migrated: if the marker names an account, that account's data goes to that exact account's new bucket (`wrld_state_v2:<that-id>`), never to whoever happens to be signing in when the migration runs. An empty/unset marker (the old scheme's "no account yet" state) migrates to the new guest bucket.
- **`wrld_volunteer_log_v1` and `wrld_assessment_v1`** — never had *any* ownership marker, ever. Per the rule that ownership must be verifiable before legacy data is attached to any account, both are quarantined (`localStorage.removeItem(...)`), not guessed at. Nothing real is lost: volunteer hours already live in Supabase's `volunteer_entries` table (reloaded correctly per account on next login); a genuinely *completed* assessment was already carried over via the `wrld_state_v1` migration above, which is the field `needsOnboarding()`/the dashboard actually read.

### Supabase reconciliation

`pullLearnerStateFromSupabase()` and `pullVolunteerEntriesFromSupabase()` (both in `app.js`, both called from `wrldRefreshSessionCache()`) are the only two functions that read from or write to Supabase's `learner_state`/`volunteer_entries` tables based on local cache contents, and both were made account-aware as described above: a server row, when one exists, always wins and overwrites this account's own local bucket; a local bucket is only ever pushed up to Supabase under `user_id: <this signed-in account's id>`, and — because of namespacing — that local bucket can no longer ever hold a different account's data in the first place. `setState()`/`syncLearnerStateToSupabase()` and `saveVolunteerEntries()`/`syncVolunteerEntriesToSupabase()` were not otherwise changed; they already scoped every Supabase write to `getCurrentUser().id`.

### Signup vs. Login are separate pathways

`postAuthDestination(requestedNext, source)` (`auth.js`) now takes an explicit `source`:

- `source === 'signup'` → unconditionally routes to `welcome.html` (carrying `next` forward) — never inferred from `getState()`, never a dashboard skip based on anything cached.
- `source === 'login'` → unconditionally routes to the requested destination or role dashboard — never re-triggers onboarding from this function. A genuinely onboarding-incomplete *returning* account is still caught correctly, from that account's own real (now-reconciled) data, by `requireAuth()`'s existing, unchanged guard on whichever protected page loads next — this routing step itself just never makes that inference.
- `source` omitted → the original shared priority order, still used (unchanged) by `assessment.html`'s `beginJourney()` immediately after a first-time assessment completes, where checking "is onboarding needed now" is exactly correct (it just became `false`) rather than an inference about which journey the person is on.

`signup.html` now calls `postAuthDestination(next, 'signup')`; `login.html` calls `postAuthDestination(next, 'login')`; `email-verified.html` (only reachable if Supabase email confirmation is ever re-enabled — currently dormant) calls it with `'signup'` for a just-verified first session and `'login'` for reopening an already-verified session, preserving the explicit signup pathway through the email-confirmation exception.

### Cache-busting

`app.js`, `auth.js`, and `supabase-client.js` are the three files this release changes. Every page that loads them now requests `?v=20.6.2` (bumped from the existing bare/`?v=2` references) so a browser or Cloudflare cannot keep serving a pre-V20.6.2 copy of the auth/state logic after deployment. `supabase-config.js`, `data.js`, `orbit-knowledge.js`, and `orbit.js` are unmodified this release and were left exactly as they were (no version bump, no reordering, no duplicated tags).

---

## Full changed-file inventory

| File | What changed |
|---|---|
| `app.js` | Replaced the single shared `wrld_state_v1`/`wrld_state_owner_v1` scheme with namespaced `wrld_state_v2:<id>`/`wrld_state_v2:guest` storage (`getState()`, `setState()`, `syncLearnerStateToSupabase()` unchanged body, `pullLearnerStateFromSupabase()`); added `wrldSetActiveStateOwner()`/`wrldResolveStateOwnerId()`/`wrldNamespacedKey()` helpers; added one-time `wrldMigrateLegacyStateOnce()` (called unconditionally at load); namespaced the Volunteer Hours Tracker store (`VOLUNTEER_LOG_KEY_BASE`, `getVolunteerEntries()`, `saveVolunteerEntries()`, `pullVolunteerEntriesFromSupabase()`). No other function in this file was touched. |
| `auth.js` | `postAuthDestination()` now takes an explicit `source` (`'signup'` / `'login'` / omitted-legacy) instead of one shared inferred priority order; one comment near the legacy-account-notice section updated to reflect the new key names. No other function changed. |
| `supabase-client.js` | `wrldRefreshSessionCache()` now calls `wrldSetActiveStateOwner()` right after the profile resolves/clears, before pulling learner state/volunteer entries. No other function changed. |
| `assessment.html` | `ASSESS_KEY`/`getAssessState()`/`setAssessState()` namespaced the same way as `app.js`'s learner state (reusing its `wrldNamespacedKey()`/`wrldResolveStateOwnerId()`); page's own control flow (sections, scoring, results, `beginJourney()`) unchanged. Cache-busted script tags. |
| `signup.html` | `postAuthDestination(next)` → `postAuthDestination(next, 'signup')`. Cache-busted script tags. |
| `login.html` | `postAuthDestination(next)` → `postAuthDestination(next, 'login')`. Cache-busted script tags. |
| `email-verified.html` | `goToDashboard()` takes an explicit `source`, wired to `'signup'` for a just-verified session and `'login'` for reopening an already-verified one. Cache-busted script tags. |
| 26 other `.html` pages (`about.html`, `account-settings.html`, `administrator-dashboard.html`, `become-mentor.html`, `check-your-email.html`, `community-guidelines.html`, `community.html`, `dashboard.html`, `downloads.html`, `events.html`, `forgot-password.html`, `index.html`, `journey-passport.html`, `learning-paths.html`, `mentor-studio.html`, `moderation-dashboard.html`, `owner-dashboard.html`, `owner-setup.html`, `playbook.html`, `playbooks.html`, `program.html`, `programs.html`, `reset-password.html`, `tools.html`, `volunteer-tracker.html`, `welcome.html`, `worksheet.html`) | Cache-busting only — `?v=20.6.2` added/bumped on their `app.js`/`auth.js`/`supabase-client.js` `<script>` tags. No other line changed (verified with a full recursive diff against the V20.6.1 baseline — see the testing document). |
| `CHANGES-V20.6.2.md`, `V20.6.2-CACHE-STATE-TESTING.md` | New, this release's documentation. |

**No file not listed above differs from the attached V20.6.1 baseline** — verified with `diff -rq` across the entire project tree.

## Why no database migration or Edge Function

This bug and its fix are entirely client-side (a `localStorage` namespacing/caching defect and a routing-inference defect). `learner_state` and `volunteer_entries` were already correctly scoped by `user_id` server-side with RLS restricting each account to its own rows — that was never the problem, and neither table's schema changed. **If you deploy this release, there is nothing to run in the Supabase dashboard or CLI** — copying the updated static files to hosting (and, as with any static-site release, a one-time Cloudflare cache purge is still recommended) is the entire deployment.

## Preservation

Nothing in this list changed: desktop/mobile/tablet design, responsive layouts, typography, colors, branding, logos, images, illustrations, navigation, header, footer, Homepage, About WRLD, Playbooks, Learning Paths, Programs, Live Learning, Download Centre (including download previews), Community Commons, announcement permissions, Volunteer Tracker's UI, Explorer Dashboard, Mentor Studio, Administrator Dashboard, Owner Command Centre, Account Settings, Orbit's design/floating assistant/AI, mentor applications, user deletion, community deletion, or any existing Supabase data/users/roles/assessment results/progress/volunteer records/community posts/backend permissions. Confirmed by the full changed-file inventory above and the line-level diffs in the testing document.
