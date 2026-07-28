# WRLD V22.2 — Onboarding Redirect-Loop Fix

Built from V22.1 as the baseline. Surgical fix only — no layout, styling,
mobile-formatting, content, Orbit, dashboard, or playbook changes.

## The bug
Production showed a real, confirmed self-redirect loop: an authenticated,
not-yet-onboarded user already on the welcome/onboarding page was
redirected BACK to that same page, with the current route appended as a
`next` parameter each time — producing an exponentially-growing,
repeatedly re-encoded URL
(`welcome.html?next=welcome%3Fnext%3Dwelcome%25253Fnext...`) until Safari
gave up with "Failed to load resource: bad URL." The production console
confirmed the exact mechanism:

```
[WRLD auth-diag] require_auth_redirect
reason: "needs_onboarding"
to: "welcome.html"
from: "welcome"
```

## Root cause
`requireAuth()`'s onboarding-page exemption (`auth.js`) compared
`location.pathname.split('/').pop()` against a **hardcoded,
extension-only list**: `ONBOARDING_FLOW_PAGES = ['welcome.html', 'assessment.html']`.

Production hosting serves this page at a clean, extension-less URL —
`location.pathname` is `/welcome`, not `/welcome.html`. `location.pathname
.split('/').pop()` then returns the bare string `"welcome"`, which never
equals the list's `'welcome.html'` entry. The exemption silently failed
to match, so the guard concluded the visitor was on some *other*,
non-onboarding page and tried to redirect them to `welcome.html` — while
they were already there. Each reload repeated this, re-encoding the
previous (already-encoded) `next` value into the new one, producing
exactly the reported nested/growing URL.

This is confirmed directly by the diagnostic log itself: `from: "welcome"`
(no `.html`) is only possible if `location.pathname` didn't end in
`.html` at that moment — which is exactly the condition the fix targets.

