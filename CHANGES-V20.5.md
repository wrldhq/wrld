# WRLD Website V20.5 — Final Authentication and New-User Onboarding Restoration

Source of truth for this release: **WRLD Website V20.4** (unmodified except where noted below).

This release touches exactly **5 files**. No CSS, no images, no other page, no database table, and no existing user data were changed. No migration was required.

---

## 1. Volunteer Tracker authentication and redirect bug

### Investigation and root cause

`volunteer-tracker.html` was re-audited line by line against the genuine V20.4 project (not a reconstruction): its three shared Supabase scripts (`supabase-js` CDN, `supabase-config.js`, `supabase-client.js`), its `await window.wrldAuthReady` before calling `requireAuth()`, and `requireAuth()`/`safeInternalNext()`/`login.html`'s post-login redirect were all traced end-to-end. **No reproducible instance of the reported bug exists in the V20.4 codebase in isolation** — the V20.3 fix (async-await session resolution before checking auth) is intact and correct on its own.

However, the same investigation identified a real *risk*: this release also had to add first-time onboarding (Fix 2, below). A careless implementation of "send new users somewhere before their dashboard" is precisely the kind of change that reintroduces this exact symptom — a login that always lands on the role dashboard and drops whatever page (like the Volunteer Tracker) the user originally asked for. Rather than treat the two fixes as unrelated, both are now driven through **one shared routing decision**, so the redirect priority is defined in exactly one place and can't silently drift.

### What changed

`auth.js` gained a single routing helper, `postAuthDestination(requestedNext)`, used by both `login.html` (after a successful login) and `assessment.html` (after a first-time assessment completes):

1. If the account still needs onboarding → `welcome.html`, carrying the original requested destination forward as its own `next=` so it is resumed afterward, not lost.
2. Else, if a validated, allowlisted requested destination exists (e.g. `?next=volunteer-tracker.html`) → that destination.
3. Else → the account's normal role dashboard (`ROLE_DESTINATIONS`).

`requireAuth()` (used directly by `volunteer-tracker.html`, `welcome.html`, `journey-passport.html`, `account-settings.html`) was extended with the same three-state model it already had (loading / authenticated / unauthenticated is preserved exactly — `await window.wrldAuthReady` still runs first), plus one additional check: a signed-in Explorer who has not finished onboarding is sent to `welcome.html?next=<current page>` before the page's own content ever renders. This closes the "direct navigation / bookmark / browser-close-and-reopen" case that `postAuthDestination()` alone (which only fires immediately after login or assessment) does not cover.

`safeInternalNext()` (the V20.1 allowlist validator — bare `filename.html[?query]` only, no schemes, no protocol-relative URLs) is unchanged and is still the only thing that ever reaches an actual `location.href` assignment from a query parameter.

### Verified NOT to be part of this bug (read in full, left untouched)

- `program.html:220` — `if(isEnrolled){ location.href='dashboard.html'; return; }`. An unrelated "View Dashboard" shortcut on an already-enrolled program card. Not an auth gate.
- `email-verified.html:87` — `location.href = (user && ROLE_DESTINATIONS[user.role]) || 'dashboard.html';`. Confirmed dormant: `signup.html`'s own comments confirm email verification is currently off project-wide, so this page is not reachable in the current configuration. Left as-is to avoid touching unrelated authentication code on an inactive path; noted here for visibility.
- `owner-dashboard.html:893` — post-ownership-transfer reload redirect between two accounts that are always Administrator/Owner, both permanently exempt from onboarding. Not related.
- `assessment.html:606` — the anonymous (logged-out) assessment-taker fallback, intentionally left as plain `dashboard.html` exactly as before (see Fix 2 below).

### Result

Volunteer Tracker access now goes through the same single, auditable priority path for every role (Explorer, Mentor, Administrator, Owner): signed-in → immediate access; signed-out → login → back to the Volunteer Tracker (never the Explorer Dashboard) unless onboarding is still outstanding, in which case onboarding completes first and the Volunteer Tracker is then reached automatically afterward.

---

## 2. Missing first-time onboarding journey

### What was found

`welcome.html` already existed with its intended design fully in place (Orbit avatar, welcome copy, "Let's Get Started" CTA) but was completely non-functional, for the same reason `volunteer-tracker.html` was broken before V20.3 and `worksheet.html` was broken before V20.4: it was missing the three shared Supabase scripts, so `window.wrldAuthReady` was `undefined`, and it called `requireAuth()` synchronously instead of awaiting session resolution first. Every visitor — including a genuinely just-signed-up user — was bounced out before the page could ever render.

`signup.html` was read in full and deliberately **not modified**. It does not auto-log-in after account creation; it sends the new user to `login.html?created=1` (an existing, intentional security decision predating this release, per its own code comments — email verification is off, so the account is not trusted with a session until the user proves their password again at login). This is preserved exactly. The very next thing a new user does is log in, which is the natural, minimal place to route them into onboarding — no auth architecture changes required.

