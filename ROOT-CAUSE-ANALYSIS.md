# WRLD V22.5 — Root Cause Analysis: Onboarding Never Finishes Loading

Source of truth for this analysis: the uploaded **WRLD Website V22.4** repository only. No prior report (including `ONBOARDING-FIX-REPORT.md` already present in that zip) was used as evidence. Every claim below is backed by a specific file/line in the V22.4 source, and where noted, by live production log data pulled read-only from the project's own Supabase instance (`hnmpcjdlhuhetgkzgdgl`, the exact project `supabase-config.js` points at).

## 1. Complete execution trace (signup → onboarding)

```
signup.html: #signup-form submit handler
  -> signUp({name,email,password,captchaToken})              [auth.js]
       -> sbClient.auth.signUp(...)                            [Supabase]
       -> wrldRefreshSessionCache(session)                     [supabase-client.js]
            -> sets _wrldSessionCache, _wrldAuthState='authenticated'
            -> wrldFetchProfileWithRetry(session)               (awaited, bounded ≤3 attempts)
            -> _wrldProfileCache set; profile syncs fired but NOT awaited (fire-and-forget)
       -> returns {ok:true, hasSession:true, user:getCurrentUser()}
  -> location.href = postAuthDestination(next, 'signup')       [auth.js]
       -> 'welcome.html' (+ ?next=... if any)
--- full page navigation, new JS context ---
welcome.html: <script> tags load in order
  -> supabase-config.js, supabase-client.js, data.js, orbit-knowledge.js,
     auth.js, app.js, orbit.js  (all synchronous, in this order)
  -> supabase-client.js top level:
       window.wrldAuthReady = sbClient.auth.getSession().then(({data}) =>
           wrldRefreshSessionCache(data.session))
       sbClient.auth.onAuthStateChange(...) registered (can also reassign
       window.wrldAuthReady on any later auth event, e.g. INITIAL_SESSION)
  -> welcome.html's own inline <script> runs:
       let wrldWelcomeInitDone = false;
       (async () => {
         const watchdog = setTimeout(() => { ... wrldRenderProfileRecovery(); }, 10000);
         try {
           await window.wrldAuthReady;
           await wrldRunWelcomeEntry();                         [welcome.html]
                -> if(!requireAuth()) return;                    [auth.js]  <-- SILENT EXIT POINT
                -> profileState check -> wrldRenderProfileRecovery() OR
                -> getCurrentUser() -> wrldRenderWelcomeGreeting(firstName)
           wrldWelcomeInitDone = true;
           clearTimeout(watchdog);                                <-- WATCHDOG DISARMED HERE
         } catch(e) { ... wrldRenderProfileRecovery(); }
       })();
```

Either `render greeting` or `render recovery` is reached on every path **except one**: `wrldRunWelcomeEntry()` returning via its first line, `if(!requireAuth()) return;`.

## 2. Exact root cause

**Execution stops at `welcome.html`'s `wrldRunWelcomeEntry()`, line `if(!requireAuth()) return;`, when `requireAuth()` (auth.js) returns `false` without an accompanying navigation actually being in flight.**

This is not an unresolved Promise — every awaited Promise in the current chain does terminate (see §4). It is a **silent-exit / caller-misinterprets-early-return** bug, exactly the class of defect the debugging brief asked to rule in or out.

### The defect, precisely

`auth.js`'s `requireAuth()` has two branches that both call the shared `wrldSafeRedirect()` helper. That helper's own contract, documented in its header comment, is explicit:

> "Returns `true` if it actually navigated (caller should stop / treat the page as unloading), `false` if it did not (caller should proceed with its own normal initialization...)"

The **`needsOnboarding` branch** (used when a different protected page redirects a user *into* onboarding) honors this contract correctly:

```js
const navigated = wrldSafeRedirect(dest, 'needs_onboarding');
if(navigated) return false; // actually leaving this page — caller should stop
return true;                // redirect was skipped/blocked — continue right here
```

The **`no_session` branch** (the one that fires on `welcome.html` itself, since `welcome.html` is where `isAuthenticated()` is checked first) does **not**:

```js
// BEFORE — auth.js, requireAuth(), no_session branch
wrldSafeRedirect(dest, 'no_session');
return false;
```