**Proven with a new regression test**
(`local-simulation/simulate_redirect_loop.js`): run against the
unmodified V22.1 baseline, it reproduces the *exact* diagnostic line
above (`reason: 'needs_onboarding', to: 'welcome.html', from: 'welcome'`)
and then crashes on the route-normalization assertions (the function
didn't exist yet). Run against this fix, all 14/14 checks pass.

## The fix (all in `auth.js`)

1. **`wrldNormalizeRoute(input)`** — reduces any of a bare name
   (`'welcome'`), a filename (`'welcome.html'`), a path (`/welcome`,
   `/welcome.html`), a path with a query or hash, or a full URL whose
   pathname resolves to one of those, down to the same bare, lowercase,
   extension-free route name. `ONBOARDING_FLOW_PAGES` (the hardcoded,
   extension-only array) is replaced with `ONBOARDING_FLOW_ROUTES =
   ['welcome', 'assessment']`, compared through this normalizer instead
   of a raw string. This alone fixes the root cause: `requireAuth()` now
   correctly recognizes being on the onboarding page regardless of
   whether the URL happens to include `.html`.

2. **`wrldSafeRedirect(destinationUrl, reason)`** — every `location.href`
   assignment inside `requireAuth()` now goes through this instead of an
   inline assignment, adding two independent layers on top of #1:
   - **Self-redirect skip**: if the normalized destination equals the
     normalized route already loaded, no navigation happens at all —
     logged as `self_redirect_skipped`. `requireAuth()` returns `true`
     in this case (not `false`), so the calling page continues its own
     initialization instead of treating this as "access denied" —
     exactly the required behavior for an onboarding-incomplete user
     already on `welcome.html`.
   - **Redirect-loop guard**: a `sessionStorage`-backed record of the
     last (from → to, reason) redirect and when it fired. An identical
     redirect attempted again within 4 seconds is blocked and logged as
     `redirect_loop_blocked` rather than executed — a second, independent
     safety net in case any other condition ever causes two different
     pages to bounce to each other.

3. **Hardened `safeInternalNext()`** (the existing `next`-parameter
   validator, now also used to sanitize the `next` value `requireAuth()`
   builds from the current location, not just values arriving from a
   URL):
   - Truncates at the first nested `next=` — a safe `next` value is
     always a bare internal path, never a value that itself carries
     another `next` chain. This is what stops the value from ever
     growing again, independent of the route-comparison fix above.
   - Rejects `welcome.html` (in any normalized form) as a `next`
     **destination** outright — it's the onboarding gate itself, never a
     legitimate final destination.
   - Everything else about it (scheme rejection, protocol-relative
     rejection, backslash rejection, the `filename.html[?query]` shape
     check, the 200-char length cap) is unchanged.

4. **Diagnostic logging** — every redirect decision now logs the raw URL,
   the normalized current route, the normalized destination route, and
   the reason, in addition to the existing `require_auth_redirect` line;
   plus the two new `self_redirect_skipped` / `redirect_loop_blocked`
   events. All via the existing `wrldLogDiag()` (redacted, dev-console
   only — no PII, no tokens).

## Verified still correct (regression checks in the new test)
- A genuinely *different* protected page (e.g. Volunteer Tracker) still
  correctly redirects an onboarding-incomplete user to `welcome.html`.
- `assessment.html` (the other onboarding-flow page) is likewise never
  redirected to itself, in either URL form.
- An already-corrupted, deeply-nested `next` chain already present in
  the URL (e.g. a bookmarked broken link from before this fix) does not
  cause any further navigation or growth — it's simply not amplified.
- The full existing suite (`simulate.js`, `simulate_auth.js`,
  `simulate_orbit_mobile.js`, `simulate_onboarding_hang.js`) still passes
  in full: 13/13, 7/7, 25/25, 11/11.

## Deliberately NOT changed
- **`dashboard.html`'s own `needsOnboarding()` check and `signup.html`'s
  dead-code fallback branches** (`check-your-email.html`/`login.html`
  `next` forwarding, reached only if Supabase's "Confirm email" setting
  is ever re-enabled) were reviewed but left untouched — they aren't part
  of the reported defect and touching them wasn't necessary for the fix.
- **welcome.html itself** required no code changes at all: since
  `requireAuth()` now correctly recognizes the onboarding-page exemption
  regardless of URL form, its existing `if(!requireAuth()) return;` call
  simply proceeds to render the onboarding UI as it always intended to.
- Requirement 9 ("users who completed onboarding *may* be redirected away
  from welcome.html") is optional language in the spec and isn't part of
  the confirmed defect — `welcome.html` doesn't currently check this, and
  adding new redirect behavior there risked touching more than the actual
  bug required. Left as-is; flagging here as a possible future,
  independent enhancement if wanted.
- Orbit's own `location.pathname.split('/').pop()` comparisons
  (`orbit.js`, e.g. its mobile auto-show exclusion list) have the same
  theoretical extension-sensitivity, but Orbit behavior was explicitly
  out of scope for this fix and was not touched.
- No database, schema, RLS, or Edge Function changes. No layout,
  styling, mobile formatting, content, dashboard, or playbook changes.

## Files changed
- `auth.js` — the fix described above (route normalization, safe
  redirect, hardened next-sanitizer, diagnostics). `postAuthDestination()`
  and `needsOnboarding()` are unchanged aside from now calling into the
  hardened `safeInternalNext()`.
- `local-simulation/simulate_redirect_loop.js` — new regression test
  (test file, not shipped app code).
- All 31 HTML pages — cache-bust bumped for the one changed shared
  script: `auth.js?v=20.6.3` → `?v=22.2`. `app.js`, `supabase-client.js`,
  `orbit.js`, and `styles.css` were not touched this release.
- No database migration.

## Testing performed
- **New regression simulation** (`simulate_redirect_loop.js`): reproduces
  the exact production diagnostic line against the unmodified baseline,
  then verifies 14/14 checks against the fix, covering the clean-URL
  case, the extension-having case, a poisoned-URL recovery case, the
  legitimate-redirect positive control, `assessment.html`'s equivalent
  case, the full route-normalization equivalence table, and the
  next-parameter sanitizer's nested-chain stripping and welcome-rejection
  rules.
- **Full existing suite re-run**: `simulate.js` (13/13), `simulate_auth.js`
  (7/7), `simulate_orbit_mobile.js` (25/25), and `simulate_onboarding_hang.js`
  (11/11) all still pass unchanged — 70/70 checks total across the whole
  local-simulation suite.
- **Syntax validation**: `node --check` on `auth.js`, `app.js`,
  `supabase-client.js`, and `orbit.js`.

## Testing limitations
No real-device, hosted-browser, or connected-Supabase testing was
performed — this environment has no network access and no browser/
Chromium available. The root cause and fix were verified by loading the
actual production `auth.js` in a sandboxed Node VM with a fake
`location` object reproducing the exact clean-URL hosting behavior, and
by directly matching the production diagnostic log line reported. Per
requirement 12, a real end-to-end test — new account, real Supabase
session/profile response, watching the actual browser URL bar stay
clean through welcome → assessment → dashboard — should still be run
before shipping; this could not be performed in this sandboxed
environment.
