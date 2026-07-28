# WRLD Website V20.3 — Changelog

Final, narrowly-scoped repair of the Volunteer Tracker login prompt. One file changed. No database changes, no Edge Function changes — this was a client-side bug, not a backend one.

---

## The exact root cause

`volunteer-tracker.html` never loaded the Supabase SDK, `supabase-config.js`, or `supabase-client.js`. Its `<script>` list was:

```
data.js → orbit-knowledge.js → auth.js → app.js → orbit.js
```

Every other authenticated page in the project (`account-settings.html`, `mentor-studio.html`, `owner-dashboard.html`, `dashboard.html`, and 20+ others) loads:

```
supabase-js (CDN) → supabase-config.js → supabase-client.js → data.js → orbit-knowledge.js → auth.js → app.js → orbit.js
```

`supabase-client.js` is where the shared `sbClient` instance is created and where `window.wrldAuthReady` — the promise every gated page awaits before checking auth — is actually assigned. Without that file ever loading on this page:

- `window.wrldAuthReady` was `undefined`. The V20.1 fix added `await window.wrldAuthReady` to this page, which looked correct and matched the pattern used everywhere else — but awaiting `undefined` resolves immediately, waiting for nothing. It never actually restored a session; it just didn't crash, so the bug read as "still happening after the V20.1 fix" rather than "the fix never engaged."
- `wrldBuildUserFromCache()` — the function `getCurrentUser()` calls to build a user object from the resolved session + profile — is also defined in `supabase-client.js`, so it didn't exist either. `getCurrentUser()` has a `typeof wrldBuildUserFromCache === 'function'` guard specifically for cases where it isn't loaded yet, and that guard silently returned `null`.
- `null` from `getCurrentUser()` means `isAuthenticated()` is `false`, which means `requireAuth()` **always** redirects to `login.html?next=volunteer-tracker.html`, unconditionally, for every user, every time — not a race condition or a timing issue, a deterministic, guaranteed failure, because the mechanism `requireAuth()` depends on was structurally absent from the page it was running on.

This also explains "successful login followed by another login prompt": logging in redirects back to `volunteer-tracker.html` (via the already-correct `next=` parameter), which immediately re-runs the exact same broken check and fails the exact same way — reproducing identically on every attempt, which is what made it look like a loop rather than a one-time misconfiguration.

## The fix

Added the three missing script tags, in the same order every other authenticated page already uses:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="supabase-config.js"></script>
<script src="supabase-client.js"></script>
<script src="data.js"></script>
...
```

That's the entire functional fix. No other logic needed to change, because the shared architecture these three files provide already correctly implements everything the required behavior calls for:

- **Loading → authenticated → unauthenticated, correctly ordered:** `window.wrldAuthReady` (in `supabase-client.js`) resolves only after `sbClient.auth.getSession()` completes AND the matching `public.profiles` row has been fetched (`wrldRefreshSessionCache()` awaits both). `getCurrentUser()` never returns a user built from a half-loaded state — it's either the fully-resolved user or `null`. A signed-in user whose profile is still loading is naturally covered by the same await; there's no separate "profile still loading" state to mishandle, because the promise doesn't resolve until both pieces are ready.
- **Volunteer data loads automatically:** `wrldRefreshSessionCache()` also calls `pullVolunteerEntriesFromSupabase()` (in `app.js`) as soon as the session/profile resolve — so by the time this page's own script continues past `await window.wrldAuthReady`, the account's real volunteer entries are already pulled into local cache. `getVolunteerSummary()` (used to render the tracker) reads from that cache synchronously.
- **Safe redirect back after login:** already built in V20.1 — `requireAuth()` builds `next=volunteer-tracker.html`, and `login.html` validates it through `safeInternalNext()`'s allowlist (bare `filename.html` only, no scheme, no protocol-relative `//`) before using it as the post-login destination. Nothing here needed to change.
- **Single shared Supabase client:** this page now uses the exact same `sbClient` instance, same project URL/anon key (from `supabase-config.js`), same `persistSession`/`autoRefreshToken`/storage configuration as every other page — there was never a second, conflicting client; there was simply no client at all on this specific page before.

### New: a genuine session-verification error state

The spec asked for a distinct message when session verification itself fails (as opposed to "no session found"). `window.wrldAuthReady` as currently written doesn't reject in normal operation, but to handle it defensively — and to avoid ever silently misreporting a real error as "please log in" — the awaiting call was wrapped locally in a `try`/`catch`:

```js
try{
  await window.wrldAuthReady;
}catch(err){
  document.getElementById('vt-loading-text').textContent = 'WRLD could not verify your session. Please try again.';
  document.getElementById('vt-retry-btn').classList.remove('hidden');
  return;
}
if(requireAuth()){ ... }
```

This reuses the existing `#vt-loading` section (adding an id to its text and a `Try Again` button, both hidden unless this path is hit) rather than adding new markup elsewhere. This change is local to `volunteer-tracker.html` only — `supabase-client.js` itself was not modified, since changing its error-handling behavior would affect all 28+ pages that share it, which is outside this release's "fix only this issue" scope.

### Data-loading failure — handled already, by design

`pullVolunteerEntriesFromSupabase()` already fails gracefully: if the Supabase query errors, it logs a warning and returns without throwing, leaving whatever was already in local storage in place — it never blocks rendering and never redirects. This already satisfies "keep the user inside the tracker, don't redirect to login" for that failure mode. No new error banner was added for this specific case, since introducing one would mean changing the shared `pullVolunteerEntriesFromSupabase()` function's signature/behavior (used by other pull-on-load paths too), which is a broader change than this release's scope. This is called out here rather than silently left out.

---

## Before / after auth-check order

**Before (V20.1/V20.2):**
1. `data.js`, `orbit-knowledge.js`, `auth.js`, `app.js`, `orbit.js` load. `sbClient` and `window.wrldAuthReady` do not exist.
2. Inline script: `await window.wrldAuthReady` — resolves immediately (awaiting `undefined`).
3. `requireAuth()` → `isAuthenticated()` → `getCurrentUser()` → `wrldBuildUserFromCache` doesn't exist → returns `null` → not authenticated → redirect to `login.html?next=volunteer-tracker.html`, always.

**After (V20.3):**
1. Supabase SDK, `supabase-config.js`, `supabase-client.js` load first. `sbClient` is created; `sbClient.auth.getSession()` kicks off immediately, reading the persisted session from storage.
2. `data.js`, `orbit-knowledge.js`, `auth.js`, `app.js`, `orbit.js` load.
3. Inline script: `try { await window.wrldAuthReady } catch { show verification-error state; return; }` — this is now a real promise that resolves once session + profile (and volunteer entries) have actually loaded.
4. `requireAuth()` → `getCurrentUser()` → `wrldBuildUserFromCache()` returns the real user if a session exists, `null` if it genuinely doesn't.
   - Authenticated → tracker shows immediately, no redirect, correct data already loaded.
   - Not authenticated → redirected to `login.html?next=volunteer-tracker.html` exactly once; login validates and returns here.

---

## Files changed

- `volunteer-tracker.html` — only file changed.

## Backend

**No migration and no Edge Function were needed or created.** This was a client-side script-loading omission, not a database or backend logic issue — nothing in the Supabase schema, RLS policies, or Edge Functions was responsible for or touched by this fix.

## Everything else

Every other file in the project — every dashboard, every playbook, Community Commons, Orbit, Orbit AI, Account Settings, Authentication, navigation, mobile layout, desktop layout — is byte-for-byte identical to V20.2. Verified with a full recursive diff between the V20.2 and V20.3 project directories: `volunteer-tracker.html` is the only file that differs.
