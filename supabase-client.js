/* =====================================================================
   WRLD — Supabase client bootstrap (supabase-client.js)

   Loaded right after the Supabase JS SDK (CDN) and supabase-config.js,
   and before auth.js. Two jobs:

   1. Create the one shared `sbClient` instance every other script uses
      for queries (learner_state sync, volunteer log, community, etc.).

   2. Bridge Supabase Auth's async session API to the rest of WRLD's
      codebase, which was built around a SYNCHRONOUS getCurrentUser() call
      (localStorage reads are instant; network calls aren't). Rather than
      rewrite every caller across 28 pages to be async, we resolve the
      session + profile ONCE, early, cache it in memory, and expose
      `window.wrldAuthReady` — a promise `initPage()` awaits before it
      renders the header — so by the time anything reads getCurrentUser()
      the cache is already correct. `onAuthStateChange` keeps that cache
      fresh afterwards (token refresh, sign-out in another tab, etc.)
      without any page needing to poll or re-check.
   ===================================================================== */

/* "Remember Me" storage adapter — login.html sets wrld_remember_me to '0'
   right before signing in when the box is unchecked, so the session token
   is written to sessionStorage (cleared when the browser/tab closes)
   instead of localStorage (survives restarts). Default is remembered —
   matches "users should remain logged in across browser sessions unless
   they explicitly sign out." Every other page just uses whichever
   storage already holds a session; nothing else needs to know about it. */
