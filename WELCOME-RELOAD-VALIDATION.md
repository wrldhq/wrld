# WRLD V22.6 — Welcome Page Reload Loop: Validation

Legend: **PASS** — actually executed/measured and confirmed. **FAIL** — executed and did not meet the requirement. **NOT TESTED** — no live Supabase project or browser was available in this environment to exercise it end-to-end; not claimed as verified.

This repository has no live Supabase backend or browser attached in the environment this repair was built in, so items requiring a real signup/login round-trip against a real project, or real cross-browser rendering, are honestly marked **NOT TESTED** rather than inferred. What *was* directly executed: the actual `supabase-client.js`/`auth.js` source files (via Node, `vm.runInContext`, unmodified except for the shipped fix) against a mock Supabase client reproducing the documented timing race, `node --check` syntax validation of every changed file and every page's inline `<script>` block, and a full-repo grep/diff confirming the scope of changes.

## Required validation (from the debugging brief)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Fresh signup with immediate Supabase session | NOT TESTED | No live Supabase project connected in this environment. The client-side logic this depends on (`signUp()` in `auth.js`) was read in full and is unmodified by this release. |
| 2 | Signup reaches `welcome.html` | NOT TESTED | Same reason as #1 — `signup.html`'s `location.href = postAuthDestination(...)` logic is unmodified and was not itself in question. |
| 3 | Orbit appears | NOT TESTED (browser rendering) | Orbit's avatar is pure CSS (`@keyframes welcomeFloat`), untouched by this release — no code path that could affect this was modified. |
| 4 | Welcome page does not reload repeatedly | **PASS (root cause reproduced and fixed under execution)** | `WELCOME-RELOAD-SIMULATION/harness3.js`, scenario E: the proven trigger condition (`getSession()` resolving with no session while `onAuthStateChange`'s initial event carries the correct one) produced exactly one incorrect `location.href` write against the pre-fix logic, and zero against the shipped fix. Re-run included in this zip; see root-cause doc §7 for the full before/after table. |
| 5 | URL remains stable | **PASS**, for the proven defect | Same harness: 0 `location.href` writes across scenarios A/B/C/E/F post-fix. |
| 6 | Greeting appears or recovery appears | **PASS** (logically; not visually rendered in this environment) | `wrldRunWelcomeEntry()`'s existing V22.5 branch coverage (kept intact) plus the new loop breaker's `wrldRenderEmergencyRecovery()` together cover every exit path; confirmed by tracing every `return` in `wrldRunWelcomeEntry()` and the outer IIFE. Not visually screenshotted — no browser available here. |
| 7 | Welcome page cannot redirect to itself | **PASS** | Unconditional in `wrldSafeRedirect()`: `if(fromRoute === toRoute){ ...; return false; }`, independent of any timing. Unchanged by this release (was already correct); confirmed by direct code read, `auth.js` lines ~676-679. |
| 8 | Login still works for existing users | NOT TESTED (no live backend) | `login.html`'s submit handler and `logIn()` (`auth.js`) are entirely unmodified by this release. |
| 9 | Logout still works | NOT TESTED (no live backend) | `logOut()` (`auth.js`) and `handleLogOut()` (`app.js`) are entirely unmodified by this release. |
| 10 | Protected pages still redirect unauthenticated visitors to login | **PASS** (for the case that matters) | Harness scenario G ("genuinely logged out — both channels agree no session") still produces exactly one `location.href = 'login.html'` write post-fix — confirms the fix does not weaken this guarantee. |
| 11 | Valid protected-page `next` destinations still work after login | NOT TESTED (no live backend); logic unchanged | `postAuthDestination()`/`safeInternalNext()`/`wrldSanitizeNextParam()` were read in full and are unmodified by this release. |
| 12 | Auth-flow pages are never recursively nested inside `next` | **PASS** (pre-existing, unchanged) | `safeInternalNext()` explicitly rejects any `next` value that itself normalizes to `welcome` (`auth.js`, already present in V22.5, unmodified). Confirmed by code read, not re-derived here since it wasn't the defect. |
| 13 | Three rapid auth-state events do not create three navigations | **PASS** | `WELCOME-RELOAD-SIMULATION/harness4.js`: `INITIAL_SESSION` + 2× `TOKEN_REFRESHED` fired 8-24ms apart, same valid session, against the shipped fix — measured **0** `location.href` writes, greeting rendered correctly. Output reproduced below. |
| 14 | Clean routes and `.html` routes do not bounce between each other | **PASS** (pre-existing, unchanged) | `wrldNormalizeRoute()` reduces both forms to the same bare route name before every comparison (already present since V22.2, unmodified by this release). Confirmed by code read. |
| 15 | Mobile and desktop layouts remain unchanged | **PASS** (no layout/CSS touched) | Full diff of this release touches exactly 3 files (`supabase-client.js`, `auth.js`, `welcome.html`), and within `welcome.html` only adds new `<script>` logic (loop breaker, instrumentation) and updates two `<script src>` version query strings — zero CSS, zero markup structure, zero copy changes to any existing element. Confirmed via diff review; not visually screenshotted (no browser available here). |

## Directly executed evidence

### Item 4/5/13 — harness output (reproducible via `node WELCOME-RELOAD-SIMULATION/harness3.js` and `harness4.js` from the repo root)

```
SCENARIO: E: getSession()=null (glitch), INITIAL_SESSION=valid (later)  <-- the proven bug case
RESULT: RENDER_GREETING:Test User
location.href writes: (none)

SCENARIO: G: genuinely logged out (both null) — must still redirect to login
RESULT: RENDER_RECOVERY_UNAUTHENTICATED
location.href writes: [{"to":"login.html"}]

RESULT (3 rapid auth events): RENDER_GREETING:Test User
Total location.href writes: 0
PASS — zero navigations for a genuinely authenticated visitor across 3 rapid auth events.
```

### Syntax / structural validation (directly executed)

- `node --check` on every `.js` file in the repository: **0 failures**.
- `node --check` on every `<script>...</script>` block extracted from every `.html` file in the repository (31 pages): **0 failures**.
- Full-repo grep confirming exactly two `.js` files and one `.html` file were modified; every one of the 31 pages that load `auth.js`/`supabase-client.js` now references `?v=22.6` consistently, with zero stale `?v=22.2`/`?v=22.3` references remaining.
- `app.js` and `orbit.js` — confirmed byte-for-byte unmodified (not part of this fix), version strings deliberately left at `?v=22.1`/`?v=22`.

## Not claimed

No claim is made that this fix was verified against a live Supabase project, a real browser, or real mobile/desktop devices — none were available in this environment. What is claimed, and directly backed by the executed harness output above, is that the specific, proven timing race (two independent, competing resolutions of `window.wrldAuthReady`) has been closed at its source, verified by running the actual shipped source files under the exact conditions that were shown to trigger it.
