/* =====================================================================
   WRLD — Content & Data Engine
   All Playbooks, Programs, Learning Paths, Downloads, Events & Community
   content lives here so every page renders from one shared source of truth.

   HONESTY NOTE: WRLD is a growing platform. No org history, partnerships,
   sponsors, testimonials, mentor rosters, or impact numbers are invented.
   Every stat shown site-wide is computed from real content in this file
   (PLAYBOOKS.length, DOWNLOADS.length, etc). Features that are genuinely
   still rolling out are labeled "Coming Soon" — confidently, not apologetically.
   ===================================================================== */

/* Navigation is grouped into a small set of scalable dropdown menus so the
   bar stays uncluttered as WRLD adds more pages — group by purpose, not by
   a flat list of every page. */
const NAV_GROUPS = [
  {label:'Explore', key:'explore', items:[
    {label:'Dashboard', href:'dashboard.html', key:'dashboard'},
    {label:'Assessment', href:'assessment.html', key:'assessment'},
    {label:'Journey Passport', href:'journey-passport.html', key:'passport'},
    {label:'Learning Paths', href:'learning-paths.html', key:'paths'},
  ]},
  {label:'Learn', key:'learn', items:[
    {label:'Playbooks', href:'playbooks.html', key:'playbooks'},
    {label:'Programs', href:'programs.html', key:'programs'},
    {label:'Live Learning', href:'events.html', key:'events'},
    {label:'Downloads', href:'downloads.html', key:'downloads'},
    {label:'Tools', href:'tools.html', key:'tools'},
  ]},
  {label:'Connect', key:'connect', items:[
    {label:'Community', href:'community.html', key:'community'},
    {label:'Volunteer', href:'community.html#volunteer', key:'community'},
    {label:'Become a Mentor', href:'become-mentor.html', key:'become-mentor'},
    {/* V25.1 fix: this used to be key:'about' — identical to every item in
       the "About WRLD" group below, so renderNavDropdown()'s
       `group.items.some(it=>it.key===activeKey)` check matched BOTH
       groups whenever about.html called initPage('about'), highlighting
       "Connect" and "About WRLD" at the same time. This link still points
       at the same #partner section on about.html (unchanged) — it just
       needed its own, non-colliding key so only the group the visitor
       actually landed on lights up. */
     label:'Partner With Us', href:'about.html#partner', key:'partner'},
  ]},
  {label:'About WRLD', key:'about-wrld', items:[
    {label:'About', href:'about.html', key:'about'},
    {label:'Support WRLD', href:'about.html#donate', key:'about'},
    {label:'Contact', href:'about.html#contact', key:'about'},
    {label:'Accessibility', href:'about.html#accessibility', key:'about'},
    {label:'Privacy', href:'about.html#privacy', key:'about'},
  ]},
];

const PILLARS = {
  work:        {label:'Work',        icon:'💼', color:'blue'},
  resilience:  {label:'Resilience',  icon:'🌱', color:'yellow'},
  learning:    {label:'Learning',    icon:'📚', color:'navy'},
  development: {label:'Development', icon:'🚀', color:'blue'},
};

/* ===================================================================
   PLAYBOOKS
   20 unique playbooks, sequenced into three signature journeys:
   First Job Journey · Financial Confidence Journey · University Journey
   (the "networking" playbook is shared between two journeys)
   =================================================================== */