The return value of `wrldSafeRedirect()` is discarded. `requireAuth()` returns `false` **unconditionally**, regardless of whether `location.href` was actually assigned or whether `wrldSafeRedirect()`'s own redirect-loop guard silently blocked it (its 4-second, same-signature dedup — see `WRLD_REDIRECT_GUARD_WINDOW_MS` in auth.js). Every one of the 20+ pages that call `requireAuth()`, including `welcome.html`, follows the same pattern: `if(!requireAuth()) return;` — which assumes `false` always means "a redirect is already carrying the visitor away." That assumption is false whenever `wrldSafeRedirect()` declined to navigate.

On `welcome.html` specifically, that bare `return;` inside `wrldRunWelcomeEntry()` is the **only** path in the whole file that exits without calling either `wrldRenderWelcomeGreeting()` or `wrldRenderProfileRecovery()`. Back in the outer `(async () => { ... })()` block:

```js
await window.wrldAuthReady;
await wrldRunWelcomeEntry();   // resolves normally — no exception was thrown
wrldWelcomeInitDone = true;    // <-- marks init "done" even though nothing rendered
clearTimeout(watchdog);        // <-- the one remaining safety net is disarmed
```

Because `wrldRunWelcomeEntry()` returning via a plain `return;` is indistinguishable, from the caller's point of view, from it returning after a successful render, `wrldWelcomeInitDone` is set to `true` and the 10-second watchdog is cancelled. Nothing else on the page will ever call `wrldRenderProfileRecovery()` or `wrldRenderWelcomeGreeting()` again. The result is exactly the reported symptom: Orbit's CSS float animation keeps running (it's pure CSS, `animation: welcomeFloat 3.2s ease-in-out infinite`, entirely independent of JS state), `#welcome-lines` and `#welcome-cta` are never populated (both start at `opacity:0` and only get the `.in` class from the now-unreached render functions), and the watchdog that exists specifically to catch this class of failure has already been told "nothing to see here."

### What has to be true for `requireAuth()` to take this branch on `welcome.html` for a brand-new signup

`requireAuth()`'s `no_session` branch only runs when `isAuthenticated()` (i.e. `wrldGetAuthState() === 'authenticated'`) is `false` **at the moment `wrldRunWelcomeEntry()` runs** — which is only reached after `await window.wrldAuthReady` has already resolved. This can happen even though the visitor really is signed in, because `window.wrldAuthReady` is reassigned twice on every page (once by the explicit `getSession().then(...)` call, once more by `onAuthStateChange`'s own event — see supabase-client.js lines 489 and 506/520), and whichever promise object happens to be assigned to `window.wrldAuthReady` at the exact statement `await window.wrldAuthReady` executes is the one that gets awaited. If the second (`onAuthStateChange`) assignment settles first — which it can, since a null/interim auth event resolves `wrldRefreshSessionCache(null)` almost immediately (no profile fetch needed), while the "real" session's promise still has a network round trip to make — `isAuthenticated()` can read `false` for a brief window even for a genuinely-just-signed-up user. The **first** time this happens in a session, `wrldSafeRedirect()` still fires the redirect for real (`location.href = 'login.html...'`) and the visitor is bounced, not hung. It is specifically the **second** occurrence of the identical `welcome→login#no_session` signature within `wrldSafeRedirect()`'s 4-second window (e.g., a manual reload/retry of `welcome.html` in the same tab shortly after the first bounce, or any other page flow that revisits `welcome.html` quickly) that the loop guard blocks — and that blocked case is precisely the one `requireAuth()` mishandles. This matches the debugging brief's own note that "several attempted fixes have already failed": each prior fix (retry logic, watchdog behavior, async handling, etc.) targeted the *profile-loading* path, which was never the defect — the defect is one level up, in the *auth-gate* path, and specifically in a code branch that only misbehaves on its second trigger, which is exactly the kind of bug that a single manual test can miss and a QA loop (repeatedly reloading the same failing page while investigating) reliably reproduces.

## 3. Why previous fixes failed

Every previously-documented fix in this codebase's own comments (V20.6.3, V22.1, V22.2, V22.3, V22.4) targeted **profile loading and Promise-rejection hygiene**: bounding retries, adding try/catch around `wrldFetchProfileOnce()`/`wrldRefreshSessionCache()`, no longer awaiting the background learner-state/volunteer sync, and adding the 10-second watchdog itself. All of that code is present and correct in V22.4 (verified in §4 below — no Promise in this chain is actually capable of hanging forever). None of it touches the **auth-gate** (`requireAuth()`) path, because that path never throws and never hangs — it returns a normal, resolved `false`. A fix aimed at rejections and timeouts cannot catch a function that returns cleanly with the wrong outcome. This is also why "adding a watchdog" (V22.1) did not fully close the gap: the watchdog only protects against work that never *finishes*; it does nothing when the work finishes immediately and mislabels itself as done.

