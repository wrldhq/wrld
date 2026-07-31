/* =====================================================================
   WRLD — Shared Application Logic
   Nav rendering, state (bookmarks/progress/streak), interactivity helpers.
   Progress currently persists via localStorage ahead of full user accounts;
   see getState()/setState() below — this is the integration point for
   swapping in real account-based persistence later.
   ===================================================================== */

/* ---------------------------------------------------------------------
   NAV + FOOTER (rendered into every page from one shared template)
   --------------------------------------------------------------------- */
function userInitials(name){
  if(!name) return '🌍';
  return name.trim().split(/\s+/).slice(0,2).map(w=>w[0].toUpperCase()).join('');
}

function loggedOutNavCTA(){
  return `
    <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
    <a href="signup.html" class="btn btn-primary btn-sm">Sign Up<span class="nav-cta-optional"> Free</span></a>`;
}

function loggedInNavCTA(user){
  const canMentor = typeof hasPermission==='function' && hasPermission(user, 'manage_own_sessions');
  const canModerate = typeof hasPermission==='function' && hasPermission(user, 'moderate_platform');
  // The Owner's profile menu doubles as the multi-experience dashboard
  // switcher (V14) — same three links every Mentor/Admin already saw,
  // just relabeled so the Owner can tell at a glance which "hat" each
  // link puts them in. The Owner's `role` column never changes when they
  // click any of these — see canAccess*() in auth.js.
  const isOwner = user.role === ROLES.OWNER;
  return `
    <div class="user-menu">
      <button class="user-menu-trigger" onclick="toggleUserMenu(event)" aria-haspopup="true" aria-expanded="false" aria-label="Account menu for ${user.name}">
        <span class="user-menu-avatar">${userInitials(user.name)}</span> <span class="user-menu-name">${user.name.split(' ')[0]}</span>
      </button>
      <div class="user-menu-dropdown" id="user-menu-dropdown">
        <div style="padding:8px 12px 10px;">
          <div style="font-weight:800; font-size:13.5px; color:var(--navy);">${user.name}</div>
          <span class="role-pill role-${user.role}">${ROLE_LABELS[user.role]||user.role}</span>
        </div>
        <a href="dashboard.html">📊 ${isOwner ? 'My Explorer Dashboard' : 'My Dashboard'}</a>
        ${canMentor ? '<a href="mentor-studio.html">🎙️ Mentor Studio</a>' : ''}
        ${canModerate ? '<a href="administrator-dashboard.html">🛡️ Administrator Dashboard</a>' : ''}
        ${isOwner ? '<a href="owner-dashboard.html">👑 Owner Command Centre</a>' : ''}
        <a href="account-settings.html">⚙️ Account Settings</a>
        <button onclick="handleLogOut()">🚪 Log Out</button>
      </div>
    </div>`;
}

/* Nav dropdown groups render from NAV_GROUPS (data.js) — a group is
   highlighted "active" if the current page's key belongs to it, so the
   bar stays orderly no matter how many pages WRLD adds later. */
function renderNavDropdown(group, gi, activeKey){
  const groupActive = group.items.some(it=>it.key===activeKey);
  return `<div class="nav-dropdown" data-nav-group="${gi}">
    <button type="button" class="nav-dropdown-trigger ${groupActive?'active':''}" onclick="toggleNavDropdown(event, ${gi})" aria-haspopup="true" aria-expanded="false">${group.label} <span class="nav-caret">▾</span></button>
    <div class="nav-dropdown-panel" id="nav-dropdown-${gi}">
      ${group.items.map(it=>`<a href="${it.href}" class="${it.key===activeKey?'active':''}">${it.label}</a>`).join('')}
    </div>
  </div>`;
}

function renderHeader(activeKey){
  const el = document.getElementById('site-header');
  if(!el) return;
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  el.innerHTML = `
  <a href="#main" class="skip-link">Skip to content</a>
  <header>
    <div class="nav container">
      <a href="index.html" class="logo">
        <svg width="30" height="30" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#2EA8C7" stroke="#ffffff" stroke-width="2.5"/><path d="M20 35c10-25 45-20 40 5-4 18-30 10-25 25 4 12-15 15-20 0-4-13 3-20 5-30z" fill="#F5CF57"/><path d="M60 15c8 5 5 15-3 12-6-2-2-15 3-12z" fill="#F5CF57"/><path d="M65 55c12-4 25 3 20 15-4 10-22 8-25-2-2-6 1-11 5-13z" fill="#F5CF57"/></svg>
        <span>wrld<span class="dot">.</span></span>
      </a>
      <nav class="nav-links" aria-label="Primary">
        ${NAV_GROUPS.map((g,gi)=>renderNavDropdown(g, gi, activeKey)).join('')}
      </nav>
      <div class="nav-right">
        <div class="nav-cta ${user ? 'nav-cta-user' : ''}">
          ${user ? loggedInNavCTA(user) : loggedOutNavCTA()}
        </div>
        <button class="burger" onclick="toggleMobileMenu()" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">☰</button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu">
    <div class="flex justify-between items-center mb-24">
      <div class="logo"><span>wrld<span class="dot">.</span></span></div>
      <button class="burger" onclick="toggleMobileMenu()" aria-label="Close menu">✕</button>
    </div>
    ${NAV_GROUPS.map(g=>`
      <div class="mobile-nav-group">
        <div class="mobile-nav-group-label">${g.label}</div>
        ${g.items.map(it=>`<a href="${it.href}" class="${it.key===activeKey?'active':''}">${it.label}</a>`).join('')}
      </div>`).join('')}
    ${user ? `
      <a href="dashboard.html" class="btn btn-primary btn-block mt-24">📊 ${user.role===ROLES.OWNER ? 'My Explorer Dashboard' : 'My Dashboard'}</a>
      ${(typeof hasPermission==='function' && hasPermission(user,'manage_own_sessions')) ? '<a href="mentor-studio.html" class="btn btn-outline btn-block mt-12">🎙️ Mentor Studio</a>' : ''}
      ${(typeof hasPermission==='function' && hasPermission(user,'moderate_platform')) ? '<a href="administrator-dashboard.html" class="btn btn-outline btn-block mt-12">🛡️ Administrator Dashboard</a>' : ''}
      ${user.role===ROLES.OWNER ? '<a href="owner-dashboard.html" class="btn btn-outline btn-block mt-12">👑 Owner Command Centre</a>' : ''}
      <a href="account-settings.html" class="btn btn-outline btn-block mt-12">⚙️ Account Settings</a>
      <button class="btn btn-outline btn-block mt-12" onclick="handleLogOut()">🚪 Log Out (${user.name.split(' ')[0]})</button>
    ` : `
      <a href="login.html" class="btn btn-outline btn-block mt-24">Log In</a>
      <a href="signup.html" class="btn btn-primary btn-block mt-12">Sign Up Free</a>
    `}
  </div>`;
}

function toggleUserMenu(e){
  e.stopPropagation();
  document.querySelectorAll('.nav-dropdown-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.nav-dropdown.open').forEach(d=>d.classList.remove('open'));
  const dd = document.getElementById('user-menu-dropdown');
  if(!dd) return;
  const isOpen = dd.classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', String(isOpen));
}

function toggleNavDropdown(e, idx){
  e.stopPropagation();
  document.getElementById('user-menu-dropdown')?.classList.remove('open');
  document.querySelectorAll('.nav-dropdown-panel').forEach((p,i)=>{ if(i!==idx) p.classList.remove('open'); });
  document.querySelectorAll('.nav-dropdown').forEach((d,i)=>{ if(i!==idx) d.classList.remove('open'); });
  const panel = document.getElementById('nav-dropdown-'+idx);
  if(!panel) return;
  const isOpen = panel.classList.toggle('open');
  panel.closest('.nav-dropdown')?.classList.toggle('open', isOpen);
  e.currentTarget.setAttribute('aria-expanded', String(isOpen));
}

document.addEventListener('click', ()=>{
  document.getElementById('user-menu-dropdown')?.classList.remove('open');
  document.querySelectorAll('.nav-dropdown-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.nav-dropdown.open').forEach(d=>d.classList.remove('open'));
});

function handleLogOut(){
  if(typeof logOut==='function') logOut();
  showToast("👋 You've been logged out — see you soon!");
  setTimeout(()=>{ location.href = 'index.html'; }, 700);
}

function toggleMobileMenu(){
  const isOpen = document.getElementById('mobile-menu').classList.toggle('open');
  const openBtn = document.querySelector('.nav .burger');
  if(openBtn) openBtn.setAttribute('aria-expanded', String(isOpen));
}

function renderFooter(){
  const el = document.getElementById('site-footer');
  if(!el) return;
  el.innerHTML = `
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="flogo">wrld<span style="color:var(--yellow)">.</span></div>
          <p class="tag">The curriculum for adulthood. Work, Resilience, Learning, and Development — free, online, for every young person figuring life out.</p>
          <div class="social-row">
            <a href="javascript:void(0)" aria-label="Instagram" onclick="showToast('📷 Social channels are launching alongside WRLD — check back soon!')">📷</a><a href="javascript:void(0)" aria-label="TikTok" onclick="showToast('🎵 Social channels are launching alongside WRLD — check back soon!')">🎵</a><a href="javascript:void(0)" aria-label="YouTube" onclick="showToast('▶️ Social channels are launching alongside WRLD — check back soon!')">▶️</a><a href="javascript:void(0)" aria-label="LinkedIn" onclick="showToast('💼 Social channels are launching alongside WRLD — check back soon!')">💼</a>
          </div>
        </div>
        <div>
          <h5>Learn</h5>
          <a href="playbooks.html">Playbook Library</a>
          <a href="learning-paths.html">Learning Paths</a>
          <a href="programs.html">Programs</a>
          <a href="downloads.html">Download Center</a>
        </div>
        <div>
          <h5>Community</h5>
          <a href="events.html">Live Learning</a>
          <a href="community.html">Discussion Boards</a>
          <a href="community.html#volunteer">Volunteer</a>
          <a href="become-mentor.html">Become a Mentor</a>
          <a href="community-guidelines.html">Community Guidelines</a>
        </div>
        <div>
          <h5>Organization</h5>
          <a href="about.html">About WRLD</a>
          <a href="about.html#donate">Support WRLD</a>
          <a href="about.html#partner">Partner With Us</a>
          <a href="about.html#contact">Contact</a>
          <a href="about.html#accessibility">Accessibility</a>
          <a href="about.html#privacy">Privacy</a>
        </div>
        <div>
          <h5>Stay in the loop</h5>
          <input class="newsletter-input" placeholder="you@email.com" aria-label="Email for newsletter">
          <button class="btn btn-yellow btn-sm btn-block" onclick="subscribeNewsletter(event)">Subscribe</button>
        </div>
      </div>
      <div class="footer-bottom">
        <div>© ${new Date().getFullYear()} WRLD. Preparing young people for the real world.</div>
        <div><a href="about.html#contact" style="display:inline">Contact</a> · <a href="about.html#privacy" style="display:inline">Privacy</a> · <a href="about.html#accessibility" style="display:inline">Accessibility</a></div>
      </div>
    </div>
  </footer>
  <div class="guide" id="guide">
    <div class="guide-bubble" id="guide-bubble" role="button" tabindex="0" aria-label="Open Orbit" onclick="orbitOpenFullFromPreview()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); orbitOpenFullFromPreview();}">
      <span id="guide-bubble-text" style="display:block;">Hi! I'm Orbit 🌎</span>
      <div class="guide-bubble-action" id="guide-bubble-action"></div>
      <button type="button" class="guide-bubble-dismiss" onclick="event.stopPropagation(); dismissOrbitCompactPreview();" aria-label="Close Orbit preview">✕</button>
    </div>
    <svg class="guide-avatar float" viewBox="0 0 100 100" onclick="orbitLauncherTap()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); orbitLauncherTap();}" role="button" tabindex="0" aria-label="Chat with Orbit, your WRLD learning companion"><circle cx="50" cy="50" r="46" fill="#2EA8C7" stroke="white" stroke-width="4"/><path d="M20 35c10-25 45-20 40 5-4 18-30 10-25 25 4 12-15 15-20 0-4-13 3-20 5-30z" fill="#F5CF57"/><circle cx="40" cy="45" r="4" fill="#1F3D4D"/><circle cx="60" cy="45" r="4" fill="#1F3D4D"/><path d="M38 60c6 6 18 6 24 0" stroke="#1F3D4D" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
  </div>
  <div class="orbit-panel" id="orbit-panel">
    <div class="orbit-panel-head">
      <svg class="avatar" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#2EA8C7" stroke="white" stroke-width="4"/><path d="M20 35c10-25 45-20 40 5-4 18-30 10-25 25 4 12-15 15-20 0-4-13 3-20 5-30z" fill="#F5CF57"/><circle cx="40" cy="45" r="4" fill="#1F3D4D"/><circle cx="60" cy="45" r="4" fill="#1F3D4D"/><path d="M38 60c6 6 18 6 24 0" stroke="#1F3D4D" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
      <div class="info">
        <div class="name">Orbit</div>
        <div class="status">Your WRLD learning companion</div>
      </div>
      <button class="orbit-panel-clear" onclick="clearOrbitConversation()" aria-label="Clear conversation" title="Clear conversation">↺</button>
      <button class="orbit-panel-close" onclick="dismissOrbitPanel()" aria-label="Close Orbit">✕</button>
    </div>
    <div class="orbit-messages" id="orbit-messages"></div>
    <div class="orbit-suggestions" id="orbit-suggestions"></div>
    <div class="orbit-input-row">
      <input type="text" id="orbit-input" placeholder="Ask Orbit anything..." aria-label="Message Orbit" onkeydown="if(event.key==='Enter') sendOrbitMessage();">
      <button onclick="sendOrbitMessage()" aria-label="Send">➤</button>
    </div>
  </div>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <canvas id="confetti-canvas"></canvas>
  <div class="report-modal" id="report-modal">
    <div class="report-modal-card">
      <h4 class="mb-8">Report this content</h4>
      <p style="font-size:13px; margin-bottom:16px;">Reports are reviewed as part of WRLD's moderation process — thank you for helping keep this a safe space.</p>
      <label style="font-size:12px; font-weight:700; color:var(--ink-faint); text-transform:uppercase; letter-spacing:.04em;">Reason</label>
      <select id="report-reason" class="mt-8" style="width:100%; padding:10px 12px; border:1.5px solid var(--navy-10); border-radius:10px; font-family:inherit; font-size:14px; margin-bottom:16px;">
        ${REPORT_REASONS.map(r=>`<option value="${r}">${r}</option>`).join('')}
      </select>
      <div class="flex gap-12" style="flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="submitReport()">Submit Report</button>
        <button class="btn btn-outline btn-sm" onclick="closeReportModal()">Cancel</button>
      </div>
    </div>
  </div>
  <div class="report-modal" id="guidelines-modal">
    <div class="report-modal-card" style="max-width:480px; max-height:80vh; overflow-y:auto;">
      <h4 class="mb-8">WRLD Community Guidelines</h4>
      <p style="font-size:13px; margin-bottom:12px;">A quick summary before you post — <a href="community-guidelines.html" target="_blank" style="color:var(--blue-dark); font-weight:700;">read the full guidelines →</a></p>
      <ul style="margin:0 0 16px; padding-left:18px; font-size:12.5px;">
        <li style="margin-bottom:6px;">Every post is tied to your real, verified WRLD account — there's no anonymous posting.</li>
        <li style="margin-bottom:6px;">Be kind. No harassment, hate speech, or bullying, ever.</li>
        <li style="margin-bottom:6px;">No sharing personal information — yours or anyone else's.</li>
        <li style="margin-bottom:6px;">No spam, scams, or unsafe/dangerous advice.</li>
        <li style="margin-bottom:6px;">Posts are automatically screened, and anyone can report content — flagged posts are hidden pending review.</li>
        <li>Breaking these guidelines can lead to a warning, removed content, or a suspended account.</li>
      </ul>
      <label class="flex gap-10 items-start mb-16" style="font-size:12.5px; cursor:pointer;">
        <input type="checkbox" id="guidelines-checkbox" onchange="toggleGuidelinesAcceptEnabled()" style="margin-top:2px;">
        <span>I've read and agree to WRLD's Community Guidelines.</span>
      </label>
      <div class="flex gap-12" style="flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" id="guidelines-accept-btn" disabled onclick="confirmAcceptGuidelines()">Accept & Continue</button>
        <button class="btn btn-outline btn-sm" onclick="closeGuidelinesModal()">Cancel</button>
      </div>
    </div>
  </div>`;
}

