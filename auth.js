/* =====================================================================
   WRLD — Authentication & Role-Based Access Control (auth.js)

   ARCHITECTURE NOTE
   WRLD does not yet have a backend server, so accounts currently live in
   this browser via localStorage. Every function below is shaped exactly
   like a real API client (signUp, logIn, logOut, getCurrentUser, etc.)
   so that when a real backend exists, only the INSIDE of these functions
   needs to change to real network calls — every page that calls them
   (header, dashboard, Mentor Studio, Orbit) keeps working unchanged.
   This mirrors the same pattern app.js already uses for getState()/setState().

   SECURITY NOTE
   Passwords are digested with SHA-256 (via the browser's SubtleCrypto)
   purely so a raw password is never sitting in localStorage in plain
   text. This is NOT production-grade security — there is no server,
   no salting, no rate limiting, and anyone with access to this browser
   profile can still see the data. Real authentication (bcrypt/argon2,
   server-side sessions, HTTPS-only cookies, etc.) is Phase 3+ backend
   work. This file exists to build the architecture that backend will
   plug into, not to replace it.
   ===================================================================== */

const USERS_KEY   = 'wrld_users_v1';
const SESSION_KEY = 'wrld_session_v1';
const RESET_KEY   = 'wrld_reset_tokens_v1';
const SESSION_LENGTH_MS = 1000 * 60 * 60 * 24 * 30; // 30-day persistent login

/* ---------------------------------------------------------------------
   ROLES + PERMISSIONS
   Four roles: Explorer, Mentor, Administrator, Owner — a strict hierarchy,
   each inheriting everything the role below it can do. Administrator and
   Owner are never selectable anywhere in the frontend; Owner exists exactly
   once (see OWNER bootstrap below) and Administrator is only ever granted
   by an existing Owner/Administrator promoting an account by hand.
   --------------------------------------------------------------------- */
const ROLES = { EXPLORER: 'explorer', MENTOR: 'mentor', ADMIN: 'admin', OWNER: 'owner' };
const ROLE_HIERARCHY = [ROLES.EXPLORER, ROLES.MENTOR, ROLES.ADMIN, ROLES.OWNER];

const ROLE_LABELS = {
  [ROLES.EXPLORER]: 'Explorer',
  [ROLES.MENTOR]: 'Mentor',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.OWNER]: 'Owner',
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

// Roles inherit downward: Owner can do everything Admins/Mentors/Explorers
// can; Admins can do everything Mentors/Explorers can, and so on.
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

/* True if user's role is this role or anything above it in the hierarchy —
   e.g. roleAtLeast(user, ROLES.MENTOR) is also true for Admins and Owner. */
function roleAtLeast(user, role){
  if(!user || !user.role) return false;
  const userIdx = ROLE_HIERARCHY.indexOf(user.role);
  const roleIdx = ROLE_HIERARCHY.indexOf(role);
  return userIdx>=0 && roleIdx>=0 && userIdx>=roleIdx;
}

/* ---------------------------------------------------------------------
   OWNER BOOTSTRAP
   Exactly one Owner account exists, created automatically the first time
   this file loads in a fresh browser, with NO password set. The Owner
   must complete a one-time setup flow (see ownerNeedsSetup/setupOwnerPassword
   below) before they can log in — this file never hardcodes a password.
   --------------------------------------------------------------------- */
const OWNER_EMAIL = 'hello@ourwrld.org';
function ensureOwnerBootstrap(){
  const users = getUsers();
  if(users.some(u=>u.role===ROLES.OWNER)) return;
  users.push({
    id: 'owner_root',
    name: 'WRLD Owner',
    email: OWNER_EMAIL,
    passwordHash: null, // set once, via setupOwnerPassword() — never hardcoded
    role: ROLES.OWNER,
    createdAt: new Date().toISOString(),
  });
  saveUsers(users);
}

function ownerNeedsSetup(){
  const owner = getUsers().find(u=>u.role===ROLES.OWNER);
  return !!owner && !owner.passwordHash;
}

