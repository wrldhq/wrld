/* =====================================================================
   WRLD — New User Journey controller (new-user-journey.js) — V25

   ARCHITECTURE NOTE — read this before touching this file or auth.js.

   V24 restored authentication to a deliberately minimal, proven shape
   after a real production incident: an earlier onboarding system lived
   INSIDE auth.js's core routing (needsOnboarding(), a branch in
   postAuthDestination(), a branch in requireAuth(), a dedicated
   welcome.html gate) and that entanglement was the root cause of users
   getting stuck unable to reach their dashboard (see
   AUTH-MIGRATION-SUMMARY.md). V24 removed all of it. Authentication
   today answers exactly two questions — is there a session, and what
   role does it belong to — nothing else.

   This file is the entire "New User Journey" feature for V25. It is a
   SEPARATE, self-contained, optional add-on:
     - auth.js is not modified. requireAuth(), postAuthDestination(),
       ROLE_DESTINATIONS, safeInternalNext(), wrldSafeRedirect(), and
       every route guard are untouched, byte-for-byte.
     - login.html is not modified. A returning user's login always goes
       straight through the existing, unchanged postAuthDestination()
       logic to their role dashboard. This file is never consulted by
       that page.
     - The ONLY two places this file is ever invoked from are:
         1. signup.html, exactly once, immediately after a brand-new
            account's first authenticated session is established, to
            mark that account as "pending" a first-time journey.
         2. dashboard.html, as a single, explicit, separate check before
            it renders — "does this signed-in Explorer still have a
            pending journey?" If not (returning user, or a pre-V25
            account that never had a marker at all, or an account that
            has already finished), this is a complete no-op and
            dashboard.html renders exactly as it does today. There is no
            new logic inside requireAuth()/postAuthDestination() making
            this decision — dashboard.html asks THIS file, once, and
            this file alone decides whether to hand control to
            orbit-welcome.html.
     - assessment.html calls one small helper (wrldNUJCompleteIfPending)
       at the moment a signed-in learner finishes their journey
       (beginJourney()), so the marker is cleared and the dashboard gate
       above never fires again for that account. If this file somehow
       isn't loaded on a given page, every call here is optional-chained
       behind `typeof fn === 'function'` checks at the call site, so
       nothing anywhere depends on this file for correctness of login,
       auth, or dashboard access.

   WHAT "PENDING" MEANS AND WHERE IT LIVES
   A brand-new V25 signup gets a small, purely local, per-account marker
   — localStorage key `wrld_nuj_v1:<user id>` — set to 'pending' at the
   moment of signup and flipped to 'completed' the moment the journey
   ends. This is NOT a new database column and NOT a schema change:
   nothing here talks to Supabase directly. The real, durable, cross-
   device signal for "has this account finished the Adulting Readiness
   Assessment" is the assessment summary already stored in
   `learner_state.assessment` (existing column, existing sync path,
   completely unchanged — see app.js's getState()/setState()/
   pullLearnerStateFromSupabase()). The local marker only decides
   whether to show the Orbit Welcome experience at all; a pre-existing
   V24 account (which never had a signup-time marker written) simply has
   no key here, ever, and is therefore permanently exempt from this
   entire feature — exactly matching "returning users should never
   notice this feature exists."

   WHY A FORCED, AWAITED RE-SYNC ON EVERY GATE CHECK
   supabase-client.js deliberately fires pullLearnerStateFromSupabase()
   in the background, UN-awaited, so it can never block
   window.wrldAuthReady (see that file's V22.4 note) — exactly correct
   for every normal page, but it means a page that reads getState()
   immediately after `await window.wrldAuthReady` can still race a guest-
   assessment merge that hasn't landed yet. wrldNUJForceSync() below
   calls that exact same, already-existing, idempotent function again
   and AWAITS it, from this file only, so the one decision that actually
   depends on having the freshest possible `learner_state.assessment`
   (does this account already have a completed assessment, e.g. from a
   guest merge) is never made on stale data. This never double-writes
   anything unsafe — pullLearnerStateFromSupabase() already safely
   no-ops once a server row exists.
   ===================================================================== */