const wrldAuthStorage = {
  getItem: (key) => {
    const remember = localStorage.getItem('wrld_remember_me') !== '0';
    return (remember ? localStorage : sessionStorage).getItem(key);
  },
  setItem: (key, value) => {
    const remember = localStorage.getItem('wrld_remember_me') !== '0';
    (remember ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

/* ---------------------------------------------------------------------
   ENVIRONMENT-AWARE PRODUCTION URLS (V14)
   Every Supabase Auth email (signup confirmation, resend, password
   reset, email change) needs a redirect URL. Building that from a raw
   request value (location.origin/location.host) unconditionally is not
   safe for production auth links — the value could reflect a spoofed
   Host header, a preview/staging domain not in Supabase's allow-list, or
   (the actual bug this fixes) simply be "localhost" if a real user's
   browser somehow reaches a stale bookmark or a link opened from a dev
   build. WRLD_PRODUCTION_URL is a fixed constant, not a request value —
   used for every non-local hostname. Only an actual localhost/127.0.0.1
   hostname (real local development) falls back to location.origin, so
   `npm`-less static-file local testing still works. See
   SUPABASE-REDIRECT-SETUP.md for the matching Supabase Dashboard
   configuration this depends on (Site URL + Additional Redirect URLs). */
const WRLD_PRODUCTION_URL = 'https://ourwrld.org';
function wrldIsLocalEnv(){
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}
function wrldSiteUrl(){
  return wrldIsLocalEnv() ? location.origin : WRLD_PRODUCTION_URL;
}

const sbClient = supabase.createClient(WRLD_SUPABASE_URL, WRLD_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,      // "Remember Me" — session survives browser close
    autoRefreshToken: true,    // automatic session refresh, never silently expires mid-visit
    detectSessionInUrl: true,  // required for email confirmation / password-reset links
    storage: wrldAuthStorage,
  },
});

let _wrldSessionCache = null;  // Supabase Session object, or null if signed out
let _wrldProfileCache = null;  // matching row from public.profiles, or null

/* ---------------------------------------------------------------------
   V20.6.3 — AUTH STATE / PROFILE STATE SEPARATION
   Root cause of the live "JWT issued in future" → wrongly-redirected-to-
   login bug: wrldBuildUserFromCache() (below) has always required BOTH
   _wrldSessionCache AND _wrldProfileCache to be non-null before it will
   hand back a user object, and auth.js's isAuthenticated()/requireAuth()
   used to treat "getCurrentUser() returned null" as the ONE and ONLY
   signal for "this visitor is logged out." That conflates two genuinely
   different situations: (1) there really is no Supabase session, and (2)
   there IS a real, valid session, but the one profiles-table read that
   fills _wrldProfileCache happened to fail — which is exactly what a
   freshly-issued access token can do for a few hundred milliseconds
   immediately after signUp()/signInWithPassword() resolve, if this
   browser's clock (or simple request timing) puts the token's `iat`
   at or fractionally ahead of the moment PostgREST validates it,
   producing a 401 "JWT issued in future." Reproducing on a Windows
   laptop, a MacBook, AND an iPhone (per the reported bug) rules out one
   misconfigured device clock — this is a timing race between "a session
   object exists in memory" and "the very first authenticated request
   using that session's token is accepted," not a per-device clock skew
   bug the user could fix themselves.

   Two independent, explicit state machines now exist so a profile
   failure can never again be misread as "logged out":
     _wrldAuthState:    'loading' | 'authenticated' | 'unauthenticated'
                        — reflects ONLY whether Supabase confirms a
                        session exists. Never set based on whether the
                        profile fetch succeeded.
     _wrldProfileState: 'not_requested' | 'loading' | 'loaded' |
                        'not_found' | 'temporary_error' | 'permanent_error'
                        — reflects ONLY the outcome of the profiles-table
                        read for the current session's user id.
   auth.js's isAuthenticated()/requireAuth() now read _wrldAuthState (via
   wrldGetAuthState()) to decide "redirect to login," never
   _wrldProfileCache/getCurrentUser(). See CHANGES-V20.6.3.md for the
   full root-cause trace and the bounded retry strategy below.
   --------------------------------------------------------------------- */
let _wrldAuthState = 'loading';
let _wrldProfileState = 'not_requested';
function wrldGetAuthState(){ return _wrldAuthState; }
function wrldGetProfileState(){ return _wrldProfileState; }
function wrldGetSession(){ return _wrldSessionCache; }

// Dev-safe diagnostic logging (V20.6.3) — never logs a token, password, or
// full profile row; only a redacted last-6-characters id suffix, event
// names, attempt counters, and response status/error text. Left enabled
// (console.debug is inert in production unless a developer has verbose
// logging switched on) specifically so this exact class of bug — a live,
// intermittent, multi-device auth timing race — can be diagnosed from a
// real user's browser console if it ever recurs, per this release's
// "Required Logging for Diagnosis" spec.
function wrldSafeIdSuffix(id){
  if(!id || typeof id !== 'string') return null;
  return id.slice(-6);
}
function wrldLogDiag(event, details){
  try{ console.debug('[WRLD auth-diag]', event, details || {}); }catch(e){}
}

/* Bounded retry strategy for a profile fetch that fails with a plausibly
   TEMPORARY error (JWT timing, a profile row that hasn't landed yet
   immediately after signup, or a transient network failure) — never for
   every error, and never without a limit (no retry storm). See
   CHANGES-V20.6.3.md's "Retry Rules" section. */
const WRLD_PROFILE_MAX_ATTEMPTS = 3;
const WRLD_PROFILE_MAX_FORCED_REFRESH = 1;
const WRLD_PROFILE_RETRY_BASE_DELAY_MS = 550;

function wrldSleep(ms){ return new Promise((resolve) => setTimeout(resolve, ms)); }

/* Classifies a profiles-table read error as plausibly temporary (worth a
   bounded retry) vs. something else entirely (e.g. an RLS permission
   error unrelated to timing) that retrying can never fix. `PGRST116`
   ("no rows") is handled as its own `not_found` case by the caller, not
   here, since a missing row immediately after signup is a normal,
   expected race with the profile-creation trigger, not exactly the same
   thing as a fetch that errored out. */
function wrldIsTemporaryProfileError(error){
  if(!error) return false;
  const msg = (error.message || '').toLowerCase();
  const status = error.status || error.code;
  if(/jwt issued in future/.test(msg)) return true;
  if(/jwt/.test(msg) && /(future|not.{0,5}yet.{0,5}valid|nbf)/.test(msg)) return true;
  if(status === 401) return true; // a 401 immediately after a fresh sign-in/signup is exactly the transient window this release fixes — bounded retries below make retrying it safe even though a 401 can, in other contexts, mean something permanent.
  if(/failed to fetch|networkerror|load failed|network request failed/.test(msg)) return true;
  if(status === 0) return true;
  return false;
}

/* Normalizes {session, profile} into the same shape auth.js's old
   localStorage user objects had, so every existing `user.name`,
   `user.role`, `user.id` call site across the app keeps working as-is. */
function wrldBuildUserFromCache(){
  if(!_wrldSessionCache || !_wrldProfileCache) return null;
  const p = _wrldProfileCache;
  return {
    id: p.id,
    name: p.name,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    role: p.role,
    avatarUrl: p.avatar_url,
    settings: p.settings || {},
    notificationPrefs: p.notification_prefs || {},
    createdAt: p.created_at,
    lastLoginAt: p.last_login_at,
    loginCount: p.login_count,
    warnings: p.warnings,
    violations: p.violations,
    suspended: p.suspended,
    deactivated: p.deactivated,
    banned: p.banned,
    emailVerified: !!p.email_verified,
  };
}

async function wrldFetchProfileOnce(userId){
  const { data, error } = await sbClient.from('profiles').select('*').eq('id', userId).single();
  return { data: data || null, error: error || null };
}

// De-dupes concurrent profile fetches for the SAME user id. Root-cause
// audit finding: on signup.html, sbClient.auth.signUp() itself fires a
// SIGNED_IN event through the onAuthStateChange listener below AT THE
// SAME TIME auth.js's signUp() also explicitly awaits
// wrldRefreshSessionCache(data.session) — two independent call sites,
// same brand-new session, both wanting this account's profile at once.
// Without this, that's two concurrent profiles reads (and, since the
// same JWT-timing race can hit either one, two independent retry loops)
// for the exact same account. Sharing one in-flight promise per user id
// means both callers get the same, single, correctly-retried result.
let _wrldInFlightProfileFetch = null; // { userId, promise } | null

async function wrldFetchProfileWithRetry(session){
  const userId = session.user.id;

  if(_wrldInFlightProfileFetch && _wrldInFlightProfileFetch.userId === userId){
    wrldLogDiag('profile_fetch_deduped', { userIdSuffix: wrldSafeIdSuffix(userId) });
    return _wrldInFlightProfileFetch.promise;
  }

  const promise = (async () => {
    let refreshesUsed = 0;
    for(let attempt = 1; attempt <= WRLD_PROFILE_MAX_ATTEMPTS; attempt++){
      // Session ownership check (required by this release's audit) —
      // never fetch/accept a profile for anyone other than the account
      // this exact session belongs to, and never proceed with a session
      // that has, mid-retry, stopped matching who we started this call
      // for (e.g. a same-browser account switch firing SIGNED_OUT then a
      // new SIGNED_IN while a retry loop from the previous account was
      // still in flight).
      const liveSession = _wrldSessionCache;
      if(!liveSession || liveSession.user.id !== userId){
        wrldLogDiag('profile_fetch_aborted_session_changed', { expected: wrldSafeIdSuffix(userId), current: wrldSafeIdSuffix(liveSession && liveSession.user && liveSession.user.id) });
        _wrldProfileState = 'not_requested';
        return null;
      }

      _wrldProfileState = 'loading';
      wrldLogDiag('profile_attempt', { attempt, userIdSuffix: wrldSafeIdSuffix(userId) });
      const { data, error } = await wrldFetchProfileOnce(userId);

      if(data && !error){
        if(data.id !== userId){
          // Structurally shouldn't happen (query is filtered by id), but
          // the audit explicitly calls for verifying ownership rather
          // than assuming it — refuse a mismatched row outright.
          wrldLogDiag('profile_ownership_mismatch', { expected: wrldSafeIdSuffix(userId), got: wrldSafeIdSuffix(data.id) });
          _wrldProfileState = 'permanent_error';
          return null;
        }
        _wrldProfileState = 'loaded';
        wrldLogDiag('profile_result', { attempt, status: 'ok' });
        return data;
      }

      const status = error && (error.status || error.code);
      wrldLogDiag('profile_result', { attempt, status: status || 'error', message: error && error.message });

      if(error && (error.code === 'PGRST116' || /0 rows|no rows/i.test(error.message || ''))){
        // No profiles row yet — either the signup trigger that creates it
        // hasn't committed/replicated yet, or (far less likely) it will
        // never exist. Bounded retry covers the normal "hasn't landed
        // yet" case; if it still isn't there after WRLD_PROFILE_MAX_ATTEMPTS,
        // that's reported as not_found, not silently retried forever.
        _wrldProfileState = 'not_found';
      } else if(wrldIsTemporaryProfileError(error)){
        _wrldProfileState = 'temporary_error';
      } else {
        _wrldProfileState = 'permanent_error';
        break; // not a plausibly-temporary error — retrying can't help.
      }

      if(attempt >= WRLD_PROFILE_MAX_ATTEMPTS) break;

      await wrldSleep(WRLD_PROFILE_RETRY_BASE_DELAY_MS * attempt);

      // Re-confirm (and, once, forcibly refresh) the session before
      // retrying — a stale or about-to-expire access token is exactly
      // the kind of thing a JWT-timing 401 can be caused by, and this is
      // the one bounded chance to correct it (WRLD_PROFILE_MAX_FORCED_REFRESH
      // = 1 — never an unbounded refresh loop).
      if(refreshesUsed < WRLD_PROFILE_MAX_FORCED_REFRESH){
        refreshesUsed++;
        try{
          const { data: refreshed, error: refreshError } = await sbClient.auth.refreshSession();
          wrldLogDiag('session_refresh_attempt', { ok: !refreshError });
          if(!refreshError && refreshed && refreshed.session){
            _wrldSessionCache = refreshed.session;
            if(refreshed.session.user.id !== userId){
              wrldLogDiag('session_ownership_mismatch_after_refresh', {});
              _wrldProfileState = 'permanent_error';
              return null;
            }
          }
        }catch(e){ wrldLogDiag('session_refresh_threw', { message: e && e.message }); }
      } else {
        try{ const { data: current } = await sbClient.auth.getSession(); if(current && current.session) _wrldSessionCache = current.session; }catch(e){}
      }
    }
    // Retry budget exhausted without success. `not_found` is left as its
    // own distinct, honest state (the profiles row genuinely never
    // showed up within the bounded window); a `temporary_error` that
    // never resolved, by definition, is no longer "temporary" from this
    // call's point of view — it's escalated to `permanent_error` so the
    // calling page (welcome.html) knows to stop silently waiting and
    // show its own recoverable Retry state instead. Never redirects to
    // login on its own — that decision is never made here.
    if(_wrldProfileState === 'temporary_error') _wrldProfileState = 'permanent_error';
    wrldLogDiag('profile_retry_exhausted', { finalState: _wrldProfileState });
    return null;
  })();

  _wrldInFlightProfileFetch = { userId, promise };
  try{
    return await promise;
  } finally {
    if(_wrldInFlightProfileFetch && _wrldInFlightProfileFetch.promise === promise){
      _wrldInFlightProfileFetch = null;
    }
  }
}

// Monotonic generation counter — guards against a slower, OLDER
// wrldRefreshSessionCache() call (e.g. one still working through its
// bounded profile retries) overwriting the cache with stale results
// after a NEWER call (a subsequent auth event) has already resolved.
// Part of this release's "must not let a stale session captured before
// signup clobber a newer one" audit requirement.
let _wrldSessionRefreshGen = 0;

async function wrldRefreshSessionCache(session){
  const gen = ++_wrldSessionRefreshGen;
  const previousUserId = _wrldSessionCache && _wrldSessionCache.user ? _wrldSessionCache.user.id : null;

  _wrldSessionCache = session || null;
  _wrldAuthState = session ? 'authenticated' : 'unauthenticated';
  wrldLogDiag('auth_state_change', { authState: _wrldAuthState, userIdSuffix: wrldSafeIdSuffix(session && session.user && session.user.id) });

  if(!session){
    _wrldProfileCache = null;
    _wrldProfileState = 'not_requested';
    if(gen === _wrldSessionRefreshGen && typeof wrldSetActiveStateOwner === 'function'){
      wrldSetActiveStateOwner(null);
    }
    return;
  }

  // A different account just became active in this browser (same-tab
  // account switch) — drop any previous account's cached profile
  // immediately rather than letting it linger as "the current profile"
  // for even one extra render while the new account's own fetch is in
  // flight.
  if(previousUserId && previousUserId !== session.user.id){
    _wrldProfileCache = null;
    _wrldProfileState = 'not_requested';
  }

  const profile = await wrldFetchProfileWithRetry(session);

  if(gen !== _wrldSessionRefreshGen){
    // A newer auth event (another onAuthStateChange firing, or another
    // explicit caller) has already superseded this call while it was
    // retrying — discard these results instead of clobbering whatever
    // the newer call already resolved. See the generation-counter
    // comment above.
    wrldLogDiag('stale_refresh_discarded', { gen, current: _wrldSessionRefreshGen });
    return;
  }

  _wrldProfileCache = profile;

  // V20.6.2 — the single authoritative moment this browser learns (or
  // re-confirms) which account, if any, is actually signed in. Stamps
  // the durable wrld_state_owner_v2 pointer app.js's getState()/setState()/
  // getVolunteerEntries()/etc. read to pick the correct namespaced
  // localStorage bucket — including on a page that reads progress before
  // ITS OWN window.wrldAuthReady has resolved, since the pointer already
  // reflects the last confirmed sign-in from this or an earlier page.
  // Explicitly set to '' (guest) on sign-out, never left stale. See
  // app.js's LOCAL STATE section and CHANGES-V20.6.2.md for the full
  // design.
  //
  // V20.6.3 fix: this used to pass `_wrldProfileCache ? _wrldProfileCache.id
  // : null` — meaning a temporarily-failed profile fetch (this release's
  // whole bug) stamped the pointer to '' (guest) even though a real,
  // confirmed session existed the entire time. That's a second symptom
  // of the same root cause: a page reading progress during the failure
  // window would briefly read the GUEST bucket instead of this account's
  // own. The session's own user id is already the authoritative account
  // id (public.profiles.id === auth.users.id by design — see
  // supabase/migrations/001) regardless of whether the profile ROW has
  // loaded yet, so that id is used directly here.
  if(typeof wrldSetActiveStateOwner === 'function'){
    wrldSetActiveStateOwner(session.user.id);
  }
  // Pull this account's learner progress down from Supabase right after
  // the session/profile resolve, so every page that awaits
  // window.wrldAuthReady automatically gets synced progress with no
  // extra per-page wiring. pullLearnerStateFromSupabase() lives in
  // app.js, which has already finished loading (as a plain <script> tag,
  // synchronously, before this promise callback can ever run) by the
  // time this executes — see app.js's setState()/pullLearnerStateFromSupabase()
  // comment for the full read/write-through design.
  // V22.1 — ROOT CAUSE FIX for the "onboarding never finishes loading"
  // bug: this call, and the volunteer-entries pull right after it, used
  // to run with no try/catch. A brand-new account's FIRST sync ever
  // takes the "no server row yet — push local state up" branch inside
  // pullLearnerStateFromSupabase()/pullVolunteerEntriesFromSupabase(),
  // which makes an additional Supabase write these two functions don't
  // make on any later, returning-user sync. If that write (or the read
  // before it) ever throws — a timing hiccup on a row created moments
  // ago by the signup trigger, a transient network error, anything —
  // the exception used to propagate straight out of this function and
  // reject the wrldRefreshSessionCache() promise itself, i.e. reject
  // window.wrldAuthReady. Every page's initPage() (app.js) awaits that
  // promise with no catch, and welcome.html's own onboarding entry does
  // too — so a single failed background sync could silently stop
  // EVERYTHING on the page (header, footer, Orbit, and on welcome.html
  // specifically, the entire onboarding UI) from ever finishing its
  // first render, with no error shown to the visitor. Session and
  // profile are already fully, correctly resolved by the time this
  // runs regardless of whether this best-effort sync succeeds, so a
  // failure here must never again be able to affect anyone else
  // awaiting this promise. This is the ONLY change in this function —
  // the auth/profile resolution above it is untouched.
  try{
    if(typeof pullLearnerStateFromSupabase === 'function'){
      await pullLearnerStateFromSupabase();
    }
  }catch(e){ wrldLogDiag('pull_learner_state_threw', { message: e && e.message }); }
  try{
    if(typeof pullVolunteerEntriesFromSupabase === 'function'){
      await pullVolunteerEntriesFromSupabase();
    }
  }catch(e){ wrldLogDiag('pull_volunteer_entries_threw', { message: e && e.message }); }
}

// Kicks off immediately when this script loads (before DOMContentLoaded on
// every page) — getSession() reads the persisted session from local
// storage first and only hits the network if the token needs refreshing,
// so this resolves fast enough in the common case to avoid any visible
// "logged out, then logged in" flash once initPage() awaits it.
window.wrldAuthReady = sbClient.auth.getSession().then(({ data }) => wrldRefreshSessionCache(data.session));

/* V20.6 — defensive re-render on a LATE auth-state resolution.
   supabase-js can fire onAuthStateChange more than once around page load
   (an initial-session event, then a token refresh, etc.), and on a slow
   connection or a browser with unusual storage-restore timing (the
   "Safari session restoration" case called out in this release's audit)
   a later event can resolve its cache update AFTER initPage() already
   awaited an earlier window.wrldAuthReady and rendered the header once.
   Without this, that first render — possibly a stale/incomplete one —
   would be the only one the page ever shows, on any page, for the rest
   of that page view. app.js's initPage() now records the activeKey it
   last rendered with (window.__wrldLastNavKey) specifically so this can
   safely re-render the exact same header again with the corrected/now-
   current session state. A no-op on the very first resolution (nothing
   has rendered yet, so __wrldLastNavKey is still undefined) and cheap on
   every later one — renderHeader() only rewrites the #site-header DOM. */
sbClient.auth.onAuthStateChange((_event, session) => {
  // V20.6.3 — logged per this release's "Required Logging for Diagnosis"
  // spec: event name + whether a session came with it + a redacted user
  // id suffix, nothing more. This listener itself still never redirects
  // and never signs anyone out on its own — it only refreshes the cache
  // (through the same ownership-checked, bounded-retry path every other
  // caller uses) and re-renders the header. Audited for this release:
  // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, and
  // SIGNED_OUT all funnel through this one call with no special-casing,
  // so none of them can independently trigger a "returning user" route or
  // a login redirect — that decision is made exactly once, by
  // requireAuth() (auth.js), and only from a definitively confirmed
  // absence of a session.
  wrldLogDiag('auth_event', { event: _event, hasSession: !!session, userIdSuffix: wrldSafeIdSuffix(session && session.user && session.user.id) });
  window.wrldAuthReady = wrldRefreshSessionCache(session).then(() => {
    if(typeof window.__wrldLastNavKey !== 'undefined' && typeof renderHeader === 'function'){
      renderHeader(window.__wrldLastNavKey);
    }
  });
});