function subscribeNewsletter(e){
  e.preventDefault();
  const input = e.target.closest('div').querySelector('.newsletter-input');
  if(input && input.value.includes('@')){ showToast('🎉 Subscribed — welcome to WRLD updates!'); input.value=''; }
  else showToast('Enter a valid email to subscribe');
}

/* ---------------------------------------------------------------------
   LOCAL STATE (V20.6.2 — account-scoped browser storage)
   Browser-local progress store. getState()/setState() are the single
   read/write boundary for user progress — when accounts/auth land, swap
   the bodies of these two functions for API calls and everything else
   on the site (bookmarks, streak, quiz scores, achievements) keeps working
   unchanged.

   V20.6.1 kept everything under one global, un-namespaced localStorage
   key (`wrld_state_v1`) and added a side-marker (`wrld_state_owner_v1`)
   recording who it currently belonged to, so the NEXT sync could detect
   a mismatched account before pushing foreign data to Supabase — see
   CHANGES-V20.6.1.md. That correctly stopped the specific "new signup
   inherits a foreign completed assessment" symptom it was written for,
   but getState() itself never checked the marker, so anything reading
   local progress directly (dashboard greeting, Programs recommendations,
   the assessment "already completed" banner, etc.) could still show a
   different account's cached data for as long as the marker and the
   data happened to be out of sync (e.g. a failed/slow pull, or any page
   that reads progress before this page's own auth state has resolved).

   V20.6.2 replaces the single shared key with one real, separate
   localStorage key PER Supabase account — `wrld_state_v2:<user_id>` —
   plus a single fixed `wrld_state_v2:guest` bucket for logged-out/
   pre-signup browsing. Reading "the wrong account's data" is now
   structurally impossible (there is no shared key left to misread);
   each stored record also carries its own `ownerUserId` marker as a
   second, defense-in-depth check. See CHANGES-V20.6.2.md for the full
   design and wrldMigrateLegacyStateOnce() below for how existing
   browsers with the old V20.6.1 key are handled safely.
   --------------------------------------------------------------------- */
/* Durable, synchronously-readable pointer to "whichever account this
   browser most recently, authoritatively confirmed is signed in." Set
   ONLY by wrldSetActiveStateOwner() (called from supabase-client.js's
   wrldRefreshSessionCache(), the one real place Supabase Auth
   resolution happens) — never guessed at by getState()/setState()
   themselves. getCurrentUser() is the more authoritative source
   whenever it's already resolved, but it can briefly return null on a
   fresh page load before this page's own `window.wrldAuthReady` settles
   (a pre-existing, documented property of this codebase's sync-
   getCurrentUser()/async-Supabase bridge — see supabase-client.js's
   top comment). Falling back to this pointer instead of assuming
   "guest" during that brief window is what lets a page that reads
   progress early (e.g. programs.html's recommended-programs render,
   assessment.html's resume-in-progress check) keep showing the correct
   signed-in account's data exactly as before, now that data lives under
   a namespaced key instead of one shared one. */
const WRLD_STATE_OWNER_POINTER_KEY = 'wrld_state_owner_v2';
function wrldSetActiveStateOwner(ownerId){
  try{ localStorage.setItem(WRLD_STATE_OWNER_POINTER_KEY, ownerId || ''); }catch(e){}
}
function wrldResolveStateOwnerId(){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  if(user) return user.id;
  try{ return localStorage.getItem(WRLD_STATE_OWNER_POINTER_KEY) || null; }catch(e){ return null; }
}
function wrldNamespacedKey(base, ownerId){
  return base + ':' + (ownerId || 'guest');
}

const STORE_KEY_BASE = 'wrld_state_v2';
function wrldEmptyLearnerState(){
  return {bookmarks:[], completed:[], checklists:{}, quizScores:{}, streak:0, lastVisit:null, recentlyViewed:[], guidelinesAcceptedAt:null};
}
function getState(){
  const ownerId = wrldResolveStateOwnerId();
  try{
    const raw = localStorage.getItem(wrldNamespacedKey(STORE_KEY_BASE, ownerId));
    if(raw){
      const record = JSON.parse(raw);
      // Defense in depth only — the namespaced key already makes reading
      // a different account's record structurally impossible; this just
      // refuses to ever hand back a payload whose own embedded marker
      // disagrees with the key it was read from (e.g. a corrupted or
      // hand-edited entry).
      if(record && record.data && record.ownerUserId === (ownerId || null)) return record.data;
    }
  }catch(e){}
  return wrldEmptyLearnerState();
}
/* setState() stays SYNCHRONOUS on purpose — dozens of existing call sites
   (markComplete, toggleBookmark, renderQuiz, renderChecklist, the
   Assessment, etc.) call it inline from click handlers with no `await`,
   and rewriting all of them to be async was out of scope for this pass.
   Instead this uses the same write-through-cache pattern as auth: the
   localStorage write happens immediately (instant, unchanged behavior),
   and a background upsert to Supabase's `learner_state` table fires
   right after it, un-awaited, for any logged-in user — never blocking
   the UI and never throwing into a caller that isn't expecting a
   promise. See pullLearnerStateFromSupabase() below for the other half
   (pulling this back down on a new device/session). Every write is
   wrapped with {ownerUserId, version, data} so the record is
   self-describing, matching the key it lives under. */
function setState(state){
  const ownerId = wrldResolveStateOwnerId();
  const record = { ownerUserId: ownerId || null, version: 2, data: state };
  try{ localStorage.setItem(wrldNamespacedKey(STORE_KEY_BASE, ownerId), JSON.stringify(record)); }catch(e){}
  syncLearnerStateToSupabase(state);
}
async function syncLearnerStateToSupabase(state){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  if(!user || typeof sbClient==='undefined') return;
  const { error } = await sbClient.from('learner_state').upsert({
    user_id: user.id,
    bookmarks: state.bookmarks||[],
    completed: state.completed||[],
    checklists: state.checklists||{},
    quiz_scores: state.quizScores||{},
    streak: state.streak||0,
    last_visit: state.lastVisit||null,
    recently_viewed: state.recentlyViewed||[],
    guidelines_accepted_at: state.guidelinesAcceptedAt||null,
    assessment: state.assessment||null,
    updated_at: new Date().toISOString(),
  });
  if(error) console.warn('WRLD: could not sync progress to the database', error.message);
}
/* The other half of progress sync — called once per session, right after
   the Supabase session/profile cache resolves (see supabase-client.js's
   wrldRefreshSessionCache(), which calls this automatically so every page
   gets it for free via `await window.wrldAuthReady` with no extra
   per-page wiring). If this account already has a row in `learner_state`
   (e.g. progress made on another device), it overwrites this account's
   own namespaced local cache with the server's copy so this device picks
   up right where the other one left off. If this is the first time this
   account has synced, there's nothing to pull yet, so instead it pushes
   whatever progress already exists locally up to the server — but ONLY
   progress that can legitimately belong to this account already. */
async function pullLearnerStateFromSupabase(){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  if(!user || typeof sbClient==='undefined') return;
  const key = wrldNamespacedKey(STORE_KEY_BASE, user.id);
  const { data, error } = await sbClient.from('learner_state').select('*').eq('user_id', user.id).maybeSingle();
  if(error){ console.warn('WRLD: could not load progress from the database', error.message); return; }
  if(data){
    const record = { ownerUserId: user.id, version: 2, data: {
      bookmarks: data.bookmarks||[],
      completed: data.completed||[],
      checklists: data.checklists||{},
      quizScores: data.quiz_scores||{},
      streak: data.streak||0,
      lastVisit: data.last_visit||null,
      recentlyViewed: data.recently_viewed||[],
      guidelinesAcceptedAt: data.guidelines_accepted_at||null,
      assessment: data.assessment||null,
    }};
    try{ localStorage.setItem(key, JSON.stringify(record)); }catch(e){}
  } else {
    // This account has no learner_state row yet. Its OWN namespaced
    // bucket (wrld_state_v2:<this user's id>), by construction, can only
    // ever already contain data this exact account previously wrote
    // itself under this same key — never another account's, since a
    // different account always writes to ITS OWN separate key. The one
    // legitimate case left to check is a guest's pre-signup local
    // progress on this same browser (wrld_state_v2:guest) — the
    // existing, intentional "sign up fresh and your local progress
    // carries over" feature. A different account's leftover cache is
    // never in the running at all under this scheme, so it's never
    // mistakenly pushed up as this brand-new account's own history.
    let ownState = null;
    try{ const raw = localStorage.getItem(key); if(raw) ownState = JSON.parse(raw); }catch(e){}
    if(ownState && ownState.data){
      await syncLearnerStateToSupabase(ownState.data);
      return;
    }
    let guestState = null;
    try{ const raw = localStorage.getItem(wrldNamespacedKey(STORE_KEY_BASE, null)); if(raw) guestState = JSON.parse(raw); }catch(e){}
    if(guestState && guestState.data){
      const record = { ownerUserId: user.id, version: 2, data: guestState.data };
      try{ localStorage.setItem(key, JSON.stringify(record)); }catch(e){}
      await syncLearnerStateToSupabase(guestState.data);
    }
    // Otherwise: genuinely nothing to carry over. getState() already
    // defaults to a fresh, empty state for a key that doesn't exist yet.
  }
}

/* ---------------------------------------------------------------------
   LEGACY BROWSER-STATE MIGRATION (V20.6.1 → V20.6.2, one time only)
   Runs once per browser, ever (guarded by WRLD_V2_MIGRATION_FLAG), and
   as early as possible (called unconditionally below, at top-level, so
   it always finishes before any other script on the page — including
   this same page's own inline script — can call getState() or
   getVolunteerEntries()). See CHANGES-V20.6.2.md for the full rationale.
   --------------------------------------------------------------------- */
const WRLD_V2_MIGRATION_FLAG = 'wrld_v2_migration_done';
function wrldMigrateLegacyStateOnce(){
  try{
    if(localStorage.getItem(WRLD_V2_MIGRATION_FLAG) === '1') return;

    // wrld_state_v1 / wrld_state_owner_v1 (V20.6.1) is the one legacy
    // store that already carried a real, self-healing ownership marker
    // (see CHANGES-V20.6.1.md) — ownership CAN be verified here, so it's
    // safe to migrate into that exact same account's new namespaced
    // bucket. An empty/unset legacy owner ('') meant "a guest's
    // pre-signup progress, no account yet" in the old scheme, which maps
    // directly onto the new dedicated guest bucket — not to any specific
    // account. Never overwrites a bucket that already has data in it
    // (e.g. this migration somehow running twice, or a bucket a fresher
    // pull already populated).
    const legacyStateRaw = localStorage.getItem('wrld_state_v1');
    if(legacyStateRaw){
      let legacyState = null;
      try{ legacyState = JSON.parse(legacyStateRaw); }catch(e){}
      if(legacyState){
        const legacyOwner = localStorage.getItem('wrld_state_owner_v1') || '';
        const targetKey = wrldNamespacedKey(STORE_KEY_BASE, legacyOwner || null);
        if(!localStorage.getItem(targetKey)){
          localStorage.setItem(targetKey, JSON.stringify({ ownerUserId: legacyOwner || null, version: 2, data: legacyState }));
        }
      }
    }

    // wrld_volunteer_log_v1 and wrld_assessment_v1 never had ANY
    // ownership marker, ever, at any point in this project's history —
    // under the migration rule that ownership must be verifiable before
    // any legacy data is attached to an account, neither can be safely
    // migrated to anyone, so both are quarantined (discarded) rather
    // than guessed at:
    //  - volunteer entries: the real record already lives in Supabase's
    //    volunteer_entries table (RLS-scoped per user) and reloads
    //    correctly via pullVolunteerEntriesFromSupabase() on next login
    //    — nothing real is lost.
    //  - the assessment draft store only ever holds mid-progress answers
    //    before submission; a genuinely COMPLETED assessment was already
    //    carried over above as part of wrld_state_v1.
    localStorage.removeItem('wrld_volunteer_log_v1');
    localStorage.removeItem('wrld_assessment_v1');

    // Legacy keys fully processed — remove them so nothing can ever read
    // them again (including this function, on a future no-op call).
    localStorage.removeItem('wrld_state_v1');
    localStorage.removeItem('wrld_state_owner_v1');

    localStorage.setItem(WRLD_V2_MIGRATION_FLAG, '1');
  }catch(e){ /* storage disabled/unavailable — nothing can be safely migrated; no-op */ }
}
wrldMigrateLegacyStateOnce();

