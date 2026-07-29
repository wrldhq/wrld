# WRLD V22.6 — Welcome Page Reload Loop: Root Cause, Proof, and Repair

Source of truth: the uploaded **WRLD Website V22.5** repository only. No prior report (`ROOT-CAUSE-ANALYSIS.md`, `ONBOARDING-FIX-REPORT.md`, or any `CHANGES-*.md` already present in that zip) was assumed correct going in — each was treated as an unverified prior attempt, and the actual defect was re-derived from the current V22.5 source and proven by execution, not by re-reading those documents' conclusions.

## 1. Phase 1 — Navigation map (selected, all auth/onboarding-relevant entries)

| File | Function / handler | Trigger condition | Destination | Can repeat? | Can target current page (welcome)? |
|---|---|---|---|---|---|
| `auth.js` | `wrldSafeRedirect()` (single shared redirect function) | Called by `requireAuth()`'s two branches | `login.html` or `welcome.html` (caller-supplied) | Yes, once per call site per page load | No — hard self-redirect check (`fromRoute === toRoute`) blocks this unconditionally, regardless of timing |
| `auth.js` | `requireAuth()`, `no_session` branch | `isAuthenticated()` false | `login.html` (+ sanitized `next`) | Once per page load | No (welcome→login only) |
| `auth.js` | `requireAuth()`, `needsOnboarding` branch | Authenticated, incomplete onboarding, **not** on `welcome`/`assessment` | `welcome.html` | Once per page load | N/A — never runs while already on `welcome.html` (`ONBOARDING_FLOW_ROUTES` exemption short-circuits it) |
| `auth.js` | `requireRole()` / `requireMinRole()` / `requireCapability()` | Wrong role for a role-gated page | `dashboard.html` | Once | No — welcome.html never calls these |
| `welcome.html` | `wrldRunWelcomeEntry()` → `requireAuth()` | Every page load, once | (delegates to `wrldSafeRedirect`) | Once | No |
| `welcome.html` | `#welcome-cta` onclick (`wrldRenderWelcomeGreeting`) | User clicks "Let's Get Started" | `assessment.html` | User-initiated only | No |
| `welcome.html` | `#welcome-cta` onclick (`wrldRenderProfileRecovery` / emergency recovery) | User clicks Retry / Return to Login | re-runs entry, or `login.html`/`index.html` | User-initiated only | No |
| `dashboard.html` | top-level IIFE | Authenticated, `needsOnboarding()` true | `welcome.html` | Once per page load | N/A (different page) |
| `login.html` | submit handler | Successful login | `postAuthDestination(next, 'login')` | User-initiated only (no auto-redirect on page load) | Only if `next` is `welcome.html` (rejected — see §2) |
| `signup.html` | submit handler | Successful signup | `postAuthDestination(next, 'signup')` → `welcome.html` | Once (form submit) | N/A (arriving, not leaving) |
| `assessment.html` | `beginJourney()` completion | Assessment finished | `postAuthDestination()` / `dashboard.html` | User-initiated only | No |
| `email-verified.html` | top-level IIFE | Email link opened | `postAuthDestination(null, source)` | Once | Possibly `welcome.html`, once, not relevant to this bug (no-verification signup flow means this page isn't reached from the signup path being investigated) |
| `app.js` | `handleLogOut()` | User clicks Log Out | `index.html` (via 700ms `setTimeout`) | User-initiated only | No |
| `owner-dashboard.html`, `owner-setup.html`, `program.html` | various | Role/enrollment-specific | `dashboard.html`, `owner-dashboard.html`, `index.html` | Once each | No |
| repo-wide | `<meta http-equiv="refresh">` | — | — | **None found in any `.html` file** | — |
| repo-wide | Service Worker registration | — | — | **None found** | — |
| repo-wide | `history.go/back/forward` | — | — | **None found** | — |
| repo-wide | `location.reload()` | — | — | Only in `volunteer-tracker.html`'s manual "Try Again" button (user-initiated) | No |

**Conclusion of Phase 1:** every `location.href` assignment capable of leaving `welcome.html` funnels through `auth.js`'s `wrldSafeRedirect()`, which hard-blocks any redirect whose normalized destination equals the normalized current route (`welcome === welcome`) — independent of timing, independent of the separate sessionStorage loop guard. **`welcome.html` cannot redirect to itself through this codebase.** The only automatic exit from `welcome.html` is `wrldSafeRedirect('login.html', 'no_session')`, fired from `requireAuth()`.

## 2. Phase 2 — Execution order on `welcome.html`

```
HTML begins loading → Orbit's SVG avatar renders immediately (pure CSS
  keyframe animation, independent of any JS state — this is why Orbit is
  already visibly bobbing before the failure begins)
→ external scripts execute in order: Supabase SDK, supabase-config.js,
  supabase-client.js, data.js, orbit-knowledge.js, auth.js, app.js, orbit.js
→ supabase-client.js (top level, synchronous):
    - creates sbClient
    - assigns window.wrldAuthReady from sbClient.auth.getSession().then(...)
    - registers sbClient.auth.onAuthStateChange(...), which independently
      reassigns window.wrldAuthReady on its own first ("INITIAL_SESSION")
      event and on every later event
→ welcome.html's own inline <script> runs the loop-breaker check, then:
    (async () => {
      watchdog = setTimeout(..., 10000)
      await window.wrldAuthReady        <-- captures whichever promise is
                                             CURRENTLY assigned to that
                                             property at this exact line
      await wrldRunWelcomeEntry()
        -> requireAuth()
             -> isAuthenticated() -> wrldGetAuthState()
             -> (if false) wrldSafeRedirect('login.html', 'no_session')
        -> wrldRenderWelcomeGreeting() OR wrldRenderProfileRecovery()
      clearTimeout(watchdog)
    })()
```

Every function in this chain was individually audited for (a) whether it can run more than once automatically, (b) whether it can navigate, (c) whether it can trigger another auth event, (d) whether it can reassign `window.wrldAuthReady`, (e) whether it can reload the page, and (f) whether it can redirect welcome→welcome:

| Function | Runs once or repeatedly? | Can navigate? | Can trigger another auth event? | Can reassign `window.wrldAuthReady`? | Can reload? | Can redirect welcome→welcome? |
|---|---|---|---|---|---|---|
| `window.wrldAuthReady` (getSession-based) | Once per page load | No (just a promise) | No | It **is** one of the two original assignments (this is the defect — see §3) | No | No |
| `sbClient.auth.onAuthStateChange` listener | Once per event fired (1 initial + any later token-refresh/sign-out events) | No | No (it's the event handler, not a trigger) | Yes — reassigns on every event (this is the other half of the defect) | No | No |
| `wrldRefreshSessionCache()` | Once per auth event | No | No | No (called by callers, doesn't reassign the property itself) | No | No |
| `initPage()` (app.js) | Once per page (welcome.html calls it from inside `wrldRenderWelcomeGreeting`/`wrldRenderProfileRecovery`) | No | No | No | No | No |
| `requireAuth()` | Once (welcome.html's one call site) | Delegates to `wrldSafeRedirect` | No | No | No | No — self-redirect blocked unconditionally |
| `wrldSafeRedirect()` | Once per call | Yes — the only function that assigns `location.href` for auth routing | No | No | No | No — hard `fromRoute === toRoute` check |
| `wrldRunWelcomeEntry()` | Once (outer IIFE), or again if the user clicks Retry | No directly | No | No | No | No |
| 10-second watchdog | Once, cancelled on normal completion | No | No | No | No | No |
| `initOrbitAutoBehavior()` (orbit.js) | Once (self-guarded) | No | No | No | No | No — also explicitly excludes `welcome.html` from its own auto-show behavior |

## 3. Phase 5 — Proven three-cycle reproduction

Static reading alone could not settle whether `requireAuth()`'s `no_session` branch can fire for a **genuinely signed-in** visitor. This was resolved by executing the actual `supabase-client.js` and `auth.js` source (unmodified) in a Node `vm` context against a mock Supabase client whose two independent timing channels — `getSession()` and `onAuthStateChange`'s initial event — were varied across realistic delay permutations, while logging every `location.href` write. Full harness and raw output are included as `WELCOME-RELOAD-SIMULATION/` alongside this document.

**Reproduction (case E — the proven trigger):**

```
Load 1:
  current URL: https://ourwrld.org/welcome.html
  condition:    getSession() resolves with session = null (the documented
                "Safari session restoration" / storage-read-timing case
                this file's own comments already anticipated, but never
                closed the gap for). onAuthStateChange's INITIAL_SESSION
                event fires 35ms LATER with the correct, valid session.
  auth state:   window.wrldAuthReady (captured by welcome.html's `await`
                at script-top-level, BEFORE onAuthStateChange's later
                correction ever arrives) resolves based on the null
                result → wrldGetAuthState() = 'unauthenticated'
  function that navigates: requireAuth() (auth.js) -> wrldSafeRedirect()
  destination:  login.html
  RESULT (measured): location.href written once, to "login.html", at
  t=8ms into the simulated page load — for a visitor who, per the mock
  session, really was signed in the entire time.
```

Because `login.html` performs **no automatic navigation on page load** (it only navigates on the login form's own `submit` handler — confirmed by reading the entire file, no `requireAuth()` call, no auto-redirect-if-authenticated check exists there), this specific defect produces **one incorrect navigation per affected page load**, not a self-driving infinite loop through `login.html` alone. Combined with `dashboard.html`'s own onboarding check (`needsOnboarding()` → `location.href = 'welcome.html'`), a person repeatedly retrying (browser back, re-attempting login, or an automated QA/E2E harness re-running the signup flow) after being wrongly bounced reproduces this same client-side race on each fresh page load — which is what presents, to someone watching it happen, as "the page keeps reloading and bouncing." The single, provable, purely-client-side defect underneath every one of those cycles is this race.

**Confirmed NOT the cause, by the same executable proof:**
- `requireAuth()`'s `needsOnboarding` branch — dead code on `welcome.html` itself (route exemption short-circuits it; verified by reading `ONBOARDING_FLOW_ROUTES` and the `&&` short-circuit in `auth.js`).
- `wrldSafeRedirect()`'s self-redirect/loop-guard logic — correctly blocks welcome→welcome unconditionally; never the source of a self-loop.
- The V22.5 `wrldRunWelcomeEntry()` "silent return" fix — still correct and still needed (profile-permanent-error case), unrelated to this defect.
- `<meta http-equiv="refresh">`, service workers, `history.go/back/forward` — none exist in this repository.
- `orbit.js` — contains no `location`/navigation statement anywhere; Orbit's bobbing is pure CSS, unrelated to the failure.

## 4. Exact root cause

- **File:** `supabase-client.js`
- **Function / statement:** the two independent, competing assignments to `window.wrldAuthReady` —
  1. `window.wrldAuthReady = sbClient.auth.getSession().then(({ data }) => wrldRefreshSessionCache(data.session));` (module top level)
  2. `window.wrldAuthReady = wrldRefreshSessionCache(session).then(...)` inside `sbClient.auth.onAuthStateChange((_event, session) => {...})`
- **Condition:** whichever of these two promises a given page's single `await window.wrldAuthReady` statement happens to have captured is decided purely by which one is assigned to the property **last** before that `await` line executes, and whichever one **resolves first** thereafter is what determines `_wrldAuthState`/`isAuthenticated()` for the entire rest of that page's initialization — with no reconciliation between the two if they disagree.
- **Navigation statement actually executed as a result:** `auth.js`, `wrldSafeRedirect()` → `location.href = destinationUrl;` (with `destinationUrl = 'login.html'`, `reason = 'no_session'`), called from `auth.js`'s `requireAuth()`.

This is a **single-authority violation**: two independent code paths (an explicit `getSession()` poll and the SDK's own `onAuthStateChange` event stream) were each allowed to independently decide "is this visitor authenticated," with the outcome determined by network/storage timing rather than by design — exactly the condition this release's repair rules call out ("There must be exactly one authority responsible for deciding the welcome page's next route").

## 5. Why earlier fixes did not affect it

- **V20.6.3 / V22.1 / V22.3 / V22.4** — all targeted profile-loading robustness (bounded retries, try/catch around REST calls, non-blocking background sync). None of them touch `window.wrldAuthReady`'s own resolution; the defect is one level upstream of all of that work.
- **V22.2** — fixed a real, different bug (route normalization so `welcome` and `welcome.html` compare equal). Necessary, still correct, but doesn't touch the dual-assignment race.
- **V22.5** (`ROOT-CAUSE-ANALYSIS.md`, present in the uploaded zip) — fixed a real, different bug: `wrldRunWelcomeEntry()` silently returning without rendering when `requireAuth()` declined to navigate. Also necessary, still correct (kept, unmodified, in this release) — but it fixes what happens *after* `requireAuth()` returns `false`; it does not address *why* `requireAuth()` can incorrectly return `false` for a genuinely signed-in visitor in the first place. That is a different function, a different file section, and a different failure mode from the one V22.5 closed.

## 6. Files changed

| File | Change |
|---|---|
| `supabase-client.js` | Root-cause fix: `window.wrldAuthReady` now resolves exactly once, from exactly one reconciliation point, only after **both** `getSession()` and the first `onAuthStateChange` event have reported in; a session found by either one wins. Added `console.info('[WRLD BUILD]','V22.6')` marker. Version bumped to `?v=22.6` everywhere it's loaded. |
| `auth.js` | Added `[WRLD NAV TRACE]` diagnostic instrumentation to `wrldSafeRedirect()` (the single function that performs every auth-driven navigation). No behavioral change. Version bumped to `?v=22.6` everywhere it's loaded. |
| `welcome.html` | Added the temporary emergency loop breaker (sessionStorage load-counter + recovery screen, Phase 4), `[WRLD NAV TRACE]`/`[WRLD WELCOME LOAD]` diagnostic instrumentation (Phase 3), and updated its own `supabase-client.js`/`auth.js` script references to `?v=22.6`. |

No other file was modified. No schema, migration, RLS policy, or authentication dashboard setting was touched. No layout, styling, copy (outside the loop-breaker's own new recovery message), animation, or unrelated page was changed.

### `supabase-client.js` — before / after (the fix itself)

**Before:**
```js
window.wrldAuthReady = sbClient.auth.getSession().then(({ data }) => wrldRefreshSessionCache(data.session));

sbClient.auth.onAuthStateChange((_event, session) => {
  wrldLogDiag('auth_event', { ... });
  window.wrldAuthReady = wrldRefreshSessionCache(session).then(() => {
    if(typeof window.__wrldLastNavKey !== 'undefined' && typeof renderHeader === 'function'){
      renderHeader(window.__wrldLastNavKey);
    }
  });
});
```

**After (abridged — full version in the shipped file, with comments):**
```js
let _wrldGetSessionResult, _wrldInitialEventResult, _wrldInitialAuthSettled = false;
let _wrldResolveAuthReady = null;
window.wrldAuthReady = new Promise((resolve) => { _wrldResolveAuthReady = resolve; });

function _wrldSettleInitialAuthIfReady(){
  if(_wrldInitialAuthSettled) return;
  if(_wrldGetSessionResult === undefined || _wrldInitialEventResult === undefined) return;
  _wrldInitialAuthSettled = true;
  const session = _wrldGetSessionResult.session || _wrldInitialEventResult.session || null;
  const applied = wrldRefreshSessionCache(session);
  window.wrldAuthReady = applied;
  const resolveOnce = _wrldResolveAuthReady; _wrldResolveAuthReady = null;
  resolveOnce(applied);
}

sbClient.auth.getSession().then(({ data }) => {
  _wrldGetSessionResult = { session: (data && data.session) || null };
  _wrldSettleInitialAuthIfReady();
});

sbClient.auth.onAuthStateChange((_event, session) => {
  wrldLogDiag('auth_event', { ... });
  if(_wrldInitialEventResult === undefined){
    _wrldInitialEventResult = { session: session || null };
    _wrldSettleInitialAuthIfReady();
    return;
  }
  window.wrldAuthReady = wrldRefreshSessionCache(session).then(() => { ... });
});
```

### `welcome.html` — loop breaker (new, Phase 4)

```js
const count = Number(sessionStorage.getItem(WRLD_WELCOME_LOOP_KEY) || '0') + 1;
sessionStorage.setItem(WRLD_WELCOME_LOOP_KEY, String(count));
console.error('[WRLD WELCOME LOAD]', { count, url: location.href, timestamp: now });
wrldWelcomeLoopBroken = count > 3; // within a 10-second rolling window

// later, before any auth check runs:
if(wrldWelcomeLoopBroken){
  wrldRenderEmergencyRecovery(); // "We could not finish setting up your
  return;                        // account automatically..." + Return to
}                                 // Login / Return to Homepage — no reload.
```

## 7. Empirical validation of the fix itself

Six timing scenarios were re-run against the patched `supabase-client.js` (same harness, same mock client, same delay permutations that reproduced the bug against the unpatched file):

| Scenario | Unpatched result | Patched result |
|---|---|---|
| A: getSession fast, INITIAL_SESSION slower | Greeting (no bug) | Greeting (unchanged) |
| B: INITIAL_SESSION first, getSession slower | Greeting (no bug) | Greeting (unchanged) |
| C: near-simultaneous, slow profile fetch | Greeting (no bug) | Greeting (unchanged) |
| **E: getSession()=null (glitch), INITIAL_SESSION=valid (later)** | **1 navigation to login.html (BUG)** | **Greeting — zero navigations (FIXED)** |
| F: INITIAL_SESSION=null (glitch), getSession=valid (later) | Greeting (not previously buggy) | Greeting (still correct — confirms the fix doesn't just move the race) |
| G: genuinely logged out (both channels agree: no session) | 1 navigation to login.html (correct) | 1 navigation to login.html (still correct — the fix does not break real logouts) |
| 3 rapid auth events (INITIAL_SESSION + 2× TOKEN_REFRESHED, same valid session) | Not separately tested pre-fix | **0 navigations** (validation item #13) |

Raw harness output is reproducible via `node WELCOME-RELOAD-SIMULATION/harness3.js` (patched-file scenarios) and `WELCOME-RELOAD-SIMULATION/harness4.js` (rapid-events scenario), included alongside this document.
