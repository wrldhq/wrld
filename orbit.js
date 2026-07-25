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

function openOrbitPanel(){
  const panel = document.getElementById('orbit-panel');
  if(!panel) return;
  panel.classList.add('open');
  if(!orbitHistory.length){
    addOrbitMessage(orbitGreeting(), 'orbit');
    renderOrbitSuggestions(defaultOrbitSuggestions());
  }
  setTimeout(()=>document.getElementById('orbit-input')?.focus(), 150);
}

function closeOrbitPanel(){
  document.getElementById('orbit-panel')?.classList.remove('open');
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

function sendOrbitMessage(){
  const input = document.getElementById('orbit-input');
  if(!input) return;
  const text = input.value.trim();
  if(!text) return;
  addOrbitMessage(escapeHtml(text), 'user');
  input.value = '';
  const res = getOrbitResponse(text);
  setTimeout(()=>{
    addOrbitMessage(res.html, 'orbit');
    renderOrbitSuggestions(res.suggestions || defaultOrbitSuggestions());
  }, 260);
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