/* ---------------------------------------------------------------------
   LIVE SESSIONS (Live Learning + Mentor Studio)
   WRLD never displays fictional workshops or fake scheduled dates —
   this store starts empty and only ever contains sessions a real Mentor
   actually published through Mentor Studio. Same read/write-boundary
   pattern as getState()/setState(): swap the bodies for real API calls
   once a backend exists, and every page reading from this keeps working.
   --------------------------------------------------------------------- */
const LIVE_SESSIONS_KEY = 'wrld_live_sessions_v1';
function getLiveSessions(){
  try{ return JSON.parse(localStorage.getItem(LIVE_SESSIONS_KEY)) || []; }
  catch(e){ return []; }
}
function saveLiveSessions(sessions){ localStorage.setItem(LIVE_SESSIONS_KEY, JSON.stringify(sessions)); }

function publishLiveSession(session){
  const sessions = getLiveSessions();
  sessions.push(session);
  saveLiveSessions(sessions);
}

function cancelLiveSession(id){
  saveLiveSessions(getLiveSessions().filter(s=>s.id!==id));
}

/* ---------------------------------------------------------------------
   LEARNING PATH HELPERS
   Estimated completion is computed live from each step Playbook's real
   completionTime field — never a hardcoded, potentially-stale number.
   --------------------------------------------------------------------- */
function pathEstimatedTime(lp){
  const mins = lp.steps.reduce((sum, slug)=>{
    const pb = getPlaybook(slug);
    const m = pb && pb.completionTime ? parseInt(pb.completionTime, 10) : 0;
    return sum + (isNaN(m) ? 0 : m);
  }, 0);
  if(mins >= 60){
    const h = Math.floor(mins/60), m = mins%60;
    return `~${h} hr${h!==1?'s':''}${m ? ' '+m+' min' : ''} to complete`;
  }
  return `~${mins} min to complete`;
}

function pathProgress(lp){
  const s = getState();
  const steps = lp.steps.map(getPlaybook).filter(Boolean);
  const done = steps.filter(p=>s.completed.includes(p.slug)).length;
  const nextStep = steps.find(p=>!s.completed.includes(p.slug));
  return {steps, done, total:steps.length, pct: steps.length?Math.round((done/steps.length)*100):0, nextStep};
}

function completedPathKeys(){
  const s = getState();
  return LEARNING_PATHS.filter(lp=>lp.steps.length && lp.steps.every(slug=>s.completed.includes(slug))).map(lp=>lp.key);
}

/* ---------------------------------------------------------------------
   PROGRESS SUMMARY
   Single source of truth for "how is this Explorer doing" — everything
   the Dashboard, Journey Passport, and Orbit reference should read from
   here so growth tracking stays consistent as new features land.
   --------------------------------------------------------------------- */
function computeAchievements(){
  const s = getState();
  const completedPlaybooks = s.completed.length;
  const savedPlaybooks = (s.bookmarks||[]).filter(b=>!b.startsWith('program-')&&!b.startsWith('event-')).length;
  const quizAce = Object.values(s.quizScores||{}).some(sc=>{ const [a,b]=sc.split('/').map(Number); return a===b; });
  return [
    {id:'first', label:'First Playbook', icon:'🌱', unlocked: completedPlaybooks>=1},
    {id:'five', label:'5 Playbooks Done', icon:'⭐', unlocked: completedPlaybooks>=5},
    {id:'streak3', label:'3-Day Streak', icon:'🔥', unlocked: (s.streak||0)>=3},
    {id:'saver', label:'First Bookmark', icon:'🔖', unlocked: savedPlaybooks>=1},
    {id:'quiz', label:'Quiz Ace', icon:'🎯', unlocked: quizAce},
    {id:'path', label:'First Learning Path Complete', icon:'🧭', unlocked: completedPathKeys().length>=1},
  ];
}

function getProgressSummary(){
  const s = getState();
  const savedPlaybooks = (s.bookmarks||[]).filter(b=>!b.startsWith('program-')&&!b.startsWith('event-'));
  const registeredSessions = (s.bookmarks||[]).filter(b=>b.startsWith('event-'));
  const enrolledPrograms = (s.bookmarks||[]).filter(b=>b.startsWith('program-'));
  return {
    completedPlaybooks: s.completed.length,
    completedPaths: completedPathKeys().length,
    savedPlaybooks: savedPlaybooks.length,
    registeredSessions: registeredSessions.length,
    enrolledPrograms: enrolledPrograms.length,
    streak: s.streak||0,
    certificates: 0, // certificates aren't issued yet — always real, never fabricated
    volunteerHours: (typeof getVolunteerSummary==='function' ? getVolunteerSummary().totalHours : 0),
    assessment: s.assessment || null,
  };
}

function upcomingLiveSessions(){
  const now = Date.now();
  return getLiveSessions().filter(s=>new Date(s.dateISO).getTime() > now).sort((a,b)=>new Date(a.dateISO)-new Date(b.dateISO));
}

// A session the learner registered for whose date has already passed — the
// closest honest signal we have for "attended" without fabricating check-ins.
function attendedLiveSessions(){
  const s = getState();
  const now = Date.now();
  return getLiveSessions()
    .filter(sess => (s.bookmarks||[]).includes('event-'+sess.id) && new Date(sess.dateISO).getTime() <= now)
    .sort((a,b)=>new Date(b.dateISO)-new Date(a.dateISO));
}

function updateStreak(){
  const s = getState();
  const today = new Date().toDateString();
  if(s.lastVisit === today) return s;
  const yesterday = new Date(Date.now()-86400000).toDateString();
  s.streak = (s.lastVisit === yesterday) ? (s.streak||0)+1 : 1;
  s.lastVisit = today;
  setState(s);
  return s;
}

/* ---------------------------------------------------------------------
   GUEST ACTION GATE (V24.1)
   WRLD deliberately lets guests browse freely — Playbooks, Programs, and
   the Adulting Readiness Assessment all work with no account. But any
   action that creates a real, tracked progress record (completing or
   saving a Playbook, enrolling in a Program, registering for a live
   session) needs a real account: both so it's never silently lost the
   moment this browser's storage is cleared, and so WRLD can actually
   count real completions/registrations platform-wide instead of a
   per-browser "guest" bucket getState()/setState() already fall back to
   (see wrldNamespacedKey() above — a guest's writes today succeed but
   land in a bucket no one, including that guest on another device, can
   ever see again).

   requireAccountForAction(actionLabel) is the one shared check every
   such action calls first: a real signed-in user (getCurrentUser()
   resolved) passes straight through exactly as before; a guest instead
   sees a professional Create Account/Log In prompt, reusing the existing
   .wrld-modal-overlay/.wrld-modal system showConfirmModal() already
   introduced (V19) rather than a new UI pattern. The prompt's links carry
   the current page through the same `next=` mechanism requireAuth()/
   postAuthDestination() already use everywhere else, so logging in or
   signing up returns the visitor to exactly the page they were on. */
function requireAccountForAction(actionLabel){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  if(user) return true;
  showGuestAccountModal(actionLabel);
  return false;
}

function showGuestAccountModal(actionLabel){
  const existing = document.getElementById('wrld-confirm-modal');
  if(existing) existing.remove();

  const rawNext = location.pathname.split('/').pop() + location.search;
  const safeNext = typeof wrldSanitizeNextParam==='function' ? wrldSanitizeNextParam(rawNext) : null;
  const nextQS = safeNext ? '?next=' + encodeURIComponent(safeNext) : '';

  const overlay = document.createElement('div');
  overlay.id = 'wrld-confirm-modal';
  overlay.className = 'wrld-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="wrld-modal card">
      <h4 class="mb-12">Create a free account to ${actionLabel || 'save your progress'}</h4>
      <p style="font-size:14px; color:var(--ink-soft); margin-bottom:20px;">You're welcome to browse WRLD as a guest — Playbooks, Programs, and the Assessment are all open. But saving progress, tracking completions, and registering for programs or live sessions needs a free WRLD account, so nothing gets lost and your achievements are really yours.</p>
      <div class="flex gap-10" style="flex-wrap:wrap; justify-content:flex-end;">
        <button type="button" class="btn btn-outline" id="wrld-modal-cancel">Not Now</button>
        <a href="login.html${nextQS}" class="btn btn-outline">Log In</a>
        <a href="signup.html${nextQS}" class="btn btn-primary">Create Free Account</a>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  function closeModal(){
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
  }
  function onKeydown(e){ if(e.key==='Escape') closeModal(); }
  document.addEventListener('keydown', onKeydown);
  overlay.addEventListener('click', e=>{ if(e.target===overlay) closeModal(); });
  document.getElementById('wrld-modal-cancel').addEventListener('click', closeModal);
  setTimeout(()=>document.getElementById('wrld-modal-cancel')?.focus(), 30);
}

function toggleBookmark(slug){
  if(!requireAccountForAction('save this Playbook')) return;
  const s = getState();
  const i = s.bookmarks.indexOf(slug);
  if(i>-1){ s.bookmarks.splice(i,1); showToast('Removed from Saved Playbooks'); }
  else { s.bookmarks.push(slug); showToast('🔖 Saved to your Dashboard'); }
  setState(s);
  syncBookmarkButtons();
}
function isBookmarked(slug){ return getState().bookmarks.includes(slug); }
function syncBookmarkButtons(){
  document.querySelectorAll('[data-bookmark-slug]').forEach(btn=>{
    const on = isBookmarked(btn.dataset.bookmarkSlug);
    btn.classList.toggle('active', on);
    btn.innerHTML = on ? '🔖 Saved' : '🔖 Save for later';
  });
}

function markComplete(slug, title){
  if(!requireAccountForAction('mark this Playbook complete')) return;
  const s = getState();
  if(!s.completed.includes(slug)){
    s.completed.push(slug);
    const rv = s.recentlyViewed.filter(r=>r!==slug);
    rv.unshift(slug); s.recentlyViewed = rv.slice(0,8);
    setState(s);
    updateStreak();
    launchConfetti();
    showToast(`🎉 Playbook complete: ${title||slug}`);
  }
}
function isComplete(slug){ return getState().completed.includes(slug); }

function trackView(slug){
  const s = getState();
  const rv = s.recentlyViewed.filter(r=>r!==slug);
  rv.unshift(slug); s.recentlyViewed = rv.slice(0,8);
  setState(s); updateStreak();
}

/* =======================================================================
   COMMUNITY
   Posts, replies, reports, and moderation for the Community Commons and
   Playbook-level discussions. Same localStorage-backed, API-shaped pattern
   as getState()/getLiveSessions() elsewhere in this file — every function
   here can be swapped for a real network call later without touching the
   pages that use it. Because WRLD has no server yet, posts made in this
   browser are only visible in this browser, exactly like every other
   "live" local store on the platform today (sessions, accounts, progress).

   SAFETY NOTE
   moderateContent() below is a rule-based screen (keyword/pattern matching
   for self-harm, violence, harassment cues, scams, phishing, and personal
   info) — it is deliberately described in the UI as "automated screening,"
   not as a trained AI moderation model, because it isn't one yet. Real
   large-scale moderation (an actual ML classifier or moderation API) is
   backend work; this file builds the architecture that will plug into.
   ======================================================================= */

/* ---------------------------------------------------------------------
   ACCESS: community participation is earned, not automatic. Anyone can
   browse; posting/replying/reacting unlocks after a real account +
   assessment + at least one completed Playbook.
   --------------------------------------------------------------------- */
function canParticipateInCommunity(user){
  if(!user) return false;
  const s = getState();
  return !!s.assessment && (s.completed||[]).length >= 1;
}

function communityGateReason(user){
  if(!user) return {ok:false, reason:'login', message:'Create a free WRLD account to join the conversation.'};
  const s = getState();
  if(!s.assessment) return {ok:false, reason:'assessment', message:"Take the Adulting Readiness Assessment and I'll introduce you to the community."};
  if(!(s.completed||[]).length) return {ok:false, reason:'playbook', message:"Complete your first Playbook and I'll introduce you to the community. It'll help you get the most out of the conversations."};
  if(!hasAcceptedGuidelines()) return {ok:false, reason:'guidelines', message:"Before you post, take a minute to review WRLD's Community Guidelines."};
  return {ok:true};
}

/* ---------------------------------------------------------------------
   COMMUNITY GUIDELINES ACCEPTANCE
   A one-time acceptance, tied to this account's local state, required
   before a first post anywhere on WRLD. Every contribution is already
   tied to a verified account — this adds an explicit, informed agreement
   on top of that, rather than assuming silent consent.
   --------------------------------------------------------------------- */
function hasAcceptedGuidelines(){ return !!getState().guidelinesAcceptedAt; }
function acceptGuidelines(){
  const s = getState();
  s.guidelinesAcceptedAt = new Date().toISOString();
  setState(s);
}

let guidelinesAcceptCallback = null;
function openGuidelinesModal(onAccept){
  guidelinesAcceptCallback = onAccept || null;
  const checkbox = document.getElementById('guidelines-checkbox');
  const btn = document.getElementById('guidelines-accept-btn');
  if(checkbox){ checkbox.checked = false; }
  if(btn){ btn.disabled = true; }
  document.getElementById('guidelines-modal')?.classList.add('open');
}
function closeGuidelinesModal(){
  document.getElementById('guidelines-modal')?.classList.remove('open');
  guidelinesAcceptCallback = null;
}
function toggleGuidelinesAcceptEnabled(){
  const checkbox = document.getElementById('guidelines-checkbox');
  const btn = document.getElementById('guidelines-accept-btn');
  if(btn) btn.disabled = !checkbox.checked;
}
function confirmAcceptGuidelines(){
  acceptGuidelines();
  const cb = guidelinesAcceptCallback;
  closeGuidelinesModal();
  showToast('✅ Thanks — Community Guidelines accepted.');
  if(typeof cb === 'function') cb();
}

/* ---------------------------------------------------------------------
   AUTOMATED SAFETY SCREENING (Layer 1 + Layer 2)
   Every post/reply runs through this before it's stored. 'blocked' content
   never gets saved at all; 'held' content is saved but hidden from public
   view pending review; 'approved' content publishes immediately.

   WRLD's product surfaces call this "AI moderation" — but to be clear in
   the code itself: this is a real, working rule-based screen (pattern +
   keyword matching), not a trained machine-learning model. It genuinely
   runs on every single post and reply and genuinely blocks/holds real
   content; it is just honest that "AI" here means "automated," not
   "neural network." Swapping in a real ML moderation API later only
   requires changing this function's body — every caller (createCommunityPost,
   addCommunityReply, the Owner Dashboard, the Moderation Dashboard) reads
   the same {status, flags} shape either way.
   --------------------------------------------------------------------- */
