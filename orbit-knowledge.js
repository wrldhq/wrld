/* =====================================================================
   WRLD — Orbit AI Knowledge Base (orbit-knowledge.js)

   Loaded after data.js, before orbit.js. Builds a single, flat, searchable
   knowledge index FROM the site's existing content (PLAYBOOKS, PROGRAMS,
   DOWNLOADS, LEARNING_PATHS in data.js) rather than duplicating any of
   that content by hand — this is the "maintainable knowledge structure"
   requirement: every new Playbook or Program added to data.js is
   automatically searchable by Orbit AI with zero changes needed here.

   A small STATIC_KNOWLEDGE array below covers things that aren't
   Playbook/Program/Download objects — navigation routes, role
   definitions, policies, contact info — and is the only part a person
   would ever hand-edit when WRLD adds a genuinely new kind of feature
   (not just new content within an existing kind).

   No embeddings/vector search — this is plain keyword scoring, which is
   explicitly one of the acceptable "structured local content index"
   approaches and keeps this dependency-free and instantly updatable.
   ===================================================================== */

// Hand-maintained entries for things that aren't playbook/program/download
// objects. Update this array directly when a genuinely new feature,
// policy, or route is added to WRLD (not for new Playbooks/Programs —
// those index automatically below).
const ORBIT_STATIC_KNOWLEDGE = [
  {title:'What WRLD is', text:'WRLD is a free educational platform teaching practical life skills school does not cover — resumes, budgeting, credit, taxes, apartment hunting, mental wellness, and more — through Playbooks, Learning Paths, live Programs, an Assessment, a Community, and a Volunteer Tracker.', url:'about.html', type:'about'},
  {title:'Account roles', text:'WRLD has four account roles: Explorer (every new signup), Mentor (approved volunteers who host live sessions), Administrator, and Owner. Every public signup becomes an Explorer — Mentor and Administrator are never self-service.', url:'about.html', type:'policy'},
  {title:'Becoming a Mentor', text:'Anyone can apply to become a WRLD Mentor on the Become a Mentor page. Every application is reviewed by a real person — applicants stay an Explorer until approved.', url:'become-mentor.html', type:'nav'},
  {title:'The Adulting Readiness Assessment', text:'A short, free assessment that recommends Playbooks, a Learning Path, and Programs based on your answers — no sign-up required to take it.', url:'assessment.html', type:'nav'},
  {title:'Learning Paths', text:'Guided, sequential journeys through the Playbook Library toward a specific outcome, such as Career Readiness or Financial Confidence — each one shows your progress and the next step.', url:'learning-paths.html', type:'nav'},
  {title:'Live Programs', text:'Free, fully digital, live-via-Zoom cohort programs with replay libraries, worldwide and time-zone friendly.', url:'programs.html', type:'nav'},
  {title:'Download Center', text:'Free printable worksheets and templates — resumes, budgets, trackers, and planners.', url:'downloads.html', type:'nav'},
  {title:'Community', text:'A moderated space for discussion, study groups, and volunteering alongside other WRLD learners.', url:'community.html', type:'nav'},
  {title:'Volunteer Tracker', text:'Log volunteer hours and organizations — useful for applications and reflection.', url:'volunteer-tracker.html', type:'nav'},
  {title:'Journey Passport', text:'A personal record of completed Learning Paths, Playbooks, achievements, and live sessions attended.', url:'journey-passport.html', type:'nav'},
  {title:'Contact WRLD', text:'The only real WRLD contact address is hello@ourwrld.org. Orbit never uses any other email address.', url:'about.html#contact', type:'policy'},
  {title:'Certificates', text:'Certificates are not issued yet for Playbooks — this is honestly labeled Coming Soon rather than faked. Live Programs do offer a certificate of completion once a cohort finishes.', url:'about.html', type:'policy'},
  {title:'Mentor Studio', text:'Where approved Mentors schedule live sessions on an existing WRLD Program, edit their public Mentor profile, and manage their own scheduled sessions.', url:'mentor-studio.html', type:'nav'},
  {title:'Owner Dashboard', text:'Where an Administrator or Owner reviews mentor applications, moderates community content, manages members, and sees real, computed platform metrics — never invented numbers.', url:'owner-dashboard.html', type:'nav'},
  {title:'Orbit safety boundaries', text:'Orbit is educational and informational only — not a doctor, therapist, lawyer, financial adviser, or emergency/crisis service. For medical, mental-health, legal, or financial questions, Orbit gives general educational guidance and encourages talking to a qualified professional.', url:null, type:'policy'},
];

function orbitTokenize(s){
  return (s || '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

/* Builds the full index fresh each time it's needed (cheap — a few
   hundred short objects) rather than caching it stale across a session,
   so a Playbook/Program added mid-session (e.g. by an Owner action) is
   searchable immediately without a page reload. */
function buildOrbitKnowledgeIndex(){
  const entries = [...ORBIT_STATIC_KNOWLEDGE];

  if(typeof PLAYBOOKS !== 'undefined'){
    PLAYBOOKS.forEach(p=>{
      entries.push({
        title: p.title,
        text: `${p.dek} Outcome: ${p.outcome}. Category: ${p.category}. Difficulty: ${p.difficulty}. Takeaways: ${(p.takeaways||[]).slice(0,3).join(' ')}`,
        url: `playbook.html?slug=${p.slug}`,
        type: 'playbook',
        slug: p.slug,
      });
    });
  }
  if(typeof PROGRAMS !== 'undefined'){
    PROGRAMS.forEach(pr=>{
      entries.push({
        title: pr.title,
        text: `${pr.tagline} ${pr.overview || ''} Format: ${pr.format}. Duration: ${pr.duration}.`,
        url: `program.html?id=${pr.id}`,
        type: 'program',
        id: pr.id,
      });
    });
  }
  if(typeof DOWNLOADS !== 'undefined'){
    DOWNLOADS.forEach(d=>{
      entries.push({
        title: d.title,
        text: d.desc,
        url: `worksheet.html?type=${d.type}`,
        type: 'download',
      });
    });
  }
  if(typeof LEARNING_PATHS !== 'undefined'){
    LEARNING_PATHS.forEach(lp=>{
      entries.push({
        title: lp.title,
        text: `${lp.desc} Skills gained: ${(lp.skillsGained||[]).join(', ')}.`,
        url: `learning-paths.html#${lp.key}`,
        type: 'learning-path',
      });
    });
  }
  return entries;
}

/* Plain keyword-overlap scoring — no external dependency, instantly
   reflects any content already in data.js. Returns the top `limit`
   entries, each with its real internal url so Orbit AI's replies can
   always link back to a genuine WRLD page (never a fabricated one). */
function retrieveOrbitKnowledge(query, limit){
  limit = limit || 6;
  const queryTokens = new Set(orbitTokenize(query));
  if(!queryTokens.size) return [];
  const index = buildOrbitKnowledgeIndex();

  const scored = index.map(entry=>{
    const haystack = orbitTokenize(entry.title + ' ' + entry.text);
    let score = 0;
    haystack.forEach(tok=>{ if(queryTokens.has(tok)) score++; });
    // Title matches count extra — a query mentioning the Playbook/Program
    // name directly should always surface that exact entry first.
    orbitTokenize(entry.title).forEach(tok=>{ if(queryTokens.has(tok)) score += 2; });
    return {entry, score};
  }).filter(x=>x.score>0);

  scored.sort((a,b)=>b.score-a.score);
  return scored.slice(0, limit).map(x=>x.entry);
}