const PLAYBOOKS = [

/* ---------------------------- FIRST JOB JOURNEY ---------------------------- */

{
  slug:'resume', outcome:'Leave with a complete, ATS-ready first draft resume.', title:'Build Your First Resume (Even With No Experience)', pillar:'work', flagship:true,
  heroIllustration:'resume',
  category:'Career', emoji:'📄', color:'blue', difficulty:'Beginner',
  readTime:'16 min read', completionTime:'60 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'A resume isn\'t your life story — it\'s a 6-second pitch. Here\'s how to build one from nothing, and make it survive both the skim and the software.',
  objectives:[
    'Understand what a hiring manager actually looks for in the first 6 seconds',
    'Turn everyday experience — school, sports, babysitting, clubs — into resume-worthy accomplishments',
    'Write the four sections of a resume: Header, Summary, Experience, Skills',
    'Format a resume that passes both human eyes and applicant tracking software',
    'Avoid the seven most common first-resume mistakes',
    'Leave with a complete first draft, not just a plan for one',
  ],
  sections:[
    {h:'Why a resume feels so hard to start', p:[
      'If you\'re staring at a blank document right now wondering how you\'re supposed to fill an entire page with "experience" you don\'t think you have, you\'re not behind — you\'re just at the very normal, very uncomfortable starting line that everyone crosses once. The good news is that a resume is not a personality test, and it is not a measure of your worth. It\'s a formatting exercise wrapped around real things you\'ve actually done.',
      'Here\'s the reframe that changes everything: a resume\'s job is not to impress. It\'s to get you to the next step — a callback, an interview, a conversation. That\'s it. It doesn\'t need to capture everything about you. It needs to give one specific, busy human being enough reason to want to talk to you.',
    ]},
    {h:'What actually happens in the first 6 seconds', p:[
      'Hiring managers and recruiters spend an average of six to eight seconds on an initial resume scan before deciding whether to keep reading. That number sounds almost insultingly short, but it makes sense once you understand what they\'re doing: they are not reading, they are pattern-matching. They\'re looking for a job title that resembles the one they\'re hiring for, a handful of relevant words, and a layout that looks organized rather than chaotic.',
      'This means two resumes with identical content can get completely different outcomes purely based on how easy they are to scan. If your strongest qualification is buried in paragraph three of a dense block of text, it may as well not exist. If it\'s the first thing a reader\'s eye lands on, it does all the work for you.',
    ], callout:{type:'fact', title:'Did You Know?', text:'Most recruiters read resumes in an "F-pattern" — scanning the top line, then down the left edge, then skimming right only if something catches their eye. That\'s exactly why your strongest, most specific line should sit at the very top of your Experience section, not buried at the bottom.'}},
    {h:'The four sections every first resume needs', p:[
      'Strip away the anxiety and a resume is really just four building blocks, always in this order: a Header with your contact information, a short Summary that tells the reader who you are in one or two lines, an Experience section listing what you\'ve done in reverse chronological order (most recent first), and a Skills section. For a first resume, you\'ll often add a fifth: Education, especially if you\'re still in school or a recent graduate.',
    ]},
    {h:'Turning "I have no experience" into real, resume-worthy material', p:[
      'This is the section that changes the most minds. You do not need a corporate job to have resume-worthy experience — you need to translate what you\'ve actually done into the language a hiring manager recognizes. Babysitting is client management, scheduling, and safety-critical responsibility. A sports team is teamwork under pressure, discipline, and often leadership if you were a captain. A school club is basic project coordination and event planning. A group project where you organized the group chat and kept everyone on deadline is, honestly, project management.',
      'Sit down and list every responsibility you\'ve held in the last two to three years — paid or not. Then, for each one, ask: what did I actually do, and what changed because I did it? That second question is where the real resume material comes from.',
    ], callout:{type:'example', title:'Before and after', text:'Before: "Watched neighbor\'s kids." After: "Managed care and scheduling for two children ages 4 and 7, coordinating meals, homework, and activities independently for 15+ hours per week." Before: "Was in charge of the bake sale." After: "Organized a school fundraiser that raised $650 across two days, managing inventory, pricing, and four volunteer classmates."'}},
    {h:'Writing bullet points that actually land', p:[
      'Every strong bullet point follows the same underlying structure: what you did, how you did it, and — whenever possible — what happened as a result. Numbers make a bullet point dramatically more convincing than adjectives ever will, because they replace a vague claim ("hardworking," "team player") with evidence a reader can actually picture.',
      'Start each bullet with a strong action verb — managed, organized, built, resolved, coordinated, launched — rather than a passive phrase like "was responsible for." Where you can, attach a number: how many people, how much money, how many hours, what percentage improved.',
    ]},
    {mini:true, q:'Which bullet point is stronger?', options:['"Responsible for helping customers with their orders."','"Assisted 40+ customers per shift, resolving product questions and processing an average of $600 in daily transactions."'], correct:1, explain:'The second version leads with a strong verb and backs the claim with real numbers — exactly what makes a bullet point memorable in a 6-second scan.'},
    {h:'The format that survives both robots and humans', p:[
      'Most mid-size and large companies now run incoming resumes through an Applicant Tracking System (ATS) before a human ever sees them — software that parses your document into a database and often screens out ones it can\'t read cleanly. That means the visually striking, multi-column resume template with icons and a photo may look great to your eye and be functionally invisible to the system reading it first.',
      'Stick to a single column, standard section headers (Experience, Education, Skills — not cute renamed versions), a widely-used font like Inter, Arial, or Calibri, and save the final file as a PDF unless an application specifically requests a Word document. This isn\'t about being boring — it\'s about making sure the content you worked hard on actually gets read at all.',
    ], callout:{type:'mistake', title:'Common Mistake: The graphic-heavy template', text:'Colorful, icon-heavy resume templates are one of the most common first-resume mistakes. They photograph well but frequently get mangled or entirely skipped by ATS software, which can silently disqualify an otherwise strong candidate before a human ever opens the file.'}},
    {h:'Formatting decisions that make a real difference', p:[
      'Keep your first resume to one page — it forces prioritization, which is exactly what a fast scan rewards. Use reverse chronological order (most recent experience first) unless you have a strong reason not to. Leave comfortable white space; a page crammed edge-to-edge with 9-point text is harder to scan than one with room to breathe, even if it means cutting content.',
    ], table:{headers:['Element','First-Resume Standard'], rows:[
      ['Length','One page'],
      ['Font','Inter, Arial, or Calibri, 10–12pt'],
      ['File format','PDF (unless a Word doc is specifically requested)'],
      ['Section order','Header → Summary → Experience → Education → Skills'],
      ['Layout','Single column, no tables, graphics, or text boxes'],
    ]}},
    {h:'Your Summary line — the most overlooked two sentences on the page', p:[
      'A short Summary sitting just under your header does more work than most people realize. In one to two sentences, it should say who you are and what you\'re looking for, in language that echoes the job you\'re applying to. Think of it as a spoken introduction condensed onto paper: "Detail-oriented high school senior with two years of customer service experience, seeking a part-time retail role where reliability and people skills matter."',
    ], callout:{type:'protip', title:'Pro Tip', text:'Skip the generic "Objective" statement ("Seeking a position where I can grow and learn"). It says nothing a hiring manager can\'t already assume. A specific Summary that mirrors two or three words from the actual job posting does far more to signal fit.'}},
  ],
  practiceExercises:[
    'List 5 responsibilities you\'ve held in the last 2 years — school, work, home, or volunteer — no matter how small they feel',
    'Rewrite 3 of those responsibilities as strong bullet points using the "what, how, result" structure',
    'Write your Summary line in one sitting, then read it aloud — does it sound like you, or like a template?',
    'Time yourself reading your own resume for 6 seconds, then write down the one thing you remembered',
  ],
  checklist:['Pick one clean, single-column template','List experience in reverse chronological order','Rewrite every bullet with a number or result where possible','Cut anything older than 4 years or irrelevant to the role','Write a 1–2 line Summary that mirrors the job posting\'s language','Save as a PDF named FirstName_LastName_Resume.pdf','Read it out loud once, slowly, to catch typos','Ask one person outside your household to read it in 6 seconds'],
  reflection:['What is one experience you\'ve dismissed as "not real work" that actually taught you a valuable skill?','If a hiring manager could only remember one thing about you from this resume, what would you want it to be?','Which bullet point on your current resume is the weakest — and what number or result could strengthen it?','What job are you actually picturing when you write this resume — does the wording reflect that?','What would it feel like to send this resume out today, exactly as it is?'],
  quiz:[
    {q:'What is the average time a hiring manager spends on an initial resume scan?', options:['6–8 seconds','2–3 minutes','30 seconds','10 minutes'], correct:0, explain:'Most first passes are closer to 6–8 seconds, which is why format and clarity matter as much as content.'},
    {q:'Why should you avoid multi-column, graphic-heavy resume templates?', options:['They look unprofessional','Applicant Tracking Systems often can\'t read them correctly','They take longer to print','They cost money'], correct:1, explain:'ATS software frequently misreads columns and graphics, which can drop qualified candidates before a human ever sees the resume.'},
    {q:'What makes a bullet point stronger?', options:['Longer sentences','More adjectives','A specific number or measurable result','A larger font'], correct:2, explain:'Numbers and results make your impact concrete and easy to believe.'},
    {q:'What is the recommended length for a first resume?', options:['3 pages','Half a page','One page','As long as possible to show effort'], correct:2, explain:'One page forces you to prioritize your strongest material — exactly what a fast scan rewards.'},
    {q:'What should a Summary line do?', options:['Repeat your objective in vague terms','Say who you are and what you\'re seeking, in language echoing the job','List every skill you have','Be left out entirely'], correct:1, explain:'A specific, tailored Summary signals fit far better than a generic objective statement.'},
    {q:'What file format should you generally submit your resume as?', options:['A PDF','A screenshot','A Word doc, always','Plain text only'], correct:0, explain:'PDF preserves your formatting reliably, unless an application specifically requests a Word document.'},
  ],
  faq:[
    {q:'What if I really have zero work experience?', a:'Everyone has experience — it just might not be paid. School projects, volunteering, family responsibilities, and hobbies all translate. Use the Resume Template worksheet to mine your own history for material, and lean on the "what, how, result" bullet structure to make it concrete.'},
    {q:'Should my resume be one page?', a:'For your first few jobs, yes. One page forces you to prioritize your strongest material, which is exactly what a 6-second scan rewards.'},
    {q:'Do I need an objective statement at the top?', a:'Generally no — a short "Summary" of 1–2 lines highlighting your strongest skill and goal is more useful than a generic objective.'},
    {q:'Should I include a photo on my resume?', a:'In most regions, no — many employers can\'t consider photos for legal/bias reasons and it\'s an easy way to get flagged by an ATS. Save the photo for LinkedIn.'},
    {q:'What if my experience isn\'t related to the job at all?', a:'Focus on transferable skills — responsibility, communication, problem-solving — rather than the specific industry. The framing matters more than the literal job title.'},
    {q:'How often should I update my resume?', a:'Anytime you finish something worth adding — a project, a role, a certification. Updating in small pieces is far easier than rebuilding it from memory months later.'},
  ],
  takeaways:['A resume is a 6-second pitch, not an autobiography — design for the skim.','Every experience can be translated into resume language, including unpaid work.','Numbers make bullet points dramatically more convincing than adjectives.','Simple, single-column formatting beats creative formatting for surviving ATS software.','A tailored Summary line beats a generic objective statement.','One page, for a first resume, is a feature — not a limitation.'],
  download:'resume-template', journeys:['first-job'], nextInJourney:'cover-letter',
},

{
  slug:'cover-letter', outcome:'Leave with a reusable cover letter template you can adapt for any job.', title:'Write a Cover Letter People Actually Remember', pillar:'work',
  heroIllustration:'cover-letter',
  category:'Career', emoji:'✉️', color:'yellow', difficulty:'Beginner',
  readTime:'14 min read', completionTime:'50 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Most cover letters repeat the resume in paragraph form. Here\'s how to write one that gives a hiring manager an actual reason to care.',
  objectives:['Understand the actual job a cover letter does (hint: it\'s not repeating your resume)','Structure a three-paragraph letter that reads fast and lands hard','Personalize a letter for a specific company without starting from scratch every time','Avoid the generic openers that get skimmed and ignored','Know how long is actually too long'],
  sections:[
    {h:'What a cover letter is actually for', p:[
      'Your resume answers "what have you done." Your cover letter answers "why this, why you, why now." It\'s the only part of your application where you get to sound like an actual person instead of a bullet-point list — so use it to explain motivation and fit, not to restate your work history in sentence form.',
      'A surprising number of applicants treat the cover letter as an obligatory formality and write something so generic it could be sent to any company for any job. That approach wastes the one part of the application built specifically to differentiate you.',
    ], callout:{type:'tip', title:'The one-sentence test', text:'If you could delete your cover letter and nothing would be lost because it\'s all already on your resume, rewrite it. It should add something new: your reasoning, your enthusiasm, your story.'}},
    {h:'The three-paragraph structure that works', p:[
      'Paragraph one: a specific, genuine reason you want this role at this company — not "I am writing to apply for the position of..." Paragraph two: one or two concrete examples that prove you can do the job, told as a compact story with a beginning, middle, and result, rather than a list of claims. Paragraph three: a confident, low-pressure close that invites the next step without sounding desperate or overly formal.',
    ], list:['Opening: name something real about the company or role that pulled you in','Middle: one story, told with a beginning, middle, and result','Close: state your enthusiasm plainly and thank them for their time']},
    {mini:true, q:'What should the opening paragraph of a cover letter avoid?', options:['A specific, genuine reason for applying', 'The generic phrase "I am writing to apply for the position of..."'], correct:1, explain:'That opener is so common it reads as a placeholder — hiring managers see it constantly and it signals a form letter rather than genuine interest.'},
    {h:'Personalizing without starting from scratch every time', p:[
      'Build one strong "base" letter with your best story and your genuine reasons for wanting this type of work generally. Then customize the first and last paragraphs for each specific company — that\'s roughly the 20% that needs to change, not the whole letter. This lets you apply to more roles without a proportional increase in effort.',
    ], callout:{type:'example', title:'Swap-in opener', text:'"I\'ve used [Company]\'s app every week for the last two years, and the update to [specific feature] is exactly the kind of thoughtful design work I want to help build."'}},
    {h:'How long is actually too long', p:[
      'A first cover letter should generally stay under 300 words — roughly three tight paragraphs. Anything significantly longer risks not being read in full, and length rarely correlates with strength; a focused, specific 250-word letter usually beats an unfocused 600-word one.',
    ], callout:{type:'mistake', title:'Common Mistake: Writing a second resume in paragraph form', text:'The most common cover letter mistake is restating the entire work history from the resume in paragraph form. If a sentence could be cut without losing anything new, cut it — the cover letter should add motivation and story, not repetition.'}},
    {h:'Addressing it to an actual person', p:[
      'Whenever possible, address the letter to a specific hiring manager or team rather than a generic salutation — a few minutes of research (checking the job posting, company website, or LinkedIn) can usually surface a name. When it truly can\'t be found, "Dear Hiring Team" is a fine, professional fallback.',
    ], callout:{type:'fact', title:'Did You Know?', text:'"To Whom It May Concern" is one of the most dated-sounding salutations in modern hiring — most guidance today recommends "Dear Hiring Team" or a specific name over that particular phrase.'}},
  ],
  practiceExercises:['Write your base letter\'s opening paragraph using a real, specific detail about a company you admire','Turn one resume bullet point into a short story for your middle paragraph','Count your letter\'s word count — is it under 300?','Search for a specific name to address your letter to for one real job posting'],
  checklist:['Research one specific, real detail about the company','Draft your base letter with your strongest single story','Cut any sentence that just repeats your resume','Address a specific person or team if you can find one','Keep it under 300 words','Proofread out loud before sending','Save your base letter as a template you can duplicate for future applications','Read your closing paragraph aloud and cut anything that sounds desperate or overly formal'],
  reflection:['What genuinely draws you to this type of work, beyond needing a paycheck?','What\'s one story from your life that proves you can handle responsibility?','Who could you address this letter to, instead of "To Whom It May Concern"?','Which paragraph of your current draft feels the most generic, and what specific detail could fix it?'],
  quiz:[
    {q:'What should a cover letter primarily communicate?', options:['A repeat of your resume in sentence form','Your motivation, fit, and one proof story','Your salary requirements','Your full work history'], correct:1, explain:'The cover letter\'s job is to explain why you want the role and prove you can do it — not to restate the resume.'},
    {q:'How long should a first cover letter typically be?', options:['Under 300 words','1,000+ words','A single sentence','2 full pages'], correct:0, explain:'Short and specific beats long and generic — aim for three tight paragraphs.'},
    {q:'What\'s a reasonable fallback if you can\'t find a specific name to address?', options:['"To Whom It May Concern"','"Dear Hiring Team"','Leave the greeting blank','Address it to the CEO regardless of role'], correct:1, explain:'"Dear Hiring Team" reads as current and professional; "To Whom It May Concern" tends to read as dated and impersonal.'},
    {q:'What should the middle paragraph of a three-paragraph cover letter focus on?', options:['A list of your responsibilities at past jobs','One concrete story told with a beginning, middle, and result','Your salary requirements','A restatement of your resume bullet points'], correct:1, explain:'The middle paragraph should prove you can do the job with one compact, specific story — not a list of claims.'},
    {q:'Roughly how much of a "base" cover letter should you customize for each new company?', options:['The whole letter, from scratch every time','Nothing — send the exact same letter everywhere','Mainly the opening and closing paragraphs','Just the date at the top'], correct:2, explain:'A strong base letter with your best story stays mostly the same; the opening and closing are what you personalize for each company.'},
    {q:'What\'s the biggest risk of writing a generic, one-size-fits-all cover letter?', options:['It\'s against the law','It reads like a form letter and gets skimmed', 'It takes too long to print','It automatically disqualifies you'], correct:1, explain:'A generic letter is exactly the thing the cover letter is supposed to avoid — it wastes the one part of the application meant to differentiate you.'},
  ],
  faq:[
    {q:'Do I need a different cover letter for every job?', a:'You need a different opening and closing for every job — but your core story and structure can stay the same.'},
    {q:'What if I can\'t find a specific person to address?', a:'"Dear Hiring Team" is a perfectly fine fallback — just avoid "To Whom It May Concern," which reads as generic.'},
    {q:'Is it ever okay to skip the cover letter?', a:'If an application explicitly marks it optional and you\'re short on time, a strong resume can stand alone — but a tailored letter rarely hurts and often helps you stand out.'},
    {q:'How specific does the company detail in my opening need to be?', a:'Specific enough that it couldn\'t apply to any other company — a generic compliment like "I admire your innovative culture" doesn\'t count.'},
    {q:'Should I mention salary expectations in a cover letter?', a:'Generally no — save salary conversations for later in the process, unless the posting explicitly asks you to include a number.'},
    {q:'What if I don\'t have direct experience in the field I\'m applying to?', a:'Lean on transferable skills and explain honestly why you\'re motivated to break in — a clear story and real enthusiasm matter more than a perfect experience match.'},
  ],
  takeaways:['A cover letter explains motivation and fit — it should never just repeat your resume.','One strong personal story beats five generic claims.','Reuse a base letter, but personalize the opening and closing for each role.','Under 300 words is a good target — focus beats length.','A specific, real detail about the company beats a generic compliment every time.','Address a real person when you can find one — it signals you actually did the research.'],
  download:'cover-letter-template', journeys:['first-job'], nextInJourney:'interview-skills',
},

{
  slug:'interview-skills', outcome:'Walk into any interview with prepared answers and real confidence.', title:'How to Ace Your First Job Interview', pillar:'work', flagship:true,
  heroIllustration:'interview-skills',
  category:'Career', emoji:'🎤', color:'blue', difficulty:'Intermediate',
  readTime:'17 min read', completionTime:'65 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Interviews feel unpredictable, but the questions almost never are. Prepare for the 80% that\'s completely knowable, and walk in calmer than you thought possible.',
  objectives:['Understand why interviews feel so much scarier than they actually are','Learn the STAR method for answering behavioral questions clearly','Prepare strong answers for the 8 most common interview questions','Build 3 thoughtful questions to ask every interviewer','Handle the moment you go blank without it derailing the interview','Calm interview nerves with a simple, repeatable pre-interview routine'],
  sections:[
    {h:'Why interviews feel so much worse than they actually are', p:[
      'An interview triggers the same part of your brain as any high-stakes social evaluation — which is exactly why your heart races even when, rationally, you know it\'s "just a conversation." The uncertainty is the hardest part: you don\'t know exactly what will be asked, so your brain fills that blank space with worst-case scenarios.',
      'The fix isn\'t to somehow feel less nervous through willpower. It\'s to shrink the uncertainty by preparing for what\'s actually knowable — and the reassuring truth is that far more of an interview is knowable in advance than it feels like from the outside.',
    ]},
    {h:'The predictable 80%', p:[
      'The vast majority of interviews, across almost every industry and role, draw from a small, well-known pool of questions: tell me about yourself, why do you want this role, describe a time you faced a challenge, what\'s a weakness of yours, where do you see yourself in a few years, describe a time you worked with a difficult person, tell me about a mistake you made, why should we hire you. That\'s essentially the whole list. Preparing sharp, specific answers for these eight or nine questions covers the overwhelming majority of what you\'ll actually face in the room.',
    ], callout:{type:'fact', title:'Did You Know?', text:'Research on interview structure consistently finds that a small set of core behavioral questions repeats across the vast majority of interviews, regardless of industry — which is exactly why targeted preparation works so well.'}},
    {h:'The STAR method: turning a vague memory into a convincing answer', p:[
      'When you\'re asked "tell me about a time when..." — which covers most behavioral questions — use the STAR structure: Situation, Task, Action, Result. Set the scene briefly (Situation), explain what specifically needed to happen (Task), describe exactly what you did — not what "the team" did (Action), and close with the outcome, ideally with a number attached (Result).',
      'The most common mistake with STAR isn\'t forgetting the letters — it\'s spending too long on Situation and Task and rushing through Action and Result, which are the two parts that actually prove your capability.',
    ], callout:{type:'example', title:'STAR in action', text:'Situation: "Our team\'s fundraiser was $400 short with two days left." Task: "As treasurer, I needed to close the gap without asking classmates for more money." Action: "I organized a same-day bake sale, split shifts between three volunteers, and reached out directly to three local businesses for donations." Result: "We raised $650 — surpassing the goal by over 60%, and two of those business relationships continued the next year."'}},
    {h:'Building your personal STAR bank before the interview, not during it', p:[
      'The single highest-leverage thing you can do to prepare is write out 4–5 STAR stories in advance, covering different themes: a time you solved a problem, a time you led something, a time you handled conflict, a time you made a mistake and recovered, a time you went above what was expected. Most interview questions can be answered by adapting one of these five stories — you\'re not memorizing dozens of answers, you\'re preparing a flexible toolkit.',
    ]},
    {mini:true, q:'You\'re asked "tell me about a time you faced a challenge." Which part of STAR should get the most airtime?', options:['Situation — describe the full backstory in detail','Action and Result — what you specifically did, and what happened because of it'], correct:1, explain:'Situation and Task set the scene quickly; Action and Result are where you actually prove your capability, so they deserve the most detail.'},
    {h:'The greatest weakness question, without the cliché', p:[
      'This question trips people up because the "safe" answers ("I\'m a perfectionist," "I work too hard") have become so common they now read as evasive. A stronger approach names a real, specific, low-stakes weakness and — critically — shows what you\'re actively doing about it. This demonstrates self-awareness, which is what the question is actually trying to assess.',
    ], callout:{type:'protip', title:'Pro Tip', text:'Structure your weakness answer in three parts: name the real weakness plainly, give one brief specific example, then describe the concrete step you\'re taking to improve it. "I used to avoid public speaking. Last semester I forced myself to present two group projects, and I\'ve since joined a club that does regular presentations." That\'s honest and shows growth — far stronger than a deflection.'}},
    {h:'Questions to ask them — the most overlooked part of preparation', p:[
      'An interview is a two-way conversation, not an interrogation. Asking thoughtful questions signals genuine interest, helps you evaluate whether the role is actually right for you, and is one of the easiest ways to leave a strong final impression since it\'s often the last thing you say.',
    ], list:['"What does success look like in this role after the first 90 days?"','"What\'s something you genuinely enjoy about working here?"','"What\'s the biggest challenge someone in this position might face early on?"','"How would you describe the team\'s working style?"']},
    {h:'A realistic interview-day timeline', p:['Preparation compounds — most of the calm you feel on interview day comes from what you did in the days before it, not from anything you do in the final five minutes.']
      , timeline:[
        {label:'3 days before', text:'Write out your 4–5 STAR stories. Research the company\'s mission and one recent update.'},
        {label:'1 day before', text:'Do one practice run-through out loud — with a friend, or just talking to a mirror. Plan your outfit and test your tech if it\'s virtual.'},
        {label:'Morning of', text:'Review your STAR stories once, lightly — don\'t over-rehearse to the point of sounding scripted.'},
        {label:'15 minutes before', text:'Do a 2-minute breathing reset. Arrive or log on 10 minutes early.'},
      ]},
    {h:'Calming pre-interview nerves — the physical reset', p:[
      'Nervousness before an interview is completely normal, and honestly a sign that you care about the outcome. A short physical reset — slow breathing, a brief walk, light stretching — in the 15 minutes beforehand tends to lower your heart rate far more effectively than trying to think your way calm.',
    ], callout:{type:'tip', title:'Two-minute box breathing reset', text:'Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat for two full minutes before you log on or walk in. This specific pattern is used by performers and public speakers precisely because it\'s fast, private, and genuinely lowers physiological stress response.'}},
    {h:'What to do the moment you go blank', p:[
      'It happens to almost everyone at least once: a question lands and your mind is simply empty. The instinct is to panic and start talking immediately to fill the silence — resist it. A brief, composed pause reads as thoughtful, not weak.',
    ], callout:{type:'mistake', title:'Common Mistake: Filling silence with rambling', text:'When candidates go blank, the most common mistake isn\'t the blank moment itself — it\'s panicking and rambling to fill the silence, which usually makes the answer worse and more scattered. A simple "let me take a second to think about that" buys you real time and reads as composure.'}},
  ],
  practiceExercises:['Write out your 5 core STAR stories before reading further','Say your "why this role" answer out loud, timed — aim for under 60 seconds','Practice the box breathing reset once right now, so it\'s familiar on interview day','Draft your 3 questions to ask the interviewer'],
  checklist:['Write out answers to the 8 common questions using STAR','Build your personal bank of 4–5 STAR stories','Research the company\'s mission and one recent update','Prepare 3 thoughtful questions to ask the interviewer','Test your camera, mic, and internet if it\'s virtual','Plan your outfit the night before','Do a 2-minute breathing reset right before','Practice your answers out loud at least once — not just in your head'],
  reflection:['What\'s a challenge you\'ve faced that shows real problem-solving, even if it feels small?','What question are you most nervous about being asked — and why?','What do you genuinely want to know about this role or company?','What is a real, honest weakness you could speak to with self-awareness rather than deflection?','How do you typically respond to silence or a pause — does it feel comfortable or does it push you to fill it?'],
  quiz:[
    {q:'What does the "R" in STAR stand for?', options:['Reason','Result','Response','Requirement'], correct:1, explain:'Result closes the loop — always try to end with a measurable or concrete outcome.'},
    {q:'Why should you ask questions during an interview?', options:['It\'s required by law','It shows genuine interest and helps you evaluate the role','It makes the interview shorter','It\'s only for senior roles'], correct:1, explain:'Interviews are two-way — thoughtful questions demonstrate engagement and help you decide if it\'s the right fit.'},
    {q:'When answering "what\'s your greatest weakness," what makes an answer stronger?', options:['Naming a fake weakness that\'s secretly a strength','Naming a real weakness and showing what you\'re doing to improve it','Refusing to answer','Comparing yourself to a coworker'], correct:1, explain:'Real self-awareness plus a concrete improvement step reads as far stronger than a deflective non-answer.'},
    {q:'What should you do if you go completely blank on a question?', options:['Ramble until something comes to mind','Ask to skip the question','Pause, breathe, and say you need a second to think','End the interview'], correct:2, explain:'A brief, composed pause reads as thoughtful — rambling to fill silence usually makes things worse.'},
    {q:'What is the recommended pre-interview breathing pattern?', options:['Rapid short breaths','Inhale 4, hold 4, exhale 4, hold 4','Holding your breath as long as possible','No specific pattern matters'], correct:1, explain:'This box-breathing pattern is fast, private, and measurably reduces physiological stress response.'},
    {q:'How many core STAR stories should you prepare in advance?', options:['None — improvise in the moment','1 very long one','4–5 flexible stories covering different themes','20+ stories for every possible question'], correct:2, explain:'A small, flexible bank of stories can be adapted to answer most behavioral questions, without needing to memorize dozens of separate answers.'},
  ],
  faq:[
    {q:'What if I go blank during an answer?', a:'Pause, take a breath, and say "let me think about that for a second" — interviewers respect a considered pause far more than a rushed, scattered answer.'},
    {q:'Is it okay to admit I\'m nervous?', a:'A brief, light acknowledgment ("I\'m a little nervous, but excited to be here") can actually build rapport — just don\'t dwell on it.'},
    {q:'What if I don\'t have a strong answer for "tell me about a challenge"?', a:'Challenges don\'t need to be dramatic — a scheduling conflict, a disagreement in a group project, or a tight deadline all work well if you focus on your specific actions and the result.'},
    {q:'Should I memorize my answers word for word?', a:'No — memorize the structure and key details of your STAR stories, but let the exact wording come out naturally. Word-for-word memorization tends to sound stiff and falls apart if you\'re interrupted with a follow-up.'},
    {q:'What should I do right after the interview?', a:'Send a short thank-you note within 24 hours, referencing one specific thing you discussed. It\'s a small gesture that meaningfully reinforces a strong impression.'},
  ],
  takeaways:['Most interview questions are predictable — prepare for the common eight or nine.','STAR turns a vague memory into a structured, convincing answer — spend the most time on Action and Result.','A flexible bank of 4–5 STAR stories covers the majority of behavioral questions.','Bring your own thoughtful questions; interviews go both ways.','A short physical reset calms nerves better than trying to think your way calm.','If you go blank, pause and breathe — don\'t ramble to fill the silence.'],
  download:'interview-worksheet', journeys:['first-job'], nextInJourney:'networking',
},

{
  slug:'networking', outcome:'Build genuine professional relationships without the awkwardness.', title:'Networking Without the Awkwardness', pillar:'work', flagship:true,
  heroIllustration:'networking',
  category:'Career', emoji:'🤝', color:'yellow', difficulty:'Intermediate',
  readTime:'15 min read', completionTime:'55 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Networking isn\'t schmoozing — it\'s just staying in touch with people who might one day be useful to each other. Here\'s how to do it without the cringe.',
  objectives:['Reframe networking as relationship-building, not favor-asking','Write a cold outreach message that actually gets a reply','Understand the difference between "weak ties" and "strong ties" — and why weak ties matter more than you\'d think','Build a simple, low-effort system for staying in touch over time','Use LinkedIn without feeling like you\'re performing','Recover gracefully from a message that gets ignored'],
  sections:[
    {h:'Why the word "networking" makes everyone cringe', p:[
      'Say the word "networking" out loud and most people picture forced handshakes, fake enthusiasm, and business cards exchanged at an awkward mixer. That image is exactly why so many capable people avoid it entirely — and exactly why so many capable people miss out on opportunities that networking, done honestly, would have brought them.',
      'Strip away the cringe and networking is just one thing: being intentional about relationships. Reaching out, following up, and — critically — offering help before you need any yourself. The goal was never to extract favors from strangers. It\'s to build a group of people who genuinely know and trust your work over time.',
    ]},
    {h:'The surprising power of "weak ties"', p:[
      'Sociologists have a useful concept here: "strong ties" are your close friends and family, while "weak ties" are the people you know a little — a former teacher, a classmate\'s parent, someone you met once at an event. Research on job-finding has repeatedly found that opportunities disproportionately come through weak ties, not strong ones — because your close circle already knows the same things and people you do, while weak ties connect you to entirely new information and networks.',
      'This is genuinely good news if networking feels intimidating: you don\'t need to build deep friendships with powerful people. You need a wide, loose web of weak ties who have a basic positive impression of you.',
    ], callout:{type:'fact', title:'Did You Know?', text:'The "strength of weak ties" is one of the most replicated findings in social science research on job searching — acquaintances, not close friends, are disproportionately how people hear about opportunities, because they sit outside your existing circle of information.'}},
    {h:'A message that actually gets a reply', p:[
      'Cold outreach works when it\'s short, specific, and low-pressure. The biggest mistake people make is writing a vague, generic message ("Hi, I\'d love to connect!") that gives the recipient no reason to respond and no easy way to help. A strong message does three things: mentions something real and specific about the person, states clearly and modestly what you\'re asking for (usually 15 minutes of their time, never a job directly), and makes it easy to say yes with a low-commitment ask.',
    ], callout:{type:'example', title:'Template that works', text:'"Hi [Name] — I came across your work at [Company] and loved [specific detail — a project, a post, a talk]. I\'m exploring a path into [field] and would love 15 minutes to hear how you got started, if you have time in the next couple weeks. No worries at all if not!"'}},
    {mini:true, q:'Which opening line is more likely to get a reply?', options:['"Hi, I\'d love to connect and pick your brain sometime!"','"Hi — I saw your talk on sustainable packaging at the conference last month, and your point about supplier audits stuck with me."'], correct:1, explain:'Specific, genuine detail proves you actually engaged with their work — a generic "pick your brain" request is easy to skim past and ignore.'},
    {h:'What to do when a message gets ignored', p:[
      'Most outreach messages don\'t get a reply — and that\'s completely normal, not a reflection of your worth or approach. People are busy, messages get buried, and timing matters as much as content. One polite follow-up after a week or two is reasonable and often works; beyond that, it\'s best to move on gracefully rather than push.',
    ], callout:{type:'mistake', title:'Common Mistake: Taking silence personally', text:'It\'s tempting to read an unanswered message as rejection. In reality, most professionals receive far more outreach than they can respond to. Send a handful of messages rather than pinning your hopes on one, and the odds shift dramatically in your favor.'}},
    {h:'Staying in touch without being weird', p:[
      'The system that works for most people is refreshingly low-effort: keep a running list of the 10–15 people you\'ve connected with, and check in every few months with something genuine — congratulating them on a career change you noticed, sharing an article relevant to a conversation you had, or simply asking how a project they mentioned turned out. Consistency over a long period beats intensity in a short burst.',
    ], table:{headers:['Cadence','What it looks like'], rows:[
      ['Right after connecting','A short thank-you message within 24–48 hours'],
      ['Every 2–3 months','A brief, genuine check-in — no ask attached'],
      ['When something changes','Congratulating a promotion, new role, or project launch'],
      ['When you can genuinely help','Sharing an article, making an introduction, offering a resource'],
    ]}, callout:{type:'protip', title:'Pro Tip', text:'Whenever you can, offer something first — a helpful article, an introduction to someone else in your network, a genuine compliment on their work. Networking that only ever flows in one direction fades fast; networking that flows both ways compounds.'}},
    {h:'Using LinkedIn without feeling like you\'re performing', p:[
      'LinkedIn works best as a quiet, accurate record of what you\'re doing and interested in — not a stage for constant self-promotion. A clear, specific headline (not just your job title, but what you actually focus on), a short summary in your own voice, and occasional genuine engagement with others\' posts does more for your network over time than frequent, forced "thought leadership" posts ever will.',
    ]},
  ],
  practiceExercises:['List 10 people you already know loosely — teachers, coaches, family friends, alumni, former coworkers','Draft one outreach message using the template above, for a real person you\'d like to reach out to','Identify one thing you could genuinely offer someone in your network before asking for anything','Update your LinkedIn headline to be specific rather than generic'],
  checklist:['List 10 people you already know loosely (teachers, coaches, family friends, alumni)','Draft one outreach message using the template','Send 2 messages this week','Set a calendar reminder to follow up in 8 weeks','Update your LinkedIn headline to be specific, not generic','Send one message to someone you haven\'t spoken to in 6+ months just to check in','Write a short, genuine thank-you message to send within 48 hours of connecting','Offer something — an article, an introduction, a compliment — before you ask for anything'],
  reflection:['Who is one person you\'ve been meaning to reach out to but haven\'t?','What could you genuinely offer someone before asking them for anything?','What makes you nervous about networking — and is that fear about rejection, or about being "fake"?','Think of a "weak tie" in your life right now — someone you know only a little. What might they know that your closer circle doesn\'t?','How do you typically feel after sending a message that goes unanswered — and how might reframing that help?'],
  quiz:[
    {q:'What is the core idea of effective networking?', options:['Asking for favors quickly','Building genuine relationships over time','Attending as many events as possible','Only connecting with senior people'], correct:1, explain:'Real networking is relationship-building — favors and opportunities tend to follow naturally.'},
    {q:'According to social science research, where do job opportunities most often come from?', options:['Close friends and family ("strong ties")','Acquaintances and loose connections ("weak ties")','Random job postings only','Direct applications with no networking'], correct:1, explain:'The "strength of weak ties" research finding shows acquaintances disproportionately connect you to new information and opportunities your close circle doesn\'t have.'},
    {q:'What should you do if your outreach message goes unanswered?', options:['Message them repeatedly every day','Assume they dislike you and give up on networking entirely','Send one polite follow-up, then move on gracefully if there\'s still no reply','Never message anyone again'], correct:2, explain:'One respectful follow-up is reasonable; beyond that, moving on preserves the relationship for a future opportunity.'},
    {q:'How often should you check in with your network, roughly?', options:['Every single day','Every 2–3 months, with something genuine','Only when you need something','Never, once you\'ve connected once'], correct:1, explain:'Occasional, genuine check-ins sustain a relationship far better than either daily contact or total silence.'},
    {q:'What should a strong cold outreach message do?', options:['Flatter the person extensively and ask for a job directly','Mention something specific, state a modest low-pressure ask, and make it easy to say yes','Stay vague so it could apply to anyone','Ask for two hours of their time right away'], correct:1, explain:'A specific detail, a small clear ask, and an easy way to say yes are what actually earn a reply.'},
    {q:'According to the lesson, what\'s the best way to use LinkedIn?', options:['Post frequent "thought leadership" content daily','Keep it as a quiet, accurate record with a specific headline and occasional genuine engagement','Only use it to message recruiters directly','Copy other people\'s posts to stay visible'], correct:1, explain:'A specific headline and occasional genuine engagement build your network more effectively over time than constant self-promotion.'},
  ],
  faq:[
    {q:'Isn\'t networking just using people?', a:'It can feel that way if it only flows one direction. Reframed as mutual relationship-building — where you also offer help — it feels a lot less transactional.'},
    {q:'What if I don\'t know anyone in my target field?', a:'Start with your loose network: teachers, family friends, alumni from your school. Most people are one or two connections away from someone useful — this is exactly what "weak ties" research points to.'},
    {q:'How many people should be in my network?', a:'There\'s no magic number, but a working list of 10–15 people you check in with occasionally is a realistic, sustainable starting point.'},
    {q:'Is it weird to reach out to someone I only met once?', a:'Not at all — referencing the specific time and context you met immediately makes it feel natural rather than random.'},
    {q:'What if I feel like I have nothing to offer someone more experienced than me?', a:'You probably have more than you think — a relevant article, a fresh perspective, or genuine appreciation for their work all count as offering something.'},
    {q:'Does networking have to happen in person to count?', a:'No — most effective outreach today happens over email or a LinkedIn message. In-person events can help, but they\'re not required.'},
  ],
  takeaways:['Networking is relationship-building, not favor-asking.','"Weak ties" — loose acquaintances — disproportionately lead to real opportunities.','Short, specific outreach gets far more replies than vague messages.','An unanswered message usually isn\'t personal — send a few, not just one.','Consistency — checking in occasionally — matters more than grand gestures.'],
  download:'networking-planner', journeys:['first-job','university'], nextInJourney:'salary-negotiation',
},

{
  slug:'salary-negotiation', outcome:'Negotiate your next offer with a clear number and a script.', title:'Negotiate Your First Salary With Confidence', pillar:'work',
  heroIllustration:'salary-negotiation',
  category:'Money', emoji:'💰', color:'blue', difficulty:'Advanced',
  readTime:'15 min read', completionTime:'55 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Most first-time employees accept the first number they\'re offered. A short, respectful conversation could be worth thousands over the life of a career.',
  objectives:['Understand why almost every offer has room to negotiate','Research a fair market range before your conversation','Use simple, respectful scripts to ask for more','Know what to do if the answer is no','Understand why the very first negotiation matters more than it seems'],
  sections:[
    {h:'Why the first number is rarely the final number', p:[
      'Most employers build some negotiating room into an initial offer, expecting a counter — it\'s a normal, expected part of the process on both sides, not an adversarial move. Declining to negotiate doesn\'t make you look agreeable or easygoing; it usually just means you leave money on the table that was available the entire time.',
    ], callout:{type:'warn', title:'The risk is smaller than it feels', text:'Offers are very rarely rescinded because a candidate asked one respectful negotiation question. The perceived risk is almost always bigger than the real one.'}},
    {h:'Why your very first negotiation matters more than it seems', p:[
      'Because future raises are frequently calculated as a percentage of current salary, a small difference in your starting number can compound meaningfully over years and multiple job changes. This isn\'t a reason to panic over one conversation — it\'s a reason to take the conversation seriously rather than skip it out of nervousness.',
    ], callout:{type:'fact', title:'Did You Know?', text:'Because raises often compound as percentages of your existing salary, even a modest few-thousand-dollar difference in a starting offer can meaningfully affect total earnings over a multi-year career, especially across several job changes.'}},
    {h:'Research before you talk numbers', p:[
      'Look up typical pay for the exact role, your experience level, and your specific region using a few different sources, since any single source can be imprecise. Walk into the conversation with a specific range in mind, grounded in real data — not a vague feeling about what "seems fair."',
    ], list:['Search the job title and city on a few salary-data sites','Ask people in your network directly — this is a normal, welcome question, not an awkward one','Factor in the full package — benefits, remote flexibility, PTO — not just base pay']},
    {mini:true, q:'Why should you research salary data from multiple sources rather than just one?', options:['Because any single source can be imprecise or outdated','It doesn\'t matter — one source is always enough'], correct:0, explain:'Salary data varies by source and can be imprecise individually — cross-referencing a few gives you a more reliable, defensible range.'},
    {h:'Scripts that keep it respectful and simple', p:[
      'You don\'t need clever tactics, leverage games, or an ultimatum — just a clear, calm, specific ask. The goal of the conversation is collaborative, not adversarial: you\'re trying to reach a number that works for both sides, not "win" against the employer.',
    ], callout:{type:'example', title:'Simple negotiation script', text:'"Thank you so much for the offer — I\'m genuinely excited about this role. Based on my research for similar positions, I was hoping we could look at something closer to $X. Is there flexibility there?"'}},
    {h:'If the answer is no', p:[
      'If base salary truly can\'t move — which does happen, especially at larger organizations with fixed pay bands — ask about other levers: a signing bonus, an earlier performance review date, extra PTO, or a professional development budget. A "no" on one specific thing doesn\'t mean a "no" on everything; treat it as one part of a larger, negotiable package.',
    ], callout:{type:'protip', title:'Pro Tip', text:'If salary is genuinely fixed, try asking "is there flexibility anywhere else in the offer?" as an open-ended follow-up — it invites the employer to suggest a lever you might not have thought to ask about directly.'}},
    {h:'The mistake that costs candidates the most', p:[
      'The single most common and costly mistake isn\'t asking for too much — it\'s not asking at all, out of fear that any negotiation risks the offer. In reality, a calm, well-researched, respectful counter is one of the lowest-risk professional conversations you\'ll ever have.',
    ], callout:{type:'mistake', title:'Common Mistake: Accepting immediately out of relief', text:'After a stressful job search, the relief of receiving an offer can create pressure to accept on the spot. It\'s almost always acceptable to say "thank you — could I have a day or two to review this?" before responding, even for a strong offer.'}},
  ],
  practiceExercises:['Research a real salary range for a role you\'re interested in, using at least 2 sources','Write out your own version of the negotiation script above, in your own words','Say your script out loud once — notice where it feels awkward and smooth it out','List 3 non-salary levers you could ask about if base pay can\'t move'],
  checklist:['Research market rate for the role and location','Decide on your target number and your minimum acceptable number','Write out your negotiation script and practice saying it out loud','Ask about the full package, not just base salary','Ask for a day or two to review before accepting on the spot','Get the final offer in writing before accepting','List 3 non-salary levers you\'d ask about if base pay can\'t move','Cross-reference at least 2 salary-data sources before settling on your range'],
  reflection:['What number would make you feel genuinely valued, not just "okay"?','What\'s the actual worst-case outcome of asking — and could you handle it?','Beyond salary, what else matters to you in an offer (flexibility, growth, benefits)?','What has stopped you from negotiating in the past, if you\'ve had the chance before?','If the answer to your ask is no, how would you want to respond in the moment?'],
  quiz:[
    {q:'What typically happens when a candidate makes one respectful counter-offer?', options:['The offer is usually withdrawn','It rarely affects the offer and often results in more money','It\'s seen as rude in most industries','It only works for senior employees'], correct:1, explain:'A single polite counter almost never costs an offer, and frequently results in a better outcome.'},
    {q:'Why does a first job\'s starting salary matter beyond that first paycheque?', options:['It doesn\'t — every future job resets to market rate','Future raises are often calculated as a percentage of current salary, so early differences can compound','Only the final job before retirement matters','Starting salary has no effect on future negotiations'], correct:1, explain:'Because raises are frequently percentage-based, a stronger starting number can compound meaningfully over a career.'},
    {q:'What is the most common and costly negotiation mistake?', options:['Asking for too much','Not asking at all, out of fear','Asking about non-salary benefits','Taking a day to consider an offer'], correct:1, explain:'Not negotiating at all is the most common way candidates leave money on the table — the perceived risk of asking is almost always bigger than the real risk.'},
    {q:'Why should you research salary from a few different sources instead of just one?', options:['Because a single source can be imprecise or outdated','Because it\'s required by law','Because employers only trust one specific website','It doesn\'t matter which sources you use'], correct:0, explain:'Cross-referencing a few sources gives you a more reliable, defensible range than trusting any single number.'},
    {q:'If an employer says base salary truly can\'t move, what should you do?', options:['End the negotiation entirely','Ask about other levers like a signing bonus, extra PTO, or an earlier review date','Accept and never bring up pay again','Assume the whole offer is fixed'], correct:1, explain:'A "no" on base salary doesn\'t mean a "no" on everything — other parts of the package may still be negotiable.'},
    {q:'What should you say if you want time before accepting an offer?', options:['Nothing — you must decide on the spot','"Thank you — could I have a day or two to review this?"','Say you\'re not interested to buy time','Ignore the offer until they follow up'], correct:1, explain:'Asking for a day or two to review is a standard, low-risk request, even for an offer you\'re excited about.'},
  ],
  faq:[
    {q:'What if this is truly my first job ever?', a:'You can still negotiate — research typical entry-level ranges and ask respectfully. Even a small increase compounds over a career.'},
    {q:'Should I share my current or previous salary?', a:'In many places you\'re not required to, and it can work against you. It\'s reasonable to say, "I\'d prefer to focus on the value I\'d bring to this role."'},
    {q:'Is it okay to ask for time before accepting an offer?', a:'Yes — asking for a day or two to review is standard and reasonable, even for a strong offer you\'re excited about.'},
    {q:'What if I don\'t have a specific number in mind?', a:'Research a range instead of a single figure, then anchor near the top of that range — a range grounded in real data is far stronger than a vague guess.'},
    {q:'Will negotiating make me look greedy or ungrateful?', a:'A calm, respectful counter is a completely normal, expected part of the process — employers build room for it into most initial offers.'},
    {q:'What if the recruiter asks for my number first?', a:'It\'s fine to redirect: "I\'d like to learn more about the role first, but based on my research the range for similar positions is around $X to $Y."'},
  ],
  takeaways:['Most offers have room to negotiate — asking rarely costs you the job.','Research gives you a confident, specific number instead of a guess.','A first salary matters beyond the first paycheque, since raises often compound as percentages.','If salary is fixed, other parts of the offer may still be negotiable.','Not negotiating at all is a far more common mistake than negotiating poorly.'],
  download:'salary-negotiation-worksheet', journeys:['first-job'], nextInJourney:'first-day',
},

{
  slug:'first-day', outcome:'Start any new job already knowing exactly what to expect.', title:'Your First Day (and First Week) at Work', pillar:'work',
  heroIllustration:'first-day',
  category:'Career', emoji:'🚪', color:'yellow', difficulty:'Beginner',
  readTime:'13 min read', completionTime:'45 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'The first week sets the tone for everything after it. Here\'s how to walk in prepared, ask good questions, and not panic about the things nobody explains.',
  objectives:['Know what to prepare the night before your first day','Learn the questions that make you look sharp, not lost','Understand common unwritten workplace norms','Build a simple system for tracking early tasks and feedback','Know what to do if you make a mistake in your first week'],
  sections:[
    {h:'The night before', p:[
      'Confirm your start time, location or login link, and dress code one more time — even if you already checked days ago, plans can quietly change. Prepare any requested documents (ID, banking info for direct deposit) so the first morning isn\'t a scramble. A little preparation the night before removes the majority of first-day anxiety, because it eliminates the logistics questions that otherwise crowd your mind.',
    ]},
    {h:'Questions that make a strong first impression', p:[
      'New employees often worry that asking questions makes them look unprepared or incapable. The opposite is usually true — specific, thoughtful questions signal that you\'re paying close attention and genuinely want to do the job well, which is exactly the impression a new hire wants to make.',
    ], list:['"What does a successful first 30 days look like in this role?"','"Who should I go to with questions about X versus Y?"','"Is there a particular communication style or tool the team prefers?"']},
    {mini:true, q:'Does asking questions in your first week make you look unprepared?', options:['Yes, always avoid asking questions early on','No — specific, thoughtful questions usually signal engagement and care'], correct:1, explain:'Thoughtful questions in the first week are one of the strongest signals a new hire can send — the opposite of looking unprepared.'},
    {h:'Unwritten rules nobody explains', p:[
      'Every workplace has norms that never appear in any handbook — how quickly people are expected to reply to messages, whether cameras are typically on for meetings, how casual the culture really is day-to-day versus how it was described during interviews. Spend the first week genuinely observing before assuming any of this.',
    ], callout:{type:'tip', title:'Match the room first', text:'In your first two weeks, lean toward observing and matching the existing culture rather than immediately trying to stand out. You can bring your full personality in once you understand the norms.'}},
    {h:'What to do the moment you make a mistake', p:[
      'Almost everyone makes at least one mistake in their first week — it\'s expected, not a red flag. What matters far more than the mistake itself is how quickly and directly you handle it: acknowledge it, ask how to fix it, and move on without excessive apologizing or catastrophizing.',
    ], callout:{type:'mistake', title:'Common Mistake: Over-apologizing', text:'A brief, direct acknowledgment ("I see the error — here\'s how I\'ll fix it") reads far better than repeated apologies, which can actually draw more attention to the mistake and make it feel bigger than it is.'}},
    {h:'Track your own progress from day one', p:[
      'Keep a simple running note of tasks assigned, questions asked, and feedback received, updated in real time rather than reconstructed from memory later. This single habit pays off enormously in your first check-in conversation and quietly demonstrates initiative without you needing to announce it.',
    ]},
    {h:'A realistic first-week rhythm', p:['Preparation compounds across the week — each day builds on what you learned the day before.']
      , timeline:[
        {label:'Night before', text:'Confirm logistics, prepare documents, plan your outfit or setup.'},
        {label:'Day 1', text:'Ask 2+ clarifying questions, observe communication norms, start your tracking notes.'},
        {label:'Days 2–4', text:'Continue observing culture, log tasks and feedback, send a thank-you to whoever onboarded you.'},
        {label:'End of week 1', text:'Review your notes and identify anything you\'d like clarified in a check-in.'},
      ]},
  ],
  practiceExercises:['Write out your specific logistics checklist for the night before a big first day','Draft 2 questions you\'d genuinely want to ask a new manager in week one','Start a simple running note format you could use to track tasks and feedback','Practice a calm, direct response to a hypothetical small mistake'],
  checklist:['Confirm start time, location/login, and dress code the night before','Prepare a notebook or doc for tracking tasks and questions','Arrive or log on 10 minutes early','Ask at least 2 clarifying questions on day one','Send a short thank-you note to whoever onboarded you','Schedule a 30-day check-in with your manager if one isn\'t already planned','Respond to any first mistakes briefly and directly, without over-apologizing'],
  reflection:['What is one thing that would help you feel calmer walking in on day one?','What unwritten workplace norm are you most curious or nervous about?','How do you usually like to receive feedback — and could you tell your manager that directly?','How do you typically respond to your own mistakes — does that response usually help or hurt?','What would "a strong first week" look like to you, beyond just not messing anything up?'],
  quiz:[
    {q:'What\'s a good approach to the first week at a new job?', options:['Try to stand out immediately with big ideas','Observe norms first, then bring your full personality','Avoid asking any questions','Only speak when spoken to'], correct:1, explain:'Observing first helps you understand unwritten norms before making big moves.'},
    {q:'What\'s the best response to making a mistake in your first week?', options:['Repeated apologies','A brief, direct acknowledgment and a plan to fix it','Ignoring it and hoping nobody noticed','Quitting immediately'], correct:1, explain:'A short, direct acknowledgment reads far better than over-apologizing, which can draw more attention to the mistake.'},
    {q:'What should you prepare the night before your first day?', options:['Nothing — just show up and figure it out','Your start time, dress code, and any requested documents','A formal resignation letter','The full employee handbook, memorized'], correct:1, explain:'Confirming logistics the night before removes most of the scramble and anxiety of the actual morning.'},
    {q:'Why does keeping a running note of tasks and feedback from day one help?', options:['It\'s required by HR at most companies','It pays off in your first check-in and quietly demonstrates initiative','It replaces the need to ask any questions','It guarantees a raise'], correct:1, explain:'A simple, real-time record of tasks and feedback makes your first check-in far more useful, without you needing to announce your effort.'},
    {q:'Which is an example of a strong question to ask in your first week?', options:['"What does a successful first 30 days look like in this role?"','"What is everyone\'s salary?"','"When is the next paid holiday?"','"Can I work from home permanently starting today?"'], correct:0, explain:'Asking about what success looks like shows genuine engagement and gives you a concrete target to work toward.'},
    {q:'Why should you generally observe workplace norms before trying to stand out?', options:['Standing out immediately is always the safest move','Every workplace has unwritten norms worth learning before making big moves','Observing wastes valuable time','Norms never matter once you\'re hired'], correct:1, explain:'Matching the room first — communication style, culture, pace — helps you understand a workplace before you try to change or stand out in it.'},
  ],
  faq:[
    {q:'What if I make a mistake in my first week?', a:'Almost everyone does — it\'s expected. Own it quickly, ask how to fix it, and move on without over-apologizing.'},
    {q:'Is it okay to ask what\'s expected of me?', a:'Yes — directly asking your manager what success looks like in 30/60/90 days is one of the strongest things a new hire can do.'},
    {q:'How formal should my first-week questions be?', a:'Conversational is fine — you don\'t need a scripted list, just genuine curiosity about how to do the job well.'},
    {q:'What if I don\'t understand something explained during onboarding?', a:'Ask again — clarifying once is far better than quietly guessing and getting it wrong later.'},
    {q:'Should I bring up ideas for improvement in my first week?', a:'Generally hold off — spend the first couple weeks observing and understanding why things are done a certain way before suggesting changes.'},
    {q:'What if my onboarding feels disorganized?', a:'That\'s common, especially at smaller companies — proactively asking your manager what you should be working on can fill the gap.'},
  ],
  takeaways:['A little prep the night before removes most first-day anxiety.','Specific questions make you look engaged, not unprepared.','Every workplace has unwritten norms — observe before assuming.','A brief, direct response to a mistake beats over-apologizing.','Tracking your own tasks and questions pays off at your first check-in.'],
  download:'first-paycheque-breakdown', journeys:['first-job'], nextInJourney:'professional-growth',
},

{
  slug:'professional-growth', outcome:'Turn any job into an intentional, growing career.', title:'Turning a Job Into a Career', pillar:'work',
  heroIllustration:'professional-growth',
  category:'Career', emoji:'📈', color:'blue', difficulty:'Intermediate',
  readTime:'14 min read', completionTime:'50 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'A job pays the bills. A career compounds. Here\'s how to make sure your first role is quietly building toward something bigger.',
  objectives:['Understand the actual difference between a job and a career','Set a simple 1-year and 3-year professional goal','Build the habit of asking for feedback before annual reviews','Recognize signs it might be time to grow within a role — or move on','Start a lightweight system for tracking wins and skills gained'],
  sections:[
    {h:'The difference between a job and a career', p:[
      'A job is a set of tasks you complete for pay. A career is what happens when those tasks are chosen — even loosely and imperfectly — to build skills, relationships, and direction over time. You don\'t need a rigid 10-year plan to have a career instead of just a job; you need a rough sense of what you\'re building toward and how your current role genuinely fits into that.',
    ]},
    {h:'Ask for feedback before you need it', p:[
      'Waiting for a single annual review to learn how you\'re actually doing means accepting up to a full year of uncertainty, with no chance to adjust course along the way. A short, casual check-in with your manager every month or two — "is there anything I should be doing differently?" — keeps genuine surprises out of your formal performance reviews.',
    ], callout:{type:'tip', title:'Simple feedback script', text:'"I want to make sure I\'m growing in the right direction — is there anything you\'d like to see more or less of from me?"'}},
    {mini:true, q:'What\'s a healthier alternative to waiting for one annual review?', options:['Ignoring feedback entirely until it\'s given','Regular, informal check-ins every month or two'], correct:1, explain:'Frequent, low-pressure check-ins prevent surprises and support steady, ongoing growth rather than a once-a-year evaluation.'},
    {h:'Signs it might be time to grow or move on', p:[
      'Staying too long in a role that\'s stopped teaching you anything new can be just as costly, long-term, as leaving a role too early. Watch for a pattern of signs: repeated tasks with no new challenge attached, no clear next step ever being discussed, or consistently being passed over for opportunities you\'ve directly expressed interest in.',
    ], table:{headers:['Sign','What it might mean'], rows:[
      ['Tasks feel identical to 6 months ago','You may have plateaued in this role'],
      ['No next step ever discussed','Growth path may be unclear or absent'],
      ['Passed over despite asking','A mismatch between your interest and the opportunity'],
      ['Still learning something new monthly','A good sign — this role likely still has runway'],
    ]}},
    {h:'Track your wins as you go', p:[
      'Keep a running document of accomplishments, positive feedback, and new skills gained — updated monthly in small increments, not scrambled together under pressure right before a review or a job search. Future-you, sitting in a stressful moment trying to remember what you\'ve accomplished, will be genuinely grateful for present-you\'s habit.',
    ], callout:{type:'fact', title:'Did You Know?', text:'Memory research consistently shows that we tend to underestimate and forget our own accomplishments over time — a running "wins" document counteracts this bias directly, giving you an accurate record instead of a faded, incomplete memory.'}},
    {h:'The mistake that quietly stalls careers', p:[
      'The most common mistake isn\'t staying in a role too long or leaving too early — it\'s never having the direct conversation about growth at all, and instead privately assuming things will either improve or that nothing can be done. A calm, direct conversation about growth expectations, repeated periodically, prevents years of quiet stagnation.',
    ], callout:{type:'mistake', title:'Common Mistake: Assuming growth will happen automatically', text:'Growth within a role is rarely automatic — it usually requires directly asking what growth would look like, rather than waiting to be offered it. Silence is often read as satisfaction, even when it isn\'t.'}},
  ],
  practiceExercises:['Write one rough 1-year and one 3-year professional goal, even imperfectly','Draft the exact feedback script you could use with your own manager','Start a "wins" document today with just one entry, however small','Identify which sign from the table above best describes your current situation, if you\'re employed'],
  checklist:['Write one rough 1-year and one 3-year professional goal','Schedule a recurring monthly or quarterly feedback check-in','Start a "wins" document and add to it monthly','Identify one skill you want to build in the next 6 months','Ask a mentor or manager what growth could look like in this role','Have a direct conversation about growth rather than assuming it\'ll happen','Write down one specific project or skill to ask for feedback on this month','Review your "wins" document before any review or job search conversation'],
  reflection:['What skill are you building right now that you\'re genuinely proud of?','If you looked one year ahead, what would "growth" look like from where you are today?','Is there feedback you\'ve been avoiding asking for?','Have you ever assumed growth would happen automatically, without asking directly?'],
  quiz:[
    {q:'What\'s a healthy alternative to waiting for an annual review?', options:['Ignoring feedback until asked','Regular, informal check-ins with your manager','Comparing yourself to coworkers','Changing jobs every 3 months'], correct:1, explain:'Frequent, low-pressure check-ins prevent surprises and support steady growth.'},
    {q:'What often quietly stalls someone\'s growth in a role?', options:['Asking directly about growth expectations','Never having a direct conversation about growth, and just assuming', 'Keeping a wins document','Setting a 1-year goal'], correct:1, explain:'Assuming growth will happen automatically, without ever raising it directly, is one of the most common ways careers quietly stall.'},
    {q:'What\'s the actual difference between a job and a career, according to the lesson?', options:['A career always pays significantly more','A career is tasks chosen, even loosely, to build skills and direction over time','A job requires no planning at all, a career requires a rigid 10-year plan','There is no meaningful difference'], correct:1, explain:'You don\'t need a rigid plan to have a career instead of just a job — you need a rough sense of direction and how your current role fits into it.'},
    {q:'Which of these is listed as a sign it might be time to grow or move on?', options:['Still learning something new every month','Being repeatedly passed over for opportunities you\'ve directly expressed interest in','Having a running wins document','Getting monthly feedback check-ins'], correct:1, explain:'Being consistently passed over despite asking is one of the patterns worth paying attention to, alongside repeated, unchanging tasks and no discussed next step.'},
    {q:'Why does the lesson recommend keeping a running "wins" document?', options:['Memory research shows we tend to underestimate and forget our own accomplishments over time','It\'s legally required for performance reviews','It replaces the need to ever ask for feedback','It only matters if you\'re actively job hunting'], correct:0, explain:'A wins document counteracts the natural tendency to forget or undersell your own accomplishments, giving you an accurate record instead of a faded memory.'},
    {q:'How often does the lesson suggest checking in for feedback, rather than waiting for an annual review?', options:['Once every five years','Every month or two, informally','Only if something goes wrong','Never — annual reviews are sufficient'], correct:1, explain:'Short, casual check-ins every month or two keep genuine surprises out of formal reviews and support steady growth.'},
  ],
  faq:[
    {q:'How do I know if I should leave a job?', a:'If you\'ve raised growth or challenge concerns directly and nothing changes after a reasonable period, it may be time to look elsewhere — but always have that direct conversation first.'},
    {q:'What if my manager doesn\'t give useful feedback?', a:'Ask more specific questions ("what\'s one thing I could improve on X project?") rather than open-ended ones — specificity often gets better answers.'},
    {q:'Do I need a formal 5-year plan?', a:'No — a rough 1-year and 3-year direction is enough to inform decisions. Rigid long-term plans often need to change anyway as circumstances shift.'},
    {q:'What if I ask for feedback and just get vague answers back?', a:'Get more specific — ask about one concrete project or skill rather than a general "how am I doing," which tends to get a general, unhelpful answer.'},
    {q:'Is it normal to not have a long-term career plan yet?', a:'Completely normal — a rough 1-year and 3-year direction is enough for now, and it\'s fine for the specifics to stay fuzzy.'},
    {q:'What if I bring up growth directly and nothing actually changes?', a:'Give it a reasonable period after that conversation — if it still doesn\'t shift, that\'s useful information about whether this role can support the growth you\'re looking for.'},
  ],
  takeaways:['A career is a job shaped by intention over time — you don\'t need a rigid plan, just a direction.','Regular feedback prevents unpleasant surprises at review time.','Track your own wins; don\'t rely on memory alone.','Growth rarely happens automatically — it usually requires asking for it directly.','A short monthly or quarterly check-in beats waiting an entire year to learn how you\'re doing.','No single stagnation sign is proof on its own, but a pattern of them is worth a direct conversation.'],
  download:'career-roadmap', journeys:['first-job'], nextInJourney:null,
},

/* ---------------------------- FINANCIAL CONFIDENCE JOURNEY ---------------------------- */

{
  slug:'budgeting', outcome:'Build a real, working budget from your actual spending.', title:'Creating Your First Real Budget', pillar:'resilience', flagship:true,
  heroIllustration:'budgeting',
  category:'Money', emoji:'📊', color:'blue', difficulty:'Beginner',
  readTime:'16 min read', completionTime:'60 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Most budgets fail because they\'re built on guilt and restriction. Here\'s one built on reality, honesty, and automation — the kind you\'ll actually keep using.',
  objectives:['Understand why most budgets quietly fail by month two','Learn the 50/30/20 framework and adapt it to a real, imperfect income','Track a full week of spending without judgment, as a diagnostic step','Build a budget that survives irregular income or a part-time paycheque','Set up automatic systems that remove daily willpower from the equation','Know what to do the first time you go over budget'],
  sections:[
    {h:'Why most budgets don\'t survive month two', p:[
      'Most budgets fail not because people lack discipline, but because the budget itself was unrealistic from day one — usually too strict, built on a "should" ("I should only spend $50 on food") rather than an honest look at real spending ("I actually spend closer to $120"). A budget that requires perfect willpower every single day will eventually break, usually within a few weeks, and then it feels like a personal failure rather than what it actually is: a design problem.',
      'A budget that survives is one built from your real numbers first, and adjusted gradually — not one copied from a personal finance influencer\'s ideal scenario that doesn\'t match your actual life.',
    ]},
    {h:'Start with observation, not restriction', p:[
      'Before changing a single spending habit, track a full week of spending exactly as it happens — every coffee, every subscription, every impulse purchase, with zero judgment attached. This single step is more useful than almost anything else in this lesson, because you cannot fix a pattern you haven\'t actually seen clearly yet. Most people are surprised by at least one category when they track it honestly for the first time.',
    ], callout:{type:'tip', title:'The no-judgment rule', text:'While tracking your first week, resist the urge to change your behavior or feel guilty about any purchase. The goal of week one is pure data collection — an honest baseline, not a diet.'}},
    {h:'The 50/30/20 framework, adapted for real life', p:[
      'A simple, well-tested starting split: roughly 50% of income toward needs (rent, groceries, transportation, phone bill, insurance), 30% toward wants (entertainment, eating out, hobbies, non-essential clothes), and 20% toward savings and debt paydown. If your income is lower or irregular, the exact percentages matter far less than having three clear buckets and a rough sense of how much flows into each one.',
    ], table:{headers:['Bucket','% Target','Examples'], rows:[
      ['Needs','~50%','Rent, groceries, phone bill, transportation, insurance'],
      ['Wants','~30%','Streaming, eating out, hobbies, clothes beyond basics'],
      ['Savings & Debt','~20%','Emergency fund, future goals, extra debt payments'],
    ]}},
    {mini:true, q:'Which category does a monthly phone bill belong in?', options:['Wants','Needs'], correct:1, explain:'A phone bill is generally a Need — a fixed, largely unavoidable cost of daily life, unlike discretionary spending such as streaming or eating out.'},
    {h:'Budgeting with irregular income', p:[
      'If your paycheque changes month to month — common with part-time work, gig work, or seasonal jobs — budget off your lowest realistic month rather than your best one. This single adjustment prevents the classic trap of treating a good month\'s income as the new normal and then coming up short the next month. Anything extra earned in a strong month should flow straight into savings, not into an upgraded lifestyle.',
    ], callout:{type:'fact', title:'Did You Know?', text:'Financial counselors often refer to this as "budgeting off your floor" — using your lowest reasonably expected income as your baseline, which naturally builds in a cushion for the inevitable slower months.'}},
    {h:'Automate the boring parts', p:[
      'The most reliable budgets remove decision-making wherever possible, because willpower is a limited and unreliable resource, especially by the end of a long day. Set up an automatic transfer to savings the day you get paid — before you ever see the money sitting in your checking account, tempting you to spend it.',
    ], callout:{type:'example', title:'Pay yourself first', text:'If you\'re paid $500 biweekly, set an automatic transfer of $50–75 to savings the same day — before it has a chance to become spending money. Over a year, that\'s $1,300–1,950 saved without a single daily decision required.'}},
    {h:'What to do the first time you go over budget', p:[
      'You will go over budget in at least one category at some point — this is normal, expected, and not a sign the system has failed. The mistake most people make is abandoning the whole budget after one rough week. Instead, treat it as data: which category ran over, and why? Adjust next month\'s targets slightly rather than scrapping the system entirely.',
    ], callout:{type:'mistake', title:'Common Mistake: All-or-nothing thinking', text:'One overspent week does not undo a budget — it\'s a normal part of using one. The costly mistake is deciding "I already blew it, so nothing matters this month," which turns one small overspend into a much larger one.'}},
    {h:'Building your budget, step by step', p:['Once you\'ve tracked a week and understand the 50/30/20 shape, building the actual budget is a short, mechanical process.']
      , timeline:[
        {label:'Step 1', text:'List your total monthly income (or your lowest realistic month, if irregular).'},
        {label:'Step 2', text:'Sort last month\'s real spending into Needs, Wants, and Savings.'},
        {label:'Step 3', text:'Compare that sorting to the 50/30/20 targets — where\'s the biggest gap?'},
        {label:'Step 4', text:'Set one automatic transfer to savings for payday.'},
        {label:'Step 5', text:'Revisit and adjust after 30 days — this is a living document, not a one-time task.'},
      ]},
  ],
  practiceExercises:['Track every purchase for the next 7 days without changing any habits yet','Sort last month\'s spending (or this week\'s, if that\'s all you have) into Needs / Wants / Savings','Calculate what 50/30/20 would look like for your actual income','Set up one automatic transfer to savings, even a small one, before finishing this lesson'],
  checklist:['Track every purchase for 7 days without changing anything yet','Sort last month\'s spending into Needs / Wants / Savings','Set a rough percentage target for each bucket','Set up one automatic transfer to savings on payday','Choose one app or simple spreadsheet to track going forward','Revisit and adjust after 30 days','Identify your "floor" income if your paycheque is irregular'],
  reflection:['What\'s one expense that surprised you when you actually tracked it?','What would "enough" savings feel like to you right now — not perfect, just enough to feel calmer?','What\'s one small automatic system you could set up this week?','Think of the last time you went over budget — what happened right after, and did it help or hurt?','Which of the three buckets (Needs, Wants, Savings) feels hardest to control right now?'],
  quiz:[
    {q:'In the 50/30/20 framework, what does the 20% represent?', options:['Wants','Needs','Savings and debt paydown','Taxes'], correct:2, explain:'The 20% bucket is for savings and extra debt payments — building your financial cushion.'},
    {q:'What\'s the recommended approach for irregular income?', options:['Budget off your best month','Budget off your lowest realistic month','Don\'t budget at all','Spend first, save what\'s left'], correct:1, explain:'Budgeting conservatively off your lowest realistic month prevents overspending in lean months.'},
    {q:'Why track a week of spending before building a budget?', options:['It\'s required by banks','You can\'t fix a pattern you haven\'t actually seen','It guarantees you\'ll save more immediately','It replaces the need for a budget entirely'], correct:1, explain:'Tracking first gives you an honest, judgment-free baseline to build a realistic budget from.'},
    {q:'What should you do the first time you go over budget in a category?', options:['Abandon the budget entirely','Treat it as data and adjust next month slightly','Stop spending completely for the rest of the month','Ignore it — it doesn\'t matter'], correct:1, explain:'One overspent category is normal feedback, not a failure — small adjustments keep the system realistic and sustainable.'},
    {q:'What does "pay yourself first" mean in this lesson?', options:['Spending on yourself before paying any bills','Setting an automatic transfer to savings the day you\'re paid, before it becomes spending money','Paying off all debt before ever saving anything','Giving yourself a fixed weekly cash allowance'], correct:1, explain:'Automating a transfer to savings the moment you\'re paid removes the daily willpower needed to save what\'s left over.'},
    {q:'Why does the lesson recommend tracking a full week of spending before building a budget?', options:['It\'s required to open a bank account','You can\'t fix a spending pattern you haven\'t honestly seen yet','It automatically lowers your expenses','It replaces the need for the 50/30/20 framework'], correct:1, explain:'A judgment-free week of tracking gives you an honest baseline — most people are surprised by at least one category once they see it clearly.'},
  ],
  faq:[
    {q:'What if my income barely covers needs?', a:'Start with even a tiny automatic savings amount — $5 a paycheque builds the habit. The percentage matters less than the consistency early on.'},
    {q:'Do I need a special app?', a:'No — a basic spreadsheet or even a notes app works. The Monthly Budget Planner worksheet gives you a ready-made template.'},
    {q:'What if I go over budget one month?', a:'It happens to almost everyone — treat it as information rather than failure, adjust next month\'s targets slightly, and keep going.'},
    {q:'Should I budget down to the last dollar?', a:'For a first budget, rough categories and percentages are more sustainable than micromanaging every dollar — precision can come later once the habit is established.'},
    {q:'What if I don\'t have steady income right now?', a:'You can still build the habit — track spending against whatever money moves through your hands, even an allowance or occasional gig income, so the system is ready as your income grows.'},
    {q:'Is 50/30/20 a strict rule I have to hit exactly?', a:'No — it\'s a starting shape, not a strict rule. Having three clear buckets and a rough sense of proportion matters more than hitting the exact percentages.'},
  ],
  takeaways:['Track before you restrict — you can\'t fix a pattern you haven\'t seen.','A simple three-bucket system beats a complicated one you\'ll abandon.','If your income is irregular, budget off your lowest realistic month.','Automating savings removes the need for daily willpower.','Going over budget once is normal feedback, not a reason to give up.'],
  download:'budget-planner', journeys:['financial'], nextInJourney:'bank-accounts',
},

{
  slug:'bank-accounts', outcome:'Choose the right accounts for you and use them with confidence.', title:'Choosing and Using Your First Bank Account', pillar:'resilience',
  category:'Money', emoji:'🏦', color:'yellow', difficulty:'Beginner',
  readTime:'11 min read', completionTime:'35 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'bank-accounts',
  dek:"Checking, savings, fees, overdrafts — the vocabulary alone can be intimidating. Here's exactly what matters when picking, opening, and actually using your first bank account.",
  objectives:['Understand the difference between checking and savings accounts, and why you likely need both','Know which fees to watch for and how to get them waived','Learn what overdraft protection actually means and which option to choose','Compare banks and credit unions using the same checklist','Set up a simple two-account system for spending and saving','Avoid the most common first-account mistakes'],
  sections:[
    {h:'Checking vs. savings, simply explained', p:["A checking account is for everyday spending — bills, debit card purchases, transfers, and anything that moves in and out often. A savings account is meant to hold money you're not touching regularly, and it usually earns a small amount of interest in return for leaving it alone.", 'Most people need both, even with a small or irregular income. The point isn\'t the amount — it\'s the separation. Money that lives in a different account, with a different purpose, is money you\'re far less likely to accidentally spend.'],
      callout:{type:'fact', title:'Did You Know?', text:'Interest rates on savings accounts vary enormously between banks — some pay close to nothing, while online-only banks and credit unions often pay significantly more for the exact same type of account. It always pays to compare.'}},
    {h:'Fees to watch for', p:['Monthly maintenance fees, minimum balance fees, paper statement fees, and out-of-network ATM fees are the most common ways banks quietly take money back. None of them are required — they exist because most customers don\'t ask.', 'Many banks waive monthly fees automatically for students, for accounts under a certain age, or for accounts with recurring direct deposit. The waiver usually isn\'t advertised — you have to ask for it by name.'],
      callout:{type:'warn', title:'Read the fee schedule', text:"Every bank publishes a fee schedule, usually a page or two buried in account disclosures. It's not exciting reading, but ten minutes here can save you from surprise charges for years."}},
    {h:'Overdraft protection, in plain terms', p:["Overdraft happens when you spend more than what's in your account. Some banks charge $30+ per overdraft — and will do it multiple times in one day; others offer to simply decline the transaction (safer for a first account) or link a second account to cover the gap for free.", "Ask your bank what its default overdraft setting is before you open the account — don't assume. If given a choice, most first-time account holders are better off opting into a 'decline' rather than a 'pay and charge a fee' arrangement."],
      callout:{type:'mistake', title:'Common Mistake', text:"Assuming overdraft coverage is a helpful safety net. For a first account, it's often the opposite — it quietly turns a $6 mistake into a $36 one. Ask what the fee-free option is."}},
    {h:'What to actually compare between banks', p:['It\'s tempting to just open an account wherever a parent, friend, or campus table happens to be. A few extra minutes of comparison shopping usually pays for itself many times over.'],
      table:{headers:['What to check','Why it matters'], rows:[
        ['Monthly fee & waiver conditions','Determines whether the account costs you money just to exist'],
        ['ATM network size / reimbursement','Out-of-network withdrawals can cost $3–5 per use'],
        ['Overdraft policy','Can turn a small mistake into a $30+ charge — or cost nothing'],
        ['Mobile app quality','You will check your balance from your phone far more than a branch'],
        ['Minimum opening deposit','Some accounts require $25–100 just to open'],
        ['Interest rate (savings)','The difference between near-0% and a competitive rate compounds over time'],
      ]}},
    {h:'Setting up your two-account system', p:['Once you\'ve chosen a bank, the setup itself takes about 20 minutes online or in an app: open a checking account, open a savings account, and — if you have income — set up direct deposit so a portion routes automatically into savings before you ever see it in checking.', 'Automating the split removes the willpower problem entirely. You\'re not relying on remembering to transfer money later; it\'s already separated the moment it arrives.'],
      callout:{type:'protip', title:'Pro Tip', text:'Name your savings account something specific in the app — "Emergency Fund" or "Move-Out Fund" instead of just "Savings." A named goal is measurably harder to raid for impulse spending than a generic pot of money.'},
      mini:{q:'Why does automating a transfer to savings work better than transferring manually?', options:['It earns more interest automatically','It removes the need to rely on willpower each time','Banks require it','It avoids all fees'], correct:1, explain:'Automation removes the decision point — the money moves before you have a chance to spend it, which is far more reliable than good intentions alone.'}},
    {h:'Everyday account hygiene', p:['Opening the account is the easy part. A few small habits keep it working for you: check your balance at least weekly through the app, turn on low-balance and unusual-activity alerts, and reconcile your statement monthly against what you remember spending.', 'Catching an error or unauthorized charge within days is straightforward. Catching it after two months can mean losing your legal protection to dispute it.']},
  ],
  practiceExercises:[
    'Pick two banks or credit unions (at least one should be a credit union or online-only bank) and fill in the six comparison factors from the table above side by side',
    'Write a two-sentence script you could say to a bank representative to ask about waiving a monthly maintenance fee, then practice saying it out loud once',
    'Turn on low-balance and unusual-activity alerts on your own account (or the one you\'re about to open) right now',
    'Reconcile one full month of your own statement against what you remember spending, and note anything that surprised you',
  ],
  checklist:['Compare 2–3 banks or credit unions for student/no-fee options','Ask specifically about monthly fees and how to waive them','Ask what happens by default if you overdraft, and opt for the fee-free option if offered','Check the minimum opening deposit and ATM network size','Open a checking and a separate savings account','Name your savings account after a specific goal','Set up direct deposit if you have a job','Download the mobile app and turn on balance/activity alerts','Set a recurring reminder to check your statement monthly'],
  reflection:['Have you ever been surprised by a bank fee — what happened, and how did you find out?','What would make you trust a bank or credit union with your money?','What\'s one savings goal specific enough that naming an account after it would help?','What\'s one fee you\'d want to ask a bank representative about directly before opening an account?','How often do you actually check your bank balance right now — and is that often enough for you?'],
  quiz:[
    {q:'What is overdraft protection meant to prevent?', options:['Identity theft','Spending more money than is in your account without a fee or automatic decline','Losing your debit card','Late tax filing'], correct:1, explain:'Overdraft protection is about handling — or avoiding fees from — spending beyond your account balance.'},
    {q:'What\'s usually the fastest way to get a monthly maintenance fee waived?', options:['Wait for the bank to remove it automatically','Ask directly about student status or setting up direct deposit','Close and reopen the account','Only use ATMs in-network'], correct:1, explain:'Fee waivers are almost never automatic — you typically have to ask for them by name and meet a simple condition like direct deposit.'},
    {q:'Why separate checking and savings into different accounts?', options:['It\'s legally required','It makes it harder to accidentally spend money meant for goals or emergencies','Savings accounts don\'t allow debit cards','It reduces your taxes'], correct:1, explain:'Physical separation removes a layer of temptation — money you don\'t see in your spending account is money you\'re unlikely to spend.'},
    {q:'What\'s one advantage of naming your savings account after a specific goal?', options:['It increases your interest rate automatically','It makes the money noticeably harder to justify raiding for impulse spending','It\'s required by most banks','It reduces monthly fees'], correct:1, explain:'A named goal creates a small but real psychological barrier — money in a generic "Savings" account is much easier to justify spending than money earmarked for something specific.'},
    {q:'Why does reconciling your bank statement monthly matter?', options:['It\'s required by law','Catching an error or unauthorized charge within days protects your ability to dispute it — waiting months can mean losing that protection','It automatically waives fees','It increases your interest rate'], correct:1, explain:'Most banks give you a limited window to dispute unauthorized charges — checking your statement monthly means you catch problems while you can still act on them.'},
  ],
  faq:[
    {q:'Should I use a bank or a credit union?', a:'Both can work well — credit unions often have lower fees and better savings rates, while banks may have more branches and a wider ATM network. Compare fee schedules and app quality either way; there\'s no universally right answer.'},
    {q:'How much should I keep in checking vs. savings?', a:'A common approach is keeping roughly 1–2 months of typical expenses in checking for smooth cash flow, and building savings separately for both an emergency fund and specific goals.'},
    {q:'What if I can\'t meet a minimum opening deposit?', a:'Many student and no-fee accounts have $0 or very low minimums specifically for this reason — it\'s worth searching for these before assuming you need $100+ to open an account.'},
    {q:'Do I need a credit card too?', a:'Not immediately. A bank account with a debit card covers spending; credit is a separate topic covered in the Credit Scores 101 playbook, worth exploring once your banking basics are set up.'},
    {q:'What\'s an out-of-network ATM fee, and how do I avoid it?', a:'It\'s a charge — often $3–5 — for withdrawing at machines outside your bank\'s network. Check the fee schedule, use your bank\'s app to find in-network ATMs, or pick a bank that reimburses these fees.'},
    {q:'Do I actually need to check my account often once it\'s open?', a:'Yes — checking your balance weekly and reconciling your statement monthly are the two habits that actually catch errors and unauthorized charges while you can still dispute them.'},
  ],
  takeaways:['Checking is for spending, savings is for goals and emergencies — most people benefit from having both.','Ask directly about fees and overdraft policy; many costs are avoidable simply by asking.','Compare banks using the same six factors — fees, ATM network, overdraft policy, app quality, minimum deposit, and interest rate.','Automating a transfer to savings removes the willpower problem — the money moves before you can spend it.','Checking your account weekly and your statement monthly catches errors while you can still dispute them.'],
  download:'expense-tracker', journeys:['financial'], nextInJourney:'credit-scores',
},

{
  slug:'credit-scores', outcome:'Understand exactly what builds — or hurts — your credit score.', title:'Understanding Credit Scores Before You Need One', pillar:'resilience', flagship:true,
  heroIllustration:'credit-scores',
  category:'Money', emoji:'💳', color:'blue', difficulty:'Intermediate',
  readTime:'18 min read', completionTime:'65 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Your credit score can quietly affect your apartment, your car, your phone plan, and your interest rates for decades. Here\'s how it actually works, before you need it to.',
  objectives:['Understand exactly what a credit score is measuring and why it exists','Learn the five factors that make up a credit score, and how they\'re weighted','Understand the real difference between a credit card and a debit card','Build credit safely as a complete beginner, with minimal risk','Avoid the handful of mistakes that hurt new credit histories the most','Know how to check your credit report without hurting your score'],
  sections:[
    {h:'What a credit score actually measures', p:[
      'A credit score is a number, typically ranging from 300–850, that estimates how reliably you repay borrowed money based on your financial history. Lenders use it to decide whether to approve a loan and at what interest rate; landlords increasingly use it to screen renters; some employers and insurers use it too. It can feel invisible until the exact moment it isn\'t — like when you\'re trying to rent your first apartment and discover you have no credit history at all.',
      'The frustrating paradox for young people is that you often need credit history to get approved for the things that would let you build credit history in the first place. Understanding the system before you need it is the way out of that trap.',
    ]},
    {h:'The five factors, and how they\'re weighted', p:[
      'A credit score isn\'t a mysterious black box — it\'s built from five well-documented factors, weighted quite differently from each other. Understanding the weighting tells you exactly where to focus your effort as a beginner.',
    ], table:{headers:['Factor','Approx. Weight','What it means'], rows:[
      ['Payment history','~35%','Do you pay on time, every time?'],
      ['Credit utilization','~30%','How much of your available credit you\'re using'],
      ['Length of credit history','~15%','How long your accounts have been open'],
      ['Credit mix','~10%','Variety of account types (cards, loans, etc.)'],
      ['New credit','~10%','How many new accounts you\'ve recently opened'],
    ]}, callout:{type:'fact', title:'Did You Know?', text:'Payment history and credit utilization together make up roughly two-thirds of your score. This means a beginner focused only on those two factors — paying on time and keeping balances low — is already addressing the majority of what matters.'}},
    {mini:true, q:'Which two factors together make up roughly two-thirds of a typical credit score?', options:['Credit mix and new credit','Payment history and credit utilization'], correct:1, explain:'Payment history (~35%) and utilization (~30%) combine for about 65% of the typical score — by far the two most important factors to manage.'},
    {h:'Credit card vs. debit card — a difference that actually matters', p:[
      'A debit card spends money directly from your bank account and has no effect on your credit score at all, no matter how you use it. A credit card is a small loan every time you use it — you\'re borrowing the purchase amount and agreeing to pay it back, and that repayment behavior is exactly what gets reported to build your credit history. This is why a debit card, no matter how responsibly you use it for years, will never build credit — only credit accounts do.',
    ]},
    {h:'Building credit safely as a complete beginner', p:[
      'Two options stand out as safe starting points precisely because they limit your downside risk while still reporting activity to credit bureaus. A secured credit card requires a small refundable deposit (often equal to your credit limit), which dramatically lowers the risk to the lender and makes approval easy even with no history. Alternatively, becoming an authorized user on a trusted family member\'s long-standing, well-managed card can let their positive history benefit your own score.',
    ], callout:{type:'protip', title:'Pro Tip', text:'If you go the secured card route, treat the deposit amount as the real spending limit in your head — even if the card technically allows more. Staying comfortably under 30% utilization from day one builds good habits before they even need to be broken.'}},
    {h:'The golden rule of beginner credit', p:[
      'Never spend more on a credit card than you could pay off in cash that same month. The card is a tool for building a positive repayment history — it is not a way to access money you don\'t actually have. Treating available credit as spendable income is the single most common way a first credit card turns into a financial setback instead of a financial tool.',
    ], callout:{type:'warn', title:'Heads up: Interest compounds fast', text:'Credit card interest rates are often significantly higher than other forms of borrowing. Carrying a balance month to month, even a small one, can mean paying substantially more than the original purchase price over time.'}},
    {h:'Mistakes that hurt beginners the most', p:[
      'Missing a payment — even by just a few days — can meaningfully damage a new, thin credit history far more than it would an older, established one. Maxing out a card, even if you fully pay it off every month, can also temporarily hurt your utilization ratio if a high balance is reported to the bureau before your payment posts.',
    ], callout:{type:'mistake', title:'Common Mistake: Assuming "pay in full" erases utilization risk', text:'Many beginners believe that paying a card in full every month means utilization doesn\'t matter. In reality, most issuers report your balance on your statement closing date — if that balance is high even briefly, it can affect your score regardless of whether you pay it off days later.'}},
    {h:'Autopay: the single best habit for beginners', p:[
      'Set your card to automatically pay the full statement balance every month, the same day you open the account. This one setup step prevents the most common and costly credit mistake — a missed or late payment caused by simple forgetfulness rather than any real financial trouble.',
    ]},
    {h:'Checking your credit report without hurting your score', p:[
      'Checking your own credit score or report is what\'s known as a "soft inquiry" and has no negative effect on your score whatsoever, no matter how often you do it. Only certain lender-initiated checks tied to a real application — a "hard inquiry" — cause a small, temporary dip. Many countries offer at least one free credit report check per year through official channels; using it is one of the lowest-effort, highest-value habits you can build.',
    ]},
  ],
  practiceExercises:['Look up whether your country offers a free annual credit report, and where to access it','Decide which safe starting option — secured card or authorized user — fits your situation better','Calculate what 30% utilization would look like on a hypothetical $500 credit limit','Write down what "autopay for full statement balance" would need from you to set up on day one'],
  checklist:['Check your credit report for free once (many countries offer this annually)','Decide between a secured card or authorized-user status','Set up autopay for the full statement balance the day you open a card','Keep utilization under 30% of your limit ideally','Never treat available credit as spendable income','Check your score every few months, not obsessively','Set a calendar reminder to check your free annual credit report','Write down your card\'s statement closing date so you know when your balance gets reported'],
  reflection:['What\'s one thing about credit that has always confused or intimidated you?','If you had a credit card today, what system would you put in place to avoid missing a payment?','What\'s a purchase you might be tempted to put on credit that you couldn\'t pay off right away?','Do you know anyone whose credit history has affected something surprising — an apartment, a job, an interest rate?','What would it feel like to already have a strong credit history by the time you actually need one — for an apartment, a car, or a loan?'],
  quiz:[
    {q:'What factor makes up the largest portion of a typical credit score?', options:['Credit mix','Payment history','New credit inquiries','Length of history'], correct:1, explain:'Payment history is usually weighted around 35% — the single largest factor.'},
    {q:'What is a "secured" credit card?', options:['A card with no limit','A card backed by a deposit you provide','A card only for people with excellent credit','A type of debit card'], correct:1, explain:'Secured cards require a deposit (often equal to your limit) and are a common safe starting point for building credit.'},
    {q:'Does a debit card help build credit history?', options:['Yes, if used responsibly for years','No — only credit accounts get reported to build credit history','Only if linked to a savings account','Only for people over 25'], correct:1, explain:'Debit cards spend directly from your own money and are never reported to credit bureaus, regardless of how they\'re used.'},
    {q:'What is a "hard inquiry"?', options:['Checking your own score','A lender-initiated credit check tied to a real application, causing a small temporary dip','A type of credit card','A missed payment'], correct:1, explain:'Hard inquiries happen when you apply for credit and a lender checks your file — unlike soft inquiries (checking your own score), they cause a small, temporary effect.'},
    {q:'Why can a fully-paid-off card still hurt utilization?', options:['It can\'t — paying in full always erases the risk','Many issuers report the balance from your statement closing date, which may be high even if paid off days later','Utilization only matters for loans, not cards','It only matters if you miss a payment'], correct:1, explain:'The reported balance snapshot can occur before your payment posts, meaning a high balance briefly affects your utilization ratio even if you pay in full.'},
  ],
  faq:[
    {q:'Does checking my own credit score hurt it?', a:'No — checking your own score is a "soft inquiry" and has no effect. Only certain lender applications ("hard inquiries") have a small, temporary impact.'},
    {q:'How long does bad credit stay on a report?', a:'Negative items commonly stay for around 7 years, which is exactly why starting carefully matters so much.'},
    {q:'What credit score counts as "good"?', a:'Ranges vary by scoring model, but generally scores in the upper-600s and above are considered good, with the best rates typically reserved for scores in the mid-700s and higher.'},
    {q:'Can I build credit without a credit card at all?', a:'It\'s harder but possible — some rent-reporting services and specific credit-builder loans exist for this purpose, though a secured card remains one of the simplest, most widely available options.'},
    {q:'What happens if I miss a credit card payment?', a:'Pay it as soon as you can — this is exactly why autopay for the full statement balance is worth setting up on day one, since a missed payment can meaningfully hurt a new, thin credit history.'},
    {q:'Does having multiple credit cards hurt my score?', a:'Not inherently — what matters more is your overall utilization and payment history across all of them, not simply the number of cards you hold.'},
  ],
  takeaways:['Payment history and utilization are the two biggest levers you control, together making up roughly two-thirds of your score.','A secured card is a low-risk way to start building credit as a complete beginner.','Never treat available credit as spendable income — it\'s a loan, not income.','Autopay for the full statement balance is the single best habit for beginners.','Checking your own credit report never hurts your score.'],
  download:'credit-building-tracker', journeys:['financial'], nextInJourney:'taxes',
},

{
  slug:'taxes', outcome:'File your first tax return without the panic.', title:'Filing Your First Tax Return Without Panic', pillar:'resilience',
  category:'Money', emoji:'🧾', color:'yellow', difficulty:'Intermediate',
  readTime:'12 min read', completionTime:'50 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'taxes',
  dek:"Taxes feel intimidating mostly because nobody explains the vocabulary. Here's a calm, judgment-free, step-by-step walkthrough of your first return.",
  objectives:['Understand the documents you need before you start (like a W-2 or equivalent)','Learn the difference between a deduction and a credit','Know your filing deadline and what happens if you miss it','Decide whether free filing tools are right for your situation','Walk through the actual order of steps in filing a simple return','Avoid the most common first-time filer mistakes'],
  sections:[
    {h:'Gather your documents first', p:["Before anything else, you need proof of what you earned. If you had a job, your employer sends a wage statement (like a W-2 in the U.S., or a T4 in Canada) usually by the following January or February. If you did freelance or gig work, you'll need your own income records instead — bank deposits, invoices, or a 1099-style form from each client or platform.", 'Set up one folder — physical or digital — the moment you start any job, and drop every pay-related document into it as it arrives. Scrambling to find documents in March is the single biggest source of tax-season stress.']},
    {h:'Deductions vs. credits — the difference that matters', p:["A deduction reduces the income you're taxed on. A credit reduces your tax bill directly, dollar for dollar — which usually makes it more valuable. Many first-time filers miss credits they're actually eligible for simply because they didn't know to look."],
      callout:{type:'example', title:'Quick way to think about it', text:'A $100 deduction might save you $12–22 depending on your tax bracket. A $100 credit saves you the full $100.'}},
    {h:'The filing process, step by step', p:['Once your documents are together, the actual filing follows a predictable order. Knowing the sequence in advance makes the process feel far less like a maze.'],
      timeline:[
        {label:'Step 1', text:'Gather all income documents and any receipts for deductible expenses or education costs.'},
        {label:'Step 2', text:'Choose a filing method — free filing program, tax software, or a preparer — based on how simple your situation is.'},
        {label:'Step 3', text:'Enter your income and answer the guided questions about deductions/credits (student status, dependents, etc.).'},
        {label:'Step 4', text:'Review the summary before submitting — check your name, ID number, and bank details for refunds carefully.'},
        {label:'Step 5', text:'File before the deadline and save a confirmation copy of your submitted return.'},
      ]},
    {h:'Free filing options', p:['Many countries offer free filing programs for simple returns, especially for students and lower-income filers. If your situation is simple — one job, no dependents, no investments — a free tool is usually all you need.'],
      callout:{type:'tip', title:"Don't overpay for simple returns", text:'If your tax situation is straightforward, paid software or a paid preparer is often unnecessary. Look for official free-filing programs first.'}},
    {h:"What happens if you're late", p:["Filing late when you owe money typically comes with a penalty that grows over time — so even if you can't pay in full, filing on time (or requesting an extension) and paying what you can is almost always better than not filing at all.", "If you're owed a refund, there's usually no penalty for filing late — but you also don't get your money until you file, so there's no upside to waiting."],
      callout:{type:'mistake', title:'Common Mistake', text:"Avoiding filing altogether because you're worried you owe money you don't have. Not filing almost always makes the situation worse — filing and arranging a payment plan is the better move."}},
    {h:'Getting help when you\'re stuck', p:['It\'s completely normal to hit a question you can\'t answer alone — a specific tax term, an unfamiliar form box, or a document that looks different from what you expected. Free filing programs typically include built-in help text, and many schools or community organizations offer free tax-prep assistance for students during filing season.'],
      mini:{q:'If your tax situation is simple (one job, no dependents, no investments), what\'s usually the best first option?', options:['A paid tax preparer','An official free-filing program','Skipping filing until you have investments','Estimating your taxes without documents'], correct:1, explain:'Free filing programs are typically designed exactly for simple, first-time-filer situations and cost nothing.'}},
  ],
  practiceExercises:[
    'Based on your actual situation this year (job, gig work, both, or neither), list every document you\'d need to gather — and where you\'d go to get any you don\'t have yet',
    'List three things about your life right now (student status, job type, location, dependents) that might make you eligible for a specific deduction or credit',
    'Look up whether your country offers a free official filing program, and bookmark the link before you need it',
    'Write down your actual filing deadline this year and add it to a calendar you\'ll actually see',
  ],
  checklist:['Gather all income documents (wage statements, gig income records)','Set up a dedicated folder for tax documents as they arrive all year','Note your filing deadline and set a reminder 2 weeks early','Check if you qualify for a free filing program','List any deductions or credits that might apply to you (education, first job, etc.)','File even if you can\'t pay everything owed — filing late is worse than paying late','Review your submitted details carefully before final submission','Save a copy of your filed return somewhere safe'],
  reflection:['What part of taxes has felt most confusing or intimidating to you?','Do you know where to find your income documents when the time comes?','Who could you ask for help if you got stuck partway through?','Have you started a document folder for pay-related paperwork yet — if not, what\'s stopping you?','What\'s your actual filing deadline this year, and is it already somewhere you\'ll see it in time?'],
  quiz:[
    {q:'What\'s the key difference between a tax deduction and a tax credit?', options:['They\'re the same thing','A deduction reduces taxable income; a credit reduces the tax bill directly','A credit only applies to businesses','A deduction is only for homeowners'], correct:1, explain:'Credits reduce your tax bill dollar-for-dollar, generally making them more valuable than deductions.'},
    {q:'What should you do if you owe money but can\'t pay it all by the deadline?', options:['Don\'t file until you have the full amount','File anyway and pay what you can — filing late is worse than paying late','Wait until next year','Ask your employer to pay it'], correct:1, explain:'Filing on time (even with partial payment) avoids the larger late-filing penalty, which is separate from any late-payment penalty.'},
    {q:'What\'s the biggest source of tax-season stress for most first-time filers?', options:['The math itself','Scrambling to find documents at the last minute','Choosing a filing method','Understanding refunds'], correct:1, explain:'Most of the stress comes from disorganized documents, not the filing process itself — a running folder solves this in advance.'},
    {q:'What document does an employer typically send to report your wages?', options:['A wage statement, like a W-2 or T4','A birth certificate','A lease agreement','A grade transcript'], correct:0, explain:'Employers send a wage statement (a W-2 in the U.S., a T4 in Canada, or an equivalent) usually by the following January or February.'},
    {q:'What\'s usually the smartest filing choice for someone with one simple job, no dependents, and no investments?', options:['A paid tax preparer','An official free filing program','Skipping filing entirely','Filing only every other year'], correct:1, explain:'Free filing programs are typically designed exactly for simple, first-time-filer situations and cost nothing.'},
  ],
  faq:[
    {q:'What if I only worked part of the year?', a:'You still generally need to file if you earned above the minimum threshold — your documents will simply reflect a partial year of income.'},
    {q:'Can I file on my phone?', a:'Many free filing tools work fully on mobile for simple returns — no need for a computer if that\'s more accessible to you.'},
    {q:'What if I made a mistake after filing?', a:'Most tax systems allow you to file an amended return to correct errors — it\'s a normal, non-alarming process, not a red flag.'},
    {q:'Do I need to file if I barely made any money?', a:'It depends on the minimum income threshold where you live — check the specific number, since it\'s common for part-time or first-job earners to fall under it.'},
    {q:'What if I did freelance or gig work instead of a traditional job?', a:'You\'ll need to track your own income records — bank deposits, invoices, or platform-issued forms — since there\'s no employer sending a wage statement for you automatically.'},
    {q:'Is there really a difference between a $100 deduction and a $100 credit?', a:'Yes — a $100 deduction might only save you $12–22 depending on your bracket, while a $100 credit saves you the full $100 directly.'},
  ],
  takeaways:['Gather your income documents early — don\'t wait until the deadline week.','Credits are usually more valuable than deductions — check what you qualify for.','Filing on time (even without full payment) is almost always better than not filing.','A simple situation almost always qualifies for a free filing program — you likely don\'t need to pay to file.','Getting stuck on one confusing term doesn\'t mean you need a paid preparer — help resources exist specifically for first-time filers.'],
  download:'tax-checklist', journeys:['financial'], nextInJourney:'emergency-funds',
},

{
  slug:'emergency-funds', outcome:'Build a real emergency fund, starting from zero.', title:'Building an Emergency Fund From Zero', pillar:'resilience',
  category:'Money', emoji:'🛟', color:'blue', difficulty:'Beginner',
  readTime:'11 min read', completionTime:'35 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'emergency-funds',
  dek:"An emergency fund isn't about being rich — it's about not having one bad week turn into a crisis. Here's exactly how to build one from nothing, in stages that actually feel achievable.",
  objectives:['Understand what an emergency fund is actually for (and what it isn\'t)','Set a realistic first goal instead of an overwhelming one','Find small, consistent amounts to redirect toward savings','Know where to actually keep the money','Understand the staged approach from $0 to a full fund','Avoid the mindset traps that stop people from starting'],
  sections:[
    {h:'What an emergency fund protects you from', p:['An emergency fund exists for the truly unplanned: a job loss, a medical bill, a car repair that can\'t wait, an unexpected travel need. It is not for planned expenses like holiday gifts or a vacation — those deserve their own separate savings goals, tracked separately so the emergency fund stays untouched.'],
      callout:{type:'fact', title:'Did You Know?', text:'Studies on financial stress consistently find that having even a few hundred dollars set aside is one of the strongest predictors of lower day-to-day financial anxiety — often more than income level itself.'}},
    {h:'Start smaller than you think', p:['The commonly cited target of 3–6 months of expenses is a long-term goal, not a starting point — and aiming for it immediately can feel so overwhelming that people give up before starting. A first goal of $300–500 covers many common small emergencies and is genuinely achievable within weeks.'],
      callout:{type:'tip', title:'The first-goal reframe', text:'Your first target isn\'t "enough to handle anything." It\'s "enough that one bad week doesn\'t become a crisis." Start there.'}},
    {h:'The staged approach', p:['Building a full emergency fund happens in stages, and knowing the stages in advance makes each one feel like progress rather than a never-ending goal.'],
      table:{headers:['Stage','Target','What it protects against'], rows:[
        ['Starter fund','$300–500','A small car repair, a missed shift, a replacement phone screen'],
        ['1-month fund','1 month of essential expenses','A short gap in income or a moderate unexpected bill'],
        ['3-month fund','3 months of essential expenses','A job loss or extended reduction in income'],
        ['Full fund','3–6 months of expenses','Most personal financial emergencies without needing debt'],
      ]}},
    {h:'Finding money you didn\'t know you had', p:['Look for small, recurring amounts rather than trying to find one large lump sum: a subscription you forgot you had, rounding up purchases, a portion of any cash gifts, a percentage of every paycheck. Small and consistent beats large and occasional.'],
      callout:{type:'mistake', title:'Common Mistake', text:'Waiting for a large windfall — a bonus, a tax refund, a gift — before starting. Funds built entirely on windfalls stay at $0 for a long time; funds built on small automatic transfers start growing immediately.'}},
    {h:'Where to actually keep it', p:['Keep your emergency fund somewhere separate from your everyday spending account, but still reasonably accessible — a basic or high-yield savings account works well. It shouldn\'t be so easy to touch that you dip into it casually, but not locked away for years either — you need to be able to reach it within a day or two in a real emergency.'],
      callout:{type:'protip', title:'Pro Tip', text:'Naming the account something specific — "Emergency Fund: Don\'t Touch" — and keeping it at a different bank than your everyday spending account both add just enough friction to prevent casual withdrawals, without making the money hard to access when you truly need it.'},
      mini:{q:'What\'s the recommended first goal for someone starting an emergency fund from $0?', options:['3–6 months of expenses','$10,000','$300–500','Whatever is left over at the end of the month'], correct:2, explain:'A small, specific first goal ($300–500) is achievable quickly and builds the habit before tackling the larger 3–6 month target.'}},
    {h:'What counts as a real emergency', p:['Defining "emergency" in advance — before you\'re in the moment — prevents the fund from slowly draining on things that aren\'t actually emergencies. A useful test: was it unplanned, and is it necessary? A concert ticket sale is neither. A sudden medical bill is both.']},
  ],
  practiceExercises:[
    'Look through your last month of spending (bank app, receipts, memory) and find one recurring cost of at least $20/month you could redirect — then set up the redirect this week',
    'Write down three things that have felt like "emergencies" to you in the past year, and sort each into "real emergency" or "should have its own separate savings goal"',
    'Open (or identify) a savings account separate from your everyday spending, and give it a specific name like "Emergency Fund: Don\'t Touch"',
    'Set up one small automatic transfer to that account for your very next payday, even if it\'s just $10',
  ],
  checklist:['Set a first goal of $300–500, not 3–6 months of expenses','Open a separate savings account just for this fund, ideally at a different bank','Find one recurring expense to redirect (even $10–20/month)','Set up a small automatic transfer on paydays','Define in advance what counts as a real emergency for you','Only use the fund for genuine emergencies — track when and why you dip into it','Once you hit your starter goal, set the next stage target'],
  reflection:['What has felt like a financial emergency for you in the past — and how did you handle it?','What\'s one small, recurring expense you could redirect toward this fund?','What would having even $300 saved change about how you feel day to day?','Looking at the staged approach — starter, 1-month, 3-month, full — which stage are you at right now?','What\'s something you once treated as an emergency that, looking back, probably deserved its own separate savings goal instead?'],
  quiz:[
    {q:'What\'s a realistic first goal for an emergency fund?', options:['6 months of expenses immediately','$300–500 to start','$10,000','There\'s no useful first goal'], correct:1, explain:'A smaller, achievable first goal builds momentum — 3–6 months of expenses is a longer-term target.'},
    {q:'Why is waiting for a windfall (bonus, refund, gift) a weaker strategy than small automatic transfers?', options:['Windfalls are taxed more','Funds built only on windfalls tend to stay at $0 much longer','Automatic transfers earn more interest','It\'s not actually weaker'], correct:1, explain:'Small, consistent, automatic contributions start growing the fund immediately rather than waiting indefinitely for a large one-time amount.'},
    {q:'Which of these best fits the definition of a genuine emergency-fund expense?', options:['A holiday gift you planned for months','A concert ticket on sale','An unexpected car repair needed to get to work','A vacation you\'ve been saving for'], correct:2, explain:'A genuine emergency is both unplanned and necessary — the other options are either planned or non-essential, and deserve their own separate savings goals.'},
    {q:'In the staged approach, what does a "1-month fund" protect against?', options:['A vacation','A short gap in income or a moderate unexpected bill','A full job loss','Holiday gifts'], correct:1, explain:'The 1-month stage covers a short gap in income or a moderate unexpected bill — the fuller 3-month and full stages are for bigger shocks like a job loss.'},
    {q:'Where should you keep your emergency fund?', options:['Invested in stocks for higher growth','Somewhere separate from everyday spending but still accessible within a day or two, like a savings account','In cash at home only','Locked away somewhere you can\'t touch for years'], correct:1, explain:'The fund needs enough separation to avoid casual spending, but still needs to be reachable within a day or two for a real emergency.'},
  ],
  faq:[
    {q:'Should I pay off debt or build an emergency fund first?', a:'Many experts suggest a small starter fund ($300–500) first, then focusing on high-interest debt, then continuing to build the fund further once that debt is under control.'},
    {q:'Is a high-yield savings account worth it?', a:'It can help your fund grow slightly faster with no added risk — worth comparing, but not essential to get started. Starting is more important than optimizing the interest rate.'},
    {q:'What if I have to use the whole fund at once?', a:'That\'s exactly what it\'s for — use it, then treat rebuilding it as your next savings priority rather than a failure.'},
    {q:'Can I invest my emergency fund instead of keeping it in savings?', a:'Generally not recommended — the fund needs to be stable and quickly accessible, and investments can lose value right when you need the money most.'},
    {q:'What\'s the two-part test for whether something counts as a real emergency?', a:'Ask whether it was unplanned and whether it\'s necessary — a genuine emergency is both. A concert ticket sale is neither; a sudden medical bill is both.'},
    {q:'Does naming my emergency fund account actually make a difference?', a:'It adds just enough friction to discourage casual withdrawals — something like "Emergency Fund: Don\'t Touch" works better than a generic "Savings" label, without making the money hard to access when you truly need it.'},
  ],
  takeaways:['An emergency fund is for the truly unplanned and necessary, not for planned expenses.','Start with a small, achievable goal ($300–500) rather than the "ideal" 3–6 months.','Small, consistent, automatic contributions beat waiting for a big lump sum.','Building the fund happens in stages — starter, 1-month, 3-month, full — each one is real progress.','Defining "real emergency" in advance protects the fund from slowly draining on non-emergencies.'],
  download:'emergency-fund-calculator', journeys:['financial'], nextInJourney:'investing-basics',
},

{
  slug:'investing-basics', outcome:'Start investing with confidence, even with very little money.', title:'Investing Basics for Complete Beginners', pillar:'resilience',
  category:'Money', emoji:'📈', color:'yellow', difficulty:'Advanced',
  readTime:'14 min read', completionTime:'50 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'investing-basics',
  dek:"Investing sounds like something for people with a lot of money. It's actually most powerful for people who start with very little, early.",
  objectives:['Understand why starting early matters more than starting with a lot','Learn the basic difference between saving and investing','Understand what a low-cost index fund is, in plain terms','Recognize investing red flags and scams aimed at beginners','Know the order of financial priorities before investing meaningfully','Understand basic account types available to new investors'],
  sections:[
    {h:'Why starting early beats starting big', p:["Because of compound growth, money invested in your early 20s has dramatically more time to grow than the same amount invested a decade later. Two people who each invest the same monthly amount, but ten years apart, can end up with wildly different totals — the early starter almost always wins, even investing less overall."],
      callout:{type:'example', title:'A simplified illustration', text:'Investing $100/month starting at age 20 versus starting at age 30, both stopping contributions at 40, assuming the same average return — the early starter typically ends up with significantly more by retirement age, purely from the extra decade of growth.'}},
    {h:'Saving vs. investing — not the same thing', p:["Saving is for money you'll need soon and can't risk losing (your emergency fund, a short-term goal). Investing is for money you won't need for years, given the chance to grow — and to occasionally lose value in the short term — in exchange for likely higher long-term growth."],
      table:{headers:['','Saving','Investing'], rows:[
        ['Time horizon','Days to ~2 years','5+ years, ideally decades'],
        ['Risk of loss','Very low','Real, especially short-term'],
        ['Typical growth','Low but steady','Higher on average, over long periods'],
        ['Best for','Emergency fund, near-term goals','Retirement, long-term wealth building'],
      ]}},
    {h:'Get the order of operations right', p:['Investing meaningfully before the basics are covered often backfires — a market dip right when you need cash for an emergency can force you to sell at a loss. A sensible order protects you from that trap.'],
      timeline:[
        {label:'Step 1', text:'Build a small starter emergency fund ($300–500) so short-term shocks don\'t touch your investments.'},
        {label:'Step 2', text:'Pay down any high-interest debt — guaranteed "returns" from avoiding interest usually beat market averages.'},
        {label:'Step 3', text:'Learn what accounts are available to you, especially any with tax advantages for long-term investing.'},
        {label:'Step 4', text:'Start small, consistent contributions to a broadly diversified, low-cost fund.'},
        {label:'Step 5', text:'Leave it alone and increase contributions gradually as your income grows.'},
      ]},
    {h:'What a low-cost index fund actually is', p:['An index fund is a single investment that holds small pieces of many companies at once, tracking a broader market instead of betting on one company. For most beginners, a low-fee, broadly diversified index fund is a far more reasonable starting point than picking individual stocks.'],
      callout:{type:'fact', title:'Did You Know?', text:'Decades of research comparing professional stock-pickers to simple low-cost index funds consistently find that the majority of actively managed funds fail to beat the broader market average over long periods, after fees.'}},
    {h:'Red flags to watch for', p:['Beginners are frequent targets for investment scams promising guaranteed high returns, "can\'t lose" opportunities, or pressure to act immediately. Legitimate investing is patient and boring by design — anything promising fast, guaranteed riches deserves serious skepticism.'],
      callout:{type:'warn', title:'If it sounds too good...', text:'Guaranteed high returns with no risk do not exist in legitimate investing. Treat any promise like that as a serious red flag.'},
      mini:{q:'Someone messages you promising "guaranteed 40% monthly returns, act now." What should you do?', options:['Invest a small test amount to see','Treat it as a serious scam red flag and walk away','Ask them for references first','Invest only if a friend recommended it'], correct:1, explain:'Guaranteed high returns with no risk do not exist in legitimate investing — this is a classic scam pattern regardless of who refers you.'}},
    {h:'Common first-timer mistakes', p:['Two mistakes account for most beginner regret: checking your investments daily and reacting emotionally to normal short-term dips, and trying to pick individual "hot" stocks before understanding diversification. Both come from treating investing like a fast game instead of a slow, patient process.'],
      callout:{type:'mistake', title:'Common Mistake', text:'Panic-selling during a market downturn. Short-term drops are a normal part of investing — selling locks in the loss permanently, while staying invested gives your money time to recover.'}},
  ],
  practiceExercises:[
    'Using the 5-step order of operations above, write down honestly which step you\'re currently on — and the one action that would move you to the next step',
    'Find or recall an investment ad, DM, or social post promising unusually high or guaranteed returns, and list the specific red-flag language it uses',
    'Look up the expense ratio on one low-cost index fund and one actively managed fund, and compare what a 1% difference could cost over 20 years',
    'Write one sentence describing your own investing timeline and risk comfort, in your own words, before you open any account',
  ],
  checklist:['Build a small emergency fund before investing meaningfully','Pay down high-interest debt first','Learn what accounts are available to you (retirement accounts, tax-advantaged options)','Research low-cost, broadly diversified index funds','Decide on a small, consistent monthly amount you could invest','Avoid any investment "opportunity" that pressures quick decisions','Commit to leaving investments alone during normal short-term dips'],
  reflection:['What have you heard about investing that turned out to be a myth once you looked closer?','What\'s a small, sustainable amount you could realistically set aside to invest monthly?','What would it mean for your future self if you started now, even small?','Which step of the 5-step order of operations — emergency fund, debt, accounts, start small, leave it alone — are you currently on?','How would you honestly react if your investment dropped 10% the week after you put money in?'],
  quiz:[
    {q:'Why does starting to invest early matter so much?', options:['Early investors pay lower taxes','Compound growth means more time to grow, even with smaller amounts','It\'s required by law after age 25','Early investments are risk-free'], correct:1, explain:'Time in the market allows compound growth to work — the extra years matter more than the amount invested.'},
    {q:'What should generally come before investing meaningfully?', options:['Buying individual stocks','A starter emergency fund and paying down high-interest debt','Opening five different brokerage accounts','Waiting until you have $10,000'], correct:1, explain:'A financial safety net and avoiding high-interest debt protect you from being forced to sell investments at a bad time.'},
    {q:'What\'s the safest response to a "guaranteed 40% monthly return" pitch?', options:['Invest a small amount to test it','Walk away — guaranteed high returns are a classic scam sign','Ask for a longer trial period','Invite friends to invest too'], correct:1, explain:'No legitimate investment guarantees high returns with no risk — this is one of the clearest scam indicators.'},
    {q:'What is a low-cost index fund?', options:['A loan from a bank','A single investment that holds small pieces of many companies, tracking the broader market','A guaranteed high-return account','A type of savings account'], correct:1, explain:'An index fund tracks a broader market instead of betting on one company, making it a reasonable starting point for most beginners.'},
    {q:'What\'s one of the two most common beginner investing mistakes described in this lesson?', options:['Investing too little money','Checking investments daily and reacting emotionally to normal short-term dips','Opening a retirement account','Diversifying too much'], correct:1, explain:'Checking constantly and reacting to normal short-term dips — along with chasing individual "hot" stocks — account for most beginner regret.'},
  ],
  faq:[
    {q:'Do I need a lot of money to start investing?', a:'No — many platforms allow you to start with small, regular contributions. Consistency matters far more than the initial amount.'},
    {q:'Is investing risky?', a:'All investing carries some risk, especially short-term. Broadly diversified, long-term investing is generally considered lower-risk than picking individual stocks or timing the market.'},
    {q:'What if the market drops right after I invest?', a:'Short-term drops are normal and expected. The strategy is designed for long time horizons — reacting by selling is usually what turns a temporary dip into a permanent loss.'},
    {q:'Should I try to time the market?', a:'Most evidence suggests consistent investing over time ("time in the market") outperforms trying to predict highs and lows ("timing the market"), even for experienced investors.'},
    {q:'What\'s the difference between saving and investing?', a:'Saving is for money you\'ll need soon and can\'t risk losing, like an emergency fund. Investing is for money you won\'t need for years, given the chance to grow — and occasionally dip — in exchange for likely higher long-term growth.'},
    {q:'Why do actively managed funds often underperform low-cost index funds?', a:'Decades of research show most actively managed funds fail to beat the broader market average over long periods once fees are factored in, which is why a low-cost, diversified index fund is a reasonable starting point for most beginners.'},
  ],
  takeaways:['Time matters more than amount — starting small and early beats starting big and late.','Saving and investing serve different purposes; use both.','Get the order right: emergency fund and high-interest debt before meaningful investing.','Low-cost, diversified index funds are a reasonable starting point for most beginners.','Guaranteed high returns are always a red flag — legitimate investing is patient and boring by design.'],
  download:'goal-setting-workbook', journeys:['financial'], nextInJourney:'financial-planning',
},

{
  slug:'financial-planning', outcome:'Build a realistic financial plan for your 20s.', title:'Long-Term Financial Planning in Your 20s', pillar:'resilience',
  category:'Money', emoji:'🧭', color:'blue', difficulty:'Advanced',
  readTime:'13 min read', completionTime:'50 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'financial-planning',
  dek:"You don't need a 30-year plan. You need a rough direction and a few smart defaults that keep working while you live your life.",
  objectives:['Set financial goals across three timeframes: 1 year, 5 years, and "someday"','Understand how debt paydown, saving, and investing fit together','Build one simple annual "financial check-in" habit','Avoid lifestyle inflation as your income grows','Know what to actually review during a check-in','Decide in advance how to handle raises and windfalls'],
  sections:[
    {h:'Three timeframes, not one master plan', p:['Rather than trying to plan your entire financial future at once, break it into three simpler layers: what you want in the next year (an emergency fund, a trip, a certification), the next five years (a car, further education, moving out), and "someday" (a home, financial independence, retirement). Each layer informs different decisions today.'],
      callout:{type:'example', title:'What this looks like in practice', text:'1-year goal: finish building a $1,000 emergency fund. 5-year goal: pay off a student loan and save toward a car. Someday goal: reach a level of savings where work feels like a choice, not a necessity.'}},
    {h:'How debt, saving, and investing work together', p:['A common, reasonable order: build a small emergency fund, pay down high-interest debt aggressively, then split additional money between further savings goals and long-term investing. The exact split is personal, but the order — safety net first, expensive debt next — holds for most situations.'],
      table:{headers:['Priority','Focus','Why it comes at this point'], rows:[
        ['1','Starter emergency fund','Prevents debt from being your only fallback in a crisis'],
        ['2','High-interest debt','Guaranteed "return" from avoiding interest usually beats market averages'],
        ['3','Fuller emergency fund','Extends your safety net to 3–6 months of expenses'],
        ['4','Investing & other goals','Long-term growth once the foundation is stable'],
      ]}},
    {h:'A simple annual check-in', p:['Once a year, spend 30 minutes reviewing: did your income change? Did your goals change? Is your emergency fund still sized appropriately? Small course corrections yearly beat either ignoring your finances entirely or obsessing over them daily.'],
      callout:{type:'tip', title:'Pick a date and stick to it', text:"Tie your financial check-in to something memorable — your birthday, New Year's, the start of a new job — so it actually happens every year."},
      mini:{q:'What\'s the main benefit of a once-a-year financial check-in over checking constantly or never?', options:['It guarantees higher investment returns','It catches needed course-corrections without the stress of daily monitoring','It\'s legally required','It replaces the need for an emergency fund'], correct:1, explain:'A yearly rhythm balances staying on track with avoiding the stress and overreaction that comes from checking too frequently.'}},
    {h:'Watch for lifestyle inflation', p:['As income grows, spending naturally tends to grow with it — a bigger apartment, more takeout, upgraded everything. This isn\'t inherently bad, but it\'s worth being intentional: when your income increases, consider directing at least a portion of the raise toward savings or investing before your spending catches up to match it.'],
      callout:{type:'mistake', title:'Common Mistake', text:'Deciding what to do with a raise only after it hits your account, when it\'s already mentally "spent." Deciding in advance — even a simple rule like "half of any raise goes to savings" — makes the decision automatic instead of a fresh temptation each time.'}},
    {h:'Building in flexibility', p:['Plans made in your early 20s will change — a new job, a move, a relationship, a shift in priorities. That\'s expected, not a failure of planning. The goal of long-term financial planning isn\'t to predict the future perfectly; it\'s to have defaults solid enough that changes don\'t knock you off course entirely.'],
      callout:{type:'protip', title:'Pro Tip', text:'Whenever a major life change happens — new job, move, relationship change — treat it as a trigger for an extra check-in, not just your scheduled annual one.'}},
  ],
  practiceExercises:[
    'Write one specific, real goal for each timeframe — 1 year, 5 years, and "someday" — concrete enough that you\'d know clearly when you\'d achieved it',
    'Write a simple, one-sentence rule for what you\'ll do the next time you get a raise, bonus, or windfall, before the money actually arrives',
    'Pick a recurring date for your own annual financial check-in and add it to a calendar right now',
    'List the three accounts or numbers you\'d actually look at during that annual check-in',
  ],
  checklist:['Write one goal each for 1 year, 5 years, and "someday"','Review your current debt, savings, and investing balance in one place','Schedule a recurring yearly financial check-in date','Decide in advance what you\'ll do with your next raise or bonus','Revisit your goals whenever a major life change happens','Write a one-sentence rule for how you\'ll handle lifestyle inflation as your income grows','Pick the three accounts or numbers you\'d actually check during your annual review','Note one recent life change that might be worth an extra, unscheduled check-in'],
  reflection:['What does financial security actually look like to you, specifically?','Is there a goal you\'ve been putting off because it felt too far away to plan for?','How do you want to handle your next raise before it happens, so the decision is already made?','If you got a raise next month, what\'s the first thing you\'d honestly be tempted to spend it on?','What would your annual financial check-in actually look like — where, when, and what would you review?'],
  quiz:[
    {q:'What\'s a commonly reasonable order for handling debt, saving, and investing?', options:['Invest everything first','Small emergency fund, then high-interest debt, then broader savings/investing','Ignore debt until it\'s paid by itself','Save nothing until debt-free'], correct:1, explain:'This order builds a safety net first, then tackles the most expensive debt, before optimizing further.'},
    {q:'Why is deciding what to do with a raise "in advance" more effective than deciding after it arrives?', options:['It\'s required by employers','Money already mentally "spent" is harder to redirect once it arrives','It avoids taxes','It only works for large raises'], correct:1, explain:'Pre-committing to a rule removes the in-the-moment temptation to spend the entire increase.'},
    {q:'What\'s the purpose of breaking financial planning into 1-year, 5-year, and "someday" layers?', options:['It\'s required for retirement accounts','It makes an otherwise overwhelming timeline into manageable, actionable pieces','It only applies to homeowners','It replaces the need for an emergency fund'], correct:1, explain:'Layering timeframes turns a vague, distant goal into specific, actionable near-term steps.'},
    {q:'What\'s a good trigger for an extra, unscheduled financial check-in beyond your annual one?', options:['Only after 5 years pass','A major life change like a new job, move, or relationship shift','Never — stick strictly to the annual date','Only when you get a raise'], correct:1, explain:'Major life changes are a trigger for an extra check-in, not just your scheduled annual one.'},
    {q:'What is lifestyle inflation?', options:['A government tax policy','Spending naturally growing to match rising income','A type of investment fee','An emergency fund shortfall'], correct:1, explain:'As income grows, spending naturally tends to grow with it — being intentional about it prevents it from quietly eating an entire raise.'},
  ],
  faq:[
    {q:'Do I need a financial advisor in my 20s?', a:'Not necessarily — many people manage the basics well on their own with good defaults. An advisor can be worth it later as finances get more complex.'},
    {q:'What if my goals keep changing?', a:'That\'s normal — the yearly check-in exists precisely so your plan can evolve with you instead of staying rigid.'},
    {q:'What should I actually review during my annual check-in?', a:'Income changes, whether your emergency fund is still appropriately sized, progress on your 1-year and 5-year goals, and whether any major life changes should shift your priorities.'},
    {q:'Is it too late to start planning if I\'m already in my late 20s?', a:'No — the same principles apply at any age. The best time to start was earlier; the second-best time is now.'},
    {q:'What\'s an example of a concrete 1-year vs. 5-year vs. "someday" goal?', a:'A 1-year goal might be finishing a $1,000 emergency fund, a 5-year goal might be paying off a loan and saving for a car, and a "someday" goal might be reaching a level of savings where work feels like a choice, not a necessity.'},
    {q:'Is lifestyle inflation always bad?', a:'Not inherently — it\'s normal for spending to grow somewhat with income. The point is being intentional, like directing part of any raise to savings before your spending catches up to match it.'},
  ],
  takeaways:['Break long-term planning into 1-year, 5-year, and "someday" layers instead of one overwhelming plan.','A simple order — emergency fund, high-interest debt, then saving/investing — works for most people.','A once-a-year check-in beats both ignoring finances and obsessing over them.','Decide how you\'ll handle raises and windfalls before they arrive, not after.','Plans will change — the goal is solid defaults, not a perfect prediction of the future.'],
  download:'career-planner', journeys:['financial'], nextInJourney:null,
},

/* ---------------------------- UNIVERSITY JOURNEY ---------------------------- */

{
  slug:'scholarships', outcome:'Find and apply to scholarships you actually qualify for.', title:'Finding Scholarships You Actually Qualify For', pillar:'learning', flagship:true,
  heroIllustration:'scholarships',
  category:'School', emoji:'🎓', color:'blue', difficulty:'Beginner',
  readTime:'16 min read', completionTime:'60 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Most students search for scholarships the same way — and miss the smaller, less competitive ones that are actually realistic to win. Here\'s a system, not just a search bar.',
  objectives:['Understand the difference between "big name" and niche scholarships, and why it matters for your odds','Build a structured weekly search system instead of scrolling endlessly','Write one strong scholarship essay you can adapt for multiple applications','Track deadlines so nothing falls through the cracks','Know what actually makes an application memorable to a review committee'],
  sections:[
    {h:'Why scholarship searching feels so discouraging', p:[
      'If you\'ve searched "scholarships for high school seniors" and found the same five famous, wildly competitive names every time, you\'re not doing anything wrong — you\'re just seeing the tip of an iceberg that most students never look past. Those famous scholarships get enormous applicant pools precisely because they\'re the easiest to find, which paradoxically makes them some of the hardest to win.',
    ]},
    {h:'Stop competing for the same ten scholarships as everyone else', p:[
      'Most students search the same handful of well-known scholarship names, creating enormous, often thousands-deep competition for a small number of awards. Smaller, local, or niche scholarships — tied to a hobby, a cultural heritage, a specific field of study, a parent\'s employer, or a local community organization — often have far fewer applicants and genuinely better odds, even though the award amounts may be smaller.',
    ], callout:{type:'fact', title:'Did You Know?', text:'Many local and niche scholarships go unclaimed or receive only a handful of applicants each year, simply because they don\'t show up prominently in general search engines the way famous national awards do.'}},
    {h:'Building a structured search system', p:[
      'Rather than scrolling through endless "top scholarships" listicles, set up a structured search across four specific channels: your school\'s financial aid or guidance office, local community foundations, any employer of a parent or guardian (many companies offer scholarships specifically for employees\' dependents), and dedicated niche scholarship search platforms filtered by your specific background, interests, or field of study. Spend 30 focused minutes weekly rather than one overwhelming, unfocused session.',
    ], table:{headers:['Channel','Why it works'], rows:[
      ['School financial aid / guidance office','Often knows about small local awards invisible to general search'],
      ['Local community foundations','Regional scholarships with far smaller applicant pools'],
      ['Parent/guardian\'s employer','Many companies offer dependent scholarships few students think to ask about'],
      ['Niche search platforms','Filter by heritage, hobby, major, or identity for less-competitive matches'],
    ]}, callout:{type:'tip', title:'Ask your school directly', text:'Financial aid and guidance offices often know about smaller, local scholarships that never show up in general online searches — a five-minute conversation can surface opportunities you\'d never find alone.'}},
    {mini:true, q:'Why might a $500 local scholarship actually be a better use of your time than a famous $10,000 national one?', options:['It never is — always apply to the biggest awards first','It may have a far smaller, less competitive applicant pool, making your odds meaningfully better'], correct:1, explain:'Smaller, less visible scholarships often have dramatically fewer applicants, meaningfully improving your realistic odds even if the award itself is smaller.'},
    {h:'One essay, adapted for many applications', p:[
      'Write one strong, honest core essay about a real challenge, goal, or value from your own life — then adapt the opening and closing paragraphs to match each specific scholarship\'s prompt and mission, rather than starting from scratch every time. This lets you apply to significantly more scholarships without a proportional increase in effort.',
    ], callout:{type:'example', title:'What makes an essay memorable', text:'Specific, honest detail beats impressive-sounding generalities every time. "I organized my siblings\' school pickup schedule after my mom\'s night shifts changed" reads as far more real and memorable to a review committee than "I have strong leadership skills and time management."'}},
    {h:'What review committees are actually looking for', p:[
      'Scholarship committees read dozens or hundreds of essays, and most blur together because they lean on the same vague, impressive-sounding language. What stands out is specificity: a precise moment, a real detail, an honest struggle or realization — not a polished list of accomplishments that reads like a resume in paragraph form.',
    ], callout:{type:'protip', title:'Pro Tip', text:'After writing your essay, circle every sentence that could apply to literally any other applicant. If more than half your essay is circled, it needs more specific, personal detail.'}},
    {h:'The mistake that costs students the most scholarships', p:[
      'Missing a scholarship deadline by even a single day usually means automatic disqualification, with essentially no exceptions — no matter how strong the application would have been. This is the single most avoidable way students lose out on scholarship money they were genuinely qualified for.',
    ], callout:{type:'mistake', title:'Common Mistake: Tracking deadlines from memory', text:'Relying on memory or scattered browser bookmarks to track scholarship deadlines is one of the most common — and entirely preventable — reasons students miss out. A simple, centralized tracker with every deadline in one place removes this risk almost completely.'}},
    {h:'A realistic weekly rhythm', p:['Scholarship searching works best as a small, repeated habit rather than one overwhelming weekend push.']
      , timeline:[
        {label:'Week 1', text:'Ask your school\'s financial aid office directly, and set up your tracker.'},
        {label:'Week 2', text:'Search niche platforms filtered to your background and interests; write your core essay draft.'},
        {label:'Week 3', text:'Apply to 2–3 smaller/niche scholarships using your adapted essay.'},
        {label:'Ongoing', text:'Spend 30 minutes weekly searching, tracking, and applying — consistency beats intensity.'},
      ]},
  ],
  practiceExercises:['List 3 search channels beyond general search engines that apply specifically to your background','Draft your core essay using one real, specific moment from your own life','Build your scholarship tracker and add every deadline you\'re aware of right now','Circle any sentence in your draft essay that could apply to literally anyone — then rewrite it with a specific detail'],
  checklist:['List 3 places to search beyond general search engines (school office, local orgs, employer programs)','Write your core essay draft','Create a tracker with deadlines for every scholarship you\'re considering','Ask 1–2 people to review your essay before submitting','Apply to at least 3 smaller/niche scholarships alongside any large ones','Submit at least a week before each deadline when possible','Set a weekly 30-minute recurring reminder to keep searching'],
  reflection:['What\'s a real challenge or accomplishment in your life that most people don\'t know about?','What niche or local scholarship categories might apply specifically to you?','What\'s stopped you from applying to scholarships in the past — time, confidence, or something else?','Which sentence in your current essay draft feels the most generic, and what specific detail could replace it?','If a scholarship committee only read one paragraph of your application, which one would you want it to be?'],
  quiz:[
    {q:'Why do niche or local scholarships often have better odds than well-known national ones?', options:['They pay less so nobody wants them','Fewer people apply, since they\'re less visible','They require a paid application','They don\'t actually exist'], correct:1, explain:'Lower visibility usually means a smaller applicant pool and genuinely better odds, even if the awards are smaller.'},
    {q:'What makes a scholarship essay memorable to a review committee?', options:['Impressive-sounding general claims','Specific, honest personal detail','The longest possible word count','Formal, distant language'], correct:1, explain:'Specific, honest detail stands out against a pile of essays leaning on the same vague, impressive-sounding claims.'},
    {q:'What happens if you miss a scholarship deadline by one day?', options:['Most committees grant a short grace period','Usually automatic disqualification, with no exceptions','It only matters for large scholarships','Nothing — deadlines are flexible'], correct:1, explain:'Deadlines are one of the strictest parts of the process — missing by even a day usually means disqualification.'},
    {q:'Which four channels does the lesson recommend searching beyond general search engines?', options:['Only social media ads and word of mouth','School financial aid office, local community foundations, a parent/guardian\'s employer, and niche search platforms','Only the five most famous national scholarships','Just one general scholarship search website'], correct:1, explain:'These four channels tend to surface smaller, less competitive scholarships that general search engines rarely show.'},
    {q:'About how much time does the lesson recommend spending on scholarship searching each week?', options:['One overwhelming weekend session, then nothing','About 30 focused minutes weekly','Several hours every single day','Only when you happen to think of it'], correct:1, explain:'A small, repeated weekly habit beats one overwhelming push — consistency compounds over the search process.'},
    {q:'What\'s a quick way to check if your scholarship essay is too generic?', options:['Count the total number of words','Circle every sentence that could apply to literally any other applicant','Compare your essay to a friend\'s word for word','Read the essay backwards'], correct:1, explain:'If more than half the essay could apply to anyone, it needs more specific, personal detail.'},
  ],
  faq:[
    {q:'Is it worth applying to small scholarships (like $500)?', a:'Absolutely — several smaller awards add up, and they\'re often far less competitive than one large scholarship.'},
    {q:'What if I don\'t have a dramatic story for my essay?', a:'You don\'t need a dramatic story — specific, honest, small moments are often more memorable than an exaggerated one.'},
    {q:'How many scholarships should I realistically apply to?', a:'There\'s no fixed number, but combining a mix of a few larger, competitive awards with several smaller, niche ones tends to produce the best realistic outcome.'},
    {q:'Can I reuse the same essay for every scholarship?', a:'You can reuse your core story, but always adapt the opening and closing to reflect the specific scholarship\'s prompt and mission — reviewers can tell when an essay wasn\'t tailored at all.'},
    {q:'Should I only apply to scholarships I\'m confident I\'ll win?', a:'No — apply broadly across a mix of odds. Even scholarships that feel like a long shot sometimes have surprisingly few applicants.'},
    {q:'Is it okay to reuse parts of my essay across multiple applications?', a:'Yes — reusing and adapting your own core essay is completely normal and expected, as long as you tailor the opening and closing to each specific prompt.'},
  ],
  takeaways:['Niche and local scholarships are often less competitive than famous, high-profile ones.','A structured search system beats endless, unfocused scrolling.','One strong core essay can be adapted for many applications — you don\'t need a dramatic story.','Specific, honest detail is what makes an essay memorable to reviewers.','A simple deadline tracker prevents the most common, avoidable loss.'],
  download:'scholarship-tracker', journeys:['university'], nextInJourney:'time-management',
},

{
  slug:'time-management', outcome:'Build a schedule that fits school and a real life.', title:'Time Management for Students Who Have a Life', pillar:'resilience',
  category:'School', emoji:'⏰', color:'yellow', difficulty:'Beginner',
  readTime:'12 min read', completionTime:'40 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'time-management',
  dek:"Time management advice usually assumes you have no job, no friends, and no life outside school. Here's a version that assumes you're a real person.",
  objectives:['Build a weekly schedule that includes rest, not just tasks','Learn the difference between urgent and important work','Use time-blocking without becoming rigid or overwhelmed','Recognize and interrupt procrastination patterns early','Understand the four-quadrant way of sorting priorities','Build one weekly review habit that actually sticks'],
  sections:[
    {h:'A schedule that includes being a person', p:["Most time management systems only account for tasks — classes, assignments, work — and treat rest, friendships, and downtime as what's left over. A more sustainable system blocks time for rest and relationships intentionally, the same way it blocks time for studying."],
      callout:{type:'fact', title:'Did You Know?', text:'Research on productivity consistently shows that scheduled downtime improves — rather than reduces — overall output, because sustained focus depends on genuine recovery, not just willpower.'}},
    {h:'Urgent vs. important — they\'re not the same', p:["Urgent tasks demand attention right now (a message, a due-tomorrow assignment). Important tasks matter for your longer-term goals but rarely feel urgent (studying steadily instead of cramming, maintaining friendships, sleep). Left unchecked, urgent tasks always crowd out important ones — you have to protect time for what matters, not just what's loud."],
      table:{headers:['','Urgent','Not Urgent'], rows:[
        ['Important','Do now (crisis, deadline tomorrow)','Schedule deliberately (studying steadily, sleep, friendships)'],
        ['Not important','Minimize or delegate (some messages, minor requests)','Cut or limit (mindless scrolling, low-value busywork)'],
      ]},
      callout:{type:'tip', title:'Protect one important thing daily', text:'Each day, pick one "important but not urgent" task and do it before checking messages or notifications — before the urgent stuff has a chance to take over.'}},
    {h:'Time-blocking without the rigidity', p:['Time-blocking means assigning specific windows to specific tasks rather than working from an open-ended to-do list. Keep it flexible: block "study 4–6pm" rather than "study exactly this chapter for exactly 47 minutes" — flexibility keeps the system usable when life doesn\'t go as planned.'],
      mini:{q:'What makes a time-blocking system sustainable rather than something you abandon after a week?', options:['Scheduling every minute precisely','Using rough, flexible windows instead of rigid minute-by-minute plans','Never changing the schedule once set','Blocking only study time, not rest'], correct:1, explain:'Flexible windows absorb the unpredictability of real life, while overly rigid schedules break the first time something runs long.'}},
    {h:'Catching procrastination early', p:["Procrastination is rarely about laziness — it's usually about a task feeling too big, too vague, or too uncomfortable to start. Breaking a task into a much smaller, five-minute first step (\"open the document and write one sentence\") is often enough to get moving."],
      callout:{type:'mistake', title:'Common Mistake', text:'Waiting to "feel ready" or "feel motivated" before starting. Motivation more often follows starting than precedes it — the five-minute first step works because it removes the need to feel ready at all.'}},
    {h:'A weekly review that actually sticks', p:['At the end of each week, spend 10 minutes reviewing: what got done, what didn\'t, and why. This isn\'t about self-criticism — it\'s about noticing patterns (a certain day always gets overloaded, a certain task always gets pushed) so next week\'s schedule can adjust accordingly.'],
      callout:{type:'protip', title:'Pro Tip', text:'Keep the weekly review to the same three questions every time: what worked, what didn\'t, what will I change next week. Consistency in the format makes the habit easier to sustain than reinventing the review each week.'}},
  ],
  practiceExercises:[
    'Block your upcoming week using rough time windows — not exact minutes — for classes, work, study, rest, and social time, then note at the end which blocks held up',
    'Pick the task you\'ve been avoiding most and write down the smallest possible first step, something completable in five minutes or less — then do it today',
    'Try the weekly review questions (what worked, what didn\'t, what will I change) after your very next week, even if it feels early to start',
    'Identify one commitment on your calendar this week that doesn\'t actually need to be there, and decide what to do about it',
  ],
  checklist:['Block rest and social time into your weekly schedule, not just tasks','Identify one important-but-not-urgent task to protect daily','Try time-blocking for one week using rough windows, not rigid minutes','Break your biggest current task into a 5-minute first step','Set a recurring 10-minute weekly review','Review what worked and didn\'t at the end of the week'],
  reflection:['What\'s one "important but not urgent" thing you\'ve been putting off?','When do you procrastinate most — what does the task usually have in common?','What would a genuinely sustainable weekly schedule look like for you, rest included?','Which day of your week tends to get overloaded the most, and why do you think that is?','What\'s one urgent-but-not-important task you could minimize or say no to this week?'],
  quiz:[
    {q:'What tends to happen if you only plan around urgent tasks?', options:['You automatically become more productive','Important, non-urgent priorities get crowded out','Nothing changes','You have more free time'], correct:1, explain:'Urgent tasks are loud and demand attention, so important-but-quiet priorities need to be deliberately protected.'},
    {q:'Why does a "five-minute first step" help with procrastination?', options:['It completes the whole task','It removes the need to feel ready or motivated before starting','It\'s required by most schools','It works only for easy tasks'], correct:1, explain:'Motivation more often follows starting than precedes it — a tiny first step gets you moving without needing to feel ready.'},
    {q:'What\'s the main purpose of a weekly review?', options:['To criticize yourself for missed tasks','To notice patterns and adjust next week\'s schedule accordingly','To plan the entire semester','To replace daily planning entirely'], correct:1, explain:'The review is about noticing what worked and what didn\'t, so the next week\'s plan improves — not about judgment.'},
    {q:'According to the urgent/important framework, how should you treat something important but not urgent, like studying steadily or sleep?', options:['Ignore it until it becomes urgent','Schedule it deliberately, since it won\'t demand attention on its own','Delegate it to someone else','Only do it if time allows'], correct:1, explain:'Important-but-not-urgent priorities need to be scheduled deliberately, or urgent tasks will always crowd them out.'},
    {q:'Why does this lesson recommend blocking rough windows like "study 4–6pm" instead of rigid minute-by-minute plans?', options:['Rough windows are required by most planners','Flexibility keeps the system usable when life doesn\'t go exactly as planned','It takes less time to write','Rigid schedules are illegal'], correct:1, explain:'Flexible windows absorb the unpredictability of real life, while overly rigid schedules break the first time something runs long.'},
  ],
  faq:[
    {q:'Is time-blocking too rigid for a busy, unpredictable schedule?', a:'It doesn\'t have to be — using rough windows instead of precise minutes keeps the structure useful without requiring perfect compliance.'},
    {q:'What if I just can\'t make myself start a task?', a:'Shrink it further. A task that feels impossible at "write the essay" often feels doable at "write one sentence."'},
    {q:'How much rest should actually be scheduled into a week?', a:'There\'s no universal number — the key is that rest is planned deliberately rather than only happening as leftover time, if any is left at all.'},
    {q:'What if my week never goes according to plan?', a:'That\'s normal and expected — the weekly review exists precisely to notice this and adjust, rather than treating every deviation as a failure.'},
    {q:'What\'s the difference between urgent and important tasks?', a:'Urgent tasks demand attention right now, like a due-tomorrow assignment. Important tasks matter for your longer-term goals but rarely feel urgent, like studying steadily or maintaining friendships — left unchecked, urgent tasks crowd out important ones.'},
    {q:'What are the three questions to ask during a weekly review?', a:'What worked, what didn\'t, and what will I change next week — keeping the same three questions each time makes the habit easier to sustain than reinventing the review from scratch.'},
  ],
  takeaways:['A sustainable schedule blocks time for rest and relationships, not just tasks.','Urgent and important are different — protect time for what matters, not just what\'s loud.','Flexible time-blocking beats a rigid, easily-broken system.','Shrinking a task\'s first step is the fastest way past procrastination.','A short weekly review turns each week into useful feedback for the next one.'],
  download:'student-planner', journeys:['university'], nextInJourney:'study-skills',
},

{
  slug:'study-skills', outcome:'Study smarter and retain more — in less time.', title:'Study Smarter, Not Longer', pillar:'learning',
  category:'School', emoji:'🧠', color:'blue', difficulty:'Beginner',
  readTime:'13 min read', completionTime:'45 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'study-skills',
  dek:"Rereading your notes feels productive and barely works. Here's what the research on learning actually recommends instead.",
  objectives:['Understand why rereading and highlighting feel effective but aren\'t','Learn active recall and spaced repetition, in practical terms','Build a simple weekly study rhythm instead of last-minute cramming','Know when to stop studying and rest instead','Understand how the 25-minute focus rhythm works and why','Recognize which study techniques are backed by research versus habit alone'],
  sections:[
    {h:'Why rereading feels productive but isn\'t', p:["Rereading and highlighting create a sense of familiarity — the material looks recognizable — which gets mistaken for actually knowing it. But recognizing a concept when you see it again is a much weaker skill than being able to produce it from memory, which is exactly what a test requires."],
      callout:{type:'fact', title:'Did You Know?', text:'Large-scale reviews of learning research consistently rank rereading and highlighting among the least effective study techniques, despite being the most commonly used ones — mostly because they feel productive without requiring real retrieval effort.'}},
    {h:'Active recall, in practical terms', p:["Active recall means testing yourself instead of re-reading — closing the book and trying to explain a concept, or answering practice questions without looking. It feels harder and slower in the moment, which is exactly why it works better: the effort of retrieving information strengthens memory far more than passively viewing it again."],
      callout:{type:'example', title:'Try this tonight', text:'After reading a section, close the material and write down everything you remember from it — in your own words, without peeking. Then check what you missed.'}},
    {h:'Spaced repetition beats cramming', p:['Reviewing material once, then again after a couple of days, then again after a week, builds far more durable memory than reviewing it five times in one sitting the night before a test. Spreading review out over time is one of the most well-supported findings in learning research.'],
      table:{headers:['Technique','Effectiveness','Effort required'], rows:[
        ['Rereading / highlighting','Low','Low'],
        ['Active recall (self-testing)','High','Moderate–high'],
        ['Spaced repetition','High','Moderate'],
        ['Cramming the night before','Low, short-term only','High, all at once'],
      ]},
      mini:{q:'Why does cramming the night before a test tend to produce weak long-term memory?', options:['It\'s technically impossible to learn quickly','It skips the spacing that builds durable memory, even if it helps short-term recognition','It only works for certain subjects','It requires too little effort'], correct:1, explain:'Cramming can create short-term familiarity, but without spacing the memory fades quickly — durable learning requires review spread out over time.'}},
    {h:'Knowing when to stop', p:['Studying past the point of real focus mostly builds anxiety, not knowledge. A short, well-timed break — or simply stopping for the night — often helps more than pushing through exhaustion.'],
      callout:{type:'tip', title:'The 25-minute rule', text:'Try 25 minutes of focused studying followed by a genuine 5-minute break. After 3–4 rounds, take a longer break — this rhythm helps sustain real focus rather than fading attention.'}},
    {h:'Techniques worth skipping', p:['Not every popular study trick holds up. Re-reading a textbook cover to cover, highlighting entire paragraphs, and passively re-watching lecture recordings all feel productive but rarely translate into stronger recall compared to actively testing yourself on the same material.'],
      callout:{type:'mistake', title:'Common Mistake', text:'Judging how well you know something by how familiar it feels while reviewing. Familiarity is a weak signal — the real test is whether you can produce the answer with the material closed.'}},
    {h:'Building a sustainable weekly rhythm', p:['Rather than deciding what to study each day from scratch, set a simple weekly rhythm: which subjects get active recall sessions on which days, and when spaced reviews of older material are due. A repeatable rhythm removes the daily decision fatigue of figuring out what to study.'],
      callout:{type:'protip', title:'Pro Tip', text:'Keep a simple running list of topics you\'ve studied along with the date. A five-minute glance at the list each morning tells you exactly what\'s due for review that day.'}},
  ],
  practiceExercises:[
    'Pick two similar topics you need to study — study one with rereading/highlighting and the other with active recall, then quiz yourself on both the next day and compare',
    'For one subject, write down today\'s date and schedule three follow-up review dates — 1 day, 3 days, and 1 week later — with reminders for each',
    'Keep a running list of everything you study this week along with the date, and glance at it once tomorrow morning',
    'Explain one concept you just learned out loud, in your own words, as if teaching someone who\'s never heard of it',
  ],
  checklist:['Replace one rereading session this week with an active recall session','Schedule review of new material at 1 day, 3 days, and 1 week after learning it','Try the 25-minute focus / 5-minute break rhythm for one study session','Write a weekly study schedule instead of planning day-by-day','Keep a running list of studied topics with dates for easy review tracking','Notice and respect when you\'ve genuinely hit your limit for the day'],
  reflection:['What study habit have you relied on that you suspect isn\'t actually working well?','What subject would benefit most from active recall instead of rereading?','What does a sustainable, non-cramming study week look like for you?','What would it look like to replace just one rereading session this week with active recall?','When during the day do you tend to have the most real focus — and does your study schedule actually reflect that?'],
  quiz:[
    {q:'Why does active recall work better than rereading?', options:['It takes less time','The effort of retrieving information strengthens memory more than passive review','It\'s required by most schools','It only works for math'], correct:1, explain:'The mental effort of recall strengthens memory pathways far more than simply recognizing familiar material again.'},
    {q:'What does spaced repetition mean?', options:['Studying only once','Reviewing material at increasing intervals over time','Studying for 10 hours straight','Only reviewing right before a test'], correct:1, explain:'Spacing review out over days and weeks builds much more durable memory than cramming it all at once.'},
    {q:'Why is "it feels familiar" a weak signal of how well you know something?', options:['Familiarity is always wrong','Recognizing material is a much weaker skill than producing it from memory, which is what tests require','Familiarity only applies to math','It\'s actually a strong signal'], correct:1, explain:'Tests require retrieval, not recognition — feeling familiar with material doesn\'t mean you could produce it without looking.'},
    {q:'What is the "25-minute rule" described in this lesson?', options:['Study for 25 minutes straight then stop for the day','25 minutes of focused studying followed by a genuine 5-minute break','Only study 25 minutes total per week','Review notes for 25 minutes before every class'], correct:1, explain:'This rhythm — 25 minutes focused, then a real 5-minute break, with a longer break after 3–4 rounds — helps sustain real focus rather than fading attention.'},
    {q:'How does cramming the night before compare to spaced repetition, according to this lesson?', options:['Cramming is more effective long-term','Cramming is low-effectiveness for long-term memory despite requiring high effort all at once','They\'re equally effective','Cramming works better for math specifically'], correct:1, explain:'Cramming can build short-term familiarity, but without spacing, the memory fades quickly — spaced repetition produces far more durable learning.'},
  ],
  faq:[
    {q:'Is highlighting completely useless?', a:'Not useless, but weak on its own — it\'s best combined with active recall (like turning highlighted points into questions to quiz yourself on later).'},
    {q:'How do I actually do spaced repetition without a fancy app?', a:'A simple calendar reminder works fine — schedule a quick self-quiz 1 day, 3 days, and 1 week after learning something new.'},
    {q:'What if I only have one night before a test?', a:'Active recall is still your best option even under time pressure — self-testing beats rereading even in a single cramming session, though it won\'t match the durability of spaced review.'},
    {q:'Does this work for all subjects, including math and skills-based classes?', a:'Yes — active recall applies broadly (working practice problems from memory is itself a form of active recall), though the exact format of self-testing will look different subject to subject.'},
    {q:'What\'s a simple way to build a weekly study rhythm?', a:'Keep a running list of topics you\'ve studied along with dates, and glance at it each morning — it removes the daily decision fatigue of figuring out what to study and review.'},
    {q:'How do I know when to actually stop studying for the day?', a:'Studying past the point of real focus mostly builds anxiety, not knowledge — a well-timed break, or simply stopping for the night, often helps more than pushing through exhaustion.'},
  ],
  takeaways:['Rereading feels productive but builds weak, recognition-only memory.','Active recall — testing yourself — builds far stronger memory.','Spacing review out over days beats cramming the night before.','Familiarity is a weak signal of real knowledge — the true test is recall with the material closed.','Respecting real focus limits beats pushing through exhaustion.'],
  download:'student-planner', journeys:['university'], nextInJourney:'mental-wellness',
},

{
  slug:'mental-wellness', outcome:'Spot burnout early and protect your mental wellness.', title:'Protecting Your Mental Wellness in School', pillar:'resilience',
  category:'Mental Wellness', emoji:'🌿', color:'yellow', difficulty:'Beginner',
  readTime:'12 min read', completionTime:'35 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'mental-wellness',
  dek:"Academic pressure is real. So is the fact that your wellbeing isn't optional overhead — it's the foundation everything else depends on.",
  objectives:['Recognize early signs of burnout before they become a crisis','Build a short daily practice that supports mental wellness without adding pressure','Know the difference between everyday stress and something that needs more support','Identify who to reach out to when things feel like too much','Understand how sleep, movement, and connection each support steadier mental health','Know what a first conversation with a counselor actually looks like'],
  sections:[
    {h:'Recognizing burnout before it\'s a crisis', p:['Burnout rarely arrives all at once — it usually builds gradually through signs like persistent exhaustion even after rest, growing cynicism about work you used to care about, and a drop in the sense that your effort is making a difference. Catching these early makes them far easier to address.'],
      callout:{type:'fact', title:'Did You Know?', text:'Burnout researchers commonly describe it along three dimensions — exhaustion, cynicism/detachment, and reduced sense of effectiveness — rather than as a single feeling. Noticing which dimension shows up first for you can help you catch it sooner.'}},
    {h:'Three everyday foundations', p:['Sleep, movement, and connection with others are three of the most consistently supported foundations for steadier mental wellness — not because they solve everything, but because a shortage in any one of them tends to make every other stressor feel heavier.'],
      table:{headers:['Foundation','Why it matters','A small, realistic version'], rows:[
        ['Sleep','Affects mood, focus, and stress resilience directly','A consistent wind-down time, even on busy nights'],
        ['Movement','Reliably reduces stress hormones and improves mood','A 10-minute walk, not necessarily a workout'],
        ['Connection','Buffers stress and reduces isolation','One honest check-in with a friend per week'],
      ]}},
    {h:'A daily practice that doesn\'t add pressure', p:["This doesn't need to be elaborate. A consistent, small practice — a short walk, five minutes of journaling, a specific wind-down routine before bed — supports steadier mental wellness better than an occasional big gesture."],
      callout:{type:'tip', title:'Make it almost too easy', text:"If your wellness practice feels like one more demanding task, it won't stick. Aim for something so small it's hard to skip — even two minutes counts."},
      mini:{q:'Why does a small, consistent daily practice tend to work better than an occasional big wellness gesture?', options:['Big gestures are always wrong','Small practices are easier to sustain and don\'t add to the pressure already present','Only small practices are backed by research','Daily practices are required by schools'], correct:1, explain:'Consistency compounds — a tiny practice you actually keep up with beats an occasional elaborate one that adds more pressure than relief.'}},
    {h:'Everyday stress vs. something more', p:["Some stress before exams or deadlines is completely normal and often even motivating. It becomes worth extra attention when it's persistent, when it's affecting sleep, appetite, or relationships significantly, or when it doesn't ease up even after the stressful event passes."],
      callout:{type:'note', title:'This is informational, not diagnostic', text:'These signs are meant to help you notice patterns worth discussing with a professional — not to diagnose yourself. A counselor is the right person to help sort out what\'s going on and what would help.'}},
    {h:'Who to reach out to, and what a first conversation looks like', p:["Most schools have counseling services, often free or low-cost, and specifically trained to help with the pressures of student life. Reaching out isn't a sign that something is deeply wrong with you — it's a normal, proactive step, the same as seeing a doctor for a physical concern.", 'A first appointment is usually just a conversation: what\'s been going on, how long, and what kind of support might help. There\'s no requirement to have it all figured out beforehand — showing up is the hard part, and it\'s already enough.'],
      callout:{type:'protip', title:'Pro Tip', text:'If reaching out feels like a big step, it can help to write down two or three sentences about what\'s been going on beforehand — it takes the pressure off finding the right words in the moment.'}},
  ],
  practiceExercises:[
    'Rate your last week from 1–5 on each of the three foundations — sleep, movement, connection — and pick whichever scored lowest to nudge up this week',
    'Look up your school\'s (or a local/national) counseling or wellness resource right now, even if you don\'t currently need it, and save the contact information somewhere you\'d actually find it later',
    'Notice one moment this week where you pushed through exhaustion instead of resting, and write down what resting instead could have looked like',
    'Write two or three sentences about how you\'ve actually been doing lately — the kind of note that would make it easier to reach out if you needed to',
  ],
  checklist:['Notice one early sign of stress building up this week','Choose one small daily practice and try it for 7 days','Rate your sleep, movement, and connection for the past week','Identify your school\'s counseling or wellness resource, even if you don\'t need it yet','Tell one trusted person how you\'re actually doing, honestly','Build one small recovery ritual into your week (not tied to productivity)'],
  reflection:['What does burnout tend to look like for you, specifically?','What\'s one small daily practice that has helped you feel steadier in the past?','Who is someone you trust enough to be honest with about how you\'re really doing?','Of the three foundations — sleep, movement, connection — which one tends to slip first when you\'re stressed?','What would it take for you to actually reach out to a counselor or trusted adult if you needed to?'],
  quiz:[
    {q:'What is a hallmark early sign of burnout?', options:['Occasional tiredness after a hard week','Persistent exhaustion even after rest, plus growing cynicism','Being excited about a new project','Studying for an exam'], correct:1, explain:'Persistent exhaustion that doesn\'t improve with rest, alongside rising cynicism, is a classic early burnout pattern.'},
    {q:'Which three everyday foundations most consistently support steadier mental wellness?', options:['Grades, money, and social media','Sleep, movement, and connection','Caffeine, willpower, and discipline','None — mental wellness can\'t be supported by habits'], correct:1, explain:'Sleep, movement, and connection with others are well-supported foundations — shortages in any of them tend to make other stressors feel heavier.'},
    {q:'What does a first counseling appointment usually involve?', options:['A test you have to pass','A conversation about what\'s been going on and what kind of support might help','Immediate medication','A requirement to have everything figured out beforehand'], correct:1, explain:'A first session is typically just a conversation — there\'s no expectation of arriving with answers already worked out.'},
    {q:'Burnout researchers commonly describe it along which three dimensions?', options:['Grades, money, and time','Exhaustion, cynicism/detachment, and reduced sense of effectiveness','Sleep, food, and exercise only','Anxiety, depression, and anger'], correct:1, explain:'Burnout is commonly described along exhaustion, cynicism/detachment, and a reduced sense of effectiveness — noticing which shows up first can help you catch it sooner.'},
    {q:'What makes a daily wellness practice more likely to actually stick?', options:['Making it as elaborate and impressive as possible','Keeping it small and consistent enough that it\'s hard to skip','Only doing it once a month','Waiting until you feel motivated'], correct:1, explain:'A practice that feels like one more demanding task won\'t stick — something small enough to be hard to skip works better than an occasional big gesture.'},
  ],
  faq:[
    {q:'Is it normal to feel overwhelmed sometimes?', a:'Yes — occasional stress, especially around deadlines, is a normal part of student life. It\'s the persistent, unrelenting version that\'s worth extra attention.'},
    {q:'What if I don\'t know if I need help or I\'m just being dramatic?', a:'That uncertainty is common and is itself a reasonable enough reason to talk to a counselor — they can help you figure out what kind of support, if any, would help.'},
    {q:'What if my school doesn\'t have counseling services, or I don\'t feel comfortable using them?', a:'Many regions have low-cost or free community and national mental health resources outside of school as well — it\'s worth searching for what\'s available locally.'},
    {q:'Does asking for help mean something is seriously wrong?', a:'No — reaching out is a proactive, preventive step available at any point along the spectrum from everyday stress to something more serious, not just a last resort.'},
    {q:'What are the three everyday foundations this lesson focuses on?', a:'Sleep, movement, and connection with others — not because they solve everything, but because a shortage in any one of them tends to make every other stressor feel heavier.'},
    {q:'What\'s a realistic, low-pressure version of a daily wellness practice?', a:'Something small enough to be hard to skip — a short walk, five minutes of journaling, or a consistent wind-down routine before bed, rather than an occasional big gesture.'},
  ],
  takeaways:['Burnout usually builds gradually — catching early signs matters.','Sleep, movement, and connection are three foundations worth checking in on regularly.','Small, consistent wellness practices beat occasional big gestures.','Persistent, significant impact on sleep, appetite, or relationships is worth extra attention.','Reaching out for support is a proactive, normal step — not a last resort.'],
  download:'habit-tracker', journeys:['university'], nextInJourney:'internships',
},
/* Note: mental-wellness content always points toward professional/crisis resources for anything
   beyond everyday stress — WRLD supplements, and never replaces, professional mental health support. */

{
  slug:'managing-anxiety', outcome:'Calm pre-event anxiety before it takes over.', title:'Managing Anxiety Before Big Moments', pillar:'resilience', flagship:true,
  heroIllustration:'managing-anxiety',
  category:'Mental Wellness', emoji:'🧘', color:'yellow', difficulty:'Beginner',
  readTime:'15 min read', completionTime:'55 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Interviews, exams, first days, hard conversations — the anxious feeling before a big moment is universal. Here\'s how to work with it instead of against it.',
  objectives:['Understand what anxiety actually is, physiologically, and why it shows up before big moments','Learn the difference between helpful nervous energy and overwhelming anxiety','Build a simple, repeatable calming routine you can use before any high-stakes moment','Reframe anxious thoughts without dismissing or suppressing them','Know when everyday anxiety is worth extra support beyond self-help tools'],
  sections:[
    {h:'That feeling before something big', p:[
      'The racing heart before an interview. The tight stomach before walking into a first day. The spiral of "what if" thoughts the night before an exam. If you\'ve felt this, you\'re not broken and you\'re not alone — this is one of the most universal human experiences, and it shows up specifically around moments that matter to us. The fact that you feel anxious before something big is, in a strange way, evidence that you care about the outcome.',
      'The goal of this lesson isn\'t to make anxiety disappear entirely — for most people, that\'s not a realistic or even desirable target. The goal is to understand what\'s actually happening in your body and mind, and to build simple tools that help you function well even while feeling nervous.',
    ]},
    {h:'What anxiety actually is, physiologically', p:[
      'Anxiety is your nervous system\'s alarm response — the same system that once helped humans react quickly to real physical danger, now firing off in response to modern stressors like interviews, exams, and social situations. Your body releases stress hormones, your heart rate rises, your muscles tense, and your attention narrows. This response is fast, automatic, and not something you can simply think your way out of in the moment — which is exactly why breathing and body-based tools work better than willpower alone.',
    ], callout:{type:'fact', title:'Did You Know?', text:'The same physical sensations — racing heart, quick breathing, a jittery stomach — occur in both anxiety and excitement. Some research suggests that mentally relabeling nervous energy as "excitement" rather than "anxiety" can genuinely shift how manageable it feels, because the physical experience is nearly identical.'}},
    {h:'Helpful nervous energy vs. overwhelming anxiety', p:[
      'A moderate amount of nervous energy before a big moment is not just normal — it\'s often useful, sharpening focus and motivation. It becomes worth extra attention when it tips into something that interferes with your ability to function: a racing mind that won\'t let you prepare, physical symptoms strong enough to be distracting, or a spiral of catastrophic thinking that feels impossible to interrupt.',
    ], table:{headers:['Helpful Nervous Energy','Overwhelming Anxiety'], rows:[
      ['Sharper focus, slight edge','Mind racing, hard to concentrate'],
      ['Manageable physical symptoms','Physical symptoms strong enough to distract'],
      ['Fades once you begin','Persists or worsens even once you start'],
      ['Motivates preparation','Interferes with preparation'],
    ]}},
    {mini:true, q:'A moderate amount of nervous energy before a big moment is...', options:['Always a sign something is wrong','Often normal, and can even sharpen focus and motivation'], correct:1, explain:'A moderate amount of nervous energy is a normal, often useful response — it becomes a concern mainly when it interferes with functioning rather than simply being present.'},
    {h:'A simple calming routine you can use before anything', p:[
      'Because anxiety is a physical, automatic response, physical tools tend to work faster than trying to "think calm" thoughts. A short, repeatable routine you can use before any big moment — an interview, a presentation, a hard conversation — builds familiarity, which itself reduces anxiety over time.',
    ], timeline:[
      {label:'5 minutes before', text:'Do 2 minutes of slow box breathing: inhale 4, hold 4, exhale 4, hold 4.'},
      {label:'3 minutes before', text:'Name 5 things you can see, 4 you can hear, 3 you can feel — a quick grounding exercise.'},
      {label:'1 minute before', text:'Say one honest, encouraging sentence to yourself out loud or in your head.'},
      {label:'Right before', text:'Roll your shoulders back, take one full breath, and begin.'},
    ], callout:{type:'protip', title:'Pro Tip', text:'Practice this routine at a low-stakes moment first — before a casual conversation, not just before your biggest exam. Familiarity with the routine itself makes it far more effective when you actually need it.'}},
    {h:'Reframing anxious thoughts without dismissing them', p:[
      'Telling yourself "don\'t be nervous" rarely works, because it dismisses a real feeling instead of addressing it. A more effective approach is to acknowledge the thought, then gently question it: "I\'m thinking I\'ll completely blank on everything" can be met with "that\'s possible, but unlikely given how much I\'ve prepared — and even a rough answer is better than silence."',
    ], callout:{type:'mistake', title:'Common Mistake: Trying to force positivity', text:'Forcing an overly positive thought ("I feel totally confident!") when you don\'t believe it often backfires, because part of your mind notices the mismatch. A more believable, moderate reframe ("I\'m nervous, and I\'m also prepared") tends to feel more genuine and land better.'}},
    {h:'When to seek more support than self-help tools', p:[
      'The tools in this lesson are genuinely useful for everyday, situational anxiety tied to specific moments. If anxiety feels constant rather than situational, significantly affects your sleep, appetite, or relationships, or doesn\'t ease up even once the stressful event has passed, that\'s worth a conversation with a counselor, doctor, or trusted adult — not something to push through alone.',
    ], callout:{type:'note', title:'A note on support', text:'This Playbook is designed to help with everyday, situational nervousness — not to replace professional support for ongoing anxiety. If anxiety is significantly affecting your daily life, reaching out to a school counselor, doctor, or mental health professional is a strong, proactive step, not a last resort.'}},
  ],
  practiceExercises:['Practice the 4-4-4-4 box breathing pattern right now, for two full minutes','Try the 5-4-3-2-1 grounding exercise (5 things you see, 4 you hear, 3 you feel, etc.)','Write one honest, moderate reframe for an anxious thought you\'ve had recently','Identify one low-stakes moment this week where you could practice your calming routine'],
  checklist:['Learn and practice the 4-4-4-4 box breathing pattern','Try the 5-4-3-2-1 grounding exercise at least once','Write one honest, believable reframe for a recurring anxious thought','Practice your calming routine before a low-stakes moment first','Identify your school or community\'s counseling resource, even if you don\'t need it yet','Notice the difference between helpful nervous energy and overwhelming anxiety for yourself','Practice relabeling nervous energy as excitement once, and notice if it shifts how it feels','Write your honest, moderate reframe on a note you can glance at right before a big moment'],
  reflection:['What does your body typically feel like right before a big moment?','Is there a thought that tends to spiral for you — and what would a moderate, honest reframe of it sound like?','Who is someone you could be honest with about feeling anxious, without it feeling like a big confession?','What\'s one low-stakes moment this week where you could practice your calming routine?','When you feel that racing-heart, tight-stomach sensation, do you usually read it as anxiety or excitement — and could reframing it help?'],
  quiz:[
    {q:'What is anxiety, physiologically speaking?', options:['A sign of weakness','Your nervous system\'s alarm response, evolved for danger but often triggered by modern stressors','A permanent condition with no variation','Something only some people experience'], correct:1, explain:'Anxiety is a normal, automatic nervous system response — understanding this helps remove some of the shame or confusion around feeling it.'},
    {q:'What distinguishes overwhelming anxiety from helpful nervous energy?', options:['Overwhelming anxiety interferes with functioning; helpful nervous energy sharpens focus', 'There is no real difference','Only the amount of caffeine consumed','Whether other people notice it'], correct:0, explain:'The key difference is functional impact — whether the feeling helps you focus and prepare, or interferes with your ability to do so.'},
    {q:'Why do physical tools like breathing often work better than "thinking calm" in the moment?', options:['They don\'t — thinking is always more effective','Anxiety is a fast, automatic physical response, so physical tools address it more directly','Breathing has no real effect','Only medication works for anxiety'], correct:1, explain:'Because the anxiety response is physical and automatic, physical interventions like breathing tend to shift it more reliably than willpower alone.'},
    {q:'What does the lesson say about relabeling nervous energy as "excitement"?', options:['It has no effect at all','It can genuinely shift how manageable the feeling seems, since the physical sensations are nearly identical','It only works for professional performers','It makes the anxiety worse'], correct:1, explain:'Anxiety and excitement share nearly identical physical sensations, so mentally relabeling one as the other can genuinely change how manageable it feels.'},
    {q:'What\'s the first step of the recommended pre-moment calming routine?', options:['Force an overly positive thought','Two minutes of slow box breathing: inhale 4, hold 4, exhale 4, hold 4','Avoid thinking about the event entirely','Skip preparation and improvise'], correct:1, explain:'The routine starts with box breathing at the 5-minute mark, since physical tools address the automatic anxiety response directly.'},
    {q:'What\'s a more effective way to handle an anxious thought than just telling yourself "don\'t be nervous"?', options:['Suppress the thought completely and refuse to think about it','Acknowledge the thought, then gently question it with a moderate, believable reframe','Argue with yourself loudly until it goes away','Avoid the event altogether'], correct:1, explain:'Acknowledging the thought and offering a moderate, believable reframe tends to land better than dismissing the feeling or forcing false positivity.'},
  ],
  faq:[
    {q:'Is it normal to feel anxious before every big moment?', a:'Yes — a moderate amount of nervousness before something that matters to you is extremely common and often even useful for focus and motivation.'},
    {q:'What if breathing exercises don\'t seem to help me?', a:'Different tools work for different people — grounding exercises, movement, or talking it through with someone can all be worth trying if breathing alone doesn\'t feel like enough.'},
    {q:'How do I know if I need more support than self-help tools?', a:'If anxiety feels constant rather than tied to specific situations, or significantly affects your sleep, appetite, or relationships, that\'s a sign to talk with a counselor, doctor, or trusted adult.'},
    {q:'Can practicing these tools in advance actually help?', a:'Yes — practicing a calming routine during low-stakes moments builds familiarity, which makes the same routine meaningfully more effective when the stakes are actually high.'},
    {q:'What exactly is the 5-4-3-2-1 grounding exercise?', a:'Naming 5 things you can see, 4 you can hear, and 3 you can feel — a quick way to pull your attention back to the present moment when anxious thoughts start spiraling.'},
    {q:'Should the goal be to make anxiety disappear completely?', a:'Not usually — that\'s rarely a realistic target. The goal is to function well and feel steadier while nervous, not to eliminate the feeling entirely.'},
  ],
  takeaways:['Anxiety before a big moment is a normal, physiological alarm response — not a personal flaw.','A moderate amount of nervous energy can sharpen focus; it\'s the overwhelming version that\'s worth addressing.','Physical tools like breathing and grounding work faster than trying to think your way calm.','A believable, moderate reframe works better than forced positivity.','Persistent, life-affecting anxiety deserves professional support, not just self-help tools.'],
  download:'habit-tracker', journeys:['university'], nextInJourney:null,
},

{
  slug:'apartment-renting', outcome:'Rent your first apartment without hidden costs catching you off guard.', title:'Renting Your First Apartment', pillar:'development', flagship:true,
  heroIllustration:'apartment-renting',
  category:'Housing', emoji:'🏠', color:'blue', difficulty:'Intermediate',
  readTime:'17 min read', completionTime:'60 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'Renting your first place is exciting and a little terrifying, usually at the same time. Here\'s what to actually check, ask, and understand before you sign anything.',
  objectives:['Understand the true monthly cost of an apartment beyond just the rent','Know what to check during a viewing that most first-time renters miss','Understand key lease terms before signing anything','Learn what a security deposit does and doesn\'t cover','Avoid the most common first-apartment mistakes and rental scams'],
  sections:[
    {h:'The excitement and the fear are both normal', p:[
      'Renting your first apartment is one of the clearest signals of independence — and also one of the first times you\'re signing a legally binding contract with real financial consequences, often with very little guidance on what any of it actually means. Feeling both excited and slightly overwhelmed is the completely normal reaction, not a sign you\'re not ready.',
    ]},
    {h:'The true monthly cost, beyond just rent', p:[
      'The listed rent is rarely the full monthly cost. Utilities (electricity, water, gas, internet), renter\'s insurance, parking, and sometimes pet fees or amenity charges can add a meaningful amount on top of the base rent. Before committing to a place, ask directly what\'s included and estimate the full monthly total — not just the number in the listing.',
    ], table:{headers:['Cost','Often Overlooked?'], rows:[
      ['Base rent','No — always visible'],
      ['Utilities (electric, water, gas)','Yes — ask specifically what\'s included'],
      ['Internet','Yes — rarely included, budget separately'],
      ['Renter\'s insurance','Yes — often required but not automatically included'],
      ['Parking / storage fees','Yes — ask directly, especially in cities'],
    ]}, callout:{type:'fact', title:'Did You Know?', text:'A unit listed $50 cheaper than another can easily end up more expensive overall if utilities aren\'t included — always ask for a full monthly cost estimate, not just the headline rent figure.'}},
    {h:'What to check during a viewing that most first-timers miss', p:[
      'It\'s easy to get swept up in how a place looks and forget to check the practical details that are much harder to fix later. Test every faucet for water pressure, check under sinks for signs of past water damage, flip every light switch, and open every window and door to make sure they close properly.',
    ], callout:{type:'protip', title:'Pro Tip', text:'Visit at a different time of day than your first viewing if possible — noise levels, natural light, and street activity can look completely different in the evening versus midday.'}},
    {mini:true, q:'Why is it worth visiting a potential apartment at a different time of day before deciding?', options:['It isn\'t necessary — one viewing is always enough','Noise, light, and street activity can look very different at different times of day'], correct:1, explain:'A quiet street at 2pm can be a very different experience at 11pm — a second visit at a different time can reveal things the first one missed.'},
    {h:'Key lease terms before you sign anything', p:[
      'A lease is a binding legal document, and reading it fully — even the unglamorous fine print — matters more than almost any other step in the process. Pay close attention to the length of the lease, the policy for breaking it early, whether rent can increase and under what notice, and exactly what "maintenance responsibilities" fall on you versus the landlord.',
    ]},
    {h:'What a security deposit does and doesn\'t cover', p:[
      'A security deposit is meant to cover damage beyond normal wear and tear — not routine cleaning or minor scuffs from everyday living. Document the unit\'s condition thoroughly with photos and video on move-in day, before you\'ve moved a single box in, so there\'s clear evidence of pre-existing conditions if a dispute arises later.',
    ], callout:{type:'mistake', title:'Common Mistake: Skipping move-in photos', text:'Failing to document a unit\'s condition on move-in day is one of the most common first-apartment mistakes — without photo evidence, disputing a deposit deduction for pre-existing damage becomes far harder months or years later.'}},
    {h:'Avoiding common rental scams', p:[
      'First-time renters, especially those searching online, are frequent targets for rental scams — a listing priced suspiciously below market rate, a "landlord" who is conveniently out of the country and asks for a deposit before you\'ve seen the unit in person, or pressure to wire money immediately. Never send money for a unit you haven\'t toured in person or verified through a legitimate platform.',
    ], callout:{type:'warn', title:'Heads up: Never pay before seeing it', text:'A legitimate landlord will always allow an in-person (or verified live video) tour before any money changes hands. Any pressure to pay a deposit sight-unseen is one of the clearest scam red flags in rental searching.'}},
  ],
  practiceExercises:['Estimate the full monthly cost — rent plus utilities, internet, and insurance — for an apartment you\'re considering or curious about','List 5 things you\'d check during a viewing that you might have otherwise overlooked','Read through a sample lease (your own, a friend\'s, or a template online) and identify the early-termination policy','Practice the move-in documentation habit by photographing a room in your current home as if it were move-in day'],
  checklist:['Confirm total monthly cost (rent + utilities + fees), not just base rent','Ask about the security deposit and what it specifically covers','Check water pressure and test all faucets','Test all light switches, outlets, and window/door seals','Check for signs of past pests or water damage','Read the full lease before signing anything, including early-termination terms','Photograph and video the unit\'s full condition on move-in day','Confirm the process for requesting repairs and maintenance'],
  reflection:['What matters most to you in a first place — cost, location, space, or something else?','What would make you feel confident enough to sign a lease, versus still uncertain?','Have you (or has someone you know) ever run into a surprise cost or issue with a rental — what happened?','What\'s one practical detail — water pressure, storage, noise — you might overlook if you got swept up in how a place looks?','Who could you ask to review a lease with you before you sign, if any part of it feels unclear?'],
  quiz:[
    {q:'Why might a cheaper-looking rent listing actually cost more overall?', options:['It never does — rent is always the full cost','Utilities, internet, and fees may not be included, adding to the real monthly total','Cheaper listings are always scams','Rent is the only real cost that matters'], correct:1, explain:'The listed rent is often just one part of the real monthly cost — always ask what\'s included before comparing options.'},
    {q:'What does a security deposit typically cover?', options:['Any wear and tear at all, including normal use','Damage beyond normal wear and tear','Nothing — deposits are never returned','Only pet-related damage'], correct:1, explain:'Security deposits are meant for damage beyond ordinary wear and tear, not routine cleaning or minor everyday marks.'},
    {q:'What is a major red flag when searching for a rental online?', options:['Being asked to tour the unit in person','A landlord asking for payment before you\'ve seen the unit in person or verified it','A lease with clearly stated terms','A reasonable security deposit amount'], correct:1, explain:'Legitimate landlords allow a real or verified tour before any money changes hands — pressure to pay sight-unseen is a common scam pattern.'},
    {q:'Why is it worth visiting a potential apartment at a different time of day before deciding?', options:['It isn\'t necessary — one viewing is always enough','Noise, light, and street activity can look very different at different times of day','Landlords legally require a second visit','It changes the listed rent price'], correct:1, explain:'A quiet street at 2pm can feel very different at 11pm — a second visit at a different time can reveal things the first missed.'},
    {q:'Which of these should you pay close attention to before signing a lease?', options:['Only the total square footage','Lease length, early-termination policy, rent-increase notice, and maintenance responsibilities','Just the landlord\'s name','The color of the walls'], correct:1, explain:'These are the terms that actually affect you financially and practically over the life of the lease, so they deserve careful reading.'},
    {q:'What should you do on move-in day to protect your security deposit?', options:['Nothing — it isn\'t necessary','Photograph and video the unit\'s full condition before moving anything in','Wait a month before documenting anything','Only document damage you personally caused'], correct:1, explain:'Thorough move-in documentation gives you clear evidence of pre-existing conditions if a deposit dispute comes up later.'},
  ],
  faq:[
    {q:'What if I can\'t afford the security deposit and first month\'s rent upfront?', a:'This is a common challenge — some landlords offer payment plans for deposits, and it\'s worth asking directly rather than assuming there\'s no flexibility.'},
    {q:'Should I get renter\'s insurance?', a:'In many cases it\'s required by the lease, and even when it isn\'t, it\'s a relatively low-cost way to protect your belongings — generally worth it for a first apartment.'},
    {q:'What if I find damage after moving in that I didn\'t cause?', a:'Report it to your landlord in writing immediately, and reference your move-in photos and video as documentation that it pre-existed your tenancy.'},
    {q:'What if my roommate and I both want to be on the lease?', a:'That\'s usually the safer option — being co-tenants on the lease means you\'re both legally protected and responsible, rather than one person carrying all the risk.'},
    {q:'How much should I expect to budget for a security deposit?', a:'It varies by location, but one month\'s rent is a common baseline — always confirm the exact amount and refund conditions before signing.'},
    {q:'Is it normal to try to negotiate rent or lease terms?', a:'It can\'t hurt to ask, especially in a slower rental market or for a unit that\'s been listed a while — the worst outcome is usually just a no.'},
  ],
  takeaways:['The real monthly cost of an apartment is almost always more than the listed rent alone.','Check practical details — water pressure, outlets, past damage — not just how a place looks.','Read the full lease, including early-termination and maintenance terms, before signing.','Photograph and video the unit\'s condition on move-in day to protect your deposit.','Never send money for a unit you haven\'t toured in person or verified — that pressure is a scam red flag.'],
  download:'apartment-checklist', journeys:['becoming-independent'], nextInJourney:null,
},

{
  slug:'internships', outcome:'Land an internship that actually builds your resume.', title:'Landing Your First Internship', pillar:'work',
  category:'Career', emoji:'🧳', color:'blue', difficulty:'Intermediate',
  readTime:'13 min read', completionTime:'50 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'internships',
  dek:"Internships are one of the highest-leverage things you can do in school — and one of the most misunderstood. Here's how to actually land one.",
  objectives:['Understand what makes internships so valuable beyond the resume line','Find internships beyond the obvious big-name postings','Prepare application materials specific to internship applications','Know what to do in the first week to make it count','Understand the typical internship application timeline','Avoid the most common first-time applicant mistakes'],
  sections:[
    {h:"Why internships matter more than the title suggests", p:["An internship gives you something a classroom can't: a real preview of what a field is actually like day to day, a chance to build a genuine professional reference, and often a foot in the door for future roles at that company or in that industry. Even an unpaid or short internship can be worth pursuing for these reasons."],
      callout:{type:'fact', title:'Did You Know?', text:'Many employers report that internship performance is one of the strongest predictors they use when making entry-level hiring decisions — often weighted more heavily than GPA alone.'}},
    {h:'The typical internship timeline', p:['Internship recruiting often runs on a longer, earlier timeline than people expect — many summer internships open applications in the fall or winter before. Knowing the rough timeline in advance prevents missing early-bird postings.'],
      timeline:[
        {label:'Months before', text:'Large/competitive programs: applications frequently open several months ahead of the internship start date.'},
        {label:'Ongoing', text:'Smaller organizations and local companies: postings and direct outreach happen year-round, closer to need.'},
        {label:'Weeks before', text:'Some smaller or informal internships are arranged just weeks ahead — it\'s worth asking even late.'},
      ]},
    {h:'Finding internships beyond the obvious', p:["Large, famous internship programs get enormous numbers of applicants. Smaller companies, local organizations, professors' research projects, and your school's career center often have less competitive — and sometimes more meaningful — opportunities."],
      callout:{type:'tip', title:"Ask, don't just apply", text:'Many internships are never formally posted. Reaching out directly to a small organization asking if they take interns can uncover opportunities nobody else is competing for.'},
      mini:{q:'Why might reaching out directly to a small organization work better than applying to large famous programs?', options:['Small organizations always pay more','Many never formally post internships, so direct outreach faces far less competition','Large programs don\'t accept students','It\'s required by law'], correct:1, explain:'Unposted opportunities have no applicant pool competing for them — direct outreach can surface roles nobody else even knows exist.'}},
    {h:'Application materials that fit internships specifically', p:['Internship applications should lean into your potential and coursework more than a full-time application would — relevant classes, projects, and eagerness to learn are legitimate selling points at this stage, not weaknesses to hide.'],
      callout:{type:'mistake', title:'Common Mistake', text:'Downplaying coursework or projects because they "aren\'t real experience." For internship applications specifically, relevant classwork and personal projects are exactly what employers expect to see — don\'t hide them.'}},
    {h:'Making the first week count', p:['Ask thoughtful questions, take detailed notes, and — importantly — ask directly what a strong performance would look like by the end of the internship. This turns a vague experience into one with a clear goal you can actually work toward.'],
      callout:{type:'protip', title:'Pro Tip', text:'In week one, ask your supervisor: "What would make this a great internship from your perspective?" Their answer gives you a concrete target for the rest of your time there — and shows initiative on day one.'}},
  ],
  practiceExercises:[
    'List five organizations you\'d genuinely want to learn from, mixing at least two well-known names with at least two smaller or local ones',
    'Draft a short, three-sentence outreach message to one smaller organization: who you are, why you\'re interested in them specifically, and what you\'d hope to learn',
    'Send that message to one real organization this week, even if it feels early',
    'Write down one question you\'d ask a supervisor in week one to find out what would make the internship great from their perspective',
  ],
  checklist:["List 5 companies or organizations you'd genuinely want to learn from, big or small","Check your school's career center for postings and support","Draft an internship-specific resume highlighting coursework and projects","Send at least 2 direct outreach messages to smaller organizations","Track application deadlines, since competitive programs open months early","Ask your supervisor in week one what a strong outcome would look like"],
  reflection:['What field or role are you genuinely curious about, even if you\'re not sure you\'re "qualified" yet?','What\'s one smaller organization you could reach out to directly?','What would make an internship feel worthwhile to you beyond the resume line?','What would you want to ask a supervisor in your first week to figure out what a strong outcome looks like?','Is there a smaller or local organization you\'ve been hesitant to reach out to directly — what\'s held you back?'],
  quiz:[
    {q:'Why might a smaller, less famous internship be a good target?', options:['They pay more','They typically have fewer applicants and may offer more meaningful experience','They require no application','They\'re only for graduate students'], correct:1, explain:'Smaller or less-publicized opportunities often have far less competition and can offer just as much learning value.'},
    {q:'When do the most competitive internship programs often open applications?', options:['The week the internship starts','Often months before the internship start date','Only after graduation','There\'s no pattern at all'], correct:1, explain:'Many competitive programs recruit on a long lead time — tracking deadlines early avoids missing them.'},
    {q:'On an internship application, how should you treat relevant coursework and class projects?', options:['Hide them since they aren\'t "real" experience','Highlight them — they\'re legitimate, expected selling points at this stage','Only mention them if asked directly','List only paid work experience'], correct:1, explain:'Internship applications specifically expect and reward relevant coursework and projects as evidence of potential.'},
    {q:'What\'s a smart question to ask your supervisor during the first week of an internship?', options:['When is the internship over?', '"What would make this a great internship from your perspective?"','Can I work from home?','What is the company\'s revenue?'], correct:1, explain:'Asking what a strong performance would look like turns a vague experience into one with a clear goal, and shows initiative on day one.'},
    {q:'Why might reaching out directly to a small organization uncover opportunities you wouldn\'t otherwise find?', options:['Small organizations always pay more','Many internships are never formally posted, so direct outreach faces far less competition','It\'s required by law','Small organizations only hire through direct outreach'], correct:1, explain:'Unposted opportunities have no applicant pool competing for them — direct outreach can surface roles nobody else even knows exist.'},
  ],
  faq:[
    {q:'What if I can\'t find any internships in my exact field?', a:'Adjacent experience counts — a related field or transferable-skills role can still teach you a great deal and strengthen future applications.'},
    {q:'Is an unpaid internship worth it?', a:'It depends on your circumstances, but when financially feasible, the experience, reference, and network can be genuinely valuable — weigh it against your specific situation.'},
    {q:'What if I missed the deadline for the big, well-known programs?', a:'Smaller organizations and local opportunities often recruit on a rolling, less rigid timeline — it\'s worth asking even if the famous programs have closed.'},
    {q:'How many internships should I apply to?', a:'There\'s no universal number, but casting a wide net — mixing competitive and smaller/direct-outreach options — improves your odds without requiring you to lower your standards.'},
    {q:'What does an internship offer beyond a line on a resume?', a:'A real preview of what a field is actually like day to day, a chance to build a genuine professional reference, and often a foot in the door for future roles.'},
    {q:'Should I mention my coursework and class projects in an internship application?', a:'Yes — for internship applications specifically, relevant coursework and personal projects are legitimate selling points employers expect to see, not weaknesses to downplay.'},
  ],
  takeaways:['Internships offer a real preview of a field, a reference, and a foot in the door.','Smaller, less obvious opportunities are often less competitive and still valuable.','Competitive programs often recruit months ahead — track deadlines early.','Internship applications can highlight coursework and potential, not just experience.','Asking what success looks like turns a vague internship into a focused one.'],
  download:'career-roadmap', journeys:['university'], nextInJourney:'networking',
},

{
  slug:'graduation-planning', outcome:'Turn \'what now?\' into a real 90-day plan.', title:'Planning Your Life After Graduation', pillar:'development',
  category:'Life Skills', emoji:'🧑‍🎓', color:'yellow', difficulty:'Advanced',
  readTime:'13 min read', completionTime:'50 min to complete',
  author:'WRLD Learning Team', dateUpdated:'May 2026', heroIllustration:'graduation-planning',
  dek:"Graduation can feel like driving off a cliff with no map. Here's how to build one, even if you have no idea what's next.",
  objectives:['Reduce "what am I doing with my life" pressure into smaller, answerable questions','Build a simple 90-day post-graduation plan','Understand your options beyond "dream job or failure"','Know how to talk about uncertainty honestly in interviews and with family','Recognize common post-graduation traps and how to avoid them','Build one honest check-in habit into the months after graduating'],
  sections:[
    {h:'Shrinking the impossible question', p:['"What am I doing with my life" is not an answerable question — it\'s too big. "What do I want to be true about my life in the next 90 days" is answerable, and answering it repeatedly, quarter by quarter, is how most people actually build a direction over time.'],
      callout:{type:'fact', title:'Did You Know?', text:'Career development research consistently finds that people rarely arrive at their long-term direction through one big decision — it\'s far more common to build it through a series of smaller, nearer-term steps that each teach you something the last one couldn\'t.'}},
    {h:'A simple 90-day plan', p:["Rather than an entire life plan, build a specific plan for the first 90 days after graduation: what you're applying to, what you're learning, how you're supporting yourself financially, and one honest check-in date to reassess."],
      timeline:[
        {label:'Days 1–30', text:'Apply widely, reconnect with 10 people in your network, keep your routine and sleep steady.'},
        {label:'Days 31–60', text:'Take any interviews seriously, seriously consider a bridge job if income is a pressing need.'},
        {label:'Days 61–90', text:'Reassess honestly — what\'s working, what needs to change, and what the next 90 days should focus on.'},
      ]},
    {h:'Beyond "dream job or failure"', p:['Very few people land their ideal role immediately after graduating. A "bridge job" — one that pays the bills and buys you time while you keep working toward your actual goal — is a completely legitimate, common step, not a sign of failure.'],
      callout:{type:'mistake', title:'Common Mistake', text:'Treating a bridge job as evidence that you\'ve fallen behind. Most career paths include at least one — the difference between a bridge job and a detour is simply whether you keep actively working toward your actual goal alongside it.'}},
    {h:'Common post-graduation traps', p:['A few patterns quietly derail the months after graduation more than any single bad decision: comparing your timeline to everyone else\'s highlight reel, applying to nothing because you\'re waiting to feel "ready," and letting structure disappear entirely once classes end.'],
      mini:{q:'What\'s one of the most common things that quietly derails the months after graduation?', options:['Applying to too many jobs','Comparing your timeline to other people\'s highlight-reel version of success','Taking a bridge job','Reconnecting with your network'], correct:1, explain:'Comparison to curated, incomplete pictures of others\' progress is one of the most common (and least useful) sources of post-graduation pressure.'}},
    {h:'Talking about uncertainty honestly', p:['You don\'t need a perfectly confident five-year plan to interview well or talk with family about your path. A calm, honest answer — "I\'m exploring roles in X, and open to learning more as I go" — reads as grounded, not lost.'],
      callout:{type:'tip', title:'Confidence isn\'t certainty', text:'You can sound confident about your process (how you\'re approaching the search) without needing certainty about the exact outcome.'}},
    {h:'Keeping structure after classes end', p:['School provides a built-in rhythm — classes, deadlines, a schedule — that disappears the moment you graduate. Rebuilding a simple daily structure (a wake time, a block of job-search time, some movement, a connection point with people) protects your momentum and mood during an otherwise unstructured stretch.'],
      callout:{type:'protip', title:'Pro Tip', text:'Treat the job search itself like a part-time job with regular hours, rather than something you do only when you feel motivated — this alone prevents most of the drift that makes the post-graduation period feel aimless.'}},
  ],
  practiceExercises:[
    'Using the three-phase timeline above, write your own specific version — what you\'ll do in days 1–30, 31–60, and 61–90 — including at least one honest check-in date',
    'Write down two or three criteria that would make a job an acceptable "bridge" for you, before you actually need to decide in the moment',
    'List three people you could genuinely check in with during this period, beyond just job-search contacts',
    'Write one honest sentence about how you\'re actually feeling about this transition right now — comparison-free',
  ],
  checklist:['Write a specific 90-day plan for after graduation','Identify what a reasonable "bridge job" could look like for you, just in case','Reconnect with 5–10 people in your network before you need to','Rebuild a simple daily structure once classes end','Set one honest check-in date 90 days out to reassess','Prepare a calm, honest way to talk about uncertainty if asked'],
  reflection:['What would "enough direction" feel like right now, even without full certainty?','What would you consider a reasonable bridge job while you figure out the bigger picture?','Who in your life makes you feel supported rather than pressured about this transition?','What\'s one thing in your control right now that could make the next 90 days feel less directionless?','When you imagine talking to family about "the plan," what do you actually want them to understand?'],
  quiz:[
    {q:'What\'s a more useful question than "what am I doing with my life"?', options:['"What do I want to be true in the next 90 days?"','"What will I be doing in 30 years?"','There is no better question','"What does everyone else expect of me?"'], correct:0, explain:'Smaller, nearer-term questions are answerable and buildable — the huge, distant question rarely is.'},
    {q:'What distinguishes a legitimate "bridge job" from a discouraging detour?', options:['How much it pays','Whether you keep actively working toward your actual goal alongside it','Whether family approves of it','How long you stay'], correct:1, explain:'A bridge job stays a bridge as long as it\'s paired with continued effort toward your actual direction — that\'s what separates it from drifting.'},
    {q:'What commonly disappears right after graduation that\'s worth deliberately rebuilding?', options:['Free time','Daily structure and rhythm that school used to provide','Your resume','Your emergency fund'], correct:1, explain:'School provides a built-in schedule; rebuilding a simple daily structure protects momentum and mood once that framework is gone.'},
    {q:'In the 90-day plan, what\'s the focus of days 1–30?', options:['Reassessing everything from scratch','Applying widely, reconnecting with your network, and keeping your routine steady','Only taking interviews','Waiting to feel ready before doing anything'], correct:1, explain:'The first 30 days focus on wide applications, reconnecting with your network, and keeping a steady routine and sleep schedule.'},
    {q:'What\'s a calm, honest way to talk about uncertainty in an interview or with family, according to this lesson?', options:['Avoid the topic entirely','"I\'m exploring roles in X, and open to learning more as I go"','Pretend to have a five-year plan even if you don\'t','Say you have no idea and change the subject'], correct:1, explain:'A grounded, honest answer about your process reads as confident, not lost — you don\'t need certainty about the exact outcome.'},
  ],
  faq:[
    {q:'Is it bad to take a "bridge job" that isn\'t my dream role?', a:'Not at all — it\'s a common, practical step that provides stability and time while you keep working toward your actual goal.'},
    {q:'How do I handle family pressure about "the plan"?', a:'A calm, specific answer about your current process (what you\'re applying to, learning, or exploring) often eases pressure better than avoiding the conversation.'},
    {q:'What if 90 days pass and I still don\'t have a clear direction?', a:'That\'s normal for many people — the honest check-in isn\'t about arriving at certainty, it\'s about noticing what you\'ve learned and setting the next 90-day focus accordingly.'},
    {q:'How do I stop comparing my timeline to everyone else\'s?', a:'It helps to remember that what you see from others is usually a curated highlight, not the full, messier picture — most paths include more uncertainty and detours than they show.'},
    {q:'What are some common traps that derail the months right after graduation?', a:'Comparing your timeline to other people\'s highlight reels, waiting to apply until you feel "ready," and letting all structure disappear once classes end.'},
    {q:'Why does rebuilding a daily structure after graduation matter?', a:'School provides a built-in rhythm of classes and deadlines that disappears the moment you graduate — rebuilding a simple structure protects your momentum and mood during an otherwise unstructured stretch.'},
  ],
  takeaways:['Shrink an impossible question into an answerable 90-day one.','A bridge job is a legitimate, common step — not a failure — as long as you keep working toward your actual goal.','Comparing your timeline to others\' highlight reels is one of the most common post-graduation traps.','Rebuilding daily structure after classes end protects momentum and mood.','You can speak confidently about your process without needing certainty about the outcome.'],
  download:'goal-setting-workbook', journeys:['university'], nextInJourney:null,
},

/* ---------------------------- LIFE SKILLS: FIRST VEHICLE ---------------------------- */

{
  slug:'first-vehicle', outcome:'Buy, insure, and maintain your first vehicle with real confidence — no surprises.', title:'Getting Your First Vehicle', pillar:'development', flagship:false,
  category:'Life Skills', emoji:'🚗', color:'yellow', difficulty:'Intermediate',
  readTime:'19 min read', completionTime:'70 min to complete',
  author:'WRLD Learning Team', dateUpdated:'July 2026',
  dek:'A car can be the most expensive thing you\'ve ever bought — and the one with the least guidance attached. Here\'s how to decide, shop, finance, insure, and maintain your first vehicle without getting taken advantage of.',
  objectives:[
    'Decide honestly whether you actually need a vehicle right now, or if alternatives make more sense',
    'Understand the true monthly cost of ownership — far more than just a purchase price',
    'Compare new vs. used, and financing vs. leasing vs. paying cash',
    'Know how credit affects your interest rate, and how to shop for a loan',
    'Inspect a used vehicle and spot red flags before you buy',
    'Understand registration, required documents, and insurance basics',
    'Build routine and seasonal maintenance habits that protect your investment',
    'Know exactly what to do if you\'re ever in an accident',
    'Avoid the most common first-time buyer mistakes',
  ],
  sections:[
    {h:'Do you actually need a vehicle?', p:[
      'Before comparing a single car, it\'s worth answering a more basic question honestly: do you need one at all? A vehicle is one of the largest recurring expenses most people ever take on, so it\'s worth checking it against your actual life — not just the idea of having one.',
      'If you live somewhere with reliable public transit, walk or bike to work and school, or could realistically rely on rideshares for occasional trips, the math sometimes favors waiting. If you commute somewhere transit doesn\'t reach, work irregular hours, or need to carry equipment or people regularly, a vehicle often becomes close to essential.',
    ], callout:{type:'tip', title:'A simple gut-check', text:'Add up what you\'d actually spend on rideshares, transit passes, and occasional rentals in a typical month. If that number is already close to what a modest car payment plus insurance would cost, ownership may make more financial sense than it first appears — and vice versa.'}},
    {h:'The true cost of owning a vehicle', p:[
      'The purchase price — or monthly payment — is only one piece of what a vehicle actually costs. Insurance, fuel, maintenance, registration, and depreciation all show up whether or not you\'re thinking about them, and together they often add up to more than the payment itself.',
      'Building a full monthly picture before you buy — not after — is what separates people who feel financially in control of their vehicle from people who feel blindsided by it every few months.',
    ], table:{headers:['Cost Category','What It Covers','Typical Monthly Range'], rows:[
      ['Loan or lease payment','Financing the vehicle itself','Varies by price, term, and rate'],
      ['Insurance','Legally required coverage plus protection for you and the car','$100–$250+'],
      ['Fuel or charging','Getting around day to day','$100–$250'],
      ['Maintenance & repairs','Oil changes, tires, brakes, unexpected fixes','$50–$150 (averaged)'],
      ['Registration & fees','Legal right to drive the vehicle','Varies — often annual, budget monthly'],
      ['Parking','Where applicable — a permit, a spot, a garage','$0–$200+'],
    ]}},
    {mini:true, q:'Which of these is most often left out of a first-time buyer\'s budget?', options:['The monthly loan payment','Maintenance, fuel, and insurance combined'], correct:1, explain:'The payment is the easy number to find — the ongoing costs around it are what actually surprise first-time owners.'},
    {h:'New vs. used — the real trade-offs', p:[
      'A new vehicle comes with a full warranty, the latest safety features, and zero prior wear — but it also loses value fastest in its first few years, a cost called depreciation that you pay even if you never sell it. A used vehicle, especially one two to five years old, has already absorbed that steepest drop in value, often for a meaningfully lower price with years of reliable life left.',
      'For a first vehicle, a well-inspected used car is frequently the more practical starting point — it lowers both the purchase price and the insurance cost, while still giving you a dependable vehicle if you choose carefully.',
    ], callout:{type:'fact', title:'Did You Know?', text:'A new vehicle typically loses a significant portion of its value within the first year alone, and continues depreciating quickly through year three — which is exactly the window many used-car buyers target to get a newer vehicle at a meaningfully lower price.'}},
    {h:'Financing vs. leasing vs. paying outright', p:[
      'Paying outright means no interest and no monthly payment, but it ties up a large amount of cash at once. Financing (a loan) spreads the cost over time in exchange for interest, and once the loan is paid off, the vehicle is fully yours. Leasing is essentially a long-term rental — lower monthly payments, but you don\'t own the car at the end, and mileage limits and wear-and-tear charges can add unexpected costs.',
      'For a first vehicle intended to last several years, financing (if you can\'t pay cash) or paying outright (if you genuinely can, without draining your emergency fund) usually make more sense than leasing, which tends to fit people who want a new vehicle every few years, not someone building long-term ownership.',
    ], list:['Paying outright: no interest, full ownership immediately, requires the most cash upfront','Financing: builds ownership over time, requires a down payment and monthly payments plus interest','Leasing: lowest monthly cost, but no ownership, mileage limits, and extra fees at lease-end']},
    {h:'Interest rates, loan terms, and what your payment actually means', p:[
      'A loan\'s monthly payment is driven by three things: how much you borrow, your interest rate, and your loan term (how many months you\'re paying it off). A longer term lowers the monthly payment but increases the total interest you pay over the life of the loan — sometimes substantially.',
      'It\'s worth resisting the urge to shop by monthly payment alone. A dealer can make almost any car "fit" your target monthly number simply by stretching the term longer — which can mean paying thousands more in interest for a payment that looks similar.',
    ], callout:{type:'example', title:'Same car, different term', text:'Financing $18,000 at 7% interest over 4 years costs meaningfully less in total interest than financing the same amount over 6 years — even though the 6-year payment looks smaller each month. Always compare the total cost, not just the monthly number.'}},
    {h:'Building credit — and how it shapes your rate', p:[
      'Your credit score is one of the biggest factors in the interest rate a lender offers you. A stronger credit history typically unlocks a meaningfully lower rate, which can save real money over the life of the loan — sometimes more than negotiating the purchase price itself.',
      'If your credit is still thin or new, a few honest options exist: a co-signer with stronger credit, a larger down payment to lower the lender\'s risk, or simply waiting a few months while you build a short track record of on-time payments elsewhere.',
    ], callout:{type:'protip', title:'Pro Tip', text:'Get pre-approved for a loan through your own bank or credit union before you ever visit a dealership. Walking in with a real, comparison-ready rate in hand means the dealer\'s financing has to beat it — not just sound reasonable.'}},
    {h:'Shopping for a vehicle', p:[
      'Start with a realistic list: your budget ceiling (including all the ongoing costs above, not just the payment), the body style you actually need, and two or three specific models known for reliability in that category. Cross-shopping a few real listings, rather than falling for the first car that "feels right," is what keeps the process from becoming an emotional decision.',
    ]},
    {mini:true, q:'Why is it risky to shop for a car by "monthly payment" alone?', options:['Payments are always fixed by law','A longer loan term can lower the payment while increasing total interest paid','Monthly payments never include interest'], correct:1, explain:'Stretching the loan term can make almost any car "fit" a target monthly payment — while quietly increasing how much you pay in total.'},
    {h:'Dealership vs. private seller', p:[
      'A dealership typically offers more consumer protection, financing on-site, and sometimes a limited warranty on used vehicles — often for a somewhat higher price. A private seller is often cheaper and more negotiable, but offers no formal protections, so the burden of inspection and verification falls entirely on you.',
      'Neither option is automatically the "right" one — a private-sale deal that\'s been properly inspected and history-checked can be an excellent value, while a dealership purchase gives more built-in peace of mind for a first-time buyer who\'d rather not do all the verification alone.',
    ]},
    {h:'Inspecting a used vehicle before you commit', p:[
      'Never buy a used vehicle you (or someone you trust) hasn\'t physically inspected and, ideally, test-driven. A independent mechanic\'s pre-purchase inspection — usually a modest flat fee — is one of the highest-value steps in this entire process, because it can surface expensive problems a casual look would miss entirely.',
    ], list:['Check for uneven tire wear, which can signal alignment or suspension issues','Look under the vehicle for fluid leaks','Test all electronics — windows, lights, AC/heat, infotainment','Listen for unusual engine noises at idle and while driving','Check that the VIN on the dashboard matches the title and registration','Take it on a real test drive, including highway speed if possible']},
    {h:'Vehicle history reports, recalls, liens, and red flags', p:[
      'Before buying any used vehicle, run its VIN through a vehicle history report — it can reveal prior accidents, flood or fire damage, odometer inconsistencies, and how many previous owners it\'s had. Separately, check for open safety recalls (often free to search by VIN) and confirm there\'s no outstanding lien, which could mean the seller doesn\'t actually have clear legal ownership to sell it to you.',
    ], callout:{type:'mistake', title:'Common Mistake: Skipping the lien check', text:'Buying a vehicle that still has a lien against it (an unpaid loan secured by the car) can leave you owning a vehicle the bank can legally repossess, even though you paid the seller in full. A quick title/lien check before any money changes hands avoids this entirely.'}},
    {h:'Negotiating a fair price', p:[
      'Research the vehicle\'s fair market value beforehand using its year, make, model, mileage, and condition — this is your anchor number, not the sticker price. Approach the conversation calmly and be willing to walk away; that willingness alone is often what gets a seller to move on price.',
    ], callout:{type:'protip', title:'Pro Tip', text:'Negotiate the total price first, before ever discussing monthly payment or financing. Dealers sometimes prefer to negotiate the monthly number because it obscures the real total cost — keep the conversation anchored to the actual purchase price.'}},
    {h:'Registration, licensing, and the documents you need before driving away', p:[
      'Every vehicle needs to be legally registered in your name, and most places require proof of insurance before you can register or legally drive it off the lot. Exact requirements, fees, and documents vary by province or state — this section will grow with region-specific detail over time, so check your local motor vehicle authority for the current requirements where you live.',
    ], list:['Bill of sale or purchase agreement','Proof of valid insurance (usually required before registration)','The vehicle\'s title, signed over to you','A valid driver\'s license','Proof of address, if required locally','Payment for registration fees and any applicable taxes']},
    {h:'Understanding vehicle insurance', p:[
      'Insurance isn\'t optional — nearly everywhere requires at least a minimum level of coverage before you can legally drive, and it protects you from a single accident turning into a financial catastrophe. Coverage generally breaks into a few categories, and understanding what each one actually does makes comparing quotes far less confusing.',
    ], table:{headers:['Coverage Type','What It Protects'], rows:[
      ['Liability','Damage or injury you cause to others — usually legally required'],
      ['Collision','Damage to your own vehicle from an accident, regardless of fault'],
      ['Comprehensive','Non-collision damage — theft, weather, vandalism, animals'],
      ['Uninsured/underinsured motorist','Protects you if the at-fault driver has no or insufficient insurance'],
    ]}},
    {h:'Deductibles, premiums, and comparing providers', p:[
      'Your premium is what you pay regularly for coverage; your deductible is what you pay out of pocket before insurance kicks in on a claim. A higher deductible usually lowers your premium — a reasonable trade if you have savings to cover it, riskier if you don\'t.',
      'Get quotes from at least three providers using identical coverage levels so you\'re comparing like for like, not just the lowest headline number. Ask specifically about student, safe-driver, and bundling discounts, which can meaningfully lower a first-time driver\'s premium.',
    ], callout:{type:'tip', title:'Comparing quotes fairly', text:'Two quotes with wildly different prices often reflect different coverage levels, not just different pricing. Always confirm liability limits, deductible amounts, and comprehensive/collision inclusion are identical before comparing the dollar figures.'}},
    {h:'Routine and seasonal maintenance', p:[
      'A predictable maintenance rhythm is what keeps small issues from becoming expensive ones, and it protects the vehicle\'s resale value down the line. Your owner\'s manual has the manufacturer\'s exact schedule — but a few habits apply almost universally.',
    ], timeline:[
      {label:'Every oil change interval', text:'Follow your owner\'s manual — commonly every 5,000–7,500 miles, though this varies by vehicle and oil type.'},
      {label:'Every few months', text:'Check tire pressure and tread, top off washer fluid, inspect wiper blades.'},
      {label:'Before winter', text:'Check battery health, antifreeze levels, and tire tread — cold weather is hardest on both batteries and tires.'},
      {label:'Before long trips', text:'Check tire pressure, fluid levels, and brakes before any long highway drive.'},
    ]},
    {h:'Fuel choices and ongoing operating costs', p:[
      'Fuel type (gasoline, diesel, hybrid, or electric) meaningfully affects your ongoing costs — a more fuel-efficient or electric vehicle can cost noticeably less to run day-to-day, even if the upfront price is similar or slightly higher. Factor your realistic weekly driving distance into this decision rather than the sticker efficiency number alone.',
    ]},
    {h:'What to keep inside your vehicle', p:[
      'A small, well-stocked vehicle is one of the easiest ways to turn a stressful roadside moment into a minor inconvenience.',
    ], list:['Proof of insurance and registration','A basic emergency kit — flashlight, jumper cables, a small first-aid kit','A phone charger','An ice scraper (in cold climates)','A spare tire, jack, and tire iron, confirmed to actually be in the vehicle','Emergency contact info written down, not just on a phone that could die']},
    {h:'If you\'re ever in an accident', p:[
      'The moments right after an accident feel chaotic, which is exactly why having a simple, memorized order of steps matters more than trying to think clearly from scratch in the moment.',
    ], callout:{type:'warn', title:'Heads up', text:'Check for injuries first, move to safety if possible, and call emergency services if anyone is hurt or the vehicles are blocking traffic. Exchange insurance and contact information with the other driver, take photos of all vehicles and the scene, and never admit fault at the scene — let the insurance investigation determine that.'}},
    {h:'Common mistakes first-time buyers make', p:[
      'Most first-vehicle regrets trace back to a small handful of avoidable patterns, far more often than to bad luck.',
    ], list:['Shopping by monthly payment instead of total cost','Skipping a pre-purchase inspection on a used vehicle','Underestimating insurance and maintenance costs before buying','Stretching a loan term to make an unaffordable car look affordable','Not test-driving at highway speed','Skipping the vehicle history and lien check']},
    {h:'Selling or trading in down the road', p:[
      'When it\'s eventually time to move on, you generally have two paths: sell privately, which usually nets more money but takes more effort, or trade it in toward your next vehicle, which is faster and simpler but typically offers less value. Either way, having maintenance records and a clean history report ready makes the vehicle noticeably easier to sell — and often worth more.',
    ]},
  ],
  practiceExercises:['Add up your realistic all-in monthly budget using the cost table above, before looking at a single listing','Get pre-approved for a loan quote from your own bank or credit union','Write your top 3 must-haves and 3 nice-to-haves for your first vehicle','Request insurance quotes from at least 3 providers using identical coverage levels','List what you\'d keep in your emergency kit, and confirm you actually have each item'],
  checklist:['Decide honestly whether a vehicle is the right choice right now','Build your full monthly budget, not just a target payment','Get pre-approved for financing before visiting a dealer or seller','Research fair market value for the specific vehicle you\'re considering','Get an independent pre-purchase inspection on any used vehicle','Run a vehicle history report and check for open recalls and liens','Compare at least 3 insurance quotes with identical coverage levels','Confirm all required documents before driving away','Set a maintenance reminder for your first scheduled service'],
  reflection:['Do you actually need a vehicle right now, or are you buying one out of habit or pressure?','What\'s your honest, all-in monthly budget — not just what you wish it were?','What would make you walk away from a deal, no matter how good it initially looks?','Who could you ask to look over a used vehicle with you before you commit?'],
  quiz:[
    {q:'What is usually the biggest hidden cost first-time buyers underestimate?', options:['The purchase price','Insurance, fuel, and maintenance combined','Registration fees','Sales tax'], correct:1, explain:'The ongoing costs around a vehicle often add up to more than people expect, well beyond the payment or price tag.'},
    {q:'Why can a longer loan term be risky, even with a lower monthly payment?', options:['It\'s illegal in most places','It usually increases the total interest paid over the life of the loan','It automatically raises your insurance','It has no real downside'], correct:1, explain:'A longer term spreads the same loan over more months, often at real cost — more total interest — even though the monthly number looks smaller.'},
    {q:'What does a pre-purchase inspection help you avoid?', options:['Paying sales tax','Buying a used vehicle with expensive hidden problems','Needing insurance','Registering the vehicle'], correct:1, explain:'An independent mechanic can catch issues a casual look or test drive would miss, often for a small flat fee relative to the risk.'},
    {q:'What should you check before buying a used vehicle to avoid inheriting someone else\'s unpaid loan?', options:['The color history','Whether there\'s an outstanding lien on the title','The number of previous owners only','The paint code'], correct:1, explain:'A lien means the vehicle can legally be repossessed even after you\'ve paid the seller — always confirm the title is clear first.'},
    {q:'What should you do immediately after any accident, before anything else?', options:['Post about it on social media','Check for injuries and move to safety if possible','Immediately admit fault to speed things up','Drive away if the damage looks minor'], correct:1, explain:'Safety comes first — checking for injuries and getting out of traffic matters more than anything else in the first moments.'},
    {q:'What\'s a smart move to make before ever visiting a dealership?', options:['Deciding on a monthly payment only','Getting pre-approved for financing through your own bank or credit union','Skipping insurance research until after buying','Avoiding test drives to save time'], correct:1, explain:'Walking in with your own pre-approved rate means dealer financing has to beat a real number, not just sound reasonable.'},
  ],
  faq:[
    {q:'Should I buy new or used for my first vehicle?', a:'A well-inspected used vehicle, roughly two to five years old, is often the more practical starting point — it avoids the steepest depreciation while still offering years of reliable use.'},
    {q:'How much car can I actually afford?', a:'Build your full monthly picture first — payment, insurance, fuel, and maintenance together — rather than stretching a loan term to hit a payment that looks affordable in isolation.'},
    {q:'Do I really need a pre-purchase inspection?', a:'Yes, for any used vehicle — it\'s a small cost relative to the risk of discovering an expensive problem after you\'ve already paid.'},
    {q:'What\'s the minimum insurance I need?', a:'Requirements vary by where you live, but nearly everywhere requires at least liability coverage before you can legally register and drive — check your local requirements for the current minimum.'},
    {q:'What if my credit isn\'t strong enough for a good rate yet?', a:'A co-signer, a larger down payment, or simply waiting while you build a short track record of on-time payments elsewhere can all meaningfully improve the rate you\'re offered.'},
  ],
  takeaways:['Work out your full monthly cost — insurance, fuel, and maintenance included — before you shop, not after.','A longer loan term can lower your payment while quietly increasing your total interest paid.','Never buy a used vehicle without an independent inspection and a vehicle history/lien check.','Get pre-approved for financing before visiting a dealer, so you have a real number to compare against.','Compare insurance quotes with identical coverage levels, not just the lowest headline price.','A simple maintenance rhythm protects both your safety and your vehicle\'s resale value.'],
  download:'vehicle-purchase-checklist', journeys:['becoming-independent'], nextInJourney:null,
},

];

