/* =====================================================================
   WRLD — Authentication & Role-Based Access Control (auth.js)

   ARCHITECTURE NOTE (V13 — production Supabase backend)
   This file used to keep accounts in localStorage. As of this revision,
   Supabase Auth + the `public.profiles` table (see supabase/migrations/)
   are the real, permanent source of truth — accounts, passwords, and
   sessions now survive a cleared cache and sync across every device.

   Every function below kept its EXACT original name and call signature
   (signUp, logIn, logOut, getCurrentUser, hasPermission, roleAtLeast,
   requireAuth, suspendUser, promoteUserRole, etc.) — this was always the
   point of the "shaped like a real API client" comment that used to live
   here: swapping the INSIDE of these functions for real network calls
   was meant to be a drop-in change for every page that calls them. It
   was, with one structural nuance:

   getCurrentUser() must stay SYNCHRONOUS (dozens of call sites across the
   app read it directly, mid-render, with no `await`), but real session
   lookups are inherently async. supabase-client.js bridges this: it
   resolves the session + profile ONCE, early, into an in-memory cache,
   and exposes `window.wrldAuthReady` — a promise `initPage()` (app.js)
   and every route-guarded page's inline script await BEFORE calling
   getCurrentUser()/requireAuth()/etc. By the time any of the functions
   below run, that cache is already correct. See supabase-client.js's
   top comment for the full explanation.

   NO-VERIFICATION SIGNUP FLOW (V15.1)
   New accounts no longer require opening a confirmation email before
   they can use WRLD. This required ONE change outside this codebase:
   in the Supabase dashboard, under Authentication → Providers → Email,
   the "Confirm email" toggle must be switched OFF for this project. That
   setting lives entirely server-side (there is no client-side/API way to
   disable it, and there shouldn't be — this file never touches it). With
   it off, `sbClient.auth.signUp()` returns an active session immediately
   instead of requiring the user to click an emailed link first. See
   signUp() below for how that session is handled (signed back out, not
   used to auto-log the user in) and signup.html/login.html for the
   resulting UX: create account → success message → login screen → user
   signs in with the credentials they just chose. Password-reset emails
   and every other Supabase Auth email are unaffected by this toggle.
   ===================================================================== */

/* ---------------------------------------------------------------------
   ROLES + PERMISSIONS — unchanged from the localStorage era. These are
   pure data/pure functions; nothing here talks to storage at all, so
   nothing needed to change. `admin` (not `administrator`) matches the
   Postgres enum in supabase/migrations/001_roles_and_profiles.sql and
   the existing `.role-pill.role-admin` CSS.
   --------------------------------------------------------------------- */
const ROLES = { EXPLORER: 'explorer', MENTOR: 'mentor', ADMIN: 'admin', OWNER: 'owner' };
const ROLE_HIERARCHY = [ROLES.EXPLORER, ROLES.MENTOR, ROLES.ADMIN, ROLES.OWNER];

const ROLE_LABELS = {
  [ROLES.EXPLORER]: 'Explorer',
  [ROLES.MENTOR]: 'Mentor',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.OWNER]: 'Owner',
};

// Shared "where does this role land after auth" map — used by login.html
// and email-verified.html so the two never drift apart. WRLD's real
// account roles are Explorer/Mentor/Administrator/Owner only ("Volunteer"
// is a feature within the Explorer experience, not a separate role, so
// it isn't a distinct destination here — this stays honest rather than
// inventing a role WRLD doesn't have).
const ROLE_DESTINATIONS = {
  [ROLES.EXPLORER]: 'dashboard.html',
  [ROLES.MENTOR]: 'mentor-studio.html',
  [ROLES.ADMIN]: 'administrator-dashboard.html',
  [ROLES.OWNER]: 'owner-dashboard.html',
};

const EXPLORER_PERMISSIONS = [
  'complete_playbooks','save_progress','earn_certificates','build_avatar',
  'register_sessions','track_volunteer_hours','save_favorites',
  'view_dashboard','interact_orbit',
];
const MENTOR_PERMISSIONS = [
  'host_workshops','schedule_sessions','publish_events',
  'upload_resources','mentor_learners','manage_own_sessions',
];
const ADMIN_PERMISSIONS = [
  'manage_users','approve_mentors','manage_events','manage_volunteer_opportunities',
  'publish_resources','feature_content','moderate_platform','access_analytics','edit_content',
];
// Owner-only — Administrators never get these, no matter what.
const OWNER_PERMISSIONS = [
  'manage_administrators','transfer_ownership','access_security',
  'manage_organization','delete_organization',
];

const ROLE_PERMISSIONS = {
  [ROLES.EXPLORER]: [...EXPLORER_PERMISSIONS],
  [ROLES.MENTOR]:   [...EXPLORER_PERMISSIONS, ...MENTOR_PERMISSIONS],
  [ROLES.ADMIN]:    [...EXPLORER_PERMISSIONS, ...MENTOR_PERMISSIONS, ...ADMIN_PERMISSIONS],
  [ROLES.OWNER]:    [...EXPLORER_PERMISSIONS, ...MENTOR_PERMISSIONS, ...ADMIN_PERMISSIONS, ...OWNER_PERMISSIONS],
};

function hasPermission(user, permission){
  if(!user || !user.role) return false;
  return (ROLE_PERMISSIONS[user.role] || []).includes(permission);
}

function roleAtLeast(user, role){
  if(!user || !user.role) return false;
  const userIdx = ROLE_HIERARCHY.indexOf(user.role);
  const roleIdx = ROLE_HIERARCHY.indexOf(role);
  return userIdx>=0 && roleIdx>=0 && userIdx>=roleIdx;
}