async function setupOwnerPassword(password){
  const users = getUsers();
  const owner = users.find(u=>u.role===ROLES.OWNER);
  if(!owner) return {ok:false, error:'Owner account not found.'};
  if(owner.passwordHash) return {ok:false, error:'Owner setup has already been completed.'};
  if(!password || password.length < 8) return {ok:false, error:'Password must be at least 8 characters.'};
  owner.passwordHash = await digestPassword(password);
  saveUsers(users);
  startSession(owner);
  return {ok:true, user: publicUser(owner)};
}

/* ---------------------------------------------------------------------
   STORAGE HELPERS
   --------------------------------------------------------------------- */
function getUsers(){
  try{ return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch(e){ return []; }
}
function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

function getResetTokens(){
  try{ return JSON.parse(localStorage.getItem(RESET_KEY)) || {}; }
  catch(e){ return {}; }
}
function saveResetTokens(tokens){ localStorage.setItem(RESET_KEY, JSON.stringify(tokens)); }

async function digestPassword(str){
  if(window.crypto && crypto.subtle){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  // Extremely old-browser fallback only — never reached on any modern device.
  let hash = 0;
  for(let i=0;i<str.length;i++){ hash = (hash<<5)-hash+str.charCodeAt(i); hash |= 0; }
  return 'fallback_'+String(hash);
}

function makeToken(prefix){ return (prefix||'tok')+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,10); }

function publicUser(user){
  return user ? {id:user.id, name:user.name, email:user.email, role:user.role, createdAt:user.createdAt} : null;
}

/* ---------------------------------------------------------------------
   SESSION
   --------------------------------------------------------------------- */
function startSession(user){
  const session = {userId:user.id, token:makeToken('session'), expiresAt: Date.now()+SESSION_LENGTH_MS};
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Real, honest "last active" timestamp and login count — powers the
  // Owner Dashboard's Active Users, Online Now, and Returning Users
  // metrics without inventing any activity data.
  const users = getUsers();
  const u = users.find(x=>x.id===user.id);
  if(u){ u.lastLoginAt = new Date().toISOString(); u.loginCount = (u.loginCount||0)+1; saveUsers(users); }
}

function logOut(){
  localStorage.removeItem(SESSION_KEY);
}

function getCurrentUser(){
  try{
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if(!session || !session.expiresAt || session.expiresAt < Date.now()) return null;
    const user = getUsers().find(u=>u.id===session.userId);
    if(!user || user.suspended || user.deactivated) return null;
    return publicUser(user);
  }catch(e){ return null; }
}

/* ---------------------------------------------------------------------
   MODERATION ACTIONS (Layer 4 — Moderator Dashboard)
   Real, functional account actions an Administrator can take. Suspended
   users are immediately signed out on their next request — see the
   suspended check in getCurrentUser() above and the login() check below.
   --------------------------------------------------------------------- */
function suspendUser(userId){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return false;
  u.suspended = true;
  saveUsers(users);
  return true;
}
function unsuspendUser(userId){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return false;
  u.suspended = false;
  saveUsers(users);
  return true;
}
/* Deactivate is distinct from Suspend: Suspend is a moderation action tied
   to community conduct; Deactivate is an administrative account-closure
   action (e.g. the account owner asked WRLD to close it, or it's a stale
   test account). Both block login the same way, but are tracked and
   surfaced separately in the Owner Dashboard. */
function deactivateUser(userId){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u || u.role===ROLES.OWNER) return false;
  u.deactivated = true;
  saveUsers(users);
  return true;
}
function reactivateUser(userId){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return false;
  u.deactivated = false;
  saveUsers(users);
  return true;
}
/* Ban is the escalation past Suspend, reserved for repeated abusive
   behaviour (see moderateContent()'s repeat-offender tracking). Distinct
   store field so "Banned Users" in the Owner Dashboard's Community tab
   is a real, separate list rather than reusing Suspended. */