const WRLD_NUJ_MARKER_BASE = 'wrld_nuj_v1';

function wrldNUJMarkerKey(userId){
  return WRLD_NUJ_MARKER_BASE + ':' + userId;
}

/* Never throws — a storage failure here must never block dashboard
   access (an explicit V25 requirement). Worst case: the marker can't be
   read/written and this feature silently no-ops for that visit, exactly
   as if the account were exempt. */
function wrldNUJGetStatus(userId){
  if(!userId) return null;
  try{ return localStorage.getItem(wrldNUJMarkerKey(userId)) || null; }
  catch(e){ return null; }
}
function wrldNUJSetStatus(userId, status){
  if(!userId) return;
  try{ localStorage.setItem(wrldNUJMarkerKey(userId), status); }
  catch(e){ /* best-effort only — see file header */ }
}

/* Called exactly once — from signup.html, right after a brand-new
   account's first real, confirmed session is established. This is the
   single entry point into the New User Journey; nothing else ever sets
   this marker to 'pending'. */
function wrldNUJStartForNewSignup(userId){
  if(!userId) return;
  wrldNUJSetStatus(userId, 'pending');
}

/* Called from assessment.html's beginJourney() and from orbit-welcome.html
   once the journey is genuinely finished. A no-op for any account that
   was never marked 'pending' (returning users, guests, pre-existing
   accounts) — so calling this defensively, every time, is always safe. */
function wrldNUJCompleteIfPending(userId){
  if(!userId) return;
  if(wrldNUJGetStatus(userId) === 'pending'){
    wrldNUJSetStatus(userId, 'completed');
  }
}

/* Best-effort, awaited re-sync — see file header. Never throws; a failed
   sync here just means the gate below falls back to whatever is already
   cached locally, which is exactly what would have happened anyway
   before this file existed. */
async function wrldNUJForceSync(){
  try{
    if(typeof pullLearnerStateFromSupabase === 'function'){
      await pullLearnerStateFromSupabase();
    }
  }catch(e){ /* best-effort only — see file header */ }
}

/* ---------------------------------------------------------------------
   THE GATE — called from exactly one place: dashboard.html, once, before
   renderDashboard(). Returns true if it navigated away (caller should
   stop and not render the dashboard this page load), false if the
   caller should proceed exactly as it does today.

   Deliberately conservative: any uncertainty (no user, wrong role, no
   marker, storage unavailable, sync failure) resolves to "do nothing,
   render the dashboard" — this feature is only ever allowed to ADD a
   one-time detour for a brand-new Explorer mid-journey, never to block
   or interfere with anyone else reaching their dashboard.
   --------------------------------------------------------------------- */
async function wrldNUJCheckAndRedirect(){
  try{
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if(!user || user.role !== 'explorer') return false; // NUJ only ever applies to Explorers (mirrors the old, removed needsOnboarding()'s scope)

    if(wrldNUJGetStatus(user.id) !== 'pending') return false; // no marker (pre-existing account) or already completed — exempt, forever

    await wrldNUJForceSync(); // make sure a guest-assessment merge, if any, has actually landed before deciding

    const state = typeof getState === 'function' ? getState() : null;
    if(state && state.assessment){
      // The assessment is already done — either they finished it and
      // closed the browser before clicking "Continue to Dashboard," or a
      // guest assessment was just associated with this account. Either
      // way there's nothing left for the journey to do; let it finish
      // quietly rather than showing the results screen a second time.
      wrldNUJCompleteIfPending(user.id);
      return false;
    }

    location.href = 'orbit-welcome.html';
    return true;
  }catch(e){
    // Never block dashboard access because this feature failed — see
    // "Assessment Synchronization" in the V25 spec: a synchronization
    // failure must never prevent login/dashboard access.
    console.warn('WRLD: New User Journey check failed, continuing to dashboard.', e && e.message);
    return false;
  }
}