/* ---------------------------------------------------------------------
   CURRENT USER / SESSION
   getCurrentUser() reads the cache supabase-client.js keeps in sync —
   see that file's top comment. Every page that used to read this
   synchronously right after a plain <script> tag still can, as long as
   `await window.wrldAuthReady` has resolved first (initPage() in app.js
   does this for you; route-guarded pages await it explicitly before
   calling requireAuth()/requireRole()/requireMinRole()).
   --------------------------------------------------------------------- */
function getCurrentUser(){
  return typeof wrldBuildUserFromCache === 'function' ? wrldBuildUserFromCache() : null;
}

/* ---------------------------------------------------------------------
   V20.6.3 — isAuthenticated() no longer means "getCurrentUser() returned
   something." That used to conflate "no session" with "a session exists
   but the profiles-table read hasn't succeeded yet" — the exact live bug
   this release fixes (a fresh signup's first profile request failing
   with a 401 "JWT issued in future" was being read as "logged out" and
   bounced to login.html). isAuthenticated() now asks supabase-client.js's
   wrldGetAuthState() — set ONLY from Supabase's own session presence,
   never from whether the profile fetch succeeded — so a signed-in user
   whose profile is still loading (or temporarily failing to load) is
   still, correctly, "authenticated." See CHANGES-V20.6.3.md for the full
   root-cause trace. Falls back to the old getCurrentUser()-based check
   only if supabase-client.js somehow hasn't loaded (shouldn't happen on
   any page that includes the standard script set).
   --------------------------------------------------------------------- */
function isAuthenticated(){
  if(typeof wrldGetAuthState === 'function') return wrldGetAuthState() === 'authenticated';
  return !!getCurrentUser();
}

async function logOut(){
  await sbClient.auth.signOut();
  await wrldRefreshSessionCache(null);
}

/* ---------------------------------------------------------------------
   SIGN UP / LOG IN
   Both still return {ok:true, user} or {ok:false, error} — the exact
   same shape every calling page (signup.html, login.html) already
   expects and awaits.
   --------------------------------------------------------------------- */
/* V14: distinct, specific messages per failure mode (Master Prompt
   section 3) instead of one generic error for every unrelated cause.
   `email_rate_limit` specifically means the PROJECT-WIDE email sending
   limit was hit (Supabase's default email service caps this very low —
   see SUPABASE-SMTP-SETUP.md for the production fix), which is a
   different, more serious problem than a single user's own rate limit
   and gets its own message so it isn't mistaken for "you personally are
   trying too often." */
function friendlyAuthError(error){
  if(!error) return 'Something went wrong while creating your account. Please try again shortly.';
  const msg = error.message || String(error);
  const status = error.status || error.code;
  if(!navigator.onLine) return "We couldn't create your account right now. Please check your connection and try again.";
  if(/already registered|user already exists/i.test(msg)) return 'An account already exists with this email address. Try logging in or resetting your password.';
  if(/invalid login credentials/i.test(msg)) return 'Incorrect email or password — try again.';
  if(/email not confirmed/i.test(msg)) return 'Please confirm your email before logging in — check your inbox for the verification link.';
  if(/password should be at least|password.*too short|password.*minimum/i.test(msg)) return 'Password must be at least 8 characters.';
  if(/password.*(weak|common|breach|pwned)/i.test(msg)) return "That password is too easy to guess — try a longer or more unique one.";
  if(/email.{0,20}rate limit|over_email_send_rate_limit|email_send_rate_limit/i.test(msg)) return "We're receiving a high number of signups right now. Please wait a few minutes and try again.";
  if(/rate limit/i.test(msg)) return "That's a lot of attempts — please wait a minute and try again.";
  if(/invalid.{0,15}email|unable to validate email/i.test(msg)) return 'Please enter a valid email address.';
  if(status===0 || /networkerror|failed to fetch|load failed/i.test(msg)) return "We couldn't create your account right now. Please check your connection and try again.";
  if(status>=500) return 'Something went wrong while creating your account. Please try again shortly.';
  return msg || 'Something went wrong while creating your account. Please try again shortly.';
}

