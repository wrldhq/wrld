/* =====================================================================
   WRLD — Shared Application Logic
   Nav rendering, state (bookmarks/progress/streak), interactivity helpers.
   All persistence uses localStorage — this is a demo learning account,
   clearly labeled as such wherever it's shown in the UI.
   ===================================================================== */

/* ---------------------------------------------------------------------
   NAV + FOOTER (rendered into every page from one shared template)
   --------------------------------------------------------------------- */
function renderHeader(activeKey){
  const el = document.getElementById('site-header');
  if(!el) return;
  el.innerHTML = `
  <a href="#main" class="skip-link">Skip to content</a>
  <header>
    <div class="nav container">
      <a href="index.html" class="logo">
        <svg width="30" height="30" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#2EA8C7"/><path d="M20 35c10-25 45-20 40 5-4 18-30 10-25 25 4 12-15 15-20 0-4-13 3-20 5-30z" fill="#F5CF57"/><path d="M60 15c8 5 5 15-3 12-6-2-2-15 3-12z" fill="#F5CF57"/><path d="M65 55c12-4 25 3 20 15-4 10-22 8-25-2-2-6 1-11 5-13z" fill="#F5CF57"/></svg>
        wrld<span class="dot">.</span>
      </a>
      <nav class="nav-links" aria-label="Primary">
        ${NAV_LINKS.map(l=>`<a href="${l.href}" data-key="${l.key}" class="${activeKey===l.key?'active':''}">${l.label}</a>`).join('')}
      </nav>
      <div class="nav-cta">
        <a href="dashboard.html" class="btn btn-outline btn-sm">📊 Dashboard</a>
        <a href="playbooks.html" class="btn btn-primary btn-sm">🌎 Start Learning</a>
      </div>
      <button class="burger" onclick="toggleMobileMenu()" aria-label="Open menu">☰</button>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu">
    <div class="flex justify-between items-center mb-24">
      <div class="logo">wrld<span class="dot">.</span></div>
      <button class="burger" onclick="toggleMobileMenu()" aria-label="Close menu">✕</button>
    </div>
    ${NAV_LINKS.map(l=>`<a href="${l.href}">${l.label}</a>`).join('')}
    <a href="dashboard.html" class="btn btn-primary btn-block mt-24">📊 My Dashboard</a>
  </div>`;
}

function toggleMobileMenu(){
  document.getElementById('mobile-menu').classList.toggle('open');
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
          <a href="events.html">Events</a>
          <a href="community.html">Discussion Boards</a>
          <a href="community.html#volunteer">Volunteer</a>
          <a href="community.html#mentor">Become a Mentor</a>
        </div>
        <div>
          <h5>Organization</h5>
          <a href="about.html">About WRLD</a>
          <a href="about.html#donate">Donate</a>
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
    <div class="guide-bubble" id="guide-bubble">Hi! I'm Orbit 🌎</div>
    <svg class="guide-avatar float" viewBox="0 0 100 100" onclick="guideTip()" role="button" aria-label="Get a tip from Orbit"><circle cx="50" cy="50" r="46" fill="#2EA8C7" stroke="white" stroke-width="4"/><path d="M20 35c10-25 45-20 40 5-4 18-30 10-25 25 4 12-15 15-20 0-4-13 3-20 5-30z" fill="#F5CF57"/><circle cx="40" cy="45" r="4" fill="#1F3D4D"/><circle cx="60" cy="45" r="4" fill="#1F3D4D"/><path d="M38 60c6 6 18 6 24 0" stroke="#1F3D4D" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
  </div>
  <div id="toast" class="toast"></div>
  <canvas id="confetti-canvas"></canvas>`;
}

function subscribeNewsletter(e){
  e.preventDefault();
  const input = e.target.closest('div').querySelector('.newsletter-input');
  if(input && input.value.includes('@')){ showToast('🎉 Subscribed — welcome to WRLD updates!'); input.value=''; }
  else showToast('Enter a valid email to subscribe');
}

/* ---------------------------------------------------------------------
   LOCAL STATE (demo learning account — clearly labeled in the UI)
   --------------------------------------------------------------------- */
const STORE_KEY = 'wrld_demo_state_v1';
function getState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {bookmarks:[], completed:[], checklists:{}, quizScores:{}, streak:0, lastVisit:null, recentlyViewed:[]};
}
function setState(state){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

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

function toggleBookmark(slug){
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
  itemsEl.innerHTML = items.map((txt,i)=>`
    <div class="checklist-item ${saved.includes(i)?'checked':''}" data-i="${i}" tabindex="0" role="checkbox" aria-checked="${saved.includes(i)}">
      <div class="checklist-box">${saved.includes(i)?'✓':''}</div><span class="txt">${txt}</span>
    </div>`).join('');
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
  if(pageKey==='community') return "You're not figuring this out alone — that's kind of the whole point of this page.";
  if(pageKey==='about') return "Curious why WRLD exists? I think you'll like this page.";
  if(s.streak>=3) return `${s.streak}-day streak! 🔥 I'm impressed — don't stop now.`;
  if(done>0) return `Nice work — ${done} Playbook${done!==1?'s' : ''} completed so far. Want a recommendation for what's next?`;
  return "Hi! I'm Orbit 🌎 — click me anytime for a tip, or just say hello.";
}

function setGuideMessage(msg){
  const b = document.getElementById('guide-bubble');
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
  const b = document.getElementById('guide-bubble');
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
function initPage(activeKey, customGuideMsg){
  renderHeader(activeKey);
  renderFooter();
  updateStreak();
  syncBookmarkButtons();
  setGuideMessage(customGuideMsg || contextualGuideMessage(activeKey));
  setTimeout(()=>{ initReveal(); initCounters(); }, 30);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') document.getElementById('mobile-menu')?.classList.remove('open'); });
}
