# WRLD Website V20.6 — Final Authentication, Onboarding, and Session-Stability Repair

Source of truth for this release: the attached **WRLD Website V20.5** project (unmodified except where noted below). No previous conversation, earlier version, demo build, or remembered file structure was used — every change below was made by reading the actual V20.5 files.

This release touches exactly **6 files** (plus this documentation). No CSS file, no image, no database table, no migration, no Edge Function, and no existing user data were changed. **No migration was required.**

| File | Type of change |
|---|---|
| `auth.js` | `signUp()` no longer signs a freshly-issued session back out |
| `signup.html` | Routes an already-authenticated new signup straight into onboarding |
| `email-verified.html` | Routes through the shared post-auth helper instead of straight to a dashboard |
| `app.js` | Volunteer-data-failure flag; records last-rendered nav key for header re-render |
| `supabase-client.js` | Re-renders the header if a later auth-state event resolves after the first render |
| `volunteer-tracker.html` | Adds a tracker-specific data-load error + Retry state |

---

## 1. New-user onboarding flow

### Root cause

`welcome.html`, `assessment.html`, `dashboard.html`, `login.html`, and the onboarding helpers in `auth.js` (`needsOnboarding()`, `postAuthDestination()`, `ONBOARDING_FLOW_PAGES`) were already correct and present in V20.5 — that architecture was built and documented in `CHANGES-V20.5.md` and was **not** rebuilt here. Reading `signup.html` and `auth.js`'s `signUp()` in full found the actual, still-live root cause:

`signUp()` had a deliberate V15.1 design decision: when Supabase returns an active session immediately (which it always does now, since "Confirm email" is off for this project), the function **signed that session back out** and returned `{ok:true, user:null, accountCreated:true}`. `signup.html` then sent the new user to `login.html?created=1` — a page whose header literally reads "👋 Welcome back" — where they had to log in again by hand. Only *then* would `postAuthDestination()` ever run and detect `needsOnboarding()===true`. In practice this worked, but it is exactly the flow the product spec says is wrong: a brand-new account being funneled through the returning-user login screen, shown "Welcome back," and only reaching onboarding after an extra manual step — with every intermediate opportunity for something to go sideways (a typo re-entering the password, a user closing the tab at the "account created" screen and never logging in at all, etc.).

### Fix

`signUp()` (`auth.js`) now **keeps** the session Supabase returns instead of discarding it, refreshes the in-memory session/profile cache, and returns `{ok:true, user, accountCreated:true, hasSession:true}`.

`signup.html` checks `result.hasSession` first: if true, it calls `postAuthDestination(params.get('next'))` — the exact same shared routing helper `login.html` and `assessment.html` already use — and navigates there directly. For a brand-new Explorer with no completed assessment, this resolves to `welcome.html`, carrying any originally-requested destination forward. There is no `login.html` stop in this path anymore.

The old `needsEmailConfirmation` fallback (only reachable if "Confirm email" is ever re-enabled on the Supabase project) is untouched — if Supabase ever stops returning an immediate session, `signup.html` falls back to `check-your-email.html` exactly as before.

### Dormant email-confirmation path also corrected

`email-verified.html`'s `goToDashboard()` previously routed straight to `ROLE_DESTINATIONS[user.role]`, bypassing onboarding entirely. This path is currently unreachable (email confirmation is off project-wide — see `CLAUDE.md`), but per the "if Supabase requires email confirmation... route the user into onboarding, do not send directly to the dashboard" requirement, it is now fixed for correctness: `goToDashboard()` calls `postAuthDestination(null)` instead, so if this setting is ever re-enabled, a first-time Explorer confirming their email still meets Orbit and takes the assessment before reaching a dashboard.

### Source of truth for onboarding completion

Unchanged from V20.5, reused as-is: `getState().assessment` (the existing Adulting Readiness Assessment result, already synced to the real `learner_state` Supabase table). `needsOnboarding(user)` returns `true` only for `role==='explorer'` accounts with no assessment result on file — no new field, no new table, no migration, and no separate/conflicting "onboarding_completed" flag was introduced.

### Result

```
Create account (session returned immediately)
  → signUp() keeps the session
  → postAuthDestination() sees needsOnboarding()===true
  → welcome.html (Orbit introduction, unchanged design)
  → assessment.html
  → beginJourney() saves the result (existing, unchanged save path)
  → postAuthDestination() now sees onboarding complete
  → Explorer Dashboard (or the originally requested destination, if any)
```