async function signUp({name, email, password, captchaToken}){
  name = (name||'').trim();
  email = (email||'').trim().toLowerCase();

  if(!name || !email || !password) return {ok:false, error:'Please fill in every field.'};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {ok:false, error:'Enter a valid email address.'};
  if(password.length < 8) return {ok:false, error:'Password must be at least 8 characters.'};

  // Public registration only ever creates Explorer accounts — no role
  // param is accepted here at all (public.handle_new_user() also hardcodes
  // role='explorer' as the table default, so this is enforced twice).
  // Mentor access is granted exclusively by an Administrator via
  // promoteUserRole() after a manual application review; Administrator
  // accounts are never created through public sign-up.
  const { data, error } = await sbClient.auth.signUp({
    email, password,
    options: {
      data: { name },
      // V14 fix: without an explicit emailRedirectTo, Supabase's
      // confirmation link falls back to the project's dashboard-configured
      // Site URL — which is "localhost" by default on a fresh project,
      // producing exactly the "Safari can't connect to the server" bug
      // this was reported for. wrldSiteUrl() (supabase-client.js) is a
      // fixed production constant for any non-local hostname, never a
      // raw, spoofable request value.
      emailRedirectTo: wrldSiteUrl() + '/email-verified.html',
      // Only sent if a real Turnstile site key is configured and the
      // widget actually produced a token — see WRLD_CAPTCHA_SITE_KEY in
      // supabase-config.js and AUTH-SECURITY-SETUP.md. undefined is fine
      // here; Supabase simply skips CAPTCHA verification if it isn't
      // enabled on the project.
      captchaToken: captchaToken || undefined,
    },
  });

  if(error) return {ok:false, error: friendlyAuthError(error)};

  // V20.6 (was V15.1): email verification is no longer required on this
  // project (the Supabase dashboard's Auth → Providers → Email →
  // "Confirm email" toggle has been switched off — see the
  // "No-Verification Signup Flow" note near the top of this file). With
  // that setting off, signUp() returns an active session immediately.
  //
  // V15.1 used to sign that session back out here and send the new user
  // to login.html to sign back in by hand — which is exactly the
  // "new account created, then treated like a returning user, shown
  // 'Welcome back,' and forced to log in manually before ever meeting
  // Orbit or taking the Adulting Readiness Assessment" bug this release
  // (V20.6) is required to fix. A valid Supabase session already exists
  // the instant signUp() returns one — there is no reason to discard it
  // and ask the person to re-prove a password they just chose seconds
  // ago. The session is now kept, the in-memory cache is refreshed so
  // getCurrentUser() reflects the new account immediately, and the
  // caller (signup.html) routes the now-authenticated, onboarding-
  // incomplete Explorer straight into the first-time welcome/Orbit/
  // Assessment flow via postAuthDestination() — never through
  // login.html. `hasSession:true` tells signup.html which path to take;
  // `accountCreated:true` is kept on the returned object for any other
  // caller that only checks that flag.
  //
  // V20.6.3 — Required Session Confirmation After Signup: don't assume
  // `data.session` is the only place a session could already be; fall
  // back to a direct getSession() read (mirrors the pattern
  // wrldRefreshSessionCache() already uses elsewhere) in the unlikely
  // case supabase-js resolved the session internally without echoing it
  // on this exact response. Then verify — rather than assume — that the
  // session actually belongs to the account that was just created before
  // ever using it to load a profile: this is the "confirm
  // session.user.id === newly created user.id" check the root-cause
  // audit specifically calls for. A mismatch here would mean a stale or
  // foreign session is in play; refuse to continue with it rather than
  // ever loading a different account's profile under the new account's
  // name.
  let session = data.session || null;
  if(!session){
    try{
      const sessionResult = await sbClient.auth.getSession();
      session = (sessionResult.data && sessionResult.data.session) || null;
    }catch(e){ /* fall through to the needsEmailConfirmation branch below */ }
  }

  if(session){
    const expectedUserId = (data.user && data.user.id) || session.user.id;
    if(session.user.id !== expectedUserId){
      wrldLogDiag && wrldLogDiag('signup_session_ownership_mismatch', {});
      try{ await sbClient.auth.signOut(); }catch(e){ /* best-effort */ }
      return {ok:false, error:'Something went wrong finishing your account setup. Please try logging in.'};
    }
    wrldLogDiag && wrldLogDiag('signup_session_established', { userIdSuffix: typeof wrldSafeIdSuffix==='function' ? wrldSafeIdSuffix(session.user.id) : null });
    await wrldRefreshSessionCache(session);
    return {ok:true, user:getCurrentUser(), accountCreated:true, hasSession:true};
  }
  // Fallback path: only reached if a future project configuration change
  // re-enables "Confirm email" — kept intact so signup.html's existing
  // check-your-email.html redirect still works correctly if that setting
  // is ever turned back on, without requiring another code change here.
  return {ok:true, user:null, needsEmailConfirmation:true};
}

/* Resend the signup confirmation email — used by check-your-email.html's
   "Resend" button. Supabase's own per-project/per-user rate limiting is
   the real enforcement (see SUPABASE-SMTP-SETUP.md); the caller (this
   page) also shows a client-side cooldown so a user can't just mash the
   button, but that's a UX courtesy, not the security boundary. */
async function resendVerificationEmail(email){
  email = (email||'').trim().toLowerCase();
  if(!email) return {ok:false, error:'Enter the email address you signed up with.'};
  const { error } = await sbClient.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: wrldSiteUrl() + '/email-verified.html' },
  });
  if(error) return {ok:false, error: friendlyAuthError(error)};
  return {ok:true};
}

async function logIn(email, password, rememberMe){
  email = (email||'').trim().toLowerCase();
  // Must be set BEFORE signInWithPassword() — supabase-client.js's
  // storage adapter reads this flag at the moment the session token is
  // first written, deciding localStorage (remembered) vs sessionStorage
  // (cleared when the browser closes).
  try{ localStorage.setItem('wrld_remember_me', rememberMe===false ? '0' : '1'); }catch(e){}

  const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
  if(error) return {ok:false, error: friendlyAuthError(error)};

  await wrldRefreshSessionCache(data.session);
  const user = getCurrentUser();

  if(user && (user.suspended || user.deactivated || user.banned)){
    const reason = user.banned ? 'banned' : user.deactivated ? 'deactivated' : 'suspended';
    await logOut();
    return {ok:false, error:`This account has been ${reason}. Contact WRLD if you think this is a mistake.`};
  }

  // Real, honest login activity — powers the Owner Dashboard's Active
  // Users / Online Now / Returning Users metrics without inventing data.
  if(user){
    await sbClient.from('profiles')
      .update({ last_login_at: new Date().toISOString(), login_count: (user.loginCount||0)+1 })
      .eq('id', user.id);
    await wrldRefreshSessionCache(data.session);
  }

  return {ok:true, user: getCurrentUser()};
}

