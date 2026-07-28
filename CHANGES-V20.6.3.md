# WRLD Website V20.6.3 — Final Live Signup Session and JWT Timing Repair

Source of truth: the attached **WRLD Website V20.6.2** project ZIP. Every claim below was verified by reading that project's actual code (`supabase-client.js`, `auth.js`, `welcome.html`, `signup.html`, and every other page referenced) — nothing here is inferred from an earlier conversation, an earlier WRLD version, a demo build, or a remembered implementation.

This release fixes exactly **one** remaining live-site issue: a newly created user begins Orbit onboarding correctly, but the very first profile request fails with `401: JWT issued in future`, and the application incorrectly treated that temporary profile-loading failure as a logout — redirecting the new user to `login.html` before they ever reached the Adulting Readiness Assessment. It does not redesign, restyle, or functionally change anything else. See the Preservation section at the end for what was explicitly left untouched.

---

## Root cause (confirmed by reading the code, not assumed)

Traced the exact live error string, `WRLD: could not load profile <message>`, to `wrldFetchProfile()` in `supabase-client.js` (the only place that `console.warn` text exists in the entire project). That function backed `wrldRefreshSessionCache()`, which is called from three places: the page-load bootstrap (`window.wrldAuthReady = sbClient.auth.getSession().then(...)`), the shared `onAuthStateChange` listener, and directly from `auth.js`'s `signUp()`/`logIn()`.

The chain that produces the live bug:

1. `signup.html` submits → `auth.js`'s `signUp()` calls `sbClient.auth.signUp()`. With this project's "Confirm email" toggle off (documented in `auth.js`'s own file-top comment), Supabase returns an **active session immediately** — `data.session` is truthy.
2. `signUp()` calls `await wrldRefreshSessionCache(data.session)`. That function set `_wrldSessionCache = session` and then `await`ed a single, unretried `sbClient.from('profiles').select('*').eq('id', userId).single()` call — the very first authenticated request made with the brand-new access token.
3. On a real, freshly-issued token, this project's live PostgREST layer rejected that first request with `401: JWT issued in future`. This reproduced on a Windows laptop, a MacBook, and an iPhone — ruling out one device's misconfigured clock. The more plausible explanation, consistent with reproducing across three independent devices/browsers, is a timing/leeway gap between the moment `signUp()` mints the access token (`iat`) and the moment PostgREST's JWT validation runs on the very next request that reuses it — a race, not a fixed clock offset any one visitor could correct.
4. `wrldFetchProfile()` caught the error, logged it, and returned `null`. Back in `wrldRefreshSessionCache()`, `_wrldProfileCache` stayed `null` even though `_wrldSessionCache` (the real, valid session) was set correctly.
5. `getCurrentUser()` (`auth.js`) → `wrldBuildUserFromCache()` (`supabase-client.js`) required **both** `_wrldSessionCache` and `_wrldProfileCache` to be non-null before returning a user object. With the profile null, it returned `null`.
6. `isAuthenticated()` was defined as `!!getCurrentUser()` — so a temporarily-failed profile fetch made `isAuthenticated()` return `false`, identically to a genuinely logged-out visitor. There was no distinction between the two states anywhere in the codebase.
7. `signup.html` itself was **not** fooled (it routes on `result.hasSession`, not `result.user`), so it correctly sent the new user to `welcome.html`. But `welcome.html` is a real page navigation — a fresh script load, re-running the bootstrap `getSession()` → `wrldRefreshSessionCache()` chain from scratch. If the same timing window recurred there (plausible, since it's the same account, same token, seconds later), `requireAuth()` ran `if(!isAuthenticated())` → true → `location.href = 'login.html?next=welcome.html'`. This is the exact live bug: a profile-loading error, misread as "no session," redirecting a mid-onboarding user to the login page.

Confirmed directly from the code (not assumed): `signUp()` never reused a stale/foreign token (the session came straight from `sbClient.auth.signUp()`'s own response); no manually-constructed request or hardcoded anon-key-as-bearer-token existed anywhere in the profile-fetch path; there was exactly one `onAuthStateChange` listener, and it never redirected on its own — only `requireAuth()` (`auth.js`) ever set `location.href` to `login.html`, and it did so from exactly one condition: `!isAuthenticated()`. The root cause is precisely that one condition being defined in terms of profile-load success instead of session existence — nothing more exotic (no auth-listener race, no reused foreign token, no double sign-in) was needed to produce the reported symptom, though this release also hardens several of those adjacent risks the audit was asked to check (see "Also found and fixed" below).

## Fix

**Two independent, explicit state machines**, so a profile-loading error can never again be misread as "logged out" (`supabase-client.js`):

- `_wrldAuthState`: `'loading' | 'authenticated' | 'unauthenticated'` — reflects **only** whether Supabase confirms a session exists (`wrldGetAuthState()`).
- `_wrldProfileState`: `'not_requested' | 'loading' | 'loaded' | 'not_found' | 'temporary_error' | 'permanent_error'` — reflects **only** the outcome of the `profiles` read (`wrldGetProfileState()`).

`auth.js`'s `isAuthenticated()` now reads `wrldGetAuthState() === 'authenticated'` instead of `!!getCurrentUser()`. `requireAuth()` redirects to `login.html` **only** when `isAuthenticated()` is false — i.e., only when Supabase has definitively confirmed there is no session. It never redirects because a profile fetch is still retrying or has permanently failed.

### Bounded retry for the profile fetch (`wrldFetchProfileWithRetry()`, `supabase-client.js`)

Replaces the old single, unretried `wrldFetchProfile()` call:

- **Max profile attempts: 3.** **Max forced session refreshes: 1.** A fixed, small delay (`550ms × attempt number`) between attempts — not exponential, not unbounded, no retry storm.
- Each attempt classifies the error before deciding whether to retry:
  - `PGRST116` / "0 rows" → `not_found` (the signup trigger's profile row hasn't landed/replicated yet — retried within budget, not assumed permanent).
  - `JWT issued in future`, any other JWT future/not-yet-valid/`nbf` wording, a bare `401`, or a network failure → `temporary_error` (retried within budget).
  - Anything else → `permanent_error` immediately, no further retries (retrying can't fix an RLS/permission error, for example).
  - If the retry budget is exhausted while still `temporary_error`, it is escalated to `permanent_error` — from the caller's point of view, "temporary" that never resolved within the bounded window is no longer temporary.
- Before each retry, this also re-confirms the session belongs to the same user id it started with (aborts cleanly, without touching stale data, if a same-browser account switch happened mid-retry) and, once, calls `sbClient.auth.refreshSession()` to correct a genuinely stale/about-to-expire token before retrying.
- Concurrent calls for the **same** user id share one in-flight promise (`_wrldInFlightProfileFetch`) instead of firing duplicate requests — this directly answers the audit's "does an auth event trigger profile loading twice" question: **yes, it did** (the `onAuthStateChange` listener's own `SIGNED_IN` firing during `signUp()` raced with `auth.js`'s explicit `await wrldRefreshSessionCache(data.session)` call, both for the identical brand-new session) — now deduplicated into one fetch with one shared, correctly-retried result.
- A monotonic generation counter (`_wrldSessionRefreshGen`) discards a slower, older `wrldRefreshSessionCache()` call's results if a newer one has already completed in the meantime, so a stale in-flight retry can never clobber a more current resolution.

### Session ownership verification

- `auth.js`'s `signUp()` now follows the required post-signup pattern exactly: use `data.session` if present, fall back to a direct `sbClient.auth.getSession()` read if it isn't (defensive, matches the spec's example), then **verify `session.user.id === data.user.id`** (the account that was just created) before ever using that session to load a profile. A mismatch signs the session back out and returns a clear error rather than silently continuing with a foreign/stale session.
- `wrldFetchProfileWithRetry()` re-checks `liveSession.user.id === userId` at the top of every attempt — including retries — so it can never fetch or accept a profile for any account other than the one the call started for.
- `wrldRefreshSessionCache()` compares the previous cached user id against the incoming session's user id; on a mismatch (same-browser account switch), the previous account's profile cache is cleared immediately rather than lingering for even one extra read.

### The other symptom of the same root cause: the account-state pointer

`wrldRefreshSessionCache()` used to stamp `wrld_state_owner_v2` (the pointer `app.js`'s `getState()`/`setState()`/`getVolunteerEntries()` all read to pick the correct namespaced `localStorage` bucket — see `CHANGES-V20.6.2.md`) with `_wrldProfileCache ? _wrldProfileCache.id : null`. A temporarily-failed profile fetch therefore stamped the pointer to **guest** even though a real, confirmed session existed the whole time — meaning a page reading progress during the failure window could briefly read the wrong (guest) bucket. Fixed to stamp `session.user.id` directly: `public.profiles.id === auth.users.id` by design (see `supabase/migrations/001`), so the session's own user id is already the authoritative account id regardless of whether the profile *row* has loaded yet. This is the one necessary touch to the account-scoped state system this release makes — it does not change the namespacing scheme, the migration logic, or anything else `CHANGES-V20.6.2.md` describes; it only corrects which id gets passed into the existing, unchanged `wrldSetActiveStateOwner()` call.

### `welcome.html` — profile state, not just auth state

`requireAuth()` fixes the wrongful redirect. Separately, `welcome.html` now reads `wrldGetProfileState()` after `requireAuth()` passes:

- `'loaded'` → the existing Orbit greeting renders exactly as before (unchanged copy, unchanged animation timing, unchanged CTA behavior).
- `'permanent_error'` or `'not_found'` (retry budget exhausted) → remains on this same onboarding page (never redirects to login.html), shows "WRLD is finishing your account setup. Please try again in a moment." (no raw JWT/error wording exposed), and turns the existing CTA button into a **Retry** button that re-invokes `wrldRefreshSessionCache()` for the current session and re-renders.
- A profile still mid-retry never reaches this page's script at all in the failing state — the bounded retries run to completion (or exhaustion) inside `window.wrldAuthReady`, which this page already awaits before doing anything, so "loading" is covered by the page's pre-existing loading behavior with no new UI needed for that state.

No new CSS, no new layout, no new visual elements — the recovery message reuses the existing `#welcome-lines`/`#welcome-cta` elements and the site's existing button classes.

### Auth listener audit (`supabase-client.js`)

The single `onAuthStateChange` listener was audited against every event named in the required audit (`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`, `USER_UPDATED`, `SIGNED_OUT`). It never redirects and never signs anyone out on its own in this codebase — it only calls `wrldRefreshSessionCache()` (now ownership-checked and bounded-retried) and re-renders the header. There is no returning-user dashboard routing logic inside this listener to accidentally trigger during signup; all routing decisions are made exactly once, in `signup.html`/`login.html` via `postAuthDestination(next, source)` (unchanged from V20.6.2) and in `requireAuth()` (fixed above). Diagnostic logging was added to this listener (event name, whether a session came with it, redacted user id suffix) per the required logging spec.

## Also found and fixed (adjacent to the same root cause)

- **Duplicate concurrent profile fetch during signup** (see "Bounded retry" above) — confirmed real via the local simulation harness (see the testing document's Test 1/9), fixed with the in-flight-promise de-dupe.
- **`wrld_state_owner_v2` pointer briefly wrong during a profile failure** (see above) — fixed as a one-line, necessary correction to an existing call site; the account-scoped cache architecture itself (namespacing, migration, ownership wrapper) is unchanged.

## Explicitly NOT the cause (checked and ruled out)

- Not a reused/stale token from a previous account — `signUp()`'s session comes directly from its own response, verified against `data.user.id` before use.
- Not a manually constructed request or the anon key mistakenly used as a bearer token — the only profile request in the codebase is `sbClient.from('profiles')...`, using the shared client's own session-derived Authorization header.
- Not `getUser()` called too early or in place of `getSession()` — this codebase never calls `sbClient.auth.getUser()`; session resolution goes through `getSession()`/`onAuthStateChange` exclusively.
- Not a second/duplicate Supabase client — `sbClient` is created exactly once, at the top of `supabase-client.js`, and is the only client instance anywhere in the project (grepped to confirm).
- Not a database/RLS/migration problem — no migration or Edge Function change is required or included in this release (see below).

## No database migration or Edge Function required

This is a client-side session-timing and error-handling bug. No table, RLS policy, trigger, or Edge Function needed to change, and none did. `supabase/migrations/` and `supabase/functions/` in this ZIP are byte-identical to V20.6.2.

## Full changed-file inventory

| File | What changed |
|---|---|
| `supabase-client.js` | Added `_wrldAuthState`/`_wrldProfileState` (+ `wrldGetAuthState()`/`wrldGetProfileState()`/`wrldGetSession()`), dev-safe diagnostic logging (`wrldLogDiag()`/`wrldSafeIdSuffix()`), bounded/classified profile retry (`wrldFetchProfileWithRetry()`, replacing the old unretried `wrldFetchProfile()`), in-flight profile-fetch de-duplication per user id, a generation counter guarding against a stale call clobbering a newer one, session-ownership re-checks before every retry, and the `wrldSetActiveStateOwner(session.user.id)` fix described above. The `onAuthStateChange` listener gained one diagnostic log line; its behavior (refresh cache, re-render header) is otherwise unchanged. |
| `auth.js` | `isAuthenticated()` now reads `wrldGetAuthState()` instead of `!!getCurrentUser()`. `signUp()` added the session-confirmation fallback (`getSession()` if `data.session` is falsy) and the session-ownership check (`session.user.id === data.user.id`) before continuing, plus diagnostic logging. `requireAuth()`'s first branch now redirects only on a confirmed absent session; its onboarding-redirect branch is functionally unchanged (already guarded correctly by `needsOnboarding()`'s existing null-user check) but now also logs its routing decision. No other function changed. |
| `welcome.html` | Split the inline script into `wrldRenderWelcomeGreeting()` (the original greeting, unchanged copy/timing/behavior), a new `wrldRenderProfileRecovery()` (recoverable-error + Retry state, reusing existing markup/classes), and `wrldRunWelcomeEntry()` (checks `requireAuth()` then `wrldGetProfileState()` before choosing which to render). Cache-busted script tags. |
| 29 other `.html` pages (every page listed in the grep below) | Cache-busting only — `?v=20.6.3` on their `supabase-client.js`/`auth.js` `<script>` tags. No other line changed (verified with a full recursive diff against the V20.6.2 baseline — see the testing document). |
| `CHANGES-V20.6.3.md`, `V20.6.3-LIVE-SESSION-TESTING.md` | New, this release's documentation. |

Pages whose only change is the two cache-busting version bumps: `about.html`, `account-settings.html`, `administrator-dashboard.html`, `assessment.html`, `become-mentor.html`, `check-your-email.html`, `community-guidelines.html`, `community.html`, `dashboard.html`, `downloads.html`, `email-verified.html`, `events.html`, `forgot-password.html`, `index.html`, `journey-passport.html`, `learning-paths.html`, `login.html`, `mentor-studio.html`, `moderation-dashboard.html`, `owner-dashboard.html`, `owner-setup.html`, `playbook.html`, `playbooks.html`, `program.html`, `programs.html`, `reset-password.html`, `signup.html`, `tools.html` (auth.js only — this page never loaded `supabase-client.js`, unchanged), `volunteer-tracker.html`, `worksheet.html`.

**No file not listed above differs from the attached V20.6.2 baseline** — verified with `diff -rq` across the entire project tree (see the testing document for the exact command and output).

`app.js` is **unchanged** this release (not even cache-busted) — the account-scoped cache system it implements (`CHANGES-V20.6.2.md`) was locked and out of scope, and no function in it needed to change for this fix.

`email-verified.html` was inspected: it has the same theoretical class of risk (`getCurrentUser()` used where a session-based check would be more robust) for the dormant email-confirmation pathway, but that pathway is inactive on this project (Supabase's "Confirm email" toggle is off, per `auth.js`'s own documented note) and is not implicated in the reported live bug. Left functionally unchanged this release per "do not change anything unrelated" — cache-busting bump only.

## Preservation

Nothing in this list changed: desktop/mobile/tablet design, responsive layouts, typography, colors, branding, logos, images, illustrations, navigation, header, footer, Homepage, About WRLD, Playbooks, Learning Paths, Programs, Live Learning, Download Centre (including download previews), Community Commons, announcement permissions, Volunteer Tracker, Explorer Dashboard, Mentor Studio, Administrator Dashboard, Owner Command Centre, Account Settings, mentor applications, user deletion, community deletion, Orbit's appearance/floating assistant/AI, email automation, or any existing Supabase data/users/roles/assessment results/progress/volunteer records/community data/RLS policies/Edge Functions/migrations. The account-scoped browser-state architecture and the separate signup/login pathways introduced in V20.6.2 are both intact — confirmed by the full changed-file inventory above and the line-level diffs in the testing document.
