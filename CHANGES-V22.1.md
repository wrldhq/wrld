# WRLD Website V22.1 — Onboarding Workflow Fix

Built from V22 as the baseline. Surgical fix — no redesign, no layout
changes, no unrelated refactoring. Everything outside the root cause and
its required safeguards is identical to V22.

## The bug
A brand-new user, immediately after signup, is redirected to the Orbit
welcome/onboarding page. A large white card appears, Orbit's avatar keeps
bobbing (pure CSS animation, unrelated to any JS), and the onboarding
content never loads — no error, no way to continue. Authentication itself
was already confirmed working (the account exists in Supabase Auth, and
a new tab shows the user already logged in).

## Root cause
`wrldRefreshSessionCache()` (`supabase-client.js`) — the function every
page's session/profile resolution runs through — ends by kicking off two
best-effort background syncs: `pullLearnerStateFromSupabase()` and
`pullVolunteerEntriesFromSupabase()` (both in `app.js`). Neither call was
wrapped in a `try/catch`.

A **brand-new** account's very first sync takes a different code path
than a returning user's: since there's no `learner_state`/
`volunteer_entries` row yet, each function makes an *additional* write
("push local state up") that a returning user's sync never makes. If
that read or write ever throws — a timing hiccup on a row the signup
trigger created moments earlier, a transient network blip, anything —
the exception propagated straight out of `wrldRefreshSessionCache()` and
**rejected `window.wrldAuthReady` itself**.

Every page's `initPage()` (`app.js`, used by all 31 pages) and
`welcome.html`'s own onboarding entry both did `await window.wrldAuthReady`
with **no catch anywhere**. A rejection there silently stopped the rest
of the page's own script from ever running — on `welcome.html`
specifically, the onboarding UI (`#welcome-lines`, the Continue button)
never gets populated, while the avatar's independent CSS keyframe
animation keeps running regardless, producing exactly the reported
symptom: a stuck, blank-looking card with no error, forever.

This explains why the bug is isolated to new-user onboarding: a
returning user's sync (row already exists) doesn't take the code path
that can throw, so their experience is unaffected — matching the report
that everything else already works correctly.

Confirmed with a new local simulation
(`local-simulation/simulate_onboarding_hang.js`) that reproduces the
exact failure against the unmodified baseline (6/11 checks fail there,
demonstrating `window.wrldAuthReady` rejects) and passes fully (11/11)
against this fix.

## The fix
Three layered changes, in order of importance:

1. **Root cause — `supabase-client.js`**: the two background-sync calls
   inside `wrldRefreshSessionCache()` are now each wrapped in their own
   `try/catch`. A failure is logged via the existing `wrldLogDiag()`
   diagnostic and never allowed to propagate — session and profile are
   already fully resolved by that point regardless of whether this
   best-effort sync succeeds, so a failure in it must never again be
   able to affect anyone awaiting `window.wrldAuthReady`. This is the
   only change to this function; auth/profile resolution logic above it
   is untouched.

2. **Defense in depth — `app.js`'s `initPage()`**: the shared
   `await window.wrldAuthReady` used by every page is now also wrapped
   in `try/catch`, so an unexpected rejection from any future change can
   never again silently stop the header/footer/Orbit from rendering on
   any page.

3. **Required safeguard — `welcome.html`**: the onboarding entry point
   now has (a) a `try/catch` around its own `await window.wrldAuthReady`
   / `await wrldRunWelcomeEntry()` call, and (b) a bounded 10-second
   watchdog timer. Either one firing shows the page's existing
   recoverable screen (previously used only for a stuck profile fetch)
   instead of leaving the loading state to hang forever. That screen's
   Retry button was already there; a **Return to Homepage** link was
   added next to it (reusing the existing `.btn.btn-outline.btn-sm`
   classes already defined in `styles.css` — no new styling), so the
   user is never trapped with only one way out.

Refreshing mid-onboarding, or using the browser back button, simply
re-runs this same (now-safe) initialization — no duplicate profiles are
created (the `profiles` row is created once, server-side, by the signup
trigger, not by this page), and no progress is corrupted, since the
background sync this fix protects only ever reads/writes this one
account's own already-namespaced state.

## Existing (already-onboarded) users
Unaffected. `welcome.html` is never shown to them (`needsOnboarding()` —
untouched — already routes a returning user straight past it), and the
`supabase-client.js`/`app.js` changes only add a `try/catch` around code
that, for a returning user, essentially never throws in the first place
(no first-time-sync branch to hit). Their login → dashboard route is
byte-for-byte the same code as V22.

## Not changed
Authentication logic (`signUp()`, `logIn()`, `requireAuth()`,
`isAuthenticated()`, `postAuthDestination()`, `needsOnboarding()`),
database schema, RLS policies, Edge Functions, homepage, mobile/desktop
layouts, Orbit design or intelligence, Community Commons, playbooks,
dashboards, mentor system, administrator dashboard, account settings,
styling, typography, spacing, colours, animations, navigation.

## Files changed
- `supabase-client.js` — the root-cause fix (2 `try/catch` blocks added).
- `app.js` — defense-in-depth `try/catch` in `initPage()`.
- `welcome.html` — bounded timeout + catch around the onboarding entry;
  Return-to-Homepage link added to the existing recovery screen.
- `local-simulation/simulate_onboarding_hang.js` — new regression test
  (not shipped code; a test file, matching the project's own existing
  `local-simulation/` convention).
- All 31 HTML pages — cache-bust bumped for the two changed shared
  scripts: `supabase-client.js?v=20.6.3` → `?v=22.1`,
  `app.js?v=21` → `?v=22.1`. `auth.js`, `orbit.js`, and `styles.css` were
  not touched this release, so their version strings are unchanged.
- No database migration. No schema, policy, or Edge Function changes.

## Testing performed
- **New regression simulation**: `local-simulation/simulate_onboarding_hang.js`
  loads the real `supabase-client.js` in a sandboxed VM with the
  background-sync functions stubbed to throw (reproducing the exact
  failure mode). 11/11 checks pass against the fix; the same test run
  against the unmodified baseline fails 5 of 11, confirming the bug was
  real and is now fixed.
- **Full existing suite re-run**: `simulate.js` (13/13),
  `simulate_auth.js` (7/7), and `simulate_orbit_mobile.js` (25/25) — all
  still pass unchanged, confirming no regression to the profile-retry
  logic, the auth state machine, or V22's mobile Orbit behavior.
- **Static tracing** of the full signup → session → welcome →
  assessment → dashboard chain, confirming no other unguarded
  `await window.wrldAuthReady` sits on that path besides the ones fixed
  above (`dashboard.html` has its own similar unguarded await, but it
  was left as-is per the "surgical, onboarding-only" scope — it's now
  protected indirectly, since the root-cause fix means
  `window.wrldAuthReady` itself no longer rejects for anyone).
- **Syntax validation**: `node --check` on `supabase-client.js`, `app.js`,
  and the extracted inline script from `welcome.html`.

## Testing limitations
No real-device, hosted-browser, or connected-Supabase testing was
performed — this environment has no network access and no browser/
Chromium available. The root cause and fix were verified by loading the
actual production files in a sandboxed Node VM and reproducing/resolving
the exact async failure, not by loading the pages in a browser.
Recommend one real end-to-end signup test with a genuinely new email
address (desktop, mobile responsive view, and mobile Safari) before
shipping, per the requested testing checklist.