/* ---------------------------------------------------------------------
   FORGOT / RESET PASSWORD
   Real email delivery now — Supabase Auth sends the reset link itself
   (configure the email template + redirect URL in the Supabase
   dashboard: Authentication -> Email Templates / URL Configuration).
   reset-password.html reads the recovery token Supabase appends to the
   redirect URL and calls resetPassword() below.
   --------------------------------------------------------------------- */
async function requestPasswordReset(email, captchaToken){
  email = (email||'').trim().toLowerCase();
  // V14: redirectTo now built from wrldSiteUrl() (a fixed production
  // constant for any non-local hostname) instead of the page's own
  // location.origin/pathname — safer, and correct regardless of which
  // page requestPasswordReset() is ever called from.
  const { error } = await sbClient.auth.resetPasswordForEmail(email, {
    redirectTo: wrldSiteUrl() + '/reset-password.html',
    captchaToken: captchaToken || undefined,
  });
  // Never reveal whether the email exists — Supabase itself doesn't
  // reveal this either (resetPasswordForEmail always "succeeds" from the
  // caller's point of view for unknown emails), so this stays honest.
  if(error && !/rate limit/i.test(error.message||'')) return {ok:true};
  if(error) return {ok:false, error: friendlyAuthError(error)};
  return {ok:true};
}

async function resetPassword(newPassword){
  if(!newPassword || newPassword.length < 8){
    return {ok:false, error:'Password must be at least 8 characters.'};
  }
  // By the time this is called, reset-password.html has already
  // exchanged the recovery link's token for a real (temporary) session
  // via supabase-client.js's detectSessionInUrl:true — updateUser() just
  // needs that active session, same as changePassword() below.
  const { error } = await sbClient.auth.updateUser({ password: newPassword });
  if(error) return {ok:false, error: friendlyAuthError(error)};
  return {ok:true};
}

/* Available to any authenticated user, including the Owner, from their
   own account settings. Supabase's updateUser() re-authenticates using
   the current session, so unlike the old localStorage version this no
   longer needs the current password passed in and re-checked by hand —
   but we still ask for it in the UI as a deliberate confirm-it's-you
   step before changing anything security-sensitive. */
async function changePassword(userId, currentPassword, newPassword){
  if(!newPassword || newPassword.length < 8) return {ok:false, error:'New password must be at least 8 characters.'};
  const user = getCurrentUser();
  if(!user) return {ok:false, error:'You need to be logged in to do this.'};
  // Re-verify the current password by attempting a fresh sign-in with it
  // — the closest equivalent to the old hash comparison, using Supabase
  // Auth as the source of truth instead of a locally stored hash.
  const { error: reauthError } = await sbClient.auth.signInWithPassword({ email: user.email, password: currentPassword||'' });
  if(reauthError) return {ok:false, error:'Current password is incorrect.'};
  const { error } = await sbClient.auth.updateUser({ password: newPassword });
  if(error) return {ok:false, error: friendlyAuthError(error)};
  return {ok:true};
}

function emailExists(email){
  // Supabase Auth deliberately never exposes "does this email exist" to
  // the client (signUp()/resetPasswordForEmail() both stay silent about
  // it) — this function is kept only so any old call sites don't throw;
  // it always returns false, matching the "never reveal registered
  // emails" behavior everywhere else in this file.
  return false;
}

/* ---------------------------------------------------------------------
   MODERATION ACTIONS (Owner Dashboard / Moderator Dashboard)
   Real, functional account actions an Administrator can take, now
   writing straight to public.profiles (RLS restricts these UPDATE/DELETE
   calls to Administrator+ — see supabase/migrations/001 and 009).
   --------------------------------------------------------------------- */
async function suspendUser(userId){
  const { error } = await sbClient.from('profiles').update({ suspended: true }).eq('id', userId);
  return !error;
}
async function unsuspendUser(userId){
  const { error } = await sbClient.from('profiles').update({ suspended: false }).eq('id', userId);
  return !error;
}
async function deactivateUser(userId){
  const { error } = await sbClient.from('profiles').update({ deactivated: true }).eq('id', userId).neq('role', ROLES.OWNER);
  return !error;
}
async function reactivateUser(userId){
  const { error } = await sbClient.from('profiles').update({ deactivated: false }).eq('id', userId);
  return !error;
}
async function banUser(userId){
  const { error } = await sbClient.from('profiles').update({ banned: true, suspended: true }).eq('id', userId).neq('role', ROLES.OWNER);
  return !error;
}
async function unbanUser(userId){
  const { error } = await sbClient.from('profiles').update({ banned: false, suspended: false }).eq('id', userId);
  return !error;
}
async function warnUser(userId){
  const { data } = await sbClient.from('profiles').select('warnings').eq('id', userId).single();
  const { error } = await sbClient.from('profiles').update({ warnings: ((data && data.warnings) || 0) + 1 }).eq('id', userId);
  return !error;
}

/* Self-service, any role. Calls the update_own_name() RPC (see
   supabase/migrations/035) rather than a raw table update, since that
   function is the one place validation (non-empty first name, trimming)
   and the single-source-of-truth `name` recomputation both happen —
   see that migration's header comment. Also mirrors the new name into
   Supabase Auth's own user metadata via updateUser(), since signUp()
   already writes `name` there at signup time (see signUp() above) and
   the two should stay in sync rather than silently drifting apart.
   Refreshes the in-memory session cache afterward so getCurrentUser()
   reflects the new name everywhere on the current page immediately,
   with no logout/login required. */