/* Helper: fetch a playbook by slug */
function getPlaybook(slug){ return PLAYBOOKS.find(p=>p.slug===slug); }
function getPlaybooksByJourney(key){ return PLAYBOOKS.filter(p=>p.journeys.includes(key)); }

/* ===================================================================
   RELATED PLAYBOOKS — curated, not just "same category" filtering.
   Every Playbook maps to real, existing slugs so "Keep Going" and
   "Related Playbooks" can never render an empty recommendation section.
   =================================================================== */
const RELATED_PLAYBOOKS = {
  'resume': ['cover-letter','interview-skills','networking'],
  'cover-letter': ['resume','interview-skills','networking'],
  'interview-skills': ['resume','cover-letter','salary-negotiation'],
  'networking': ['internships','professional-growth','interview-skills'],
  'salary-negotiation': ['interview-skills','professional-growth','financial-planning'],
  'first-day': ['professional-growth','networking','time-management'],
  'professional-growth': ['salary-negotiation','networking','first-day'],
  'budgeting': ['emergency-funds','credit-scores','bank-accounts'],
  'bank-accounts': ['budgeting','credit-scores','emergency-funds'],
  'credit-scores': ['budgeting','financial-planning','first-vehicle'],
  'taxes': ['budgeting','credit-scores','financial-planning'],
  'emergency-funds': ['budgeting','investing-basics','financial-planning'],
  'investing-basics': ['emergency-funds','financial-planning','budgeting'],
  'financial-planning': ['investing-basics','emergency-funds','credit-scores'],
  'scholarships': ['time-management','study-skills','financial-planning'],
  'time-management': ['study-skills','graduation-planning','mental-wellness'],
  'study-skills': ['time-management','scholarships','managing-anxiety'],
  'mental-wellness': ['managing-anxiety','time-management','study-skills'],
  'managing-anxiety': ['mental-wellness','interview-skills','time-management'],
  'apartment-renting': ['emergency-funds','bank-accounts','first-vehicle','graduation-planning'],
  'internships': ['resume','networking','professional-growth'],
  'graduation-planning': ['time-management','apartment-renting','financial-planning'],
  'first-vehicle': ['budgeting','credit-scores','emergency-funds'],
};
function getRelatedPlaybooks(slug){
  return (RELATED_PLAYBOOKS[slug]||[]).map(getPlaybook).filter(Boolean);
}