## 4. Every awaited Promise in the chain — resolve/reject classification

| Await | Location | Can it hang forever? |
|---|---|---|
| `sbClient.auth.signUp(...)` | auth.js `signUp()` | No — resolves or rejects per Supabase SDK contract; caller wraps the whole `signUp()` call in try/catch on signup.html. |
| `sbClient.auth.getSession()` | auth.js `signUp()` fallback, supabase-client.js top level | No — wrapped in try/catch where it can fail (auth.js); resolves synchronously from storage in the common case. |
| `wrldRefreshSessionCache(session)` | auth.js `signUp()`; supabase-client.js `window.wrldAuthReady` chain | No — internally bounded (see next rows); wrapped by callers where relevant. |
| `wrldFetchProfileWithRetry(session)` | supabase-client.js `wrldRefreshSessionCache()` | No — bounded `for` loop, `WRLD_PROFILE_MAX_ATTEMPTS = 3`; every branch either returns or `break`s; wrapped in try/catch at the call site (V22.3 fix, confirmed present). |
| `wrldFetchProfileOnce(userId)` | supabase-client.js `wrldFetchProfileWithRetry()` | No — single awaited REST call, wrapped in try/catch (V22.3 fix, confirmed present). |
| `sbClient.auth.refreshSession()` | supabase-client.js `wrldFetchProfileWithRetry()` retry step | No — bounded to `WRLD_PROFILE_MAX_FORCED_REFRESH = 1`, wrapped in try/catch. |
| `wrldSleep(ms)` | supabase-client.js `wrldFetchProfileWithRetry()` | No — a plain bounded `setTimeout` promise. |
| `window.wrldAuthReady` | welcome.html main IIFE, `initPage()` (app.js) | No — resolves once `wrldRefreshSessionCache()` resolves; independently bounded by the 10-second watchdog on welcome.html regardless. |
| `wrldRunWelcomeEntry()` | welcome.html main IIFE, Retry handler | No — every internal branch returns or renders synchronously; no unbounded await inside it. |
| `pullLearnerStateFromSupabase()` / `pullVolunteerEntriesFromSupabase()` | supabase-client.js `wrldRefreshSessionCache()` | **Not applicable** — as of the V22.4 fix already in this source, these are launched via `Promise.resolve().then(...)．catch(...)` and are explicitly **not awaited** here, so they cannot block `window.wrldAuthReady` even if they hang. Confirmed present and correctly implemented; not part of the live bug. |

**Conclusion: no awaited Promise in the current V22.4 onboarding chain is capable of remaining pending forever.** The bug is a synchronous-return-value/control-flow defect, not a Promise-resolution defect.

## 5. Every silent exit (`return;`) audited

Searched `signup.html`, `welcome.html`, `auth.js`, `supabase-client.js` for `return;` / bare `return`. The one that matters:

- **`welcome.html`, `wrldRunWelcomeEntry()`, `if(!requireAuth()) return;`** — confirmed above as the root cause. The caller (the outer IIFE) mistakenly treats this as successful completion and disarms the watchdog.
- `auth.js`, `requireAuth()`'s `hereRoute === 'login'` self-redirect-skip branch — also returns `false` with no navigation, by design, but its caller on `login.html` is the login form's own submit handler, not a page-load gate with a watchdog, so it does not produce a hang there.
- `wrldFetchProfileWithRetry()`'s `return null` on session-ownership mismatch — correctly paired with `_wrldProfileState = 'permanent_error'`/`'not_requested'` first, so `wrldRunWelcomeEntry()`'s profile-state check still renders recovery correctly. Not a silent exit in the problematic sense.

No other silent exit in the audited files misleads its caller.

## 6. Watchdog behaviour — can it be cancelled before either render happens?

**Yes — this is the mechanism of the bug.** `clearTimeout(watchdog)` runs immediately after `await wrldRunWelcomeEntry()` in the `try` block, with no check that a render (or a real navigation) actually occurred. Confirmed via the code path in §2 and the runtime simulation in §8.