async function updateOwnName(firstName, lastName){
  const { data, error } = await sbClient.rpc('update_own_name', {
    p_first_name: firstName, p_last_name: lastName || null,
  });
  if(error) return {ok:false, error: error.message || "Couldn't update your name — try again."};

  // Best-effort — Auth metadata is a convenience mirror, not the source
  // of truth (public.profiles is), so a failure here doesn't block the
  // save the user actually asked for.
  try{ await sbClient.auth.updateUser({ data: { name: data.name } }); }catch(e){ /* non-fatal */ }

  await wrldRefreshSessionCache(_wrldSessionCache);
  return {ok:true, name: data.name, firstName: data.first_name, lastName: data.last_name};
}

/* Owner-only. Moves the Owner role to an existing Administrator and
   demotes the current Owner to Administrator — enforced twice: here, and
   by the one-Owner-only partial unique index in the database, which
   makes it impossible to ever end up with zero or two Owners even if
   this function is called with bad input. */
async function transferOwnership(currentOwnerId, newOwnerId){
  const user = getCurrentUser();
  if(!user || user.id!==currentOwnerId || user.role!==ROLES.OWNER){
    return {ok:false, error:'Only the current Owner can transfer ownership.'};
  }
  const { data: next } = await sbClient.from('profiles').select('role').eq('id', newOwnerId).single();
  if(!next || next.role!==ROLES.ADMIN){
    return {ok:false, error:'Ownership can only be transferred to an existing Administrator.'};
  }
  // Demote-then-promote in that order so the unique "exactly one owner"
  // index is never asked to hold two owners at once, even momentarily.
  const demote = await sbClient.from('profiles').update({ role: ROLES.ADMIN }).eq('id', currentOwnerId);
  if(demote.error) return {ok:false, error: demote.error.message};
  const promote = await sbClient.from('profiles').update({ role: ROLES.OWNER }).eq('id', newOwnerId);
  if(promote.error){
    await sbClient.from('profiles').update({ role: ROLES.OWNER }).eq('id', currentOwnerId); // best-effort rollback
    return {ok:false, error: promote.error.message};
  }
  await wrldRefreshSessionCache(_wrldSessionCache);
  return {ok:true};
}

/* Owner-only, irreversible. This used to wipe every wrld_-prefixed
   localStorage key by hand; with a real database, "delete the
   organization" means truncating every WRLD table (RLS still requires
   the caller to be the Owner — see supabase/migrations/). Auth accounts
   themselves are left alone here deliberately (deleting every
   auth.users row is a separate, even more irreversible action better
   done from the Supabase dashboard, not a single button in the app). */
async function deleteOrganizationData(){
  const user = getCurrentUser();
  if(!user || user.role!==ROLES.OWNER) return false;
  const tables = [
    'community_reports','community_posts','moderation_log','community_trust',
    'volunteer_entries','mentor_applications','mentor_profiles','live_sessions',
    'announcements','learner_state',
  ];
  for(const t of tables){
    await sbClient.from(t).delete().neq('user_id', '00000000-0000-0000-0000-000000000000').select();
  }
  return true;
}

/* The only path any account ever becomes a Mentor: an Administrator
   reviewing a real application (see become-mentor.html) and promoting
   the applicant's existing Explorer account by hand. */
async function promoteUserRole(userId, role){
  if(![ROLES.EXPLORER, ROLES.MENTOR].includes(role)) return false; // never grants Admin/Owner via this path
  const { error } = await sbClient.from('profiles').update({ role }).eq('id', userId);
  return !error;
}

/* Owner-only in practice — only reachable from the Owner Dashboard's
   Administrators panel, itself gated to roleAtLeast(user, OWNER). */
async function setAdministratorStatus(userId, makeAdmin){
  const { error } = await sbClient.from('profiles')
    .update({ role: makeAdmin ? ROLES.ADMIN : ROLES.EXPLORER })
    .eq('id', userId)
    .neq('role', ROLES.OWNER);
  return !error;
}

/* ---------------------------------------------------------------------
   ROUTE GUARDS
   Unchanged signatures and behavior — call at the top of any gated
   page's inline script, AFTER `await window.wrldAuthReady` (every
   gated page's script is wrapped in `(async()=>{ await
   window.wrldAuthReady; ... })()` for exactly this reason — see e.g.
   dashboard.html, account-settings.html, owner-dashboard.html).
   --------------------------------------------------------------------- */