/* ===================================================================
   LEARNING PATHS
   Each path organizes real, existing Playbooks into a structured journey
   toward a meaningful outcome. skillsGained is editorial (written once,
   not invented per-user); estimatedCompletion is computed live from real
   completionTime fields via pathEstimatedTime() in app.js, never hardcoded.
   =================================================================== */
const LEARNING_PATHS = [
  {
    key:'career-readiness', title:'Career Readiness', icon:'💼', color:'blue', status:'live',
    desc:'From your first resume to your first raise conversation — everything you need to land and grow in your first real job.',
    skillsGained:['Writing resumes & cover letters that get read','Interviewing with real confidence','Building genuine professional relationships','Negotiating your first offer'],
    steps:['resume','cover-letter','interview-skills','networking','salary-negotiation','first-day','professional-growth','internships'],
  },
  {
    key:'financial-confidence', title:'Financial Confidence', icon:'💰', color:'yellow', status:'live',
    desc:'Budgeting, banking, credit, taxes, and investing — the full financial picture, explained without jargon.',
    skillsGained:['Building a real, working budget','Understanding credit and how it\'s built','Filing taxes without panic','Getting started with investing'],
    steps:['budgeting','bank-accounts','credit-scores','taxes','emergency-funds','investing-basics','financial-planning'],
  },
  {
    key:'university-success', title:'University Success', icon:'🎓', color:'navy', status:'live',
    desc:'Scholarships, study skills, and internships — a guided path through school and into what comes next.',
    skillsGained:['Finding and winning scholarships','Studying effectively, not just longer','Managing time across school and life','Planning your first steps after graduation'],
    steps:['scholarships','time-management','study-skills','internships','graduation-planning'],
  },
  {
    key:'workplace-communication', title:'Workplace Communication', icon:'💬', color:'blue', status:'live',
    desc:'The people-skills side of work — networking, first impressions, and advocating for yourself.',
    skillsGained:['Networking without the awkwardness','Making a strong first impression','Communicating for long-term growth','Advocating for yourself at work'],
    steps:['networking','first-day','professional-growth','salary-negotiation'],
  },
  {
    key:'becoming-independent', title:'Becoming Independent', icon:'🗝️', color:'navy', status:'live',
    desc:'Moving out and running your own household for the first time — the practical, grown-up logistics of daily life.',
    skillsGained:['Renting your first apartment with confidence','Building an emergency fund','Choosing and using bank accounts wisely','Buying and maintaining your first vehicle','Planning your next chapter with intention'],
    steps:['apartment-renting','emergency-funds','bank-accounts','first-vehicle','graduation-planning'],
  },
  {
    key:'mental-wellness-path', title:'Mental Wellness & Resilience', icon:'🌱', color:'navy', status:'live',
    desc:'A focused, early path on resilience and wellbeing — still growing as more Playbooks join it.',
    skillsGained:['Spotting burnout before it takes over','Calming anxiety before big moments','Building sustainable, everyday coping habits'],
    steps:['mental-wellness','managing-anxiety'],
  },
];

