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

/* Normalizes {session, profile} into the same shape auth.js's old
   localStorage user objects had, so every existing `user.name`,
   `user.role`, `user.id` call site across the app keeps working as-is. */
function wrldBuildUserFromCache(){
  if(!_wrldSessionCache || !_wrldProfileCache) return null;
  const p = _wrldProfileCache;
  return {
    id: p.id,
    name: p.name,
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

async function wrldFetchProfile(userId){
  const { data, error } = await sbClient.from('profiles').select('*').eq('id', userId).single();
  if(error){ console.warn('WRLD: could not load profile', error.message); return null; }
  return data;
}

async function wrldRefreshSessionCache(session){
  _wrldSessionCache = session || null;
  _wrldProfileCache = session ? await wrldFetchProfile(session.user.id) : null;
  // Pull this account's learner progress down from Supabase right after
  // the session/profile resolve, so every page that awaits
  // window.wrldAuthReady automatically gets synced progress with no
  // extra per-page wiring. pullLearnerStateFromSupabase() lives in
  // app.js, which has already finished loading (as a plain <script> tag,
  // synchronously, before this promise callback can ever run) by the
  // time this executes — see app.js's setState()/pullLearnerStateFromSupabase()
  // comment for the full read/write-through design.
  if(session && typeof pullLearnerStateFromSupabase === 'function'){
    await pullLearnerStateFromSupabase();
  }
  if(session && typeof pullVolunteerEntriesFromSupabase === 'function'){
    await pullVolunteerEntriesFromSupabase();
  }
}

// Kicks off immediately when this script loads (before DOMContentLoaded on
// every page) — getSession() reads the persisted session from local
// storage first and only hits the network if the token needs refreshing,
// so this resolves fast enough in the common case to avoid any visible
// "logged out, then logged in" flash once initPage() awaits it.
window.wrldAuthReady = sbClient.auth.getSession().then(({ data }) => wrldRefreshSessionCache(data.session));

sbClient.auth.onAuthStateChange((_event, session) => {
  window.wrldAuthReady = wrldRefreshSessionCache(session);
});