## 7. Profile loading — timeout/retry/fallback audit

Every profile request (`wrldFetchProfileOnce`, called from `wrldFetchProfileWithRetry`) has: a bounded retry count (3), a classified error path (`not_found` / `temporary_error` escalating to `permanent_error` / immediate `permanent_error` for non-temporary errors), and a guaranteed-terminating loop. **No profile request can remain pending forever.** This part of the system, despite being the target of four prior release notes (V20.6.3, V22.1, V22.3, V22.4), is correctly implemented in V22.4 and was not the cause of the still-reproducing bug.

## 8. Authentication state — every condition `requireAuth()` returns `false`, and validation

| Condition | Does onboarding stop? | Does recovery render (V22.4, before fix)? | Does redirect occur? | Correct? |
|---|---|---|---|---|
| No session, `hereRoute==='login'` (self-skip) | Yes | N/A (not welcome.html) | No | Yes — correct for login.html. |
| No session, `hereRoute==='welcome'`, redirect **succeeds** | Yes (page unloads) | N/A — navigating away | Yes | Yes. |
| No session, `hereRoute==='welcome'`, redirect **blocked** by loop guard | Yes (silent `return`) | **No — this is the bug** | No | **No — fixed below.** |
| Authenticated, needs onboarding, not on an onboarding route | Yes if it navigates | N/A (different page) | Yes/blocked-with-continue (already handled correctly) | Yes. |
| Authenticated, on welcome.html/assessment.html | N/A — `return true` | — | No | Yes. |

Ran a standalone Node simulation (isolated from the DOM, reproducing only the control-flow in question) confirming: the pre-fix `wrldRunWelcomeEntry()` logic renders **nothing** when `requireAuth()` returns `false` without navigating; the post-fix logic renders **recovery** in the same scenario. Output:

```
OLD behavior -> rendered: null
NEW behavior -> rendered: recovery
```

## 9. Cache versions / browser caching

`supabase-client.js` (`?v=22.3`), `auth.js` (`?v=22.2`), `app.js` (`?v=22.1`), and `orbit.js` (`?v=22`) are referenced with an **identical** version query string across all 31 HTML pages in the repository — verified by grepping every `<script src="...">` occurrence. `supabase-config.js` is the one inconsistency: `login.html` and `signup.html` load it as `supabase-config.js?v=2`, while all 28 other pages (including `welcome.html`) load it unversioned. This is a real inconsistency, but it is **not** the root cause of the reported bug: the file's contents are identical regardless of query string, a version-string mismatch cannot cause two different pages to disagree about the URL/key it contains, and — most importantly — it cannot explain the reported *new-user-vs-existing-user* split, since both groups' browsers request the exact same (cached-or-not) URL for `supabase-config.js`. Ruled out as a contributing cause. Per the brief's scope restrictions (no cleanup/refactoring, no unrelated files), this is documented here for awareness only and was **deliberately left unmodified** — it does not participate in the proven execution chain.

## 10. Dependency graph

```
signup.html ──(blocking: signUp() must resolve)──▶ session + profile cache
      │
      ▼ (blocking: full page navigation)
welcome.html load
      │
      ├─▶ window.wrldAuthReady  ── BLOCKING for wrldRunWelcomeEntry(),
      │                             but internally bounded (≤3 profile
      │                             attempts + bounded backoff) — never
      │                             the actual failure point.
      │
      ├─▶ requireAuth()  ── BLOCKING (must return true to proceed) ──
      │        └─▶ isAuthenticated() → wrldGetAuthState()  [BLOCKING,
      │             but always resolved by the time window.wrldAuthReady
      │             settles]
      │        └─▶ wrldSafeRedirect()  [ROOT CAUSE: its "did not
      │             navigate" outcome was silently treated as "handled"]
      │
      ├─▶ profileState check  ── BLOCKING (decides greeting vs recovery)
      │        — always settles; never the failure point.
      │
      ├─▶ pullLearnerStateFromSupabase() / pullVolunteerEntriesFromSupabase()
      │        — OPTIONAL / non-blocking (fire-and-forget as of the
      │          existing V22.4 fix). Correctly never blocks onboarding.
      │
      └─▶ 10-second watchdog  ── intended as the final, independent
               safety net, but was disarmed by the same silent-return
               path that produced no render (ROOT CAUSE).
```