// Additional journeys referenced by the brand vision, launching as content is written —
// shown honestly as "Coming Soon" rather than populated with placeholder lessons.
const LEARNING_PATHS_COMING_SOON = [
  {key:'leadership', title:'Leadership', icon:'🌟', color:'yellow', desc:'Public speaking, decision-making, and leading a team or project for the first time.'},
  {key:'entrepreneurship', title:'Starting a Business', icon:'💡', color:'blue', desc:'From first idea to first customer — the fundamentals of youth entrepreneurship.'},
];

/* Helper: fetch a Learning Path by key */
function getPath(key){ return LEARNING_PATHS.find(lp=>lp.key===key); }

/* ===================================================================
   ASSESSMENT-DRIVEN RECOMMENDATIONS
   Shared between assessment.html, dashboard.html, and Orbit so a
   learner's results personalize every corner of the platform the
   same way, not just the results page they see once.
   =================================================================== */
const SECTION_RECS = {
  career:{playbooks:['resume','interview-skills','networking'], program:'career-bootcamp', path:'career-readiness'},
  money:{playbooks:['budgeting','credit-scores'], program:'financial-literacy-academy', path:'financial-confidence'},
  school:{playbooks:['scholarships','study-skills'], program:null, path:'university-success'},
  home:{playbooks:['apartment-renting'], program:null, path:'becoming-independent'},
  health:{playbooks:['managing-anxiety','mental-wellness'], program:null, path:'mental-wellness-path'},
  relationships:{playbooks:['networking'], program:null, path:'workplace-communication'},
  growth:{playbooks:['time-management','graduation-planning'], program:'future-leaders', path:'career-readiness'},
  community:{playbooks:['scholarships'], program:'volunteer-hub', path:null},
};