### Source of truth for "has this account completed onboarding"

`getState().assessment` — the existing Adulting Readiness Assessment result, already stored in the `learner_state` Supabase table and already synced on every login via `pullLearnerStateFromSupabase()`. No new field, no new table, no migration. `needsOnboarding(user)` returns true only when `user.role === 'explorer'` **and** `getState().assessment` is not set.

### Files changed

- **`auth.js`** — added `ONBOARDING_FLOW_PAGES`, `needsOnboarding(user)`, `postAuthDestination(requestedNext)`; extended `requireAuth()` (see Fix 1).
- **`login.html`** — post-login redirect now calls `postAuthDestination(params.get('next'))` instead of computing the destination inline.
- **`welcome.html`** — added the three missing Supabase scripts; changed the synchronous `requireAuth()` call to `await window.wrldAuthReady` first; wired the existing "Let's Get Started" button to carry any pending `next` destination forward to `assessment.html`. The existing Orbit-introduction copy, avatar, and animation were not touched.
- **`assessment.html`** — `beginJourney()`'s completion redirect now calls `postAuthDestination(pendingNext)` for a logged-in user. The existing behavior for an anonymous (logged-out) visitor taking the assessment without an account is unchanged: `dashboard.html`, exactly as before.
- **`dashboard.html`** — added an explicit `needsOnboarding()` check inside its own init sequence, before `renderDashboard()`/`initPage()` run. `dashboard.html` does not call `requireAuth()` at all (it is intentionally viewable by guests), so it needed its own equivalent check — this is exactly the page where "Welcome back" was appearing for brand-new users.

### How each acceptance point is satisfied

- **New user flow**: Create account → `login.html?created=1` → log in → `postAuthDestination()` sees `needsOnboarding()===true` → `welcome.html` (Orbit introduction, unchanged design) → "Let's Get Started" → `assessment.html` → complete assessment → `beginJourney()` saves the result (existing, unchanged save path) → `postAuthDestination()` now sees onboarding complete → role dashboard (or the original requested destination, if any).
- **Returning, already-onboarded user**: `needsOnboarding()` is false the moment `getState().assessment` exists → login goes straight to dashboard or the requested destination, exactly as before this release.
- **Role exemption**: `needsOnboarding()` returns `false` immediately for any non-Explorer role, so Mentors, Administrators, and Owners are never routed into onboarding regardless of assessment status.
- **Broken-period accounts** (created while onboarding was broken, so they have no assessment result): these are Explorer accounts with `!getState().assessment`, which is exactly what `needsOnboarding()` detects — they are automatically routed into onboarding on their next login or protected-page visit, using the real data model (assessment presence), not account age. No existing progress (playbook completion, volunteer hours, saved content, roles) is touched or reset.
- **Interrupted onboarding**: there is no separate "onboarding started" flag — only assessment completion is tracked. A user who closes the browser after `welcome.html` but before finishing `assessment.html` is simply routed back to `welcome.html` again next time (via `requireAuth()`'s check, or `postAuthDestination()` on their next login), rather than ever reaching "Welcome back." **Known limitation, disclosed here**: because no partial-assessment-progress field exists in the current data model and adding one was out of scope ("do not add new features"), a resumed session restarts at the welcome screen rather than mid-assessment. `assessment.html` already has its own separate, unrelated "resume where you left off" banner for in-progress assessment answers (`assess.answers`), which continues to work unchanged for a user who re-opens the assessment directly.
- **Requested-destination interaction**: if a newly registered user's original `next=` pointed at a protected page (e.g. Volunteer Tracker), `postAuthDestination()` carries it through `welcome.html?next=...` → `assessment.html?next=...` → and finally resolves it after the assessment completes, so onboarding is never bypassed but the original destination is not lost either.

---

## Full changed-file inventory

| File | Change |
|---|---|
| `auth.js` | Added `ONBOARDING_FLOW_PAGES`, `needsOnboarding()`, `postAuthDestination()`; extended `requireAuth()` |
| `login.html` | Post-login redirect now uses `postAuthDestination()` |
| `welcome.html` | Fixed missing Supabase scripts + async auth check; wired CTA to carry `next` forward |
| `assessment.html` | `beginJourney()` completion redirect now uses `postAuthDestination()` for logged-in users |
| `dashboard.html` | Added onboarding-incomplete check before rendering |

No other file in the project differs from V20.4 (verified with a full recursive diff against the pristine V20.4 archive).

## Migration

**None required.** This release reuses the existing `learner_state.assessment` field as the sole source of truth for onboarding completion. No table, column, policy, or Edge Function was added, removed, or modified.