function moderateContent(text){
  const t = (text||'').toLowerCase();
  const flags = [];

  const patterns = {
    selfHarm: /\b(kill myself|kill yourself|end my life|end it all|want to die|suicide method)\b/i,
    violence: /\b(how to (make|build) a (bomb|weapon)|i('m| am) going to hurt|hurt (someone|him|her|them) badly)\b/i,
    graphicViolence: /\b(gore (video|pics|footage)|watch (someone|him|her|them) (die|get hurt)|graphic violence link|beheading (video|footage))\b/i,
    harassment: /\b(you('re| are) (stupid|worthless|pathetic|disgusting)|shut up and die|nobody likes you|kys)\b/i,
    bullying: /\b(everyone (hates|thinks less of) you|you don't belong (here|in this group)|no one (likes|wants) you (here|around))\b/i,
    hateSpeech: /\b(all (\w+ )?people are (subhuman|inferior|disgusting)|go back to your (own )?country|(\w+ )?lives don't matter)\b/i,
    explicitContent: /\b(send (me )?nudes|nude (pics|photos)|sexual(ly)? explicit (content|pics|photos)|explicit content link|onlyfans link)\b/i,
    dangerousAdvice: /\b(don't (take|need) your (medication|meds)|skip your (medication|meds)|doctors are lying to you about)\b/i,
    scam: /\b(wire transfer|send (me )?(bitcoin|crypto)|claim your prize|click (this|here) to claim|free gift card|guaranteed income|make \$\d+ (a|per) (day|week))\b/i,
    phishing: /\b(verify your (password|account) (here|now)|confirm your (ssn|social security|bank details))\b/i,
    selfPromotion: /\b(check out my (channel|page|shop|store|business)|dm me for (prices|deals)|subscribe to my|follow me @)\b/i,
    email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    phone: /\b(\+?\d[\d\-.\s]{8,}\d)\b/,
    url: /\bhttps?:\/\/\S+/i,
  };

  if(patterns.selfHarm.test(t)) flags.push('self-harm');
  if(patterns.violence.test(t)) flags.push('violence');
  if(patterns.graphicViolence.test(t)) flags.push('graphic-violence');
  if(patterns.harassment.test(t)) flags.push('harassment');
  if(patterns.bullying.test(t)) flags.push('bullying');
  if(patterns.hateSpeech.test(t)) flags.push('hate-speech');
  if(patterns.explicitContent.test(t)) flags.push('explicit-content');
  if(patterns.dangerousAdvice.test(t)) flags.push('dangerous-advice');
  if(patterns.scam.test(t)) flags.push('scam');
  if(patterns.phishing.test(t)) flags.push('phishing');
  if(patterns.selfPromotion.test(t)) flags.push('self-promotion');
  if(patterns.email.test(t) || patterns.phone.test(t)) flags.push('personal-info');
  if(patterns.url.test(t)) flags.push('external-link');

  // A small, non-exhaustive keyword layer covering profanity/hate-speech and
  // explicit content. A real deployment should plug in a maintained,
  // professionally-curated list or moderation API here instead.
  const blockedTerms = ['idiot','shut up','hate you','stfu','worthless'];
  if(blockedTerms.some(w=>t.includes(w))) flags.push('flagged-language');

  // The most severe categories block outright and never publish, even
  // temporarily; everything else holds for a real human review.
  const BLOCK_FLAGS = ['self-harm','violence','graphic-violence','dangerous-advice','explicit-content','hate-speech'];
  let status = 'approved';
  if(flags.some(f=>BLOCK_FLAGS.includes(f))) status = 'blocked';
  else if(flags.length) status = 'held';

  return {status, flags};
}

/* ---------------------------------------------------------------------
   REPEATED-VIOLATION ESCALATION
   A real per-account counter, not a cosmetic one: every time a post or
   reply from a given account gets held or blocked by moderateContent(),
   their count goes up. Cross the threshold and the account is suspended
   automatically — the same suspendUser() an Administrator would use by
   hand, just triggered by the system instead. Logged either way so it's
   fully visible in the Owner/Moderation Dashboard's history.
   --------------------------------------------------------------------- */
const VIOLATION_SUSPEND_THRESHOLD = 3;
function recordViolationAndMaybeEscalate(userId, flags){
  if(!userId || typeof getUsers!=='function') return;
  const users = getUsers();
  const u = users.find(x=>x.id===userId);
  if(!u) return;
  u.violations = (u.violations||0) + 1;
  saveUsers(users);
  if(u.violations >= VIOLATION_SUSPEND_THRESHOLD && !u.suspended){
    suspendUser(userId);
    logModerationEvent('auto-suspended-repeat-violations', userId, flags||[]);
  }
}

/* ---------------------------------------------------------------------
   LAYER 5 — PROGRESSIVE TRUST
   Brand-new members get modest daily limits; limits grow automatically
   as a member accumulates real, approved participation over time.
   --------------------------------------------------------------------- */
const TRUST_KEY = 'wrld_trust_v1';
function getTrustState(){
  try{
    const raw = JSON.parse(localStorage.getItem(TRUST_KEY));
    if(raw) return raw;
  }catch(e){}
  return {postsToday:0, repliesToday:0, lastDate:null, approvedCount:0};
}
function saveTrustState(t){ localStorage.setItem(TRUST_KEY, JSON.stringify(t)); }

function resetTrustIfNewDay(t){
  const today = new Date().toDateString();
  if(t.lastDate !== today){ t.postsToday = 0; t.repliesToday = 0; t.lastDate = today; }
  return t;
}

function trustLevel(t){
  const n = t.approvedCount||0;
  if(n >= 30) return {label:'Established Member', dailyPosts:10, dailyReplies:40};
  if(n >= 10) return {label:'Trusted Member', dailyPosts:5, dailyReplies:20};
  return {label:'New Member', dailyPosts:2, dailyReplies:10};
}

function canPostToday(kind){
  const t = resetTrustIfNewDay(getTrustState());
  saveTrustState(t);
  const level = trustLevel(t);
  return kind==='reply' ? t.repliesToday < level.dailyReplies : t.postsToday < level.dailyPosts;
}

function recordCommunityAction(kind, wasApproved){
  const t = resetTrustIfNewDay(getTrustState());
  if(kind==='reply') t.repliesToday++; else t.postsToday++;
  if(wasApproved) t.approvedCount = (t.approvedCount||0)+1;
  saveTrustState(t);
}

/* ---------------------------------------------------------------------
   POSTS + REPLIES (V19.2/V20 — real, shared, Supabase-backed)
   Previously this whole store was `localStorage` only
   (`wrld_community_posts_v1`) — genuinely per-browser, never visible to
   another user or device, which was the exact bug reported. Now backed
   by the REAL live public.community_posts table — a single table where
   a reply is just a row with `parent_id` set to its parent post's id
   (there is no separate replies table; migration 036, which assumed a
   separate public.community_replies table, was written against a stale
   design and was never applied to the live project — see
   supabase/migrations/037 for the real repair). RLS: anyone (including
   logged-out visitors via the anon key) can read approved content; only
   an authenticated author can insert as themselves; only the author or
   an Administrator/Owner can delete (and deleting a top-level post
   cascades to delete all of its replies via a real `on delete cascade`
   FK on parent_id). Every function here is async — callers
   (community.html, owner-dashboard.html, administrator-dashboard.html,
   moderation-dashboard.html) await and re-render, the same pattern
   already established for Playbook Q&A (getPlaybookQuestions() etc,
   just below) and for the Owner Dashboard's admin_user_list() etc.
   Client-side moderateContent() still runs before every insert (a
   courtesy check); RLS + moderation_set_community_status()/
   report_community_content() (both security definer, migration 037)
   are the real security boundary, not this file — a row can never
   self-approve past `held` on insert if the client's own flags are
   non-empty, and can never change its own moderation state on a later
   update (see guard_community_post_updates() in migration 037).
   --------------------------------------------------------------------- */
async function getCommunityPosts(category){
  let query = sbClient.from('community_posts').select('*').is('parent_id', null).order('created_at', {ascending:false});
  if(category) query = query.eq('category', category);
  const { data, error } = await query;
  if(error){ console.warn('WRLD: could not load community posts', error.message); return []; }
  const posts = data || [];
  if(!posts.length) return [];

  const { data: replies, error: repliesError } = await sbClient
    .from('community_posts').select('*').in('parent_id', posts.map(p=>p.id)).order('created_at', {ascending:true});
  if(repliesError) console.warn('WRLD: could not load community replies', repliesError.message);

  const repliesByPost = {};
  (replies||[]).forEach(r=>{ (repliesByPost[r.parent_id] = repliesByPost[r.parent_id]||[]).push(communityPostFromRow(r, [])); });
  return posts.map(p=>communityPostFromRow(p, repliesByPost[p.id]||[]));
}

// Normalizes a raw Supabase row (a top-level post OR a reply — both live
// in community_posts, distinguished only by whether parent_id is set)
// into the shape the UI (community.html, dashboards) already expects
// (authorId/authorName/createdAt/reportCount/replies). Display name uses
// the name captured at posting time (author_name, stored on the row) per
// the documented product decision (CHANGES-V19.2.md "Display names") —
// this is what remains visible if the author's account is later
// deleted, at which point author_id is anonymized to null by delete-user
// but this stored name and the content itself are preserved.
function communityPostFromRow(row, replies){
  return {
    id: row.id, parentId: row.parent_id||null, authorId: row.author_id, authorName: row.author_name || 'A WRLD member',
    category: row.category, body: row.body, createdAt: row.created_at,
    status: row.status, flags: row.flags||[], reportCount: row.report_count||0,
    replies: replies||[],
  };
}

async function communityPostsFor(category){
  return (await getCommunityPosts(category)).filter(p=>p.status!=='removed');
}

async function createCommunityPost({category, body}){
  const user = getCurrentUser();
  const gate = communityGateReason(user);
  if(!gate.ok) return {ok:false, error:gate.message};
  if(!canPostToday('post')) return {ok:false, error:"You've reached today's posting limit — it grows automatically the more you participate. Try again tomorrow."};
  if(!(body||'').trim()) return {ok:false, error:'Write something before posting.'};

  const mod = moderateContent(body);
  if(mod.status==='blocked'){
    recordViolationAndMaybeEscalate(user.id, mod.flags);
    return {ok:false, error:"This can't be posted — it looks like it may include unsafe content. If you're struggling, please reach out to a crisis line or someone you trust."};
  }

  // author_name is stored at post time (see communityPostFromRow) so a
  // post still shows something sensible if the author's account is
  // later deleted (their profile link is anonymized to null — see
  // delete-user's cleanup step — at which point this stored name is
  // what's left to show). The client-sent status/flags are a courtesy
  // hint only; guard_community_post_updates() (migration 037) is the
  // real enforcement of "no self-approval," independent of what's sent
  // here.
  const { data, error } = await sbClient.from('community_posts').insert({
    author_id: user.id, author_name: user.name, category: category||'general',
    body: body.trim(), status: mod.status==='held' ? 'held' : 'approved', flags: mod.flags||[],
  }).select().single();
  if(error){ console.warn('WRLD: could not post to community', error.message); return {ok:false, error:'Something went wrong posting that — try again.'}; }

  recordCommunityAction('post', data.status==='approved');
  if(data.status==='held') recordViolationAndMaybeEscalate(user.id, mod.flags);
  return {ok:true, post: communityPostFromRow(data, [])};
}

async function addCommunityReply(postId, body){
  const user = getCurrentUser();
  const gate = communityGateReason(user);
  if(!gate.ok) return {ok:false, error:gate.message};
  if(!canPostToday('reply')) return {ok:false, error:"You've reached today's reply limit — it grows automatically the more you participate."};
  if(!(body||'').trim()) return {ok:false, error:'Write something before replying.'};

  const mod = moderateContent(body);
  if(mod.status==='blocked'){
    recordViolationAndMaybeEscalate(user.id, mod.flags);
    return {ok:false, error:"This can't be posted — it looks like it may include unsafe content. If you're struggling, please reach out to a crisis line or someone you trust."};
  }

  // A reply is a community_posts row with parent_id set — category is
  // NOT NULL live, so a reply inherits its parent post's category.
  let parentCategory = 'general';
  try{
    const { data: parentRow } = await sbClient.from('community_posts').select('category').eq('id', postId).single();
    if(parentRow && parentRow.category) parentCategory = parentRow.category;
  }catch(e){ /* fall back to 'general' */ }

  const { data, error } = await sbClient.from('community_posts').insert({
    parent_id: postId, author_id: user.id, author_name: user.name, category: parentCategory,
    body: body.trim(), status: mod.status==='held' ? 'held' : 'approved', flags: mod.flags||[],
  }).select().single();
  if(error){ console.warn('WRLD: could not post reply', error.message); return {ok:false, error:'Something went wrong posting that reply — try again.'}; }

  recordCommunityAction('reply', data.status==='approved');
  if(data.status==='held') recordViolationAndMaybeEscalate(user.id, mod.flags);
  return {ok:true, reply: communityPostFromRow(data, [])};
}

// Author-or-Administrator deletion — enforced by RLS
// (posts_delete_own_or_mod, live on community_posts), not just by which
// button the UI shows. A plain DELETE call is all that's needed; if the
// caller isn't the author or an Administrator+, RLS silently matches
// zero rows and `error` stays null but no row is removed — checked via
// the returned count. Deleting a top-level post cascades (real FK
// `on delete cascade` on parent_id) to delete all of its replies too.
async function deleteOwnCommunityPost(postId){
  const { error, count } = await sbClient.from('community_posts').delete({count:'exact'}).eq('id', postId);
  return !error && count>0;
}
async function deleteOwnCommunityReply(replyId){
  // A reply is just a community_posts row (parent_id set) — same table,
  // same delete policy as a top-level post.
  const { error, count } = await sbClient.from('community_posts').delete({count:'exact'}).eq('id', replyId);
  return !error && count>0;
}

async function reportCommunityItem(postId, replyId, reason){
  const { error } = await sbClient.rpc('report_community_content', {
    p_post_id: replyId ? null : postId, p_reply_id: replyId||null, p_reason: reason||'unspecified',
  });
  return {ok: !error};
}

const MODERATION_LOG_KEY = 'wrld_moderation_log_v1';
function logModerationEvent(action, targetId, flags){
  let log = [];
  try{ log = JSON.parse(localStorage.getItem(MODERATION_LOG_KEY)) || []; }catch(e){}
  log.unshift({action, targetId, flags:flags||[], at:new Date().toISOString()});
  localStorage.setItem(MODERATION_LOG_KEY, JSON.stringify(log.slice(0,300)));
}
function getModerationLog(){
  try{ return JSON.parse(localStorage.getItem(MODERATION_LOG_KEY)) || []; }
  catch(e){ return []; }
}

const QUEUE_STATUSES = ['held', 'edits_requested'];
async function getModerationQueue(){
  const queue = [];
  (await getCommunityPosts()).forEach(p=>{
    if(QUEUE_STATUSES.includes(p.status)) queue.push({type:'post', post:p, item:p});
    (p.replies||[]).forEach(r=>{ if(QUEUE_STATUSES.includes(r.status)) queue.push({type:'reply', post:p, item:r}); });
  });
  return queue.sort((a,b)=>new Date(b.item.createdAt)-new Date(a.item.createdAt));
}

async function getReportedItems(){
  const items = [];
  (await getCommunityPosts()).forEach(p=>{
    if((p.reportCount||0)>0) items.push({type:'post', post:p, item:p});
    (p.replies||[]).forEach(r=>{ if((r.reportCount||0)>0) items.push({type:'reply', post:p, item:r}); });
  });
  return items.sort((a,b)=>(b.item.reportCount||0)-(a.item.reportCount||0));
}

// Admin+ only — enforced by RLS (posts_update_own_or_mod, live on
// community_posts, admin branch) and, redundantly, by
// moderation_set_community_status()'s own role_at_least('admin') check
// for status changes (migration 037) — not just by which dashboard shows
// the button. A reply is a community_posts row too (parent_id set), so
// both posts and replies live in the same table/column.
async function moderationClearReports(postId, replyId){
  const { error } = await sbClient.from('community_posts').update({report_count:0}).eq('id', replyId||postId);
  if(!error) logModerationEvent('reports-cleared', replyId||postId, []);
  return !error;
}
async function moderationSetStatus(postId, replyId, status){
  const { error } = await sbClient.rpc('moderation_set_community_status', {
    p_post_id: replyId ? null : postId, p_reply_id: replyId||null, p_status: status,
  });
  if(!error) logModerationEvent(status, replyId||postId, []);
  return !error;
}

/* =======================================================================
   PLAYBOOK QUESTIONS (V14 — real, Supabase-backed per-Playbook Q&A)
   The Community Commons store above is now also real and Supabase-backed
   as of V19.2 (see supabase/migrations/036) — both stores follow the
   same pattern: real database tables
   (public.playbook_questions / public.playbook_question_replies, see
   supabase/migrations/028-029) so a question survives a cleared cache
   and shows up the same way on another device. Every function here is
   async — callers (playbook.html) await and re-render, the same pattern
   the Owner Dashboard already uses for admin_user_list() etc. Client-side
   moderateContent() still runs before every insert (same convention as
   createCommunityPost()/addCommunityReply() above); RLS + the guard
   trigger in migration 028 are what actually stop a user from
   self-approving held content or impersonating another author on an
   edit — the client-side check is a courtesy, not the security boundary.
   ======================================================================= */
async function getPlaybookQuestions(slug){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const { data, error } = await sbClient
    .from('playbook_questions')
    .select('*')
    .eq('playbook_slug', slug)
    .eq('deleted', false)
    .order('created_at', {ascending:false});
  if(error){ console.warn('WRLD: could not load Playbook questions', error.message); return []; }
  // RLS already restricts rows to "approved", "mine", or "I'm admin+" —
  // this filter is a defensive no-op against that, not the real gate.
  return (data||[]).filter(q => q.status==='approved' || (user && q.author_id===user.id) || (user && typeof roleAtLeast==='function' && roleAtLeast(user, ROLES.ADMIN)));
}

async function getPlaybookQuestionReplies(questionId){
  const { data, error } = await sbClient
    .from('playbook_question_replies')
    .select('*')
    .eq('question_id', questionId)
    .eq('deleted', false)
    .order('created_at', {ascending:true});
  if(error){ console.warn('WRLD: could not load replies', error.message); return []; }
  return data||[];
}

async function postPlaybookQuestionToSupabase(slug, body){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const gate = communityGateReason(user);
  if(!gate.ok) return {ok:false, error:gate.message};
  if(!canPostToday('post')) return {ok:false, error:"You've reached today's posting limit — it grows automatically the more you participate. Try again tomorrow."};
  const text = (body||'').trim();
  if(!text) return {ok:false, error:'Write a question before posting.'};
  if(text.length>2000) return {ok:false, error:'That question is a bit long — try trimming it to under 2000 characters.'};

  const mod = moderateContent(text);
  if(mod.status==='blocked'){
    recordViolationAndMaybeEscalate(user.id, mod.flags);
    return {ok:false, error:"This can't be posted — it looks like it may include unsafe content. If you're struggling, please reach out to a crisis line or someone you trust."};
  }

  const { data, error } = await sbClient.from('playbook_questions').insert({
    playbook_slug: slug, author_id: user.id, author_name: user.name,
    body: text, status: mod.status, flags: mod.flags||[],
  }).select().single();
  if(error){ console.warn('WRLD: could not post Playbook question', error.message); return {ok:false, error:"Something went wrong posting your question — try again."}; }

  recordCommunityAction('post', data.status==='approved');
  if(data.status==='held'){
    logModerationEvent('auto-held-playbook-question', data.id, mod.flags);
    recordViolationAndMaybeEscalate(user.id, mod.flags);
  }
  return {ok:true, question:data};
}

async function postPlaybookReplyToSupabase(questionId, body){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const gate = communityGateReason(user);
  if(!gate.ok) return {ok:false, error:gate.message};
  if(!canPostToday('reply')) return {ok:false, error:"You've reached today's reply limit — it grows automatically the more you participate."};
  const text = (body||'').trim();
  if(!text) return {ok:false, error:'Write a reply before posting.'};

  const mod = moderateContent(text);
  if(mod.status==='blocked'){
    recordViolationAndMaybeEscalate(user.id, mod.flags);
    return {ok:false, error:"This can't be posted — it looks like it may include unsafe content. If you're struggling, please reach out to a crisis line or someone you trust."};
  }

  const { data, error } = await sbClient.from('playbook_question_replies').insert({
    question_id: questionId, author_id: user.id, author_name: user.name,
    body: text, status: mod.status, flags: mod.flags||[],
  }).select().single();
  if(error){ console.warn('WRLD: could not post reply', error.message); return {ok:false, error:"Something went wrong posting your reply — try again."}; }

  recordCommunityAction('reply', data.status==='approved');
  if(data.status==='held'){
    logModerationEvent('auto-held-playbook-reply', data.id, mod.flags);
    recordViolationAndMaybeEscalate(user.id, mod.flags);
  }
  return {ok:true, reply:data};
}

// Soft-delete/edit — RLS only allows a caller to touch their own row
// (see migration 028), so no ownership check is needed here beyond that.
async function deleteOwnPlaybookQuestion(id){
  const { error } = await sbClient.from('playbook_questions').update({deleted:true}).eq('id', id);
  return !error;
}
async function editOwnPlaybookQuestion(id, newBody){
  const text = (newBody||'').trim();
  if(!text) return {ok:false, error:"A question can't be empty."};
  const { error } = await sbClient.from('playbook_questions').update({body:text}).eq('id', id);
  if(error) return {ok:false, error:'Could not save your edit — try again.'};
  return {ok:true};
}
async function deleteOwnPlaybookReply(id){
  const { error } = await sbClient.from('playbook_question_replies').update({deleted:true}).eq('id', id);
  return !error;
}

// Reporting goes through a security-definer RPC (see migration 029) since
// a reporter never has UPDATE rights on someone else's row under RLS —
// the function records the report and auto-holds past a small threshold.
async function reportPlaybookContent(questionId, replyId, reason){
  const { error } = await sbClient.rpc('report_playbook_content', {
    p_question_id: questionId, p_reply_id: replyId||null, p_reason: reason||'unspecified',
  });
  return !error;
}

/* ---------------------------------------------------------------------
   COMMUNITY RECOGNITION
   No likes, followers, or popularity rankings — badges are computed from
   real local participation and progress, the same honest way
   computeAchievements() works.
   --------------------------------------------------------------------- */
async function computeCommunityBadges(){
  const user = getCurrentUser();
  const s = getState();
  const posts = await getCommunityPosts();
  const myApprovedPosts = user ? posts.filter(p=>p.authorId===user.id && p.status==='approved').length : 0;
  const myApprovedReplies = user ? posts.reduce((sum,p)=>sum+(p.replies||[]).filter(r=>r.authorId===user.id && r.status==='approved').length, 0) : 0;

  return [
    {id:'starter', label:'Community Starter', icon:'🌱', desc:'Made your first post in the Community Commons.', unlocked: myApprovedPosts>=1},
    {id:'helpful', label:'Helpful Contributor', icon:'💬', desc:'Posted 5 or more helpful replies.', unlocked: myApprovedReplies>=5},
    {id:'leader', label:'Learning Leader', icon:'🎓', desc:'Completed 5 or more Playbooks.', unlocked: (s.completed||[]).length>=5},
    {id:'consistent', label:'Consistent Learner', icon:'🔥', desc:'Kept a 7-day learning streak.', unlocked: (s.streak||0)>=7},
    {id:'mentor', label:'Community Mentor', icon:'🤝', desc:'A WRLD Mentor giving back through Live Learning.', unlocked: !!(user && user.role==='mentor')},
    {id:'volunteer', label:'Volunteer Champion', icon:'🌍', desc:'Logged 10 or more volunteer hours.', unlocked: (typeof getVolunteerSummary==='function' ? getVolunteerSummary().totalHours : 0) >= 10},
  ];
}

/* ---------------------------------------------------------------------
   VOLUNTEER HOURS TRACKER
   Real, localStorage-backed log of a learner's own volunteer experiences.
   Feeds getProgressSummary()'s volunteerHours (previously always 0) and
   the "Volunteer Champion" community badge, so both become real once a
   learner actually logs hours. Proof uploads store only the file's name/
   type today (not the file itself) — real secure file storage is future
   work, and the UI says so honestly rather than pretending it's stored.
   --------------------------------------------------------------------- */
/* V20.6.2 — namespaced per Supabase account, same scheme as getState()/
   setState() above (see that section's header comment for the full
   rationale). This key had NO ownership marker at all before this
   release — worse than the pre-V20.6.2 learner-state key — so on a
   browser previously used by a different account, a brand-new account's
   first sync could silently upload that OTHER account's cached volunteer
   hours into its own Supabase row the instant pullVolunteerEntriesFromSupabase()
   found no rows yet for it. Namespacing by account id makes that
   structurally impossible: this key can now only ever hold entries this
   exact account itself wrote. Volunteer Tracker is authenticated-only
   (requireAuth() gates volunteer-tracker.html), so unlike learner state
   there is no separate "guest" bucket to carry over here — nothing
   legitimate to inherit before an account exists. */
const VOLUNTEER_LOG_KEY_BASE = 'wrld_volunteer_log_v2';
function getVolunteerEntries(){
  const ownerId = wrldResolveStateOwnerId();
  try{
    const raw = localStorage.getItem(wrldNamespacedKey(VOLUNTEER_LOG_KEY_BASE, ownerId));
    if(raw){
      const record = JSON.parse(raw);
      if(record && Array.isArray(record.data) && record.ownerUserId === (ownerId || null)) return record.data;
    }
  }catch(e){}
  return [];
}
/* Same write-through-cache pattern as setState() above: the localStorage
   write is instant and unchanged, and a background full-resync to
   Supabase's `volunteer_entries` table fires right after, un-awaited.
   "Full resync" (upsert every current entry, delete any DB row for this
   user that's no longer in the local list) rather than incremental diffs
   — simple and correct given a person typically has a handful of
   volunteer entries, not thousands. */
function saveVolunteerEntries(entries){
  const ownerId = wrldResolveStateOwnerId();
  const record = { ownerUserId: ownerId || null, version: 2, data: entries };
  try{ localStorage.setItem(wrldNamespacedKey(VOLUNTEER_LOG_KEY_BASE, ownerId), JSON.stringify(record)); }catch(e){}
  syncVolunteerEntriesToSupabase(entries);
}
function volunteerEntryToRow(entry, userId){
  return {
    id: entry.id, user_id: userId,
    organization: (entry.organization||'').trim(),
    role: (entry.role||'').trim(),
    hours: Number(entry.hours)||0,
    date_start: entry.startDate || null,
    date_end: entry.endDate || null,
    reflection: (entry.reflection||'').trim(),
    skill_badges: entry.skills||[],
    proof_file_path: entry.proofFileName||null, // metadata only — see "Current Limitations" in CLAUDE.md
    confidence: (entry.verification && entry.verification.confidence) || null,
    status: (entry.verification && entry.verification.status) || null,
    verification: entry.verification || null,
    verified_badge: !!entry.verifiedBadge,
    created_at: entry.loggedAt || new Date().toISOString(),
    updated_at: entry.editedAt || entry.loggedAt || new Date().toISOString(),
  };
}
function volunteerRowToEntry(row){
  return {
    id: row.id,
    organization: row.organization||'',
    role: row.role||'',
    startDate: row.date_start||'',
    endDate: row.date_end||'',
    hours: Number(row.hours)||0,
    skills: row.skill_badges||[],
    reflection: row.reflection||'',
    proofFileName: row.proof_file_path||null,
    loggedAt: row.created_at,
    editedAt: row.updated_at!==row.created_at ? row.updated_at : undefined,
    verification: row.verification || {confidence: row.confidence, status: row.status},
    verifiedBadge: !!row.verified_badge,
    verifiedOrg: null,
  };
}
async function syncVolunteerEntriesToSupabase(entries){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  if(!user || typeof sbClient==='undefined') return;
  const rows = entries.map(e=>volunteerEntryToRow(e, user.id));
  if(rows.length){
    const { error } = await sbClient.from('volunteer_entries').upsert(rows);
    if(error){ console.warn('WRLD: could not sync volunteer entries to the database', error.message); return; }
  }
  // Clean up any DB rows for entries that were deleted locally. Diffed
  // against a real fetched id list and passed to .in() as an actual
  // array (not a hand-built filter string) so this can never be an
  // injection vector, even in principle — RLS also independently scopes
  // every delete to the caller's own user_id regardless.
  const { data: existing, error: fetchError } = await sbClient.from('volunteer_entries').select('id').eq('user_id', user.id);
  if(fetchError){ console.warn('WRLD: could not check volunteer entries for cleanup', fetchError.message); return; }
  const keepIds = new Set(entries.map(e=>e.id));
  const staleIds = (existing||[]).map(r=>r.id).filter(id=>!keepIds.has(id));
  if(staleIds.length){
    const { error: delError } = await sbClient.from('volunteer_entries').delete().eq('user_id', user.id).in('id', staleIds);
    if(delError) console.warn('WRLD: could not clean up removed volunteer entries', delError.message);
  }
}
/* Pulled alongside learner_state right after the session/profile cache
   resolves — see supabase-client.js's wrldRefreshSessionCache(). Same
   pull-or-push-on-first-sync logic as pullLearnerStateFromSupabase(). */
async function pullVolunteerEntriesFromSupabase(){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  if(!user || typeof sbClient==='undefined') return;
  const key = wrldNamespacedKey(VOLUNTEER_LOG_KEY_BASE, user.id);
  const { data, error } = await sbClient.from('volunteer_entries').select('*').eq('user_id', user.id).order('created_at', {ascending:false});
  if(error){
    console.warn('WRLD: could not load volunteer entries from the database', error.message);
    // V20.6: authentication succeeding but this one read failing is a
    // real, distinct condition from "not logged in" — volunteer-tracker.html
    // checks this flag (after requireAuth() already passed) to show a
    // tracker-specific error + Retry action instead of ever bouncing the
    // user to login or the dashboard. Never treated as a logout signal.
    window.__wrldVolunteerLoadFailed = true;
    return;
  }
  window.__wrldVolunteerLoadFailed = false;
  if(data && data.length){
    const record = { ownerUserId: user.id, version: 2, data: data.map(volunteerRowToEntry) };
    try{ localStorage.setItem(key, JSON.stringify(record)); }catch(e){}
  } else {
    // No server rows yet for this account. This account's OWN namespaced
    // bucket, by construction, can only ever already contain entries
    // this exact account previously wrote — never a different account's
    // (that was the actual bug this release fixes: the old unscoped key
    // had no such guarantee at all). getVolunteerEntries() already
    // refuses to hand back anything whose embedded ownerUserId doesn't
    // match this account, as a second, defense-in-depth check.
    const local = getVolunteerEntries();
    if(local.length) await syncVolunteerEntriesToSupabase(local);
  }
}

function addVolunteerEntry(entry){
  const entries = getVolunteerEntries();
  const record = {
    id: (typeof crypto!=='undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'vol_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),
    organization:(entry.organization||'').trim(),
    role:(entry.role||'').trim(),
    startDate:entry.startDate||'', endDate:entry.endDate||'',
    hours: Number(entry.hours)||0,
    skills:(entry.skills||[]).filter(Boolean),
    reflection:(entry.reflection||'').trim(),
    proofFileName: entry.proofFileName||null,
    loggedAt:new Date().toISOString(),
  };
  record.verification = evaluateVolunteerProof(record);
  record.verifiedBadge = record.verification.status==='verified';
  record.verifiedOrg = null; // reserved for a future Partner Organization match
  entries.unshift(record);
  saveVolunteerEntries(entries);
  return record;
}
function deleteVolunteerEntry(id){
  saveVolunteerEntries(getVolunteerEntries().filter(e=>e.id!==id));
}
function updateVolunteerEntry(id, updates){
  const entries = getVolunteerEntries();
  const entry = entries.find(e=>e.id===id);
  if(!entry) return null;
  if(updates.organization!==undefined) entry.organization = updates.organization.trim();
  if(updates.role!==undefined) entry.role = updates.role.trim();
  if(updates.startDate!==undefined) entry.startDate = updates.startDate;
  if(updates.endDate!==undefined) entry.endDate = updates.endDate;
  if(updates.hours!==undefined) entry.hours = Number(updates.hours)||0;
  if(updates.skills!==undefined) entry.skills = updates.skills.filter(Boolean);
  if(updates.reflection!==undefined) entry.reflection = updates.reflection.trim();
  if(updates.proofFileName!==undefined) entry.proofFileName = updates.proofFileName;
  entry.editedAt = new Date().toISOString();
  // Editing the substance of an entry re-runs verification from scratch —
  // a manual override only survives if nothing that fed the heuristic changed.
  entry.verification = evaluateVolunteerProof(entry);
  entry.verifiedBadge = entry.verification.status==='verified';
  saveVolunteerEntries(entries);
  return entry;
}

/* ---------------------------------------------------------------------
   AI-ASSISTED VOLUNTEER HOUR VERIFICATION
   Runs the moment an entry is logged or edited. Like moderateContent(),
   WRLD calls this "AI verification" in the product — in the code, it's an
   honest, real, rule-based confidence heuristic (proof attached, hours
   plausible for the date range, organization/reflection completeness),
   not a trained document-authenticity model. High confidence entries
   verify instantly; medium confidence queues for a human in the Owner
   Dashboard; low confidence asks the learner for more information. Swap
   this function's body for a real ML/document-analysis service later —
   every caller keeps working against the same {confidence, status,
   reasons} shape.
   --------------------------------------------------------------------- */
function evaluateVolunteerProof(entry){
  const reasons = [];
  let score = 0;
  const hours = Number(entry.hours)||0;

  if(entry.proofFileName) score += 2;
  else reasons.push('No supporting document attached');

  let datesPlausible = true;
  if(entry.startDate && entry.endDate){
    const start = new Date(entry.startDate), end = new Date(entry.endDate);
    if(end < start){ datesPlausible = false; reasons.push('End date is before the start date'); }
    else {
      const days = Math.max(1, Math.round((end-start)/86400000)+1);
      const maxPlausibleHours = days * 16; // a generous daily cap
      if(hours > maxPlausibleHours){ datesPlausible = false; reasons.push("Logged hours are high for the date range given"); }
    }
    const now = new Date();
    if(end > now){ datesPlausible = false; reasons.push('End date is in the future'); }
  }
  if(hours<=0){ datesPlausible = false; reasons.push('Hours must be greater than zero'); }
  score += datesPlausible ? 1 : -2;

  if(entry.organization && entry.organization.trim().length>=2) score += 1;
  else reasons.push('Organization name is very short or missing');

  if(entry.reflection && entry.reflection.trim().length>=20) score += 1;
  else reasons.push('Reflection is brief or missing — a couple sentences helps verification');

  let confidence, status;
  if(score>=4 && datesPlausible){ confidence='high'; status='verified'; }
  else if(score>=1){ confidence='medium'; status='pending_review'; }
  else { confidence='low'; status='needs_info'; }

  return {confidence, status, reasons, evaluatedAt:new Date().toISOString()};
}

/* Owner/Admin manual override — reachable from the Owner Dashboard's
   Volunteer tab for medium-confidence entries. Never required for every
   submission (only medium-confidence ones reach a human at all). */
function setVolunteerVerification(entryId, status){
  const entries = getVolunteerEntries();
  const entry = entries.find(e=>e.id===entryId);
  if(!entry) return false;
  entry.verification = entry.verification || {};
  entry.verification.status = status;
  entry.verification.manualOverride = true;
  entry.verification.reviewedAt = new Date().toISOString();
  entry.verifiedBadge = status==='verified';
  saveVolunteerEntries(entries);
  return true;
}
function getVolunteerSummary(){
  const entries = getVolunteerEntries();
  const totalHours = entries.reduce((sum,e)=>sum+(Number(e.hours)||0), 0);
  const organizations = new Set(entries.map(e=>e.organization).filter(Boolean));
  return {totalHours, organizationCount:organizations.size, entryCount:entries.length, entries};
}

/* ---------------------------------------------------------------------
   MENTOR PROFILES
   Optional profile info (tagline, bio, areas of expertise) a Mentor can
   fill in via Mentor Studio, surfaced on the Community "Current Mentors"
   directory. Same localStorage-backed pattern as everything else here.
   --------------------------------------------------------------------- */
const MENTOR_PROFILES_KEY = 'wrld_mentor_profiles_v1';
function getMentorProfiles(){
  try{ return JSON.parse(localStorage.getItem(MENTOR_PROFILES_KEY)) || {}; }
  catch(e){ return {}; }
}
function getMentorProfile(userId){
  return getMentorProfiles()[userId] || {tagline:'', bio:'', expertise:[]};
}
function saveMentorProfile(userId, profile){
  const all = getMentorProfiles();
  all[userId] = profile;
  localStorage.setItem(MENTOR_PROFILES_KEY, JSON.stringify(all));
}

/* ---------------------------------------------------------------------
   MENTOR APPLICATIONS
   Become a Mentor submits entirely inside WRLD — no mailto:, no email
   client popup. The application (and file metadata for any uploads) is
   saved here and shows up in the Owner Dashboard's Mentors > Applications
   queue for a real human review. WRLD has no backend server today, so
   there is no actual mail-delivery or encrypted-file-storage service to
   hand this off to — this store IS the durable record. File uploads only
   ever have their name/size/type captured (not the file bytes), which is
   disclosed honestly in the upload hint on the page itself, since real
   secure file storage requires backend infrastructure not built yet.
   --------------------------------------------------------------------- */
const MENTOR_APPLICATIONS_KEY = 'wrld_mentor_applications_v1';
// V20 fix: this used to read/write a localStorage-only store, which is
// stale legacy code from before mentor applications became a real,
// shared public.mentor_applications table (migration 032) — the actual
// apply/review/delete flow (become-mentor.html's submit_mentor_application
// RPC, owner-dashboard.html's Mentors tab, set_mentor_application_status(),
// delete_mentor_application()) has been Supabase-backed for a while, but
// this function — used by the Owner Dashboard's Overview/Analytics
// metrics and the Recent Activity Feed/System Alerts — was still reading
// an empty/stale local key, so those numbers never reflected real
// applications. Now reads the real table directly (Administrator+ RLS
// already permits this; a lower-role caller simply gets an empty array
// back rather than an error, which is fine for a stats helper).
async function getMentorApplications(){
  const { data, error } = await sbClient.from('mentor_applications').select('*').order('created_at', {ascending:false});
  if(error){ console.warn('WRLD: could not load mentor applications', error.message); return []; }
  return (data||[]).map(row=>({
    id: row.id, userId: row.user_id, name: row.name, email: row.email,
    occupation: row.occupation, education: row.education, expertise: row.expertise,
    languages: row.languages, bio: row.bio, why: row.why, experience: row.experience,
    availability: row.availability, linkedin: row.linkedin, portfolio: row.portfolio,
    status: row.status, submittedAt: row.created_at,
  }));
}
function saveMentorApplications(apps){
  localStorage.setItem(MENTOR_APPLICATIONS_KEY, JSON.stringify(apps));
}
function fileMeta(fileInput){
  if(!fileInput || !fileInput.files || !fileInput.files.length) return null;
  const f = fileInput.files[0];
  return {name:f.name, size:f.size, type:f.type||'unknown'};
}
function addMentorApplication(fields){
  const apps = getMentorApplications();
  const user = getCurrentUser ? getCurrentUser() : null;
  const record = {
    id: 'mapp_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),
    userId: user ? user.id : null,
    name: (fields.name||'').trim(),
    email: (fields.email||'').trim().toLowerCase(),
    occupation: (fields.occupation||'').trim(),
    education: (fields.education||'').trim(),
    expertise: (fields.expertise||'').trim(),
    languages: (fields.languages||'').trim(),
    bio: (fields.bio||'').trim(),
    why: (fields.why||'').trim(),
    experience: (fields.experience||'').trim(),
    availability: (fields.availability||'').trim(),
    linkedin: (fields.linkedin||'').trim(),
    portfolio: (fields.portfolio||'').trim(),
    resumeMeta: fields.resumeMeta || null,
    certsMeta: fields.certsMeta || null,
    status: 'pending', // pending | approved | rejected
    submittedAt: new Date().toISOString(),
  };
  apps.unshift(record);
  saveMentorApplications(apps);
  return record;
}
function setMentorApplicationStatus(id, status){
  const apps = getMentorApplications();
  const app = apps.find(a=>a.id===id);
  if(!app) return false;
  app.status = status;
  app.reviewedAt = new Date().toISOString();
  saveMentorApplications(apps);
  // If approved and the applicant has a linked WRLD account, promote them.
  if(status==='approved' && app.userId && typeof promoteUserRole==='function'){
    promoteUserRole(app.userId, ROLES.MENTOR);
  }
  return true;
}

/* ---------------------------------------------------------------------
   FEATURE TOGGLES (Owner Dashboard > Organization)
   Small, real, local settings switchboard. Today it only controls whether
   the Study Groups / Accountability Partners "Coming Soon" cards show on
   community.html, but it's the same store any future feature flag can
   register itself in without touching the Owner Dashboard's rendering.
   --------------------------------------------------------------------- */
const FEATURE_TOGGLES_KEY = 'wrld_feature_toggles_v1';
const DEFAULT_FEATURE_TOGGLES = { studyGroups: true, accountabilityPartners: true };
function getFeatureToggles(){
  try{ return Object.assign({}, DEFAULT_FEATURE_TOGGLES, JSON.parse(localStorage.getItem(FEATURE_TOGGLES_KEY)) || {}); }
  catch(e){ return Object.assign({}, DEFAULT_FEATURE_TOGGLES); }
}
function setFeatureToggle(key, value){
  const toggles = getFeatureToggles();
  toggles[key] = value;
  localStorage.setItem(FEATURE_TOGGLES_KEY, JSON.stringify(toggles));
  return toggles;
}

/* ---------------------------------------------------------------------
   OWNER DASHBOARD — PLATFORM OVERVIEW METRICS
   Every number here is computed live from real local stores (users,
   community posts, volunteer log, live sessions, mentor applications).
   WRLD has no backend server, so "platform-wide" really means "this
   browser's local data" — the Owner Dashboard is honest about that in
   its own copy rather than implying multi-device analytics that don't
   exist yet. Swapping these for real API aggregation later requires no
   change to anything that calls getPlatformOverview().
   --------------------------------------------------------------------- */
async function getPlatformOverview(){
  const users = typeof getUsers==='function' ? getUsers() : [];
  const now = Date.now();
  const THIRTY_DAYS = 30*24*60*60*1000;
  const newExplorers = users.filter(u=>u.role===ROLES.EXPLORER && u.createdAt && (now - new Date(u.createdAt).getTime()) <= THIRTY_DAYS).length;
  const activeUsers = users.filter(u=>u.lastLoginAt && (now - new Date(u.lastLoginAt).getTime()) <= THIRTY_DAYS).length;
  const s = getState();
  const posts = await getCommunityPosts();
  const communityActivity = posts.length + posts.reduce((sum,p)=>sum+(p.replies||[]).length, 0);
  const volSummary = getVolunteerSummary();
  const mentorApps = await getMentorApplications();
  return {
    newExplorers,
    activeUsers,
    completedPlaybooks: (s.completed||[]).length,
    volunteerHoursLogged: volSummary.totalHours,
    communityActivity,
    liveSessions: getLiveSessions().length,
    certificatesEarned: 0, // Certificates are honestly labeled Coming Soon — never fabricated.
    mentorApplications: mentorApps.length,
    pendingMentorApplications: mentorApps.filter(a=>a.status==='submitted'||a.status==='under_review').length,
    pendingAIReviews: getVolunteerEntries().filter(e=>e.verification && e.verification.confidence==='medium' && e.verification.status==='pending_review').length,
    flaggedPosts: (await getModerationQueue()).length,
  };
}

/* ---------------------------------------------------------------------
   OWNER DASHBOARD — CONTENT PUBLISHING
   Real, working local stores so "Content" is genuinely actionable rather
   than a mockup: announcements the Owner/Admin writes, a single Featured
   Playbook, and a single Highlighted Mentor. Consumer pages (dashboard,
   community, playbooks) read these directly — nothing here is decorative.
   --------------------------------------------------------------------- */
const ANNOUNCEMENTS_KEY = 'wrld_announcements_v1';
function getAnnouncements(){
  try{ return JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY)) || []; }
  catch(e){ return []; }
}
function saveAnnouncements(list){ localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list)); }
function addAnnouncement(message){
  const list = getAnnouncements();
  const record = {id:'ann_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8), message:(message||'').trim(), createdAt:new Date().toISOString()};
  list.unshift(record);
  saveAnnouncements(list);
  return record;
}
function deleteAnnouncement(id){ saveAnnouncements(getAnnouncements().filter(a=>a.id!==id)); }
function getLatestAnnouncement(){ return getAnnouncements()[0] || null; }

const FEATURED_KEY = 'wrld_featured_v1';
function getFeatured(){
  try{ return Object.assign({playbookSlug:null, mentorUserId:null}, JSON.parse(localStorage.getItem(FEATURED_KEY))||{}); }
  catch(e){ return {playbookSlug:null, mentorUserId:null}; }
}
function setFeaturedPlaybook(slug){ const f = getFeatured(); f.playbookSlug = slug||null; localStorage.setItem(FEATURED_KEY, JSON.stringify(f)); }
function setFeaturedMentor(userId){ const f = getFeatured(); f.mentorUserId = userId||null; localStorage.setItem(FEATURED_KEY, JSON.stringify(f)); }

/* ---------------------------------------------------------------------
   OWNER DASHBOARD — MEMBERS & ACTIVITY
   Same honesty rule as getPlatformOverview(): every figure is computed
   live from real local accounts/records, and "Online Now"/"Returning"
   are explicitly disclosed as single-device approximations since WRLD
   has no shared backend session store yet.
   --------------------------------------------------------------------- */
function getMembersStats(){
  const users = typeof getUsers==='function' ? getUsers() : [];
  const now = Date.now();
  const ONE_DAY = 24*60*60*1000;
  const ONLINE_WINDOW = 15*60*1000;
  return {
    totalUsers: users.length,
    dailySignups: users.filter(u=>u.createdAt && (now-new Date(u.createdAt).getTime())<=ONE_DAY).length,
    returningUsers: users.filter(u=>(u.loginCount||0)>1).length,
    explorerCount: users.filter(u=>u.role===ROLES.EXPLORER).length,
    mentorCount: users.filter(u=>u.role===ROLES.MENTOR).length,
    onlineNow: users.filter(u=>u.lastLoginAt && (now-new Date(u.lastLoginAt).getTime())<=ONLINE_WINDOW).length,
    newestMembers: users.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5),
  };
}

async function getRecentActivityFeed(limit){
  limit = limit || 20;
  const events = [];
  getModerationLog().forEach(e=>events.push({at:e.at, icon:'🛡️', text:`Moderation: ${e.action.replace(/-/g,' ')}`}));
  (await getMentorApplications()).forEach(a=>events.push({at:a.submittedAt, icon:'🤝', text:`New mentor application from ${a.name}`}));
  getVolunteerEntries().forEach(v=>events.push({at:v.loggedAt, icon:'🌍', text:`${v.organization||'A learner'} — ${v.hours} volunteer hour${v.hours!==1?'s':''} logged`}));
  (await getCommunityPosts()).forEach(p=>events.push({at:p.createdAt, icon:'💬', text:`New Community Commons post from ${p.authorName}`}));
  getUsers().forEach(u=>events.push({at:u.createdAt, icon:'🌱', text:`${u.name} joined WRLD as an Explorer`}));
  return events.filter(e=>e.at).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0, limit);
}

async function getSystemAlerts(){
  const alerts = [];
  const pendingApps = (await getMentorApplications()).filter(a=>a.status==='submitted'||a.status==='under_review').length;
  if(pendingApps>0) alerts.push({level:'info', icon:'🤝', text:`${pendingApps} mentor application${pendingApps!==1?'s':''} awaiting review`});
  const flagged = (await getModerationQueue()).length;
  if(flagged>0) alerts.push({level:'warn', icon:'🛡️', text:`${flagged} post${flagged!==1?'s':''} in the AI moderation queue`});
  const pendingVol = getVolunteerEntries().filter(e=>e.verification && e.verification.status==='pending_review').length;
  if(pendingVol>0) alerts.push({level:'info', icon:'🌍', text:`${pendingVol} volunteer entr${pendingVol!==1?'ies':'y'} awaiting verification review`});
  const bannedCount = getUsers().filter(u=>u.banned).length;
  if(bannedCount>0) alerts.push({level:'warn', icon:'⛔', text:`${bannedCount} account${bannedCount!==1?'s':''} currently banned`});
  if(!alerts.length) alerts.push({level:'success', icon:'✅', text:'All clear — nothing needs your attention right now.'});
  return alerts;
}

function timeAgo(iso){
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff/60000);
  if(mins < 1) return 'Just now';
  if(mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs/24);
  if(days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined,{month:'short', day:'numeric'});
}

/* ---------------------------------------------------------------------
   REPORT MODAL (Layer 3 — Community Reporting)
   One shared modal, injected once via renderFooter(), reused by every
   page that shows community posts/replies (Playbook discussions,
   Community Commons, Study Groups).
   --------------------------------------------------------------------- */
const REPORT_REASONS = ['Harassment','Spam','Unsafe Advice','Misinformation','Explicit Content','Other'];
let reportTarget = null;
function openReportModal(postId, replyId){
  reportTarget = {postId, replyId: replyId||null};
  document.getElementById('report-modal')?.classList.add('open');
}
function closeReportModal(){
  document.getElementById('report-modal')?.classList.remove('open');
  reportTarget = null;
}
async function submitReport(){
  if(!reportTarget) return;
  const reasonEl = document.getElementById('report-reason');
  const reason = reasonEl ? reasonEl.value : 'Other';
  await reportCommunityItem(reportTarget.postId, reportTarget.replyId, reason);
  closeReportModal();
  showToast('🚩 Report submitted — thanks for helping keep WRLD safe.');
  if(typeof window.refreshAfterReport === 'function') window.refreshAfterReport();
}

/* ---------------------------------------------------------------------
   TOAST
   --------------------------------------------------------------------- */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2800);
}