const STAGES = [
  {min:0, label:'Explorer', icon:'🌱', desc:'You\'re just starting to explore what adulthood involves — and that\'s exactly the right place to begin.'},
  {min:40, label:'Navigator', icon:'🧭', desc:'You\'ve got some direction already. A bit of focused learning will build real momentum.'},
  {min:60, label:'Builder', icon:'🛠️', desc:'You\'re actively building real skills. A few targeted Playbooks will round things out.'},
  {min:80, label:'Trailblazer', icon:'🚀', desc:'You\'re genuinely ahead of the curve. Consider mentoring others through the Mentorship Network.'},
];
function getStage(pct){ return STAGES.slice().reverse().find(s=>pct>=s.min); }

const SECTION_META = {
  career:{title:'Career & Work', icon:'💼'}, money:{title:'Money & Finance', icon:'💰'},
  school:{title:'School & Learning', icon:'🎓'}, home:{title:'Home & Independence', icon:'🏠'},
  health:{title:'Health & Wellness', icon:'🌿'}, relationships:{title:'Relationships & Communication', icon:'💬'},
  growth:{title:'Growth & Leadership', icon:'🚀'}, community:{title:'Community & Purpose', icon:'🌍'},
};

/* Given saved sectionScores, returns the weakest section's key — the
   same "Focus Area" logic the Passport uses for its own Next Step. */