A user who closes the browser mid-onboarding is unaffected by this change — `requireAuth()`'s existing onboarding check (V20.5) already sends them back to `welcome.html` on their next authenticated page load, and no partial state is erased (unchanged). Returning, already-onboarded users are unaffected — `needsOnboarding()` is false the moment an assessment result exists, so login goes straight to the requested destination or dashboard exactly as before. Owner/Administrator/Mentor accounts are unaffected — `needsOnboarding()` only ever evaluates Explorer accounts. Broken-period Explorer accounts (created while this bug was live, with no assessment on file) are automatically routed into onboarding on their next authenticated session, with no data reset — this was already true in V20.5 and still holds.

---

## 2. Volunteer Tracker authentication and return routing

### Investigation

`volunteer-tracker.html` was re-read in full against the actual V20.5 file. It already loads the three shared Supabase scripts in the correct order, already `await`s `window.wrldAuthReady` before calling `requireAuth()`, and `requireAuth()` (`auth.js`) already implements the required priority: signed-out → `login.html?next=volunteer-tracker.html`; signed-in-but-onboarding-incomplete → `welcome.html?next=volunteer-tracker.html`; signed-in-and-onboarded → the page renders directly. `login.html`'s post-login redirect already calls `postAuthDestination(params.get('next'))`, which returns the requested Volunteer Tracker destination (validated by the existing `safeInternalNext()` allowlist) ahead of the role dashboard. Every nav/dashboard/community/journey-passport link to the tracker was traced and confirmed to be a plain, correctly-cased `volunteer-tracker.html` href — no duplicate or conflicting redirect parameter names (`returnTo`, `redirect`, etc.) exist anywhere in the codebase; `next` is the only one used, consistently. No second Supabase client exists anywhere in the project (verified: `createClient()` is called exactly once, in `supabase-client.js`).

This matches what `CHANGES-V20.4.md`/`CHANGES-V20.5.md` already documented as fixed. Per the Shared Authentication Audit requirement to inspect `onAuthStateChange()` specifically, one real, plausible remaining risk was found and hardened (see the shared fix below): `supabase-client.js` re-assigns `window.wrldAuthReady` a second time on the SDK's own `onAuthStateChange` event, and on unusual timing (the audit's specific "Safari session restoration" concern) that second resolution could complete *after* `initPage()` had already rendered the header once — with nothing to correct it if that first render happened to reflect a stale intermediate state. This is now fixed globally (below), which further hardens the Volunteer Tracker's header/session display alongside every other page.

### Fix: volunteer-data-failure state (new, per acceptance criteria)

Previously, if the authenticated session was valid but the `volunteer_entries` read itself failed (a genuinely different condition from "not logged in"), the failure was silently logged to the console and the tracker rendered whatever was already cached locally, with no visible indication anything had gone wrong. `pullVolunteerEntriesFromSupabase()` (`app.js`) now sets `window.__wrldVolunteerLoadFailed = true` on that specific failure (and clears it on success). `volunteer-tracker.html` checks this flag once `requireAuth()` has already passed and shows a small inline banner (reusing the existing `.form-error` component — no new CSS) with a **Retry** button that re-runs the pull and re-renders. The user is never redirected to login or the dashboard for this condition.

### Result

Every acceptance flow in the spec (signed-in Explorer/Mentor/Administrator/Owner opening the tracker directly; signed-out → login → back to the tracker; onboarding-incomplete → onboarding → tracker; empty state for no records; tracker-specific error + Retry for a data-load failure) is satisfied by the existing V20.4/V20.5 architecture plus the two additions above (the data-failure state, and the shared late-auth-event header hardening).

---

## 3. Download Centre preview session preservation

### Investigation

`worksheet.html` (the preview page opened by the eye icon / Download button on `downloads.html`, `dashboard.html`, `playbook.html`, `program.html`, `assessment.html`, and `tools.html` — all `target="_blank"`, all pointing at the same `worksheet.html?type=...` page) was re-read in full. It already loads the three shared Supabase scripts (SDK, `supabase-config.js`, `supabase-client.js`) ahead of `data.js`, and calls `initPage('downloads')` — which awaits `window.wrldAuthReady` before rendering the header — as its very last script, after `auth.js`/`app.js`/`orbit.js` have loaded. This is the fix already documented in `CHANGES-V20.4.md` and it is intact and correct in V20.5: no missing scripts, no synchronous pre-session auth check, no code that ever calls `signOut()` or clears `localStorage`/`sessionStorage` on this page (verified — the only `auth.signOut()` call site in the entire project is inside `logOut()`, never invoked from `worksheet.html`).