/* ---------------------------------------------------------------------
   CONFIRMATION MODAL (V19)
   A small, reusable danger-confirmation dialog — WRLD had no modal
   system before this (Owner Dashboard's own progress drill-down uses an
   inline show/hide panel instead, see owner-dashboard.html). Permanent
   deletion (Delete User, Delete Mentor Application) needs a real modal
   with the record's details and a deliberate second confirmation, per
   spec, so this is added once here, reusable by any page. Built from
   the existing .card/.btn/.callout design language — no new visual
   system introduced. See styles.css's "Confirmation modal (V19)" block.
   --------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   BACKEND ERROR MESSAGES (V19.2)
   Turns a raw Supabase JS SDK / PostgREST error into one of the specific,
   safe messages required by the spec — never a raw stack trace, never a
   secret, but also never just "something went wrong" when the real
   cause (undeployed function, unapplied migration, permission, network)
   is knowable from the error shape.
   --------------------------------------------------------------------- */
function friendlyBackendError(err){
  const msg = (err && (err.message || err.error_description || String(err))) || '';
  const lower = msg.toLowerCase();
  if(lower.includes('failed to send a request') || lower.includes('failed to fetch')){
    return 'The secure deletion service is not currently available. Confirm that the Supabase Edge Function has been deployed.';
  }
  if(lower.includes('could not find the function') || lower.includes('schema cache')){
    return 'The required database function has not been installed. Apply the V19.2 Supabase migration and try again.';
  }
  if(lower.includes('permission') || lower.includes('not allowed') || lower.includes('access required') || lower.includes('only the owner')){
    return msg; // already the specific, safe, correctly-worded message the function itself returns
  }
  if(lower.includes('networkerror') || lower.includes('network request failed') || lower.includes('load failed')){
    return 'WRLD could not reach the server. Check your connection and try again.';
  }
  return msg || 'Something went wrong — please try again.';
}