function weakestAssessmentSection(sectionScores){
  if(!sectionScores) return null;
  const keys = Object.keys(sectionScores);
  if(!keys.length) return null;
  return keys.reduce((a,b)=> sectionScores[a]<=sectionScores[b] ? a : b);
}

/* ===================================================================
   PROGRAMS — all fully digital / live-online
   =================================================================== */
const PROGRAMS = [
  {
    id:'career-bootcamp', title:'Career Bootcamp', icon:'💼', color:'blue', difficulty:'Beginner–Intermediate',
    duration:'6 weeks · 2 live sessions/week', format:'Virtual cohort · Live via Zoom · Worldwide',
    tagline:'A focused 6-week sprint from "I have no idea how to get a job" to "I have interviews booked."',
    whoFor:'Anyone applying for their first job, or their first job in a new field — no resume or interview experience required.',
    prerequisites:'None. This is designed for a true first-time job search.',
    commitment:'~3–4 hours/week (2 live sessions + light homework between them)',
    overview:'Career Bootcamp is a live, cohort-based program that walks you through the entire first-job process — resume, cover letter, interview prep, and outreach — alongside a small group of peers on the same timeline. Every session is hosted live over Zoom and recorded for replay, so you can join from anywhere in the world, in your own time zone.',
    outcomes:['Build a resume and cover letter that pass real ATS screening','Practice interviews live in small breakout groups','Send your first 10 networking or application messages with confidence','Leave with a personalized 30-day job search action plan'],
    modules:[
      {title:'Week 1 — Resume Foundations', desc:'Build your resume from scratch using the WRLD framework; live Q&A on formatting and ATS.'},
      {title:'Week 2 — Cover Letters & Applications', desc:'Draft a reusable base cover letter and apply it to two real job postings.'},
      {title:'Week 3 — Interview Skills I', desc:'Learn the STAR method and prepare answers for the 8 most common questions.'},
      {title:'Week 4 — Interview Skills II', desc:'Live mock interviews in small breakout rooms with peer and facilitator feedback.'},
      {title:'Week 5 — Networking & Outreach', desc:'Write outreach messages and practice a 60-second self-introduction.'},
      {title:'Week 6 — Your 30-Day Plan', desc:'Build a personalized action plan and celebrate the cohort\'s progress together.'},
    ],
    projects:['A completed, application-ready resume and cover letter','A recorded practice interview with self-review notes','A personal 30-day job search action plan'],
    downloads:['resume-template','cover-letter-template','interview-worksheet','career-roadmap'],
    faqs:[
      {q:'Is this really free?', a:'Yes — every WRLD program is completely free, including live sessions, replays, and downloadable workbooks.'},
      {q:'What if I can\'t make a live session?', a:'Every session is recorded and added to your replay library within 24 hours, so you never lose your spot in the cohort.'},
      {q:'Do I need any experience already?', a:'No — Career Bootcamp is designed for people applying for their first job, with no assumed experience.'},
    ],
  },
  {
    id:'financial-literacy-academy', title:'Financial Literacy Academy', icon:'💰', color:'yellow', difficulty:'Beginner',
    duration:'8 weeks · Self-paced with live check-ins', format:'Self-paced modules + live virtual Q&A · Worldwide',
    tagline:'Budgeting, credit, taxes, and investing basics — from zero to genuinely confident.',
    whoFor:'Anyone who feels lost with money — whether you\'ve never budgeted before or just want a more structured, complete foundation.',
    prerequisites:'None. Starts from absolute basics.',
    commitment:'~2–3 hours/week, fully self-paced with optional live Q&A',
    overview:'Financial Literacy Academy combines self-paced learning modules with live, optional Q&A sessions so you can move at your own speed while still getting real-time answers to your questions. It covers the full arc of the Financial Confidence Journey in a structured, supported format.',
    outcomes:['Build and maintain a working monthly budget','Understand credit, and start building it safely','File a simple tax return without panic','Understand the basics of saving and investing for the long term'],
    modules:[
      {title:'Module 1 — Budgeting Foundations', desc:'The 50/30/20 framework and building a budget that survives real life.'},
      {title:'Module 2 — Banking & Credit', desc:'Choosing accounts, understanding fees, and building credit safely.'},
      {title:'Module 3 — Taxes Demystified', desc:'A calm walkthrough of your first tax return, step by step.'},
      {title:'Module 4 — Emergency Funds & Saving', desc:'Building a safety net from zero, one small deposit at a time.'},
      {title:'Module 5 — Investing Basics', desc:'What investing actually is, and how to start small and early.'},
      {title:'Module 6 — Your Financial Plan', desc:'Pulling it all together into a simple, personal long-term plan.'},
    ],
    projects:['A completed monthly budget using your own real numbers','An emergency fund starter plan','A one-page personal financial plan'],
    downloads:['budget-planner','expense-tracker','tax-checklist','emergency-fund-calculator'],
    faqs:[
      {q:'Do I need to know anything about money already?', a:'No prior knowledge assumed — this program starts from the very basics.'},
      {q:'Are the live Q&A sessions required?', a:'They\'re optional but recommended — the self-paced modules stand on their own if your schedule doesn\'t allow live attendance.'},
    ],
  },
  {
    id:'future-leaders', title:'Future Leaders', icon:'🌟', color:'blue', difficulty:'Intermediate',
    duration:'10 weeks · 1 live session/week', format:'Virtual cohort · Live via Zoom · Worldwide',
    tagline:'Public speaking, leadership, and community-building for young people ready to step up.',
    whoFor:'Young people who want to build real leadership and communication skills — whether or not you already hold a formal leadership role.',
    prerequisites:'None, though a willingness to speak and practice live in small groups helps.',
    commitment:'~2–3 hours/week across the 10-week program',
    overview:'Future Leaders is a live, discussion-based cohort program for young people who want to build real leadership and communication skills — whether that\'s leading a school club, a team at work, or a community project. Sessions blend short teaching segments with live practice and peer feedback.',
    outcomes:['Deliver a short talk with confidence and clear structure','Facilitate a group discussion or meeting effectively','Give and receive constructive feedback','Design a small community or leadership project'],
    modules:[
      {title:'Week 1–2 — Finding Your Voice', desc:'The fundamentals of public speaking and structuring a message.'},
      {title:'Week 3–4 — Leading Without a Title', desc:'Influence, initiative, and leading peers without formal authority.'},
      {title:'Week 5–6 — Facilitation Skills', desc:'Running a meeting or discussion that actually gets somewhere.'},
      {title:'Week 7–8 — Giving and Receiving Feedback', desc:'Practicing direct, kind feedback in live small groups.'},
      {title:'Week 9–10 — Your Leadership Project', desc:'Designing and presenting a small real-world leadership project.'},
    ],
    projects:['A recorded 3-minute talk','A facilitated 15-minute group discussion','A one-page leadership project proposal'],
    downloads:['goal-setting-workbook','career-planner'],
    faqs:[{q:'Do I need to already be in a leadership role?', a:'No — this program is designed for people building leadership skills from any starting point, including complete beginners.'}],
  },
  {
    id:'first-job-program', title:'First Job Program', icon:'🧳', color:'yellow', difficulty:'Beginner',
    duration:'4 weeks · Self-paced', format:'Self-paced digital workbook · Worldwide',
    tagline:'Everything for your very first job — applications, onboarding, and workplace norms nobody explains.',
    whoFor:'Anyone starting their very first job, or about to.',
    prerequisites:'None — designed for someone with zero prior workplace experience.',
    commitment:'~1–2 hours/week, fully self-paced',
    overview:'The First Job Program is a shorter, fully self-paced companion for anyone starting their very first job — covering the practical, often-unspoken parts of entering the workforce for the first time.',
    outcomes:['Understand your first paycheque and basic deductions','Navigate common first-week workplace situations with confidence','Know how and when to ask for help without feeling like a burden','Build simple habits for tracking tasks and feedback'],
    modules:[
      {title:'Week 1 — Before You Start', desc:'Paperwork, documents, and what to expect logistically.'},
      {title:'Week 2 — Your First Week', desc:'Unwritten norms, communication styles, and making a strong impression.'},
      {title:'Week 3 — Understanding Your Paycheque', desc:'Deductions, direct deposit, and reading a pay stub.'},
      {title:'Week 4 — Building Momentum', desc:'Feedback habits and setting yourself up for your first review.'},
    ],
    projects:['A personal "first week" checklist tailored to your job','A paycheque breakdown worksheet completed with your own numbers'],
    downloads:['first-paycheque-breakdown','career-roadmap'],
    faqs:[{q:'Is this different from Career Bootcamp?', a:'Career Bootcamp focuses on getting the job; First Job Program focuses on succeeding once you have it. Many people take both.'}],
  },
  {
    id:'mentorship-network', title:'Mentorship Network', icon:'🤝', color:'blue', difficulty:'All levels',
    duration:'Ongoing · 1:1 virtual matching', format:'Virtual 1:1 mentorship · Worldwide',
    tagline:'Paired, ongoing mentorship — matched thoughtfully and conducted entirely online.',
    whoFor:'Anyone who wants ongoing, personalized guidance from a volunteer mentor as they navigate a transition.',
    prerequisites:'None — just a clear sense of what kind of support you\'re looking for.',
    commitment:'~30–60 minutes every 2–4 weeks, once matched',
    overview:'The Mentorship Network pairs young people with volunteer mentors for ongoing, virtual 1:1 support. WRLD is actively building out its mentor pool — matching is opening in phases as the program grows.',
    outcomes:['Regular 1:1 conversations with a matched mentor','Personalized guidance on your specific goals','A consistent point of contact as you navigate a transition'],
    modules:[{title:'Application', desc:'Tell us about your goals and what kind of support you\'re looking for.'},{title:'Matching', desc:'We match you with a mentor based on your goals and availability.'},{title:'Ongoing sessions', desc:'Regular virtual check-ins, scheduled around both time zones.'}],
    projects:[], downloads:['goal-setting-workbook'],
    sampleStatus:'coming-soon',
    faqs:[{q:'Is the mentor network live yet?', a:'Mentor matching is launching in phases as WRLD builds its volunteer mentor community — join the waiting list to be notified as spots open.'}],
  },
  {
    id:'volunteer-hub', title:'Volunteer Hub', icon:'🌍', color:'yellow', difficulty:'All levels',
    duration:'Ongoing', format:'Virtual + self-directed opportunities · Worldwide',
    tagline:'Find and log meaningful volunteer opportunities, anywhere you are.',
    whoFor:'Anyone looking to build community involvement, scholarship-ready experience, or simply give back.',
    prerequisites:'None.',
    commitment:'As much or as little as you choose — fully self-directed',
    overview:'Volunteer Hub helps you find virtual and local volunteer opportunities and keep a running log of your hours and impact — useful for scholarship applications, resumes, and simply building community involvement.',
    outcomes:['A running, exportable log of volunteer hours','A curated list of virtual volunteering opportunities','A simple system for reflecting on your volunteer experience'],
    modules:[{title:'Explore', desc:'Browse virtual and remote-friendly volunteer opportunities.'},{title:'Log', desc:'Track your hours and role using the Volunteer Log worksheet.'},{title:'Reflect', desc:'Use guided reflection prompts to turn hours into a compelling story for applications.'}],
    projects:['A personal volunteer log with at least one logged opportunity'], downloads:['volunteer-log'],
    faqs:[{q:'Does WRLD run its own volunteer placements yet?', a:'Not yet — Volunteer Hub currently curates external opportunities and provides tracking tools; direct WRLD placements are a future goal.'}],
  },
  {
    id:'youth-entrepreneurship', title:'Youth Entrepreneurship', icon:'💡', color:'blue', difficulty:'Intermediate',
    duration:'8 weeks · 1 live session/week', format:'Virtual cohort · Live via Zoom · Worldwide',
    tagline:'Build, pitch, and launch your first business idea alongside a live cohort.',
    whoFor:'Anyone with a business idea (or just curiosity about entrepreneurship) who wants a structured, low-cost way to test it.',
    prerequisites:'None — no existing business or capital required.',
    commitment:'~3 hours/week across the 8-week program',
    overview:'Youth Entrepreneurship walks a small live cohort from an early idea through to a real pitch, covering validation, basic financial planning, and simple marketing — grounded in realistic, small-scale first ventures rather than abstract theory.',
    outcomes:['Validate a business idea with real, low-cost research','Build a one-page business plan','Understand basic pricing and simple bookkeeping','Deliver a live pitch to the cohort'],
    modules:[
      {title:'Week 1–2 — Finding and Testing an Idea', desc:'Idea generation and cheap, fast ways to validate demand.'},
      {title:'Week 3–4 — Planning', desc:'Building a simple one-page business plan and basic pricing.'},
      {title:'Week 5–6 — Getting Your First Customer', desc:'Low-cost marketing and outreach for a brand-new business.'},
      {title:'Week 7–8 — Pitch & Launch', desc:'Preparing and delivering a live pitch, and planning next steps.'},
    ],
    projects:['A one-page business plan','A live 3-minute pitch'], downloads:['goal-setting-workbook','career-planner'],
    faqs:[{q:'Do I need money to start?', a:'No — the program specifically focuses on low-cost validation and lean starting approaches.'}],
  },
  {
    id:'summer-leadership-institute', title:'Summer Leadership Institute', icon:'🏕️', color:'yellow', difficulty:'Intermediate',
    duration:'2 weeks · Immersive, daily live sessions', format:'Virtual intensive · Live via Zoom · Worldwide',
    tagline:'An immersive, two-week virtual intensive in leadership and personal growth.',
    whoFor:'Students who want to go deep on leadership during a school break, in a more intensive format than Future Leaders.',
    prerequisites:'None, though availability for daily live sessions across the 2 weeks is required.',
    commitment:'~2 hours/day, daily, for 2 weeks',
    overview:'Summer Leadership Institute compresses core leadership and personal growth material into an intensive two-week virtual experience with daily live sessions, small group work, and a culminating project — designed for students who want to go deep during a school break.',
    outcomes:['Complete an intensive leadership curriculum in two weeks','Build a small group project with peers from around the world','Present a final project to the full cohort'],
    modules:[{title:'Week 1', desc:'Core leadership, communication, and self-awareness sessions, daily.'},{title:'Week 2', desc:'Small group project work culminating in a final live presentation.'}],
    projects:['A group leadership project, presented live in week 2'], downloads:['goal-setting-workbook'],
    faqs:[{q:'Is this the same as Future Leaders?', a:'Future Leaders is a 10-week program with one session weekly; Summer Leadership Institute is a shorter, more intensive daily format designed for school breaks.'}],
  },
];
function getProgram(id){ return PROGRAMS.find(p=>p.id===id); }

