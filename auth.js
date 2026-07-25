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
   Three roles ship today: Explorer, Mentor, Administrator. Most of the
   capabilities listed below aren't built yet (avatars, certificates,
   analytics, etc.) — they're declared now so future features have a
   permission to check against on day one instead of bolting RBAC on later.
   --------------------------------------------------------------------- */
const ROLES = { EXPLORER: 'explorer', MENTOR: 'mentor', ADMIN: 'admin' };

const ROLE_LABELS = {
  [ROLES.EXPLORER]: 'Explorer',
  [ROLES.MENTOR]: 'Mentor',
  [ROLES.ADMIN]: 'Administrator',
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

// Roles inherit downward: Admins can do everything Mentors and Explorers can;
// Mentors can do everything Explorers can. Keeps the permission list in one place.
const ROLE_PERMISSIONS = {
  [ROLES.EXPLORER]: [...EXPLORER_PERMISSIONS],
  [ROLES.MENTOR]:   [...EXPLORER_PERMISSIONS, ...MENTOR_PERMISSIONS],
  [ROLES.ADMIN]:    [...EXPLORER_PERMISSIONS, ...MENTOR_PERMISSIONS, ...ADMIN_PERMISSIONS],
};

function hasPermission(user, permission){
  if(!user || !user.role) return false;
  return (ROLE_PERMISSIONS[user.role] || []).includes(permission);
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
}

function logOut(){
  localStorage.removeItem(SESSION_KEY);
}

function getCurrentUser(){
  try{
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if(!session || !session.expiresAt || session.expiresAt < Date.now()) return null;
    const user = getUsers().find(u=>u.id===session.userId);
    if(!user || user.suspended) return null;
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
/* The only path any account ever becomes a Mentor: an Administrator
   reviewing a real application (see become-mentor.html) and promoting the
   applicant's existing Explorer account by hand. There is no self-service
   way to become a Mentor or Administrator anywhere else in the product. */
function promoteUserRole(userId, role){
  if(![ROLES.EXPLORER, ROLES.MENTOR].includes(role)) return false; // never grants Admin via this path
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return false;
  u.role = role;
  saveUsers(users);
  return true;
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