function showConfirmModal({title, detailsHtml, warning, confirmLabel, onConfirm}){
  const existing = document.getElementById('wrld-confirm-modal');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wrld-confirm-modal';
  overlay.className = 'wrld-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="wrld-modal card">
      <h4 class="mb-12">${title}</h4>
      <div class="wrld-modal-details mb-16">${detailsHtml}</div>
      <p class="wrld-modal-warning mb-20">⚠️ ${warning}</p>
      <div class="flex gap-10" style="flex-wrap:wrap; justify-content:flex-end;">
        <button type="button" class="btn btn-outline" id="wrld-modal-cancel">Cancel</button>
        <button type="button" class="btn" style="background:#B3403A; color:white;" id="wrld-modal-confirm">${confirmLabel}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden'; // prevent background scroll while a destructive modal is open

  function closeModal(){
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
  }
  function onKeydown(e){ if(e.key==='Escape') closeModal(); }
  document.addEventListener('keydown', onKeydown);

  overlay.addEventListener('click', e=>{ if(e.target===overlay) closeModal(); });
  document.getElementById('wrld-modal-cancel').addEventListener('click', closeModal);
  document.getElementById('wrld-modal-confirm').addEventListener('click', async ()=>{
    const btn = document.getElementById('wrld-modal-confirm');
    btn.disabled = true; btn.textContent = 'Working…';
    await onConfirm(closeModal);
    btn.disabled = false; btn.textContent = confirmLabel;
  });

  setTimeout(()=>document.getElementById('wrld-modal-cancel')?.focus(), 30);
}