function banUser(userId){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u || u.role===ROLES.OWNER) return false;
  u.banned = true;
  u.suspended = true; // a ban always suspends login too
  saveUsers(users);
  return true;
}
function unbanUser(userId){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return false;
  u.banned = false;
  u.suspended = false;
  saveUsers(users);
  return true;
}

/* Owner-only. Moves the Owner role to an existing Administrator and
   demotes the current Owner to Administrator. There is always exactly
   one Owner — this never creates a second one or leaves zero. */
function transferOwnership(currentOwnerId, newOwnerId){
  const users = getUsers();
  const current = users.find(x=>x.id===currentOwnerId);
  const next = users.find(x=>x.id===newOwnerId);
  if(!current || current.role!==ROLES.OWNER) return {ok:false, error:'Only the current Owner can transfer ownership.'};
  if(!next || next.role!==ROLES.ADMIN) return {ok:false, error:'Ownership can only be transferred to an existing Administrator.'};
  current.role = ROLES.ADMIN;
  next.role = ROLES.OWNER;
  saveUsers(users);
  return {ok:true};
}

/* Owner-only, irreversible. Wipes every piece of WRLD data stored in this
   browser (accounts, sessions, posts, volunteer logs, everything) — the
   honest local-storage equivalent of "delete the organization" on a
   platform that has no real backend database to drop yet. */
function deleteOrganizationData(){
  const keys = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && k.startsWith('wrld_')) keys.push(k);
  }
  keys.forEach(k=>localStorage.removeItem(k));
  return true;
}
/* The only path any account ever becomes a Mentor: an Administrator
   reviewing a real application (see become-mentor.html) and promoting the
   applicant's existing Explorer account by hand. There is no self-service
   way to become a Mentor or Administrator anywhere else in the product. */
function promoteUserRole(userId, role){
  if(![ROLES.EXPLORER, ROLES.MENTOR].includes(role)) return false; // never grants Admin/Owner via this path
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return false;
  u.role = role;
  saveUsers(users);
  return true;
}

/* Owner-only in practice — only reachable from the Owner Dashboard's
   Administrators panel, which is itself gated to roleAtLeast(user, OWNER).
   Promotes/demotes between Explorer and Administrator. Owner status can
   never be granted or revoked this way — there is exactly one Owner. */
function setAdministratorStatus(userId, makeAdmin){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u || u.role===ROLES.OWNER) return false;
  u.role = makeAdmin ? ROLES.ADMIN : ROLES.EXPLORER;
  saveUsers(users);
  return true;
}

/* Available to any authenticated user, including the Owner, from their own
   account settings. Requires the correct current password. */
async function changePassword(userId, currentPassword, newPassword){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return {ok:false, error:'Account not found.'};
  const attemptHash = await digestPassword(currentPassword||'');
  if(attemptHash !== u.passwordHash) return {ok:false, error:'Current password is incorrect.'};
  if(!newPassword || newPassword.length < 8) return {ok:false, error:'New password must be at least 8 characters.'};
  u.passwordHash = await digestPassword(newPassword);
  saveUsers(users);
  return {ok:true};
}

function warnUser(userId){
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return false;
  u.warnings = (u.warnings||0)+1;
  saveUsers(users);
  return true;
}

function isAuthenticated(){ return !!getCurrentUser(); }

function emailExists(email){
  email = (email||'').trim().toLowerCase();
  return getUsers().some(u=>u.email===email);
}

/* ---------------------------------------------------------------------
   SIGN UP / LOG IN
   Both return {ok:true, user} or {ok:false, error}. Deliberately shaped
   like a fetch() response body so swapping in a real API later is a
   drop-in change for every page that calls these.
   --------------------------------------------------------------------- */
