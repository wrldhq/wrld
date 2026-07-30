/* =====================================================================
   WRLD — Orbit v2: Conversational Learning Companion (orbit.js)

   Orbit is moving from a mascot that shows contextual one-liners into
   the primary way users interact with WRLD: navigation help, a learning
   guide, a platform assistant, and a warm conversational presence that
   celebrates real progress.

   ARCHITECTURE NOTE: getOrbitResponse() is a self-contained, rule-based
   matcher today — no external AI service exists yet. It is intentionally
   written as ONE pure function that takes a message + context and returns
   a response, so that swapping in a real LLM-backed API later (e.g. a
   fetch() to an /api/orbit endpoint) only requires changing the body of
   this one function. Every place that calls it (the chat panel, future
   dashboard widgets, etc.) keeps working unchanged — the same pattern
   app.js uses for getState()/setState() and auth.js uses for signUp/logIn.

   Orbit never fabricates WRLD capabilities that don't exist yet — when a
   feature is still rolling out, Orbit says so warmly and points to the
   closest real thing WRLD already offers.
   ===================================================================== */

let orbitHistory = [];

function openOrbitPanel(auto){
  const panel = document.getElementById('orbit-panel');
  if(!panel) return;
  panel.classList.add('open');
  if(!orbitHistory.length){
    addOrbitMessage(orbitGreeting(), 'orbit');
    renderOrbitSuggestions(defaultOrbitSuggestions());
  }
  // Skip the auto-focus when Orbit opens itself (mobile auto-show) — a
  // chat that grabs keyboard focus (and pops the mobile keyboard) without
  // the person asking for it would be exactly the kind of interruption
  // Priority 1 is meant to remove. Manual opens (tapping the icon) still
  // focus the input immediately, same as always.
  if(!auto){
    setTimeout(()=>document.getElementById('orbit-input')?.focus(), 150);
  }
}

function closeOrbitPanel(){
  document.getElementById('orbit-panel')?.classList.remove('open');
}

/* ---------------------------------------------------------------------
   MOBILE COMPACT PREVIEW (V21)
   On small screens only, Orbit briefly shows a short, page-relevant
   preview — reusing the SAME small "guide" bubble that already sits next
   to Orbit's circular launcher on every screen size — then automatically
   collapses back to just the circular launcher a few seconds later.

   V21 replaces this section's previous approach (auto-opening the FULL
   orbit-panel chat window with Orbit's full greeting paragraph, then
   auto-closing it) with the shorter, purpose-built compact preview
   described below. The full assistant panel (openOrbitPanel()/
   closeOrbitPanel(), the chat history, the response engine) is completely
   unchanged — it's still exactly how a person reaches Orbit's full
   contextual greeting and conversation; the compact preview is a new,
   smaller, separate thing that sits in front of it and links into it.

   Desktop is untouched: every function below either no-ops or is never
   invoked once window.innerWidth is above ORBIT_MOBILE_BREAKPOINT (the
   same 720px breakpoint styles.css already uses for the site's other
   mobile-only rules) — see orbitLauncherTap()/initOrbitAutoBehavior().
   On desktop the guide bubble keeps showing its full contextual tip
   permanently, exactly as before; only the CSS in styles.css's
   `@media(max-width:720px)` block hides/reveals it on small screens.
   --------------------------------------------------------------------- */
const ORBIT_MOBILE_BREAKPOINT = 720;
const ORBIT_SESSION_DISMISS_KEY = 'wrld_orbit_dismissed_v1';
const ORBIT_AUTO_COLLAPSE_MS = 5000; // "approximately five seconds"

let orbitAutoCollapseTimer = null;
let orbitAutoCollapseScrollHandler = null;
let orbitCompactPreviewOpen = false;       // current visible state on THIS page load
let orbitAutoBehaviorInitialized = false;  // guards against a duplicate timer/listener if initOrbitAutoBehavior() were ever called twice
let orbitOutsideTapHandler = null;

function orbitIsMobile(){ return window.innerWidth <= ORBIT_MOBILE_BREAKPOINT; }

function orbitWasDismissedThisSession(){
  try{ return sessionStorage.getItem(ORBIT_SESSION_DISMISS_KEY) === '1'; }
  catch(e){ return false; }
}

function markOrbitDismissedThisSession(){
  try{ sessionStorage.setItem(ORBIT_SESSION_DISMISS_KEY, '1'); }
  catch(e){ /* private-browsing / storage disabled — fail silently, just skip remembering */ }
}

function clearOrbitAutoCollapseWatchers(){
  if(orbitAutoCollapseTimer){ clearTimeout(orbitAutoCollapseTimer); orbitAutoCollapseTimer = null; }
  if(orbitAutoCollapseScrollHandler){
    window.removeEventListener('scroll', orbitAutoCollapseScrollHandler);
    orbitAutoCollapseScrollHandler = null;
  }
}