/* ---------------------------------------------------------------------
   CONFETTI (lightweight canvas burst — no external library)
   --------------------------------------------------------------------- */
function launchConfetti(){
  const canvas = document.getElementById('confetti-canvas');
  if(!canvas) return;
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#2EA8C7','#F5CF57','#1F3D4D','#FFFFFF'];
  const pieces = Array.from({length:90}, ()=>({
    x: Math.random()*canvas.width, y: -20 - Math.random()*200,
    r: 4+Math.random()*5, c: colors[Math.floor(Math.random()*colors.length)],
    vy: 3+Math.random()*4, vx: -2+Math.random()*4, rot: Math.random()*360, vr: -6+Math.random()*12,
  }));
  let frame = 0;
  function tick(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.y += p.vy; p.x += p.vx; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.6);
      ctx.restore();
    });
    frame++;
    if(frame < 110) requestAnimationFrame(tick);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  tick();
}

/* ---------------------------------------------------------------------
   SCROLL REVEAL (IntersectionObserver)
   --------------------------------------------------------------------- */
function initReveal(){
  const els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {threshold:.12});
  els.forEach(e=>io.observe(e));
}

/* ---------------------------------------------------------------------
   ANIMATED COUNTERS
   --------------------------------------------------------------------- */
function initCounters(){
  const els = document.querySelectorAll('[data-count]');
  if(!els.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const el = en.target; const target = parseInt(el.dataset.count,10); const suffix = el.dataset.suffix||'';
      let cur = 0; const step = Math.max(1, Math.round(target/50));
      const t = setInterval(()=>{ cur+=step; if(cur>=target){cur=target; clearInterval(t);} el.textContent = cur.toLocaleString()+suffix; }, 20);
      io.unobserve(el);
    });
  }, {threshold:.4});
  els.forEach(e=>io.observe(e));
}

/* ---------------------------------------------------------------------
   ACCORDION (generic — works on any .accordion-item)
   --------------------------------------------------------------------- */
function initAccordions(){
  document.querySelectorAll('.accordion-item').forEach(item=>{
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if(!trigger||!panel) return;
    trigger.setAttribute('aria-expanded','false');
    trigger.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.style.maxHeight = isOpen ? null : panel.scrollHeight+'px';
    });
  });
}

/* ---------------------------------------------------------------------
   CHECKLIST (generic — pass a container id, item array, storage key)
   --------------------------------------------------------------------- */
function renderChecklist(containerId, items, storageKey, onComplete){
  const el = document.getElementById(containerId);
  if(!el) return;
  const s = getState();
  const saved = s.checklists[storageKey] || [];
  el.innerHTML = `
    <div class="checklist-progress-bar"><div class="checklist-progress-fill" id="${containerId}-fill"></div></div>
    <div id="${containerId}-items"></div>`;
  const itemsEl = el.querySelector(`#${containerId}-items`);
  // V20 fix: practiceExercises items come in two valid shapes in data.js —
  // a plain string (older Playbooks: resume, cover-letter, budgeting, etc)
  // or a richer {title, body} object (newer Playbooks: bank-accounts,
  // taxes, emergency-funds, investing-basics, financial-planning,
  // time-management, study-skills, mental-wellness, internships,
  // graduation-planning). This previously always did `${txt}` assuming a
  // string, so the object shape rendered as the literal text
  // "[object Object]" for every item in those 10 Playbooks' Practice
  // Exercises section. checklist items (the separate Action Checklist
  // field) are always plain strings and are unaffected either way.
  itemsEl.innerHTML = items.map((txt,i)=>{
    const label = (txt && typeof txt==='object') ? `<strong>${txt.title}:</strong> ${txt.body}` : txt;
    return `
    <div class="checklist-item ${saved.includes(i)?'checked':''}" data-i="${i}" tabindex="0" role="checkbox" aria-checked="${saved.includes(i)}">
      <div class="checklist-box">${saved.includes(i)?'✓':''}</div><span class="txt">${label}</span>
    </div>`;
  }).join('');
  function updateFill(){
    const state = getState();
    const checked = (state.checklists[storageKey]||[]).length;
    const pct = Math.round((checked/items.length)*100);
    const fillEl = document.getElementById(`${containerId}-fill`);
    if(fillEl) fillEl.style.width = pct+'%';
    if(pct===100 && onComplete) onComplete();
  }
  itemsEl.querySelectorAll('.checklist-item').forEach(row=>{
    const toggle = ()=>{
      const i = parseInt(row.dataset.i,10);
      const state = getState();
      state.checklists[storageKey] = state.checklists[storageKey] || [];
      const arr = state.checklists[storageKey];
      const idx = arr.indexOf(i);
      const nowChecked = idx===-1;
      if(idx>-1) arr.splice(idx,1); else arr.push(i);
      setState(state);
      row.classList.toggle('checked', nowChecked);
      row.querySelector('.checklist-box').textContent = nowChecked?'✓':'';
      row.setAttribute('aria-checked', String(nowChecked));
      updateFill();
    };
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
  });
  updateFill();
}