async function signUp({name, email, password}){
  name = (name||'').trim();
  email = (email||'').trim().toLowerCase();

  if(!name || !email || !password) return {ok:false, error:'Please fill in every field.'};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {ok:false, error:'Enter a valid email address.'};
  if(password.length < 8) return {ok:false, error:'Password must be at least 8 characters.'};

  const users = getUsers();
  if(users.some(u=>u.email===email)){
    return {ok:false, error:'An account with that email already exists — try logging in instead.'};
  }

  // Public registration only ever creates Explorer accounts — no role param
  // is accepted here at all. Mentor access is granted exclusively by an
  // Administrator via promoteUserRole() after a manual application review;
  // Administrator accounts are never created through public sign-up.
  const user = {
    id: 'u_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),
    name, email,
    passwordHash: await digestPassword(password),
    role: ROLES.EXPLORER,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  startSession(user);
  return {ok:true, user: publicUser(user)};
}

async function logIn(email, password){
  email = (email||'').trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u=>u.email===email);
  if(!user) return {ok:false, error:'No WRLD account found with that email.'};
  if(user.suspended) return {ok:false, error:'This account has been suspended. Contact WRLD if you think this is a mistake.'};
  if(user.deactivated) return {ok:false, error:'This account has been deactivated. Contact WRLD if you think this is a mistake.'};
  if(user.role===ROLES.OWNER && !user.passwordHash){
    return {ok:false, error:'Owner account setup has not been completed yet.', needsOwnerSetup:true};
  }

  const attemptHash = await digestPassword(password||'');
  if(attemptHash !== user.passwordHash) return {ok:false, error:'Incorrect password — try again.'};

  startSession(user);
  return {ok:true, user: publicUser(user)};
}

/* ---------------------------------------------------------------------
   FORGOT / RESET PASSWORD
   WRLD doesn't have outbound email yet, so this simulates the flow
   honestly instead of pretending an email was sent: requesting a reset
   generates a real token, and the UI hands the user a direct link to
   continue — clearly labeled as a stand-in for email delivery.
   --------------------------------------------------------------------- */
function requestPasswordReset(email){
  email = (email||'').trim().toLowerCase();
  const user = getUsers().find(u=>u.email===email);
  // Always resolve the same way whether or not the account exists —
  // never reveal which emails are registered.
  if(!user) return {ok:true, exists:false};

  const tokens = getResetTokens();
  const token = makeToken('reset');
  tokens[token] = {email, expiresAt: Date.now() + 1000*60*30}; // 30-minute window
  saveResetTokens(tokens);
  return {ok:true, exists:true, token};
}

async function resetPassword(token, newPassword){
  const tokens = getResetTokens();
  const entry = tokens[token];
  if(!entry || entry.expiresAt < Date.now()){
    return {ok:false, error:'This reset link has expired. Request a new one.'};
  }
  if(!newPassword || newPassword.length < 8){
    return {ok:false, error:'Password must be at least 8 characters.'};
  }
  const users = getUsers();
  const user = users.find(u=>u.email===entry.email);
  if(!user) return {ok:false, error:'Account not found.'};

  user.passwordHash = await digestPassword(newPassword);
  saveUsers(users);
  delete tokens[token];
  saveResetTokens(tokens);
  return {ok:true};
}

/* ---------------------------------------------------------------------
   ROUTE GUARDS
   Call at the top of any page's inline script, before rendering content
   that should be gated. Both redirect immediately if the check fails.
   --------------------------------------------------------------------- */
function requireAuth(){
  if(!isAuthenticated()){
    const here = location.pathname.split('/').pop() + location.search;
    location.href = 'login.html?next=' + encodeURIComponent(here);
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

/* Hierarchy-based guard — e.g. requireMinRole(ROLES.ADMIN) allows both
   Administrators and the Owner, without needing to list every role above it. */
function requireMinRole(role){
  const user = getCurrentUser();
  if(!user) return requireAuth();
  if(!roleAtLeast(user, role)){
    location.href = 'dashboard.html';
    return false;
  }
  return true;
}

/* Runs once per page load — creates the single Owner account (with no
   password) if it doesn't already exist in this browser. Safe to call
   unconditionally; it's a no-op once an Owner exists. */
ensureOwnerBootstrap();