Session persistence itself is `localStorage`-backed by default (`wrldAuthStorage` in `supabase-client.js`, gated by the `wrld_remember_me` flag, defaulting to remembered/`localStorage`) — same-origin `localStorage` is shared across tabs unconditionally in every browser, so opening a preview in a new tab reads the same persisted session the original tab has, without any special handling required. (A visitor who explicitly unchecked "Remember Me" uses `sessionStorage` instead, which is *not* guaranteed to carry into a new tab on every browser/version — this is a pre-existing, narrower edge case unrelated to the reported bug and was not touched, to avoid widening scope into `login.html`'s Remember Me behavior.)

### Fix

No `worksheet.html`-specific code change was necessary or made — the page-specific root cause from V20.4 was already resolved. The one change that benefits this flow is the same shared hardening applied for the Volunteer Tracker: `supabase-client.js` now re-renders the header (`app.js`'s `initPage()` records the last-rendered nav key for this purpose) if a *later* `onAuthStateChange` event resolves after the header's first render — closing the specific "session restore finishes just after the header already committed to a state" race the Shared Authentication Audit calls out, on every page including `worksheet.html`, without redesigning or duplicating any auth logic per-page.

### Result

A signed-in visitor previewing a document keeps their real account header (name/avatar/dashboard menu) on first load, on refresh, in a new tab, and across multiple previews; a genuinely logged-out visitor sees the existing Log In / Sign Up controls, never a fabricated authenticated state. Worksheet design, Download Centre layout, the eye icon, Share, and Print/Save as PDF were not touched.

---

## Shared Authentication Audit — findings

- **One Supabase client, confirmed.** `createClient()` is called exactly once, in `supabase-client.js`. All 30 pages that need auth load that same file; the one page that doesn't (`tools.html`, the standalone calculators page) is not gated and not part of any of the three reported flows.
- **`persistSession`, `autoRefreshToken`, `detectSessionInUrl`** — all already `true` in `supabase-client.js`, unchanged.
- **Three-state model (loading / authenticated / unauthenticated)** — already implemented correctly: `renderHeader()` is never called until `window.wrldAuthReady` resolves (`initPage()`), so the header shows a neutral empty shell during "loading," never a fabricated "unauthenticated" state. This release adds one hardening: a *second*, later resolution of that same readiness signal (a legitimate SDK behavior, not a bug) now re-renders the header instead of being silently discarded — see `supabase-client.js`.
- **Profile/role loading vs. session loading** — already correctly unified: `wrldRefreshSessionCache()` doesn't resolve until both the session and the matching `profiles` row have loaded, so a slow-loading profile can't be misread as "no session."
- **Missing volunteer record vs. missing session** — already correctly distinguished (an empty `volunteer_entries` result renders the tracker's existing empty state, not a redirect); this release adds the missing third case, a *failed* volunteer-entries read, as its own distinct, non-redirecting state (see Fix 2).
- **Redirect/return-destination handling** — a single param name (`next`) is used everywhere; validated exclusively by the existing `safeInternalNext()` allowlist (bare `filename.html[?query]` only — no scheme, no protocol-relative URL, no path traversal) before it ever reaches a `location.href` assignment. No competing `returnTo`/`redirect` parameter exists anywhere in the codebase.
- **Consumed redirects are "cleared"** by the nature of a full page navigation to a clean URL (e.g. `location.href = 'volunteer-tracker.html'`) rather than by any stored flag — there is nothing left over to explicitly clear.

---

## Full changed-file inventory

| File | Change | Why |
|---|---|---|
| `auth.js` | `signUp()`: keep the session Supabase returns instead of signing it back out; return `hasSession:true` | Root cause of Fix 1 |
| `signup.html` | Route `result.hasSession` straight through `postAuthDestination()`; old `login.html?created=1` path kept as a fallback only | Fix 1 |
| `email-verified.html` | `goToDashboard()` now calls `postAuthDestination(null)` instead of `ROLE_DESTINATIONS` directly | Fix 1 (dormant path correctness) |
| `app.js` | `pullVolunteerEntriesFromSupabase()` sets `window.__wrldVolunteerLoadFailed`; `initPage()` records `window.__wrldLastNavKey` | Fix 2 (data-failure state) + shared hardening for Fix 2/3 |
| `supabase-client.js` | `onAuthStateChange` handler re-renders the header if it resolves after the header's first render | Shared hardening for Fix 2/3 |
| `volunteer-tracker.html` | New inline data-load-error banner + Retry action, wired to the new flag | Fix 2 (data-failure state) |
| `CLAUDE.md` | Two notes updated to describe the corrected signup/onboarding flow (documentation only — no functional code) | Housekeeping per this file's own maintenance rule |

No other file in the project differs from the attached V20.5 archive — verified with a full recursive diff (`diff -rq`) against the untouched, re-extracted V20.5 ZIP.

## Migration

**None required.** No table, column, RLS policy, storage bucket, or Edge Function was added, removed, or modified. This was a client-side session/redirect/routing repair only.