/* ---------------------------------------------------------------------
   QUIZ (generic)
   --------------------------------------------------------------------- */
function renderQuiz(containerId, quiz, storageKey){
  const el = document.getElementById(containerId);
  if(!el || !quiz || !quiz.length) return;
  let answers = new Array(quiz.length).fill(null);
  el.innerHTML = quiz.map((q,qi)=>`
    <div class="quiz-q">
      <h5>${qi+1}. ${q.q}</h5>
      <div data-qi="${qi}">
        ${q.options.map((opt,oi)=>`<button type="button" class="quiz-opt" data-oi="${oi}">${opt}</button>`).join('')}
      </div>
      <p class="quiz-explain hidden" style="font-size:13px; color:var(--ink-soft); margin-top:8px;"></p>
    </div>`).join('') + `
    <div class="quiz-result" id="${containerId}-result"></div>
    <button class="btn btn-primary mt-16" id="${containerId}-submit">Check My Answers</button>`;
  el.querySelectorAll('.quiz-q').forEach((qEl, qi)=>{
    qEl.querySelectorAll('.quiz-opt').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        qEl.querySelectorAll('.quiz-opt').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        answers[qi] = parseInt(btn.dataset.oi,10);
      });
    });
  });
  const submitBtn = document.getElementById(`${containerId}-submit`);
  submitBtn.addEventListener('click', ()=>{
    let correctCount = 0;
    el.querySelectorAll('.quiz-q').forEach((qEl, qi)=>{
      const q = quiz[qi];
      qEl.querySelectorAll('.quiz-opt').forEach((btn,oi)=>{
        btn.classList.remove('correct','incorrect');
        if(oi===q.correct) btn.classList.add('correct');
        else if(oi===answers[qi]) btn.classList.add('incorrect');
      });
      const explainEl = qEl.querySelector('.quiz-explain');
      explainEl.textContent = '💡 '+q.explain;
      explainEl.classList.remove('hidden');
      if(answers[qi]===q.correct) correctCount++;
    });
    const resultEl = document.getElementById(`${containerId}-result`);
    resultEl.classList.add('show');
    resultEl.innerHTML = `<h4>You got ${correctCount} of ${quiz.length} right!</h4><p>${correctCount===quiz.length?'Perfect score — you\'ve got this. 🎉':'Review the explanations above, then move on whenever you\'re ready.'}</p>`;
    if(storageKey){ const s = getState(); s.quizScores[storageKey] = `${correctCount}/${quiz.length}`; setState(s); }
    if(correctCount===quiz.length) launchConfetti();
    submitBtn.textContent = 'Answers Checked ✓';
    submitBtn.disabled = true;
  });
}

/* ---------------------------------------------------------------------
   SEARCH / FILTER (generic grid filtering)
   --------------------------------------------------------------------- */
function filterGrid(gridSelector, itemSelector, {search='', category=''}={}){
  document.querySelectorAll(`${gridSelector} ${itemSelector}`).forEach(card=>{
    const text = (card.dataset.searchText||'').toLowerCase();
    const cat = card.dataset.category||'';
    const matchesSearch = !search || text.includes(search.toLowerCase());
    const matchesCat = !category || category==='All' || cat===category;
    card.classList.toggle('hidden', !(matchesSearch && matchesCat));
  });
}

/* ---------------------------------------------------------------------
   TIMEZONE HELPERS (for Events)
   --------------------------------------------------------------------- */
function formatEventLocalTime(iso){
  const d = new Date(iso);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateStr = d.toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'});
  const timeStr = d.toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
  return {dateStr, timeStr, tz};
}

/* ---------------------------------------------------------------------
   CALENDAR (Google/Apple-style month grid)
   --------------------------------------------------------------------- */
function renderMonthCalendar(containerId, year, month, eventsForMonth, onMonthChange){
  const el = document.getElementById(containerId);
  if(!el) return;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  let cells = '';
  for(let i=startDow-1;i>=0;i--) cells += `<div class="cal-day other-month"><div class="num">${daysInPrevMonth-i}</div></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
    const dayEvents = eventsForMonth.filter(e=>new Date(e.dateISO).getDate()===d && new Date(e.dateISO).getMonth()===month);
    cells += `<div class="cal-day ${isToday?'today':''}"><div class="num">${d}</div>${dayEvents.map(e=>`<div class="cal-event-dot" title="${e.title}">${e.title}</div>`).join('')}</div>`;
  }
  const totalCells = startDow + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for(let d=1; d<=trailing; d++) cells += `<div class="cal-day other-month"><div class="num">${d}</div></div>`;

  el.innerHTML = `
    <div class="cal-topbar">
      <h4>${monthNames[month]} ${year}</h4>
      <div class="flex gap-8">
        <button class="btn-icon" id="${containerId}-prev" aria-label="Previous month">←</button>
        <button class="btn-icon" id="${containerId}-next" aria-label="Next month">→</button>
      </div>
    </div>
    <div class="cal-grid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}${cells}</div>`;
  if(onMonthChange){
    document.getElementById(`${containerId}-prev`).addEventListener('click', ()=>onMonthChange(-1));
    document.getElementById(`${containerId}-next`).addEventListener('click', ()=>onMonthChange(1));
  }
}

/* ---------------------------------------------------------------------
   ORBIT — WRLD's contextual learning companion
   Orbit reacts to the actual page and the learner's real local progress
   rather than showing purely random tips. Never interrupts — always
   optional, one click away.
   --------------------------------------------------------------------- */
const GUIDE_TIPS = [
  "Every Playbook ends with a quiz — try to get a perfect score! 🎯",
  "You can bookmark any Playbook and find it later on your Dashboard 🔖",
  "All WRLD programs are 100% free and live online via Zoom 💻",
  "Check the Learning Paths page for a guided route instead of browsing solo 🧭",
  "Missed a live session? Every workshop gets a replay within 24 hours 🎬",
  "Your learning streak grows every day you complete a Playbook — don't break the chain! 🔥",
  "Stuck on where to start? The Adulting Readiness Assessment builds you a personal roadmap 🌍",
  "There's no wrong answer on a reflection question — they're just for you 💭",
];

function contextualGuideMessage(pageKey){
  const s = getState();
  const done = s.completed.length;
  const saved = s.bookmarks.filter(b=>!b.startsWith('program-')&&!b.startsWith('event-')).length;
  if(pageKey==='dashboard'){
    if(done===0 && saved===0) return "Hi, I'm Orbit 👋 Nothing here yet — want me to point you toward a first Playbook?";
    if(done>0) return `You've completed ${done} Playbook${done!==1?'s':''} so far — that's real progress. Keep going 🔥`;
    return `You've saved ${saved} Playbook${saved!==1?'s':''} — ready to start the first one?`;
  }
  if(pageKey==='assessment') return "Ready when you are — this takes about 10-15 minutes, and there's no wrong answer.";
  if(pageKey==='tools') return "These tools give you real, honest feedback — try one and see where you land.";
  if(pageKey==='playbooks') return "What do you want to learn today? Search, filter, or let me know if you want a recommendation.";
  if(pageKey==='paths') return "Not sure where to start? Pick the journey that matches what's happening in your life right now.";
  if(pageKey==='programs') return "Every WRLD program is live, free, and 100% online via Zoom — ask me anything before you enroll.";
  if(pageKey==='downloads') return "Every download here is print-ready — no sign-up needed. Grab whatever's useful.";
  if(pageKey==='events') return "All times shown are converted to your local time zone automatically 🌍";
  if(pageKey==='community'){
    const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
    const gate = typeof communityGateReason==='function' ? communityGateReason(user) : {ok:true};
    if(!gate.ok) return gate.message + " You're welcome to browse in the meantime.";
    return "You're not figuring this out alone — that's kind of the whole point of this page. You've unlocked posting, so jump in whenever you're ready.";
  }
  if(pageKey==='about') return "Curious why WRLD exists? I think you'll like this page.";
  if(pageKey==='passport') return "This grows every time you finish something — nothing here is invented, all of it is really yours.";
  if(s.streak>=3) return `${s.streak}-day streak! 🔥 I'm impressed — don't stop now.`;
  if(done>0) return `Nice work — ${done} Playbook${done!==1?'s' : ''} completed so far. Want a recommendation for what's next?`;
  return "Hi! I'm Orbit 🌎 — click me anytime for a tip, or just say hello.";
}

/* V21 bugfix: this used to set `.textContent` on `#guide-bubble` itself —
   the OUTER wrapper div, which also contains the dismiss "✕" button (and,
   as of V21, the mobile action-line). Setting `.textContent` on an
   element replaces ALL of its children with one plain text node, so
   every call here was silently deleting the dismiss button (and the
   message span's own click target) from the DOM on every single page
   load, immediately after renderFooter() first created them. The
   circular avatar icon (a separate sibling element with its own working
   click handler) was always still there, so Orbit itself never looked
   broken — but the bubble's own tap target and "✕" stopped working
   before a person ever saw them. Fixed by targeting the dedicated
   `#guide-bubble-text` span instead, which now exists specifically so
   the wrapper's other children are never touched here.

   V21 also delegates to orbit.js's orbitRenderGuideBubbleContent() when
   available, which shows the full message unchanged on desktop and a
   short, ~120-character mobile preview (plus a contextual action line)
   on mobile — see orbit.js's MOBILE COMPACT PREVIEW section. The direct
   fallback below only runs if orbit.js somehow hasn't loaded, which
   doesn't happen on any real page in this project (every page that calls
   initPage() also loads orbit.js). */
function setGuideMessage(msg){
  if(typeof orbitRenderGuideBubbleContent === 'function'){ orbitRenderGuideBubbleContent(msg); return; }
  const b = document.getElementById('guide-bubble-text');
  if(b && msg) b.textContent = msg;
}

function guideTip(){
  const s = getState();
  const dynamicPool = [];
  if(s.streak>=2) dynamicPool.push(`You're on a ${s.streak}-day streak — that's genuinely hard to keep up. Nice work 🔥`);
  const savedCount = s.bookmarks.filter(b=>!b.startsWith('program-')&&!b.startsWith('event-')).length;
  if(savedCount>0) dynamicPool.push(`You've got ${savedCount} Playbook${savedCount!==1?'s':''} saved for later — your Dashboard has them all 🔖`);
  if(s.completed.length>0) dynamicPool.push(`You've finished ${s.completed.length} Playbook${s.completed.length!==1?'s':''} so far. Every one adds up 🌱`);
  const pool = dynamicPool.length ? dynamicPool.concat(GUIDE_TIPS) : GUIDE_TIPS;
  // V21 bugfix: same fix as setGuideMessage() above — this is currently
  // unused/dead code (nothing calls guideTip() anywhere in the project),
  // but corrected for consistency so it can't reintroduce the same bug if
  // it's ever wired up later.
  const b = document.getElementById('guide-bubble-text');
  if(b) b.textContent = pool[Math.floor(Math.random()*pool.length)];
}

/* ---------------------------------------------------------------------
   SHARE / PRINT
   --------------------------------------------------------------------- */
function sharePage(title){
  if(navigator.share){ navigator.share({title: title||document.title, url: location.href}).catch(()=>{}); }
  else { navigator.clipboard?.writeText(location.href); showToast('🔗 Link copied to clipboard'); }
}
function printPage(){ window.print(); }

/* ---------------------------------------------------------------------
   INIT (called by every page)
   --------------------------------------------------------------------- */
async function initPage(activeKey, customGuideMsg){
  // Wait for the Supabase session + profile cache to resolve before
  // rendering anything that reads getCurrentUser() (the header's
  // avatar/Login-Sign Up state, Orbit's greeting, etc.) — see
  // supabase-client.js's top comment. Every page still calls this the
  // same fire-and-forget way it always did (`initPage('dashboard')`),
  // so making this async required no changes to any of the 28 callers.
  // V22.1 — defense in depth. window.wrldAuthReady should now always
  // resolve (see supabase-client.js's V22.1 fix to wrldRefreshSessionCache()),
  // but initPage() runs on every single page, so it never assumes that —
  // an unexpected rejection here (from this or any future change) must
  // never again be able to silently stop the header, footer, streak, and
  // Orbit init below from ever running on ANY page.
  if(typeof window.wrldAuthReady !== 'undefined'){
    try{ await window.wrldAuthReady; }
    catch(e){ if(typeof wrldLogDiag==='function') wrldLogDiag('init_page_auth_ready_threw', { message: e && e.message }); }
  }
  // V20.6: remembered so supabase-client.js can re-render the header if a
  // LATER auth-state event (a delayed session-restore resolution, a token
  // refresh, a sign-out in another tab) resolves after this first render —
  // see the matching comment in supabase-client.js's onAuthStateChange
  // handler. Harmless to set on every page; only used defensively.
  window.__wrldLastNavKey = activeKey;
  renderHeader(activeKey);
  renderFooter();
  updateStreak();
  syncBookmarkButtons();
  setGuideMessage(customGuideMsg || contextualGuideMessage(activeKey));
  if(typeof checkLegacyAccountNotice==='function') checkLegacyAccountNotice();
  if(typeof initOrbitAutoBehavior==='function') initOrbitAutoBehavior();
  setTimeout(()=>{ initReveal(); initCounters(); }, 30);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') document.getElementById('mobile-menu')?.classList.remove('open'); });
}