// V20.1: shared allowlist check for the `?next=` redirect-back param —
// used both here (harmless, since `here` is always built from
// location.pathname, never user input) and by login.html when it
// actually *consumes* a `next` value from the URL, which IS
// attacker-controllable if someone shares a crafted login link. Only a
// bare same-page WRLD filename (optionally with its own query string)
// is ever allowed — no scheme, no protocol-relative `//`, no backslash,
// no path traversal. Anything else is rejected and the caller falls
// back to the normal role-based destination.
function safeInternalNext(raw){
  if(!raw || typeof raw !== 'string') return null;
  if(raw.length > 200) return null;
  if(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return null; // has a scheme (http:, javascript:, etc)
  if(raw.startsWith('//')) return null; // protocol-relative
  if(raw.includes('\\')) return null;
  if(!/^[a-zA-Z0-9_-]+\.html(\?[^\s]*)?$/.test(raw)) return null; // bare filename[.html][?query] only
  return raw;
}

// V20.5 — first-time onboarding + unified post-auth routing.
//
// Pages that ARE the onboarding flow itself must never be redirected
// back into onboarding (that would loop). Kept short and explicit
// rather than inferring it from context.
const ONBOARDING_FLOW_PAGES = ['welcome.html', 'assessment.html'];

// Source of truth for "has this account finished first-time onboarding":
// a completed Adulting Readiness Assessment, i.e. getState().assessment.
// This already exists, is already synced to Supabase for any logged-in
// user (pullLearnerStateFromSupabase()/pushLearnerStateFromSupabase() in
// app.js, via the learner_state table — see supabase-client.js), and is
// exactly the strongest existing signal available — no new field, no new
// migration, no new table. Deliberately reused as-is rather than adding
// a second, possibly-conflicting "onboarding_completed" flag.
//
// Scoped to Explorer only: Mentors/Administrators/Owners reach their
// accounts through mentor-application approval or direct role
// assignment, not the public Explorer signup form, and may never have
// taken (or need to take) the Explorer assessment — forcing them through
// it would be the exact "accidentally force Owner/Administrator/existing
// Mentor through Explorer onboarding" mistake this release is required
// to avoid.
function needsOnboarding(user){
  if(!user || user.role !== ROLES.EXPLORER) return false;
  const s = typeof getState==='function' ? getState() : null;
  return !(s && s.assessment);
}

// V20.6.2 — Create Account and Log In are two separate journeys and must
// never share a routing decision that's INFERRED from cached/local state
// (assessment completion, browser history, account age, etc.) — only the
// explicit action the person actually took (which form they submitted)
// decides which journey runs. `source` makes that explicit:
//   source === 'signup' → this IS a brand-new account's first authenticated
//     moment. Always the first-time onboarding flow (Orbit welcome → the
//     Adulting Readiness Assessment), unconditionally — never inferred
//     from getState(), never "welcome back," never a dashboard skip based
//     on anything that happens to be cached in this browser.
//   source === 'login' → this IS a returning user's deliberate log-in.
//     Always their requested destination or role dashboard, directly —
//     never re-triggers onboarding or the Orbit welcome from this
//     function. (A genuinely onboarding-incomplete returning account is
//     still caught — correctly, from real account data, not inferred
//     here — by requireAuth()'s own independent guard on whichever
//     protected page loads next; see that function below. This routing
//     step itself just never makes that call.)
//   source omitted → legacy/shared priority order, used by
//     assessment.html's beginJourney() right after a first-time
//     assessment completes, where checking "is onboarding needed now" is
//     exactly correct (it just became false) rather than an inference
//     about which journey the person is on.
function postAuthDestination(requestedNext, source){
  const user = getCurrentUser();
  const safeNext = safeInternalNext(requestedNext);

  if(source === 'signup'){
    return 'welcome.html' + (safeNext ? '?next=' + encodeURIComponent(safeNext) : '');
  }
  if(source === 'login'){
    if(safeNext) return safeNext;
    return (user && ROLE_DESTINATIONS[user.role]) || 'dashboard.html';
  }

  // Legacy/default priority order:
  //   1. Onboarding incomplete (Explorer, no assessment yet) → welcome.html,
  //      carrying the original destination forward as its own `next=` so
  //      it isn't lost — resumed after the assessment instead of dropped.
  //   2. A validated, safe requested destination (e.g. a Volunteer Tracker
  //      link that triggered the login redirect) → that destination.
  //   3. No destination requested → the account's normal role dashboard.
  if(needsOnboarding(user)){
    return 'welcome.html' + (safeNext ? '?next=' + encodeURIComponent(safeNext) : '');
  }
  if(safeNext) return safeNext;
  return (user && ROLE_DESTINATIONS[user.role]) || 'dashboard.html';
}

/* ---------------------------------------------------------------------
   V20.6.3 — Critical Architectural Rule: "a profile-loading error is not
   the same as an unauthenticated user." This function now ONLY redirects
   to login.html when isAuthenticated() reports Supabase has definitively
   confirmed there is no valid session — never because a profile fetch
   hasn't resolved yet, and never because it failed (temporarily or
   permanently). That distinction previously didn't exist here:
   isAuthenticated() used to require a loaded profile, so the live "JWT
   issued in future" 401 on a brand-new signup's first profile request
   made this function conclude "not logged in" and bounce straight to
   login.html mid-onboarding. See supabase-client.js's wrldGetAuthState()/
   wrldGetProfileState() and CHANGES-V20.6.3.md for the full trace.

   The onboarding-redirect branch below is unaffected by this change:
   needsOnboarding() already returns false for a null user (profile not
   yet loaded), so it was never at risk of firing a wrong redirect — it
   simply stays a no-op until a real profile is available, exactly as
   before. */
function requireAuth(){
  if(!isAuthenticated()){
    const here = location.pathname.split('/').pop() + location.search;
    wrldLogDiag && wrldLogDiag('require_auth_redirect', { reason:'no_session', to:'login.html', from: here });
    location.href = 'login.html?next=' + encodeURIComponent(here);
    return false;
  }
  // A signed-in Explorer who hasn't finished first-time onboarding yet
  // must finish it before using another protected feature (e.g. the
  // Volunteer Tracker) — this covers arriving directly at a protected
  // page (bookmark, typed URL, closing the browser mid-onboarding and
  // coming straight back), not just the immediately-after-login case
  // postAuthDestination() already covers. Exempts the onboarding pages
  // themselves so this can't loop. Guarded on a real, loaded user object
  // — if the profile hasn't resolved yet (still retrying, or a
  // recoverable failure the calling page is already showing its own
  // state for), this deliberately does not guess whether onboarding is
  // needed; it simply lets the visitor stay put; the page itself is
  // responsible for showing loading/retry UI (see welcome.html).
  const here = location.pathname.split('/').pop();
  const user = getCurrentUser();
  if(user && !ONBOARDING_FLOW_PAGES.includes(here) && needsOnboarding(user)){
    wrldLogDiag && wrldLogDiag('require_auth_redirect', { reason:'needs_onboarding', to:'welcome.html', from: here });
    location.href = 'welcome.html?next=' + encodeURIComponent(here + location.search);
    return false;
  }
  return true;
}

function requireRole(roles){
  const user = getCurrentUser();
  if(!user) return requireAuth();
  const list = Array.isArray(roles) ? roles : [roles];
  if(!list.includes(user.role)){
    location.href = 'dashboard.html';
    return false;
  }
  return true;
}

function requireMinRole(role){
  const user = getCurrentUser();
  if(!user) return requireAuth();
  if(!roleAtLeast(user, role)){
    location.href = 'dashboard.html';
    return false;
  }
  return true;
}

/* ---------------------------------------------------------------------
   CAPABILITY-BASED MULTI-EXPERIENCE ACCESS (V14)
   The Owner's primary `role` column is always 'owner' — it never changes
   to 'mentor' or 'explorer' just because the Owner opens a different
   part of the site. Instead of scattering exact-match checks like
   `user.role === 'mentor'` (which is what caused the "Mentor Studio
   redirects the Owner to the Explorer Dashboard" bug: mentor-studio.html
   used to call requireRole([ROLES.MENTOR, ROLES.ADMIN]), and requireRole()
   only ever does an exact-membership check, so an Owner — role 'owner' —
   was never in that list and got bounced), every experience's access
   rule lives in exactly one place here, built on the existing hierarchy-
   aware roleAtLeast(). Because the hierarchy is
   Explorer < Mentor < Admin < Owner, each capability function below
   automatically grants access to everything a lower role can already
   reach — Owner (and Administrator, where noted) inherit every
   experience without any table write, localStorage flag, or role change.
   Add a new function here — never a new scattered `role === '...'` check
   — for any future role-specific area. See AUTH-SECURITY-SETUP.md for
   the full role/capability map this implements. */
function canAccessExplorerDashboard(user){ return roleAtLeast(user, ROLES.EXPLORER); }
function canAccessMentorStudio(user){ return roleAtLeast(user, ROLES.MENTOR); }
function canAccessModerationDashboard(user){ return roleAtLeast(user, ROLES.ADMIN); }
// V19: Owner Command Centre is now Owner-exclusive — day-to-day
// operational work for Administrators moved to the new, separate
// Administrator Dashboard (administrator-dashboard.html) below. Owner
// Command Centre remains the highest-level workspace (governance,
// security, organization settings, permanent deletion, sensitive
// analytics) per the V19 spec's explicit separation of the two.
function canAccessOwnerDashboard(user){ return roleAtLeast(user, ROLES.OWNER); }
function canAccessAdministratorDashboard(user){ return roleAtLeast(user, ROLES.ADMIN); } // Administrator and Owner both
function canAccessAdministratorsPanel(user){ return roleAtLeast(user, ROLES.OWNER); }
function canAccessSecurityPanel(user){ return roleAtLeast(user, ROLES.OWNER); }

/* Route-guard wrapper for the capability functions above — same
   redirect-with-safe-destination shape as requireRole()/requireMinRole(),
   but driven by a capability check instead of an exact role list, so it
   naturally allows every role that legitimately inherits the capability
   (including Owner) without needing to enumerate roles at every call site. */
function requireCapability(canAccessFn, redirectTo){
  const user = getCurrentUser();
  if(!user) return requireAuth();
  if(!canAccessFn(user)){
    location.href = redirectTo || 'dashboard.html';
    return false;
  }
  return true;
}

/* ---------------------------------------------------------------------
   OWNER SETUP
   The old version auto-created a passwordless 'owner_root' account on
   every page load and gated first login behind a one-time
   owner-setup.html password form — that account never existed on a real
   backend and can't be replicated safely with real Supabase Auth (no
   client-side way to create a privileged account with no password, nor
   should there be). The replacement (below) is real and backend-driven:
   sign up normally through signup.html like anyone else, then visit
   owner-setup.html and claim Owner access with one click. A database
   trigger (not this file) is what actually enforces that this only ever
   works once, for the first person to try it — see claimOwnerRole()
   just below. A manual SQL alternative (directly setting a profiles row
   to role='owner' from the Supabase SQL editor) still works too and is
   documented in SUPABASE_SETUP.md, for anyone who'd rather not race a
   public self-claim window before opening signups. */
/* ---------------------------------------------------------------------
   ADMIN USER LIST CACHE (Owner Dashboard / Moderator Dashboard)
   getUsers() used to be a synchronous localStorage read of every
   account. It's now backed by a real `profiles` query (Administrator+
   only — see the profiles_select_own_or_admin RLS policy in
   supabase/migrations/012), which is inherently async, so it follows
   the exact same cache-then-sync-read pattern as getCurrentUser():
   call `await refreshUsersCache()` once before the first render and
   again after any action that changes a user's row, then read the
   already-resolved list synchronously via getUsers() during render.
   --------------------------------------------------------------------- */
let _wrldUsersCache = [];

function mapProfileRow(p){
  return {
    id: p.id, name: p.name, email: p.email, role: p.role, avatarUrl: p.avatar_url,
    createdAt: p.created_at, lastLoginAt: p.last_login_at, loginCount: p.login_count,
    warnings: p.warnings, violations: p.violations,
    suspended: p.suspended, deactivated: p.deactivated, banned: p.banned,
    emailVerified: !!p.email_verified,
  };
}

async function refreshUsersCache(){
  const { data, error } = await sbClient.from('profiles').select('*').order('created_at', {ascending:false});
  if(error){ console.warn('WRLD: could not load user list', error.message); return; }
  _wrldUsersCache = (data||[]).map(mapProfileRow);
}

function getUsers(){
  return _wrldUsersCache;
}

/* ---------------------------------------------------------------------
   OWNER CLAIM (real, backend-driven — replaces the old client-only stubs)
   There is no passwordless auto-created Owner account anymore (see the
   file-top comment). Instead: the very first person to claim the Owner
   role for their own already-signed-up account gets it, and the window
   closes permanently the instant that happens — enforced by a database
   trigger (`guard_profile_updates()`, supabase/migrations/016), NOT by
   anything in this file. Nothing here can be trusted on its own; the
   trigger is what actually stops a second person from ever succeeding,
   or a non-admin from granting themselves any OTHER role. These
   functions just talk to that real backend state honestly:
   - ownerAccountExists() asks the database "does an Owner exist yet?"
     via the public.owner_exists() function — safe to expose (reveals
     nothing about *who* the Owner is), and callable by anyone,
     logged in or not, so owner-setup.html can decide what to show
     before the visitor even logs in.
   - claimOwnerRole() attempts the actual claim for the CURRENTLY
     LOGGED IN account. It requires a real Supabase Auth session
     (sign up / log in first, same as anyone else) — there is no
     separate "Owner password" anymore, since Supabase Auth already
     has whatever password they signed up with. If someone else won
     the race first, the trigger rejects the update and this returns
     a clear, honest error rather than a fake success. */
async function ownerAccountExists(){
  const { data, error } = await sbClient.rpc('owner_exists');
  if(error){ console.warn('WRLD: could not check Owner status', error.message); return null; } // null = "unknown", not "no"
  return !!data;
}
async function claimOwnerRole(){
  const user = getCurrentUser();
  if(!user) return {ok:false, error:'You need to be logged in to claim Owner access.'};
  if(user.role==='owner') return {ok:true, alreadyOwner:true};
  const { error } = await sbClient.from('profiles').update({role:'owner'}).eq('id', user.id);
  if(error){
    // The trigger's RAISE EXCEPTION lands here if someone else already
    // claimed Owner between this page loading and this button click.
    return {ok:false, error: /owner/i.test(error.message) || /administrator/i.test(error.message)
      ? 'Someone already claimed Owner access before you — WRLD only ever has one Owner.'
      : error.message};
  }
  await wrldRefreshSessionCache(_wrldSessionCache);
  return {ok:true};
}

/* ---------------------------------------------------------------------
   LEGACY LOCALSTORAGE ACCOUNT NOTICE (migration strategy for pre-Supabase
   demo accounts)
   Before this revision, WRLD's "accounts" were plain objects in each
   visitor's own browser (`wrld_users_v1`) — never a real, shared user
   table. There is nothing to bulk-migrate server-side: each browser's
   demo account only ever existed in that one browser. What CAN and DOES
   carry over automatically is real: if someone with old local progress
   (the account-scoped learner-state/volunteer-log stores in app.js — see
   that file's LOCAL STATE section and CHANGES-V20.6.2.md for the current
   key scheme) signs up fresh for a real account,
   pullLearnerStateFromSupabase()/pullVolunteerEntriesFromSupabase()
   (app.js) find no server row yet on first login and push their existing
   local progress up — so their progress survives the migration even
   though the account itself has to be re-created. (Passwords can't be
   migrated at all, by design: the old scheme was an unsalted client-side
   SHA-256 hash, not something that should ever be carried into a real
   auth system even if it were technically possible.)
   This function just makes sure a returning visitor with leftover old
   data understands why their old login stopped working, via Orbit's
   guide line rather than a new UI element. Called from initPage().

   BUGFIX (post-V15.1): this used to run on every single page load with
   no session gating at all, so on any browser that still had a leftover
   `wrld_users_v1` entry, it permanently overwrote initPage()'s normal
   setGuideMessage(customGuideMsg || contextualGuideMessage(activeKey))
   call on every page — Orbit's bubble showed this one static notice
   everywhere and never showed page-specific messages again for the rest
   of that browser's life (not just one session). Gated below to fire
   at most ONCE per browser session (sessionStorage, same pattern as
   orbit.js's ORBIT_SESSION_DISMISS_KEY) — after that, initPage()'s
   normal per-page message takes over again immediately on the next
   page, same as any visitor without legacy data. */
const ORBIT_LEGACY_NOTICE_SESSION_KEY = 'wrld_orbit_legacy_notice_shown_v1';
function checkLegacyAccountNotice(){
  if(isAuthenticated()) return; // already on a real account — nothing to say
  try{
    if(sessionStorage.getItem(ORBIT_LEGACY_NOTICE_SESSION_KEY) === '1') return; // already shown once this session
    const legacy = JSON.parse(localStorage.getItem('wrld_users_v1')||'[]');
    if(Array.isArray(legacy) && legacy.length>0 && typeof setGuideMessage==='function'){
      setGuideMessage("👋 WRLD upgraded its account system — old logins from before this update no longer work, sorry! Sign up again with the same email and your saved progress will carry over automatically.");
      sessionStorage.setItem(ORBIT_LEGACY_NOTICE_SESSION_KEY, '1');
    }
  }catch(e){}
}