/* Shortens any existing contextual guide message down to roughly the
   page-relevant preview WRLD's mobile spec asks for (about 120
   characters / two compact lines) — never the full desktop paragraph.
   Cuts at the nearest sentence boundary when one exists in range, so it
   reads as a complete short thought rather than a mid-word clip; falls
   back to a clean word-boundary + ellipsis otherwise. Pure/no DOM access
   so it's easy to unit-test on its own (see local-simulation/). */
function orbitCompactPreviewText(fullMsg){
  if(!fullMsg) return '';
  const MAX = 120;
  if(fullMsg.length <= MAX) return fullMsg;
  const punctMatch = fullMsg.slice(0, MAX + 20).match(/^(.*?[.!?])\s/);
  if(punctMatch && punctMatch[1].length <= MAX + 15) return punctMatch[1];
  const cut = fullMsg.slice(0, MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

// One of the site's approved short action labels, per page — a sensible,
// safe default everywhere else. Purely cosmetic/copy — every one of
// these opens the exact same full Orbit assistant.
function contextualOrbitPreviewAction(pageKey){
  const ACTIONS = {
    playbooks: 'Get a recommendation →',
    paths: 'Get a recommendation →',
    programs: 'Show me around →',
    assessment: 'Ask Orbit →',
    community: 'Ask Orbit →',
  };
  return ACTIONS[pageKey] || 'Tap me for more →';
}

/* Called by app.js's setGuideMessage() every time it has a contextual
   message to show. Desktop: unchanged, full message, no action line
   (styles.css keeps the action line hidden outside the mobile media
   query regardless). Mobile: the same message, shortened, plus a short
   action line — never both the short preview AND the full desktop
   paragraph at once. */
function orbitRenderGuideBubbleContent(fullMsg){
  const textEl = document.getElementById('guide-bubble-text');
  const actionEl = document.getElementById('guide-bubble-action');
  if(!textEl || !fullMsg) return;
  if(orbitIsMobile()){
    textEl.textContent = orbitCompactPreviewText(fullMsg);
    if(actionEl) actionEl.textContent = contextualOrbitPreviewAction(window.__wrldLastNavKey);
  } else {
    textEl.textContent = fullMsg;
    if(actionEl) actionEl.textContent = '';
  }
}

/* Shows the compact preview: clears any leftover inline `display:none`
   from a previous manual dismiss (see dismissOrbitCompactPreview()),
   restores the bubble's own focusability/visibility to assistive tech,
   and starts listening for an outside tap to collapse it. Safe to call
   on desktop (styles.css only makes any of this visually matter inside
   its mobile media query), but every call site below already only
   reaches this on mobile. */
function showOrbitCompactPreview(){
  const b = document.getElementById('guide-bubble');
  if(!b) return;
  b.style.removeProperty('display');
  b.classList.add('orbit-preview-open');
  b.setAttribute('aria-hidden', 'false');
  b.setAttribute('tabindex', '0');
  const dismissBtn = b.querySelector('.guide-bubble-dismiss');
  if(dismissBtn) dismissBtn.tabIndex = 0;
  orbitCompactPreviewOpen = true;
  attachOrbitOutsideTapListener();
}

/* Collapses the compact preview back to just the circular launcher.
   Does NOT touch sessionStorage/dismissal state on its own — the timer,
   a tap-outside, and a second launcher tap all collapse this way but
   leave the preview eligible to reopen on a later manual tap; only the
   explicit "✕" (dismissOrbitCompactPreview()) marks it as manually
   closed for the rest of the session, per the required interaction
   rules. */
function collapseOrbitCompactPreview(){
  const b = document.getElementById('guide-bubble');
  if(!b) return;
  b.classList.remove('orbit-preview-open');
  b.setAttribute('aria-hidden', 'true');
  b.setAttribute('tabindex', '-1');
  const dismissBtn = b.querySelector('.guide-bubble-dismiss');
  if(dismissBtn) dismissBtn.tabIndex = -1;
  orbitCompactPreviewOpen = false;
  clearOrbitAutoCollapseWatchers();
  detachOrbitOutsideTapListener();
}

// Explicit "✕" — collapses immediately, keeps the launcher visible, and
// (via the existing session-wide dismissal flag, unchanged from before
// V21) stops the automatic preview from popping up again on later pages
// this session, exactly like dismissing Orbit's tip already worked prior
// to this release.
function dismissOrbitCompactPreview(){
  collapseOrbitCompactPreview();
  const b = document.getElementById('guide-bubble');
  if(b) b.style.display = 'none';
  markOrbitDismissedThisSession();
}

// A tap anywhere outside the guide bubble/launcher collapses the
// compact preview — added only while it's open, removed the moment it
// isn't, so it can never intercept or block a tap on ordinary page
// content (it never calls preventDefault()/stopPropagation(), so the
// same tap still reaches whatever the visitor actually tapped).
function attachOrbitOutsideTapListener(){
  if(orbitOutsideTapHandler) return;
  orbitOutsideTapHandler = (e)=>{
    const guide = document.getElementById('guide');
    if(guide && !guide.contains(e.target)) collapseOrbitCompactPreview();
  };
  document.addEventListener('pointerdown', orbitOutsideTapHandler, {passive:true});
}
function detachOrbitOutsideTapListener(){
  if(orbitOutsideTapHandler){
    document.removeEventListener('pointerdown', orbitOutsideTapHandler);
    orbitOutsideTapHandler = null;
  }
}

// The circular launcher's click handler. Desktop: unchanged — opens the
// full assistant directly, exactly as always. Mobile: single-tap toggle
// between the compact preview and just-the-launcher, per the required
// interaction rules — never opens the full assistant directly from a
// launcher tap on mobile (tapping the preview's own text/action line
// does that instead, via orbitOpenFullFromPreview() below).
function orbitLauncherTap(){
  if(!orbitIsMobile()){ openOrbitPanel(); return; }
  if(orbitCompactPreviewOpen) collapseOrbitCompactPreview();
  else showOrbitCompactPreview();
}

// Tapping the preview's message/action line (or, on desktop, the always-
// on tip bubble) opens the full assistant. On mobile this also collapses
// the compact preview first, so the two panels never show at once; on
// desktop collapseOrbitCompactPreview() has nothing to do (the preview
// was never toggled open in the first place) so this is functionally
// identical to the old direct openOrbitPanel() call.
function orbitOpenFullFromPreview(){
  if(orbitIsMobile()) collapseOrbitCompactPreview();
  openOrbitPanel();
}

// Manual close of the FULL assistant panel (its own "✕", unrelated to
// the compact preview's) — unchanged from before V21.
function dismissOrbitPanel(){
  closeOrbitPanel();
  markOrbitDismissedThisSession();
  clearOrbitAutoCollapseWatchers();
}

// Pages that are primarily a form or a guided onboarding flow — Orbit
// never auto-opens over these on mobile (it stays available as a tap-to-
// open icon), since the auto-preview would otherwise sit on top of a
// short-viewport form field or an onboarding step. Matched against the
// current page's filename, not activeKey, so it works even on pages
// that aren't in top nav (login/signup/forgot-password/reset-password/
// owner-setup aren't NAV_GROUPS items).
// V22: assessment.html added. The assessment already has its own
// dedicated, permanent Orbit presence built into the page itself (the
// intro's and each question's `.assess-orbit-line`) — a second, separate
// floating preview auto-showing on top of that on mobile would be a
// duplicate Orbit and, on the intro view especially, can sit over the
// "Start My Journey" control. The circular launcher stays available for
// a manual tap, same as every other excluded page below.
// V24: 'welcome.html' removed from this list — the page no longer
// exists (onboarding system removed; see AUTH-MIGRATION-SUMMARY.md).
const ORBIT_AUTO_SHOW_EXCLUDED_PAGES = [
  'signup.html','login.html','forgot-password.html','reset-password.html',
  'owner-setup.html','assessment.html',
];
function orbitCurrentPageExcludedFromAutoShow(){
  const page = location.pathname.split('/').pop() || 'index.html';
  return ORBIT_AUTO_SHOW_EXCLUDED_PAGES.includes(page);
}

function initOrbitAutoBehavior(){
  if(orbitAutoBehaviorInitialized) return; // one call per page load — no duplicate timers/listeners
  orbitAutoBehaviorInitialized = true;

  if(!orbitIsMobile()) return;
  if(orbitWasDismissedThisSession()) return;
  if(orbitCurrentPageExcludedFromAutoShow()) return;
  const bubble = document.getElementById('guide-bubble');
  if(!bubble) return;

  // Begin the auto-collapse countdown only once the preview has actually
  // been rendered (next frame), not the instant this function runs.
  showOrbitCompactPreview();
  requestAnimationFrame(()=>{
    orbitAutoCollapseTimer = setTimeout(()=>{
      collapseOrbitCompactPreview();
    }, ORBIT_AUTO_COLLAPSE_MS);
  });

  orbitAutoCollapseScrollHandler = ()=>{ collapseOrbitCompactPreview(); };
  window.addEventListener('scroll', orbitAutoCollapseScrollHandler, {passive:true, once:true});

  // If the person actually starts interacting with the auto-shown
  // preview before the timer fires — tapping it, focusing the "✕" via
  // keyboard, etc. — stop the countdown rather than collapsing out from
  // under them.
  bubble.addEventListener('pointerdown', clearOrbitAutoCollapseWatchers, {once:true});
  bubble.addEventListener('focusin', clearOrbitAutoCollapseWatchers, {once:true});
}

function addOrbitMessage(html, from){
  orbitHistory.push({html, from});
  const wrap = document.getElementById('orbit-messages');
  if(!wrap) return;
  const div = document.createElement('div');
  div.className = 'orbit-msg from-' + from;
  div.innerHTML = html;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function renderOrbitSuggestions(list){
  const wrap = document.getElementById('orbit-suggestions');
  if(!wrap) return;
  wrap.innerHTML = list.map(s=>`<button type="button" class="orbit-chip" onclick="askOrbit(${JSON.stringify(s).replace(/"/g,'&quot;')})">${s}</button>`).join('');
}

function askOrbit(text){
  const input = document.getElementById('orbit-input');
  if(input) input.value = text;
  sendOrbitMessage();
}

/* ---------------------------------------------------------------------
   ORBIT AI — safe page context
   Built fresh per message from real, already-available state (no new
   globals other pages need to set) — see orbit-knowledge.js for the
   companion content index this is sent alongside.
   --------------------------------------------------------------------- */
function buildOrbitContext(){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const s = typeof getState==='function' ? getState() : null;
  const params = new URLSearchParams(location.search);
  return {
    page: location.pathname.split('/').pop().replace('.html','') || 'index',
    playbookSlug: params.get('slug') || undefined,
    programId: params.get('id') || undefined,
    loggedIn: !!user,
    role: user ? user.role : undefined,
    progress: s ? {
      completedPlaybooks: (s.completed||[]).length,
      completedPaths: typeof completedPathKeys==='function' ? completedPathKeys().length : undefined,
      streak: s.streak || 0,
    } : undefined,
  };
}

// Shown once per session on the first fallback, so a real outage doesn't
// silently look like Orbit just got worse — but doesn't repeat and
// clutter every subsequent message once the person keeps chatting.
let orbitAIFallbackNoticeShown = false;

async function tryOrbitAI(text){
  if(typeof sbClient === 'undefined' || !sbClient?.functions?.invoke) return null;
  try{
    const knowledge = typeof retrieveOrbitKnowledge==='function' ? retrieveOrbitKnowledge(text, 6) : [];
    const history = orbitHistory.slice(-6).map(m=>({from:m.from, text: (new DOMParser().parseFromString(m.html,'text/html')).body.textContent || ''}));
    const { data, error } = await sbClient.functions.invoke('orbit-ai', {
      body: { message: text, history, context: buildOrbitContext(), knowledge },
    });
    if(error || !data?.ok || !data?.reply) return null;
    return data;
  }catch(e){
    return null;
  }
}

async function sendOrbitMessage(){
  const input = document.getElementById('orbit-input');
  if(!input) return;
  const text = input.value.trim();
  if(!text) return;
  addOrbitMessage(escapeHtml(text), 'user');
  input.value = '';

  const aiResult = await tryOrbitAI(text);

  if(aiResult){
    const linksHtml = (aiResult.links||[]).map(l=>orbitActionLink(l.label+' →', l.url)).join('');
    setTimeout(()=>{
      addOrbitMessage(escapeHtml(aiResult.reply).replace(/\n/g,'<br>') + linksHtml, 'orbit');
      renderOrbitSuggestions(defaultOrbitSuggestions());
    }, 260);
    return;
  }

  // Fall back to the existing rule-based Orbit — unchanged behavior,
  // exactly as before Orbit AI existed.
  const res = getOrbitResponse(text);
  setTimeout(()=>{
    if(!orbitAIFallbackNoticeShown){
      orbitAIFallbackNoticeShown = true;
      addOrbitMessage(`<em>My AI connection is taking a quick orbit. You can still use my shortcuts and explore WRLD while I reconnect.</em>`, 'orbit');
    }
    addOrbitMessage(res.html, 'orbit');
    renderOrbitSuggestions(res.suggestions || defaultOrbitSuggestions());
  }, 260);
}

function clearOrbitConversation(){
  orbitHistory = [];
  const wrap = document.getElementById('orbit-messages');
  if(wrap) wrap.innerHTML = '';
  addOrbitMessage(orbitGreeting(), 'orbit');
  renderOrbitSuggestions(defaultOrbitSuggestions());
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function orbitActionLink(label, href){
  return `<div class="mt-8"><a href="${href}" class="btn btn-primary btn-sm" style="display:inline-block;">${label}</a></div>`;
}

/* ---------------------------------------------------------------------
   PERSONALIZED GREETING
   Uses real local progress (getState) and, once logged in, the real
   account (getCurrentUser) — never invented stats.
   --------------------------------------------------------------------- */
function orbitGreeting(){
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;
  const s = typeof getState==='function' ? getState() : {completed:[], bookmarks:[], streak:0};
  const firstName = user ? user.name.split(' ')[0] : null;
  const done = s.completed?.length || 0;
  const streak = s.streak || 0;

  // Assessment-aware: the most personalized greeting we can give
  if(s.assessment && typeof weakestAssessmentSection==='function'){
    const weakest = weakestAssessmentSection(s.assessment.sectionScores);
    const rec = weakest && typeof SECTION_RECS!=='undefined' ? SECTION_RECS[weakest] : null;
    const pb = rec && rec.playbooks.map(getPlaybook).find(p=>p && !s.completed.includes(p.slug));
    if(pb){
      const name = firstName ? firstName+', ' : '';
      return `Hey ${name}based on what you shared in your assessment, I'd recommend starting with <strong>${pb.title}</strong> next.${orbitActionLink('Start This Playbook →','playbook.html?slug='+pb.slug)}`;
    }
  }
  if(firstName && streak>=2){
    return `Welcome back, ${firstName} — you were making great progress, on a ${streak}-day streak 🔥 Ready to continue where we left off?`;
  }
  if(firstName && done>0){
    return `Hey ${firstName} 👋 You've completed ${done} Playbook${done!==1?'s':''} so far — genuinely great progress. What can I help with today?`;
  }
  if(firstName){
    return `Hey ${firstName} 👋 I'm Orbit — think of me as your guide to everything on WRLD. Ask me where to find something, what to learn next, or just say what's going on and I'll point you the right way.`;
  }
  if(done>0){
    return `Welcome back 👋 You've completed ${done} Playbook${done!==1?'s':''} on this browser so far. I'm Orbit — ask me anything about WRLD, or tell me what's going on and I'll point you somewhere useful.`;
  }
  return `Hi, I'm Orbit 🌎 I'm here to help you find your way around WRLD — Playbooks, live sessions, tools, all of it. Ask me a question, or tell me what's going on in life right now and I'll point you toward something useful.`;
}

function defaultOrbitSuggestions(){
  return ['Where should I start?', 'Recommend a Playbook', 'How do live sessions work?', "I'm overwhelmed"];
}

/* ---------------------------------------------------------------------
   RESPONSE ENGINE
   Ordered rules, first match wins. Each rule's test() checks the raw
   lowercase message; respond() returns {html, suggestions}.
   --------------------------------------------------------------------- */
function getOrbitResponse(raw){
  const msg = raw.toLowerCase();
  const s = typeof getState==='function' ? getState() : {completed:[], bookmarks:[], streak:0};
  const user = typeof getCurrentUser==='function' ? getCurrentUser() : null;

  for(const rule of ORBIT_RULES){
    if(rule.test(msg)){
      return rule.respond({msg, s, user});
    }
  }
  return {
    html: `I don't have a perfect answer for that yet, but I can always point you toward the Playbook Library or the Adulting Readiness Assessment — both are great starting points no matter what's going on.${orbitActionLink('Browse Playbooks →','playbooks.html')}`,
    suggestions: defaultOrbitSuggestions(),
  };
}

const ORBIT_RULES = [
  /* ---------- Celebration / progress check-ins ---------- */
  {
    test:m=>/(how am i doing|my progress|check my progress|my streak|my stats)/.test(m),
    respond:({s})=>{
      const done = s.completed?.length||0, streak = s.streak||0, saved = (s.bookmarks||[]).filter(b=>!b.startsWith('program-')&&!b.startsWith('event-')).length;
      const paths = typeof completedPathKeys==='function' ? completedPathKeys().length : 0;
      if(done===0 && saved===0){
        return {html:"You haven't completed a Playbook yet — no pressure, everyone starts somewhere. Want me to recommend a beginner-friendly one?", suggestions:['Recommend a Playbook','Where should I start?']};
      }
      let html = `Here's where you're at: <strong>${done} Playbook${done!==1?'s':''} completed</strong>`;
      if(paths>0) html += `, <strong>${paths} Learning Path${paths!==1?'s':''} finished</strong> 🧭`;
      if(streak>=2) html += `, on a <strong>${streak}-day streak</strong> 🔥`;
      if(saved>0) html += `, and <strong>${saved} saved</strong> for later`;
      html += `. ${done>=5?"That's real, consistent progress — keep going 🌱":"Every one of those adds up — nice work."}`;
      return {html, suggestions:['Recommend a Playbook','Show my Journey Passport']};
    }
  },
  {
    test:m=>/passport|journey passport/.test(m),
    respond:()=>({html:`Your Journey Passport is a growing record of your Learning Paths, milestones, and progress — all real, nothing invented.${orbitActionLink('View My Passport →','journey-passport.html')}`, suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/dashboard/.test(m),
    respond:()=>({html:`Your Dashboard has your saved Playbooks, completed progress, streak, and achievements all in one place.${orbitActionLink('Open Dashboard →','dashboard.html')}`, suggestions:defaultOrbitSuggestions()})
  },

  /* ---------- Conversational / emotional prompts ---------- */
  {
    test:m=>/overwhelm|stressed|anxious|don'?t know where to start|lost/.test(m),
    respond:()=>({
      html:"That feeling is really normal — adulthood throws a lot at once, and nobody hands you a manual for it. Let's make it smaller: the Adulting Readiness Assessment takes about 10-15 minutes and builds you a personal starting point, so you're not guessing.",
      suggestions:['Take the Assessment','Recommend a Playbook','I have my first interview'],
    })
  },
  {
    test:m=>/first interview|job interview|interview (prep|tomorrow|coming up|soon)/.test(m),
    respond:()=>({
      html:`Congrats on the interview — that's a big step. The Interview Skills Playbook covers the most common questions, the STAR method, and how to calm pre-interview nerves.${orbitActionLink('Open Interview Playbook →','playbook.html?slug=interview-skills')}`,
      suggestions:['I need a resume too', 'How do I follow up after?'],
    })
  },
  {
    test:m=>/resume/.test(m),
    respond:()=>({html:`The Resume Playbook walks through building one from scratch — even with zero work experience.${orbitActionLink('Open Resume Playbook →','playbook.html?slug=resume')}`, suggestions:['I have my first interview','Recommend a Playbook']})
  },
  {
    test:m=>/choos(e|ing) a university|which university|picking a school|which college/.test(m),
    respond:()=>({
      html:"That's a big decision, and honestly WRLD doesn't have a dedicated \"choosing a university\" Playbook yet — but Scholarships and Financial Planning can help you think through the pieces that matter most: cost, aid, and long-term plans.",
      suggestions:['Scholarships','Financial planning', 'Where should I start?'],
    })
  },
  {
    test:m=>/budget|budgeting/.test(m),
    respond:()=>({html:`Creating Your First Real Budget is exactly the Playbook for this — it starts with tracking before restricting, so you actually see your real patterns first.${orbitActionLink('Open Budgeting Playbook →','playbook.html?slug=budgeting')}`, suggestions:['Emergency fund','Credit scores']})
  },
  {
    test:m=>/credit score/.test(m),
    respond:()=>({html:`Understanding Credit Scores covers the two biggest levers you control — payment history and utilization.${orbitActionLink('Open Credit Scores Playbook →','playbook.html?slug=credit-scores')}`, suggestions:['Budgeting','Emergency fund']})
  },

  /* ---------- Navigation ---------- */
  {
    test:m=>/scholarship/.test(m),
    respond:()=>({html:`Finding Scholarships You Actually Qualify For covers where to look beyond the famous, high-competition ones.${orbitActionLink('Open Scholarships Playbook →','playbook.html?slug=scholarships')}`, suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/volunteer/.test(m),
    respond:()=>({html:`The Volunteer Hub curates remote and virtual-friendly opportunities across a few categories — tutoring, digital skills mentoring, community organizing, and more.${orbitActionLink('Open Volunteer Hub →','community.html#volunteer')}`, suggestions:['Become a mentor','How do live sessions work?']})
  },
  {
    test:m=>/(become a|becoming a) mentor|mentorship|mentor network/.test(m),
    respond:()=>({html:`Becoming a Mentor starts with a real application — tell WRLD about your background and availability, and a real person reviews it before Mentor access is granted.${orbitActionLink('Apply to Mentor →','become-mentor.html')}`, suggestions:['How do live sessions work?','Where do I find worksheets?']})
  },
  {
    test:m=>/certificate/.test(m),
    respond:()=>({html:`Certificates aren't issued quite yet — they're launching alongside full WRLD accounts, starting with the first completed cohorts. Completing every Playbook in a Learning Path is what makes you eligible once they go live. You can track eligible progress on your Dashboard already.${orbitActionLink('Open Dashboard →','dashboard.html')}`, suggestions:['Learning Paths','Show my Dashboard']})
  },
  {
    test:m=>/worksheet|template|download/.test(m),
    respond:()=>({html:`The Download Center has every worksheet and template WRLD offers — all free, print-ready, no sign-up required.${orbitActionLink('Open Download Center →','downloads.html')}`, suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/\btool(s)?\b/.test(m),
    respond:()=>({html:`The Tools page has WRLD's interactive calculators — budgeting, savings goals, and more — for honest, real-number feedback.${orbitActionLink('Open Tools →','tools.html')}`, suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/live session|live learning|workshop|event/.test(m),
    respond:()=>({html:`Live Learning is where WRLD's live, virtual sessions show up — hosted by mentors over Zoom, Google Meet, or Teams. Browse every program, and any scheduled sessions appear there as mentors publish them.${orbitActionLink('Open Live Learning →','events.html')}`, suggestions:['How do I become a mentor?','Recommend a Playbook']})
  },
  {
    test:m=>/program/.test(m),
    respond:()=>({html:`WRLD Programs are free, live, cohort-based experiences — things like Career Bootcamp and Financial Literacy Academy.${orbitActionLink('Browse Programs →','programs.html')}`, suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/learning path/.test(m),
    respond:()=>({html:`Learning Paths string Playbooks together into a guided journey, so you're never wondering what to do next.${orbitActionLink('See Learning Paths →','learning-paths.html')}`, suggestions:['Recommend a Playbook']})
  },
  {
    test:m=>/resource/.test(m),
    respond:()=>({html:`Most WRLD resources live in two places: the Download Center for worksheets and templates, and the Playbook Library for full lessons.${orbitActionLink('Open Download Center →','downloads.html')}`, suggestions:['Recommend a Playbook','Where do I find worksheets?']})
  },
  {
    test:m=>/playbook/.test(m) && !/recommend/.test(m),
    respond:()=>({html:`The Playbook Library has every WRLD Playbook, searchable and filterable by category and difficulty.${orbitActionLink('Browse Playbooks →','playbooks.html')}`, suggestions:['Recommend a Playbook']})
  },

  /* ---------- Learning guide / recommendations ---------- */
  {
    test:m=>/recommend|what (should|to) i learn|what'?s next|suggest a playbook/.test(m),
    respond:({s})=>{
      // Assessment-driven recommendation takes priority over generic heuristics
      if(s.assessment && typeof weakestAssessmentSection==='function'){
        const weakest = weakestAssessmentSection(s.assessment.sectionScores);
        const rec = weakest && typeof SECTION_RECS!=='undefined' ? SECTION_RECS[weakest] : null;
        const pick = rec && rec.playbooks.map(getPlaybook).find(p=>p && !(s.completed||[]).includes(p.slug));
        if(pick){
          return {
            html:`Based on your assessment, ${SECTION_META[weakest].title.toLowerCase()} is where a bit of focus would help most — I'd start with <strong>${pick.title}</strong>.${orbitActionLink('Start This Playbook →','playbook.html?slug='+pick.slug)}`,
            suggestions:['My Learning Path', 'Something else instead'],
          };
        }
      }
      const pool = (typeof PLAYBOOKS!=='undefined' ? PLAYBOOKS : []).filter(p=>!(s.completed||[]).includes(p.slug));
      const pick = pool.find(p=>p.difficulty==='Beginner') || pool[0];
      if(!pick){
        return {html:"Looks like you've worked through everything in the library already — genuinely impressive. Check Learning Paths for a guided next journey.", suggestions:['Learning Paths']};
      }
      return {
        html:`Based on where you're at, I'd try <strong>${pick.title}</strong> — ${pick.dek}${orbitActionLink('Start This Playbook →','playbook.html?slug='+pick.slug)}`,
        suggestions:['Something more advanced','Something for beginners','Where should I start?'],
      };
    }
  },
  {
    test:m=>/my learning path|which (learning )?path|what path/.test(m),
    respond:({s})=>{
      if(s.assessment && typeof weakestAssessmentSection==='function'){
        const weakest = weakestAssessmentSection(s.assessment.sectionScores);
        const pathKey = weakest && typeof SECTION_RECS!=='undefined' ? SECTION_RECS[weakest].path : null;
        const path = pathKey && typeof getPath==='function' ? getPath(pathKey) : null;
        if(path){
          return {html:`Based on your assessment, <strong>${path.title}</strong> is the Learning Path I'd suggest — it's built around ${(path.skillsGained||[])[0]?path.skillsGained[0].toLowerCase():'the skills you need most right now'}.${orbitActionLink('View This Path →','learning-paths.html#'+path.key)}`, suggestions:defaultOrbitSuggestions()};
        }
      }
      return {html:`Take the Adulting Readiness Assessment and I'll match you to the Learning Path that fits your goals best.${orbitActionLink('Take the Assessment →','assessment.html')}`, suggestions:['Recommend a Playbook']};
    }
  },
  {
    test:m=>/beginner/.test(m),
    respond:()=>{
      const pick = (typeof PLAYBOOKS!=='undefined'?PLAYBOOKS:[]).find(p=>p.difficulty==='Beginner');
      return pick ? {html:`${pick.title} is a great beginner-friendly place to start.${orbitActionLink('Start This Playbook →','playbook.html?slug='+pick.slug)}`, suggestions:defaultOrbitSuggestions()} : {html:"Try the Playbook Library and filter by Beginner.", suggestions:defaultOrbitSuggestions()};
    }
  },
  {
    test:m=>/advanced/.test(m),
    respond:()=>{
      const pick = (typeof PLAYBOOKS!=='undefined'?PLAYBOOKS:[]).find(p=>p.difficulty==='Advanced');
      return pick ? {html:`${pick.title} is one of our more advanced Playbooks.${orbitActionLink('Start This Playbook →','playbook.html?slug='+pick.slug)}`, suggestions:defaultOrbitSuggestions()} : {html:"Try the Playbook Library and filter by Advanced.", suggestions:defaultOrbitSuggestions()};
    }
  },

  /* ---------- Community ---------- */
  {
    test:m=>/(community commons|join the community|post (a|my) question|ask the community|discussion board)/.test(m),
    respond:({user})=>{
      const gate = typeof communityGateReason==='function' ? communityGateReason(user) : {ok:true};
      if(!gate.ok) return {html:gate.message + " You can still browse discussions in the meantime.", suggestions:['Recommend a Playbook','Take the Assessment']};
      return {html:`You're all set to post — head to Community Commons, or scroll to the bottom of any Playbook to join that topic's discussion.${orbitActionLink('Open Community Commons →','community.html')}`, suggestions:defaultOrbitSuggestions()};
    }
  },
  {
    test:m=>/why (can'?t i post|is posting locked)|unlock (posting|the community)/.test(m),
    respond:({user})=>{
      const gate = typeof communityGateReason==='function' ? communityGateReason(user) : {ok:true};
      return gate.ok
        ? {html:"You're unlocked — you can post and reply anywhere on WRLD now.", suggestions:defaultOrbitSuggestions()}
        : {html:gate.message, suggestions:['Take the Assessment','Recommend a Playbook']};
    }
  },
  {
    test:m=>/study group/.test(m),
    respond:()=>({html:`Study Groups connect you with others working through the same Learning Path, Program, or Playbook. It's a newer part of WRLD, so it's rolling out in phases — check Community Commons for what's open right now.${orbitActionLink('Open Community Commons →','community.html#study-groups')}`, suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/accountability partner/.test(m),
    respond:()=>({html:`Accountability Partners is a WRLD concept for pairing learners working toward similar goals — it needs real, matched members to work properly, so it's launching as WRLD's community grows. For now, Study Groups and Community Commons are the best places to find people on the same journey.`, suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/report|moderation|safety|is (this|wrld) safe/.test(m),
    respond:()=>({html:`WRLD's community is built to be safe by design — every post is automatically screened, anyone can report a post or reply, and reported or flagged content is hidden from public view until it's reviewed. Posting is also only unlocked after you've completed your first Playbook, which keeps things genuinely for learners.`, suggestions:defaultOrbitSuggestions()})
  },

  /* ---------- Platform assistant Q&A ---------- */
  {
    test:m=>/where (should|do) i start|where to start|getting started/.test(m),
    respond:()=>({html:`Most people start with the Adulting Readiness Assessment — 10-15 minutes, builds you a personalized starting point. If you'd rather browse first, the Playbook Library works too.${orbitActionLink('Take the Assessment →','assessment.html')}`, suggestions:['Recommend a Playbook instead','How do live sessions work?']})
  },
  {
    test:m=>/which playbook is right for me|what'?s right for me/.test(m),
    respond:()=>({html:`The Adulting Readiness Assessment is built exactly for this — it looks at where you're at and builds you a personal roadmap.${orbitActionLink('Take the Assessment →','assessment.html')}`, suggestions:['Recommend a Playbook']})
  },
  {
    test:m=>/free|cost|price|pay/.test(m),
    respond:()=>({html:"Everything on WRLD is free — every Playbook, program, worksheet, and live session. No paywalls, no hidden tiers.", suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/hi|hello|hey there|^hey$/.test(m),
    respond:()=>({html:"Hey! 👋 What can I help you find today?", suggestions:defaultOrbitSuggestions()})
  },
  {
    test:m=>/thank/.test(m),
    respond:()=>({html:"Anytime — that's what I'm here for. 🌱", suggestions:defaultOrbitSuggestions()})
  },
];