Dependencies that **should never block onboarding** and, confirmed, do not in V22.4: the two background-sync calls. The one dependency that **does** block onboarding and was mishandled: the auth gate's redirect-outcome check.

## 11. Files and functions modified

Two files only, both already on the explicitly permitted list (`auth.js`, `welcome.html`). No schema, migrations, RLS, styling, layout, or unrelated page was touched.

### `auth.js` — `requireAuth()`, `no_session` branch

**Before:**
```js
const sanitizedNext = wrldSanitizeNextParam(rawNext);
const dest = 'login.html' + (sanitizedNext ? '?next=' + encodeURIComponent(sanitizedNext) : '');
wrldSafeRedirect(dest, 'no_session');
return false;
```

**After:**
```js
const sanitizedNext = wrldSanitizeNextParam(rawNext);
const dest = 'login.html' + (sanitizedNext ? '?next=' + encodeURIComponent(sanitizedNext) : '');
const navigated = wrldSafeRedirect(dest, 'no_session');
if(!navigated){
  wrldLogDiag && wrldLogDiag('redirect_blocked_no_fallback', { reason:'no_session', from: hereRoute });
}
return false;
```

This does **not** change `requireAuth()`'s return value in any case (still always `false` here) — zero behavior change for any of the other 20+ pages calling `requireAuth()`. It only makes the previously-discarded outcome observable (via the existing `wrldLogDiag` diagnostic pattern already used throughout this file), which the `welcome.html` fix below relies on conceptually (and which makes any future regression of this kind visible in the browser console immediately, per this codebase's existing diagnostic-logging convention).

### `welcome.html` — `wrldRunWelcomeEntry()`

**Before:**
```js
async function wrldRunWelcomeEntry(){
  if(!requireAuth()) return;

  const profileState = ...
```

**After:**
```js
async function wrldRunWelcomeEntry(){
  if(!requireAuth()){
    if(typeof isAuthenticated === 'function' && !isAuthenticated()){
      wrldRenderProfileRecovery();
    }
    return;
  }

  const profileState = ...
```

This is the actual user-facing fix: on `welcome.html` specifically, if `requireAuth()` denies access, the page now always shows the existing recovery UI (with its Retry and Return-to-Homepage controls, already built and already used for the profile-error case) instead of silently doing nothing. If a real navigation to `login.html` is genuinely in progress, this extra DOM write is harmless — the page unloads a moment later regardless. If no navigation was actually happening (the proven defect), the visitor now sees a working recovery screen instead of an infinite loading card, and — since `wrldRunWelcomeEntry()` still resolves normally either way — the outer IIFE's `wrldWelcomeInitDone = true; clearTimeout(watchdog);` is now happening *after* a real render, matching every other path in the file.

## 12. Validation performed

- `node --check` on `auth.js` and on `welcome.html`'s extracted inline `<script>` block: both parse with no syntax errors after the change.
- Full-repo diff against the original V22.4 extraction confirms **exactly two files changed**, no others.
- Standalone Node simulation of the exact control-flow defect (isolated from the DOM/network) confirms the pre-fix path renders nothing and the post-fix path renders the recovery UI, given the same `requireAuth() → false` input (§8).
- Re-walked §4's Promise table against the patched files: no new awaited Promise was introduced, and the existing bounded-retry/try-catch guarantees are unchanged.
- Confirmed via the live Supabase project (`hnmpcjdlhuhetgkzgdgl`, the exact project referenced in `supabase-config.js`) that email confirmation is off (`immediate_login_after_signup: true` on `/signup` in the auth logs) and that profile rows are being created and read successfully (200s on `/rest/v1/profiles`) — ruling out a database-side cause and confirming the defect is purely in the client-side control flow described above.

### Outstanding invariant check (master-prompt requirement)

- ✅ Every awaited Promise in the onboarding chain terminates (§4 — unchanged by this fix, already true in V22.4).
- ✅ Every execution path through `wrldRunWelcomeEntry()` now renders either onboarding (`wrldRenderWelcomeGreeting`) or recovery (`wrldRenderProfileRecovery`) — the one path that previously rendered neither is closed.

No other file was inspected as a candidate root cause and rejected without evidence: `supabase-client.js`'s profile/session pipeline, `app.js`'s `initPage()`/background sync, and `orbit.js` were all read in full and confirmed not to contain a hang or silent-exit in this chain (see §4, §7, §10).