/* ===================================================================
   DOWNLOADS / WORKSHEET TEMPLATES
   =================================================================== */
const DOWNLOADS = [
  {type:'resume-template', title:'Resume Template', icon:'📄', pillar:'work', desc:'A clean, ATS-friendly resume template with example bullet points.'},
  {type:'cover-letter-template', title:'Cover Letter Template', icon:'✉️', pillar:'work', desc:'A three-paragraph structure you can personalize for any role.'},
  {type:'scholarship-tracker', title:'Scholarship Tracker', icon:'🎓', pillar:'learning', desc:'Track deadlines, requirements, and submission status in one place.'},
  {type:'budget-planner', title:'Monthly Budget Planner', icon:'📊', pillar:'resilience', desc:'A 50/30/20-style monthly budget you fill in by hand or print.'},
  {type:'expense-tracker', title:'Expense Tracker', icon:'🧾', pillar:'resilience', desc:'A simple weekly expense log to build spending awareness.'},
  {type:'interview-worksheet', title:'Interview Notes Worksheet', icon:'🎤', pillar:'work', desc:'STAR-method prep sheet for your top interview stories.'},
  {type:'networking-planner', title:'Networking Planner', icon:'🤝', pillar:'work', desc:'Track outreach messages, follow-ups, and key contacts.'},
  {type:'career-roadmap', title:'Career Roadmap', icon:'🧭', pillar:'work', desc:'Map your 1-year and 3-year career goals on one page.'},
  {type:'goal-setting-workbook', title:'Goal Setting Workbook', icon:'🎯', pillar:'development', desc:'A guided workbook for setting and tracking meaningful goals.'},
  {type:'apartment-checklist', title:'Apartment Search Checklist', icon:'🏠', pillar:'development', desc:'What to check, ask, and compare before signing a lease.'},
  {type:'grocery-budget-sheet', title:'Grocery Budget Sheet', icon:'🛒', pillar:'resilience', desc:'Plan and track weekly grocery spending without overthinking it.'},
  {type:'student-planner', title:'Student Planner', icon:'🗓️', pillar:'learning', desc:'A weekly planner built around active recall and spaced review.'},
  {type:'habit-tracker', title:'Habit Tracker', icon:'✅', pillar:'resilience', desc:'A simple monthly grid for building one habit at a time.'},
  {type:'emergency-fund-calculator', title:'Emergency Fund Calculator', icon:'🛟', pillar:'resilience', desc:'Work out a realistic first savings goal step by step.'},
  {type:'credit-building-tracker', title:'Credit Building Tracker', icon:'💳', pillar:'resilience', desc:'Track your score, utilization, and the habits that build it over time.'},
  {type:'tax-checklist', title:'Tax Checklist', icon:'🧮', pillar:'resilience', desc:'Everything to gather before filing your first tax return.'},
  {type:'first-paycheque-breakdown', title:'First Paycheque Breakdown', icon:'💵', pillar:'work', desc:'Understand exactly where your paycheque goes, line by line.'},
  {type:'salary-negotiation-worksheet', title:'Salary Negotiation Worksheet', icon:'💬', pillar:'work', desc:'Plan your target number, script, and fallback options.'},
  {type:'career-planner', title:'Career Planner', icon:'📈', pillar:'development', desc:'A broader planning sheet linking goals, skills, and next steps.'},
  {type:'volunteer-log', title:'Volunteer Log', icon:'🌍', pillar:'development', desc:'Track volunteer hours, roles, and reflections over time.'},
  {type:'vehicle-purchase-checklist', title:'Vehicle Purchase Checklist', icon:'🚗', pillar:'development', desc:'A budget worksheet plus a comparison and inspection checklist for buying your first vehicle.'},
];
function getDownload(type){ return DOWNLOADS.find(d=>d.type===type); }

/* Curated "what to do next" for each download — keeps the learning journey
   moving forward instead of ending at a printed page. Mapped by hand so it's
   always thematically real, e.g. Resume Template -> Interview Preparation. */
const DOWNLOAD_NEXT_STEP = {
  'resume-template': 'interview-skills',
  'cover-letter-template': 'interview-skills',
  'scholarship-tracker': 'study-skills',
  'budget-planner': 'credit-scores',
  'expense-tracker': 'budgeting',
  'interview-worksheet': 'salary-negotiation',
  'networking-planner': 'professional-growth',
  'career-roadmap': 'professional-growth',
  'goal-setting-workbook': 'time-management',
  'apartment-checklist': 'emergency-funds',
  'grocery-budget-sheet': 'budgeting',
  'student-planner': 'time-management',
  'habit-tracker': 'time-management',
  'emergency-fund-calculator': 'investing-basics',
  'tax-checklist': 'financial-planning',
  'first-paycheque-breakdown': 'budgeting',
  'salary-negotiation-worksheet': 'professional-growth',
  'career-planner': 'internships',
  'volunteer-log': null, // no natural Playbook follow-up — points to Community instead
  'vehicle-purchase-checklist': 'emergency-funds',
};
function getDownloadNextStep(type){
  const slug = DOWNLOAD_NEXT_STEP[type];
  return slug ? getPlaybook(slug) : null;
}

/* ===================================================================
   LIVE LEARNING — meeting platform options for Mentor Studio
   Actual scheduled sessions are never hardcoded here — WRLD never shows
   fictional workshops or fake dates. Real sessions live in localStorage
   once a Mentor publishes one (see getLiveSessions() in app.js) and are
   read live by events.html and mentor-studio.html.
   =================================================================== */
const MEETING_PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Other'];

/* ===================================================================
   COMMUNITY
   =================================================================== */
const COMMUNITY_FEATURES = [
  {title:'Community Commons', icon:'💬', status:'live', desc:'Ask questions and swap encouragement with other learners — unlocked once you complete your first Playbook.', anchor:'#discussion'},
  {title:'Playbook Discussions', icon:'📖', status:'live', desc:'Every Playbook has its own Q&A at the bottom — ask something specific to exactly what you\'re studying.', href:'playbooks.html'},
  {title:'Office Hours', icon:'🕐', status:'live', desc:'Recurring virtual office hours to ask questions live, no appointment required.', anchor:'#office-hours'},
  {title:'Volunteer Opportunities', icon:'🌍', status:'live', desc:'Browse and log virtual and remote-friendly volunteer opportunities via the Volunteer Hub.', anchor:'#volunteer'},
  {title:'Meet Our Mentors', icon:'🧑‍🏫', status:'live', desc:'Browse the real Mentors who\'ve joined WRLD, their bios, and areas of expertise.', anchor:'#mentor'},
  {title:'Study Groups', icon:'📚', status:'coming-soon', desc:'Form or join a small virtual study group tied to a specific course, exam, or Learning Path — rolling out in phases.', anchor:'#study-groups'},
  {title:'Accountability Partners', icon:'🧭', status:'coming-soon', desc:'Orbit-suggested pairing with another learner working toward the same goal — needs a growing, matched community to work well.', anchor:'#accountability'},
  {title:'Ask a Mentor', icon:'🤝', status:'coming-soon', desc:'Direct, matched access to a volunteer mentor — launching in phases as our mentor community grows.', anchor:'#mentor'},
  {title:'Success Stories', icon:'✨', status:'coming-soon', desc:'Real stories from real WRLD members — this section will populate honestly as the community grows.', anchor:'#success-stories'},
];

/* Community Commons categories — organized by purpose, not an endless
   general feed. 'restricted' categories can only be posted to by Mentors/
   Administrators (e.g. official announcements); everyone can still browse. */
const COMMONS_CATEGORIES = [
  {key:'introductions', label:'Introductions', icon:'👋', desc:"New here? Say hello and share a bit about what brought you to WRLD."},
  {key:'celebrations', label:'Celebrating Achievements', icon:'🎉', desc:'Finished a Playbook or hit a milestone? Share it here — this is what progress looks like.'},
  {key:'general', label:'General Questions', icon:'❓', desc:"Ask anything about adulting that doesn't fit neatly into one Playbook."},
  {key:'accountability', label:'Accountability & Study Partners', icon:'🤝', desc:'Find someone working toward the same goal to check in with.'},
  {key:'announcements', label:'Announcements', icon:'📣', desc:'Updates from the WRLD team — new features, programs, and changes.', restricted:true},
];
function getCommonsCategory(key){ return COMMONS_CATEGORIES.find(c=>c.key===key); }

/* ===================================================================
   VOLUNTEER HUB — DIRECTORY
   WRLD doesn't run its own volunteer placements yet, so this curates real,
   well-known, remote/virtual-friendly volunteering platforms rather than
   inventing WRLD-run opportunities. Every organization listed here is a
   real, established platform — never a fabricated one.
   =================================================================== */
/* Skill badges use a fixed taxonomy so students immediately understand the
   value they'll gain, rather than a different ad-hoc label per listing. */
const VOLUNTEER_SKILL_BADGES = ['Leadership','Communication','Digital Skills','Scholarship Friendly','Remote','Flexible','Teamwork','Public Speaking','Organization','Research'];

const VOLUNTEER_OPPORTUNITIES = [
  {title:'Tutor a student remotely', org:'Idealist (formerly VolunteerMatch)', category:'Tutoring & Homework Help', icon:'📖', skills:['Communication','Remote','Scholarship Friendly'], commitment:'1-2 hrs/week', url:'https://www.idealist.org/'},
  {title:'Share a professional skill with a nonprofit', org:'Catchafire', category:'Digital Skills Mentoring', icon:'💻', skills:['Leadership','Digital Skills','Flexible'], commitment:'Project-based, flexible', url:'https://www.catchafire.org/'},
  {title:'Volunteer internationally, entirely online', org:'UNV Online Volunteering', category:'Community Organizing', icon:'🌐', skills:['Organization','Remote','Teamwork'], commitment:'Flexible, task-based', url:'https://www.unv.org/become-online-volunteer'},
  {title:'Help translate materials into more languages', org:'Translators without Borders', category:'Content & Translation', icon:'✍️', skills:['Communication','Remote','Flexible'], commitment:'Flexible, project-based', url:'https://translatorswithoutborders.org/'},
  {title:'Transcribe historical documents', org:'Smithsonian Digital Volunteers', category:'Content & Translation', icon:'📜', skills:['Research','Organization','Remote'], commitment:'Self-paced', url:'https://transcription.si.edu/'},
  {title:'Support a real cause through youth campaigns', org:'DoSomething', category:'Community Organizing', icon:'🌱', skills:['Leadership','Public Speaking','Teamwork','Scholarship Friendly'], commitment:'Campaign-based, flexible', url:'https://www.dosomething.org/'},
  {title:'Help classify real research data', org:'Zooniverse', category:'Digital Skills Mentoring', icon:'🔬', skills:['Research','Digital Skills','Flexible'], commitment:'Self-paced, any amount', url:'https://www.zooniverse.org/'},
  {title:'Assist someone who is blind or low-vision via video call', org:'Be My Eyes', category:'Community Organizing', icon:'👁️', skills:['Communication','Remote','Flexible'], commitment:'On-demand, a few minutes at a time', url:'https://www.bemyeyes.com/'},
];
function volunteerCategoryList(){ return [...new Set(VOLUNTEER_OPPORTUNITIES.map(v=>v.category))]; }
