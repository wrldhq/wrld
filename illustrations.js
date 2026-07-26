/* =====================================================================
   WRLD — Illustration Gallery
   Hand-built flat-vector SVG scenes in WRLD's signature style: rounded
   geometric shapes, warm blue/gold palette, diverse simple figures, soft
   gradients — now composed as complete little scenes (environment +
   interaction + a small storytelling detail) rather than one isolated
   person or object floating on a blob. Every Playbook hero draws from
   this same reusable prop library, so the whole platform reads as one
   consistent illustrated world instead of disconnected page graphics.
   ===================================================================== */

const WRLD_SKIN = ['#F2C4A0','#C68B5E','#8D5A3B','#EAB28B','#5C3B24'];
const WRLD_HAIR = ['#1F3D4D','#3A2418','#6B3F21','#C4A27A','#2B2B2B'];

/* A simple, friendly person — head, hair, rounded body. Parameterized so
   every illustration can vary skin tone, hair, and outfit color while
   staying visually consistent. */
function personSVG(cx, cy, scale, skin, hair, outfit, pose){
  pose = pose || 'stand';
  const s = scale;
  let armPath = `M${cx-18*s},${cy+34*s} q-6,20 2,34 M${cx+18*s},${cy+34*s} q6,20 -2,34`;
  if(pose==='wave') armPath = `M${cx-18*s},${cy+34*s} q-10,10 -14,30 M${cx+18*s},${cy+34*s} q14,-6 20,-26`;
  if(pose==='typing') armPath = `M${cx-16*s},${cy+36*s} q-2,22 10,30 M${cx+16*s},${cy+36*s} q2,22 -10,30`;
  if(pose==='point') armPath = `M${cx-18*s},${cy+34*s} q-6,18 4,32 M${cx+18*s},${cy+34*s} q18,-4 30,-16`;
  if(pose==='reach') armPath = `M${cx-18*s},${cy+34*s} q-14,4 -26,-4 M${cx+18*s},${cy+34*s} q14,4 26,-4`;
  if(pose==='sit') armPath = `M${cx-18*s},${cy+34*s} q-4,16 8,26 M${cx+18*s},${cy+34*s} q4,16 -8,26`;
  return `
  <g>
    <path d="${armPath}" stroke="${outfit}" stroke-width="${9*s}" fill="none" stroke-linecap="round"/>
    <path d="M${cx-26*s},${cy+95*s} Q${cx},${cy+120*s} ${cx+26*s},${cy+95*s} L${cx+22*s},${cy+34*s} Q${cx},${cy+18*s} ${cx-22*s},${cy+34*s} Z" fill="${outfit}"/>
    <circle cx="${cx}" cy="${cy}" r="${26*s}" fill="${skin}"/>
    <path d="M${cx-26*s},${cy-6*s} Q${cx-28*s},${cy-38*s} ${cx},${cy-40*s} Q${cx+28*s},${cy-38*s} ${cx+26*s},${cy-6*s} Q${cx+18*s},${cy-20*s} ${cx},${cy-22*s} Q${cx-18*s},${cy-20*s} ${cx-26*s},${cy-6*s} Z" fill="${hair}"/>
  </g>`;
}

/* ---------------------------------------------------------------------
   SHARED SCENE PROPS
   Small, reusable environment pieces — a wall+floor, a window, a desk, a
   plant, a lamp, a stack of books — so every illustration can feel like a
   real room or place instead of a person against an empty gradient.
   --------------------------------------------------------------------- */
function roomBG(wall, floor, floorY){
  floorY = floorY || 225;
  return `<rect x="0" y="0" width="400" height="300" fill="${wall}"/><rect x="0" y="${floorY}" width="400" height="${300-floorY}" fill="${floor}"/>`;
}
function outdoorBG(sky, ground, groundY){
  groundY = groundY || 225;
  return `<rect x="0" y="0" width="400" height="300" fill="${sky}"/><rect x="0" y="${groundY}" width="400" height="${300-groundY}" fill="${ground}"/>`;
}
function windowSVG(x, y, w, h){
  w = w||64; h = h||84;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#EAF8FC" stroke="#1F3D4D" stroke-width="3"/><line x1="${x+w/2}" y1="${y}" x2="${x+w/2}" y2="${y+h}" stroke="#1F3D4D" stroke-width="2"/><line x1="${x}" y1="${y+h/2}" x2="${x+w}" y2="${y+h/2}" stroke="#1F3D4D" stroke-width="2"/>`;
}
function plantSVG(x, y, scale){
  const s = scale||1;
  return `<g>
    <path d="M${x-14*s},${y} h${28*s} l-3,${18*s} h-${22*s} z" fill="#C68B5E"/>
    <path d="M${x},${y} q-${16*s},-${18*s} -${5*s},-${40*s}" stroke="#1F9D5A" stroke-width="${5*s}" fill="none" stroke-linecap="round"/>
    <path d="M${x},${y} q${16*s},-${14*s} ${7*s},-${34*s}" stroke="#1F9D5A" stroke-width="${5*s}" fill="none" stroke-linecap="round"/>
    <path d="M${x},${y} q0,-${24*s} 0,-${44*s}" stroke="#1F9D5A" stroke-width="${5*s}" fill="none" stroke-linecap="round"/>
  </g>`;
}
function deskSVG(x, y, w){
  w = w||170;
  return `<rect x="${x}" y="${y}" width="${w}" height="12" rx="4" fill="#1F3D4D"/><rect x="${x+10}" y="${y+12}" width="9" height="46" fill="#1F3D4D" opacity=".65"/><rect x="${x+w-19}" y="${y+12}" width="9" height="46" fill="#1F3D4D" opacity=".65"/>`;
}
function laptopSVG(x, y, scale){
  const s = scale||1;
  return `<g><rect x="${x-24*s}" y="${y-18*s}" width="${48*s}" height="${28*s}" rx="3" fill="#1F3D4D"/><rect x="${x-20*s}" y="${y-14*s}" width="${40*s}" height="${20*s}" rx="2" fill="#2EA8C7"/><rect x="${x-28*s}" y="${y+10*s}" width="${56*s}" height="${6*s}" rx="3" fill="#1F3D4D"/></g>`;
}
function bookStack(x, y, colors){
  colors = colors || ['#2EA8C7','#F5CF57','#1F3D4D'];
  let out = '', yy = y;
  colors.forEach((c,i)=>{ out += `<rect x="${x-28+i*2}" y="${yy}" width="${56-i*4}" height="11" rx="2" fill="${c}"/>`; yy -= 11; });
  return out;
}
function coffeeCup(x, y){
  return `<g><rect x="${x-8}" y="${y}" width="16" height="15" rx="3" fill="white" stroke="#1F3D4D" stroke-width="2"/><path d="M${x+8},${y+3} q7,0 7,6 q0,6 -7,6" stroke="#1F3D4D" stroke-width="2" fill="none"/></g>`;
}
function frameSVG(x, y, w, h, accent){
  w = w||46; h = h||34; accent = accent || '#F5CF57';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="white" stroke="#1F3D4D" stroke-width="3"/><rect x="${x+7}" y="${y+7}" width="${w-14}" height="${h-14}" rx="2" fill="${accent}" opacity=".5"/>`;
}
function cloudSVG(x, y, scale){
  const s = scale||1;
  return `<g opacity=".85"><ellipse cx="${x}" cy="${y}" rx="${26*s}" ry="${12*s}" fill="white"/><ellipse cx="${x-13*s}" cy="${y-5*s}" rx="${15*s}" ry="${10*s}" fill="white"/><ellipse cx="${x+15*s}" cy="${y-5*s}" rx="${13*s}" ry="${9*s}" fill="white"/></g>`;
}
function treeSVG(x, y, scale){
  const s = scale||1;
  return `<g><rect x="${x-5*s}" y="${y-18*s}" width="${10*s}" height="${28*s}" fill="#C68B5E"/><circle cx="${x}" cy="${y-42*s}" r="${28*s}" fill="#1F9D5A" opacity=".85"/><circle cx="${x-16*s}" cy="${y-30*s}" r="${18*s}" fill="#1F9D5A" opacity=".7"/><circle cx="${x+17*s}" cy="${y-32*s}" r="${16*s}" fill="#1F9D5A" opacity=".7"/></g>`;
}
function pathCurve(color){
  return `<path d="M20 250q160-60 360 10" stroke="${color}" stroke-width="4" fill="none" stroke-dasharray="9 9" opacity=".45"/>`;
}
function boxSVG(x, y, w, h, color){
  w=w||44; h=h||36; color = color || '#C68B5E';
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}"/><line x1="${x}" y1="${y+h/2}" x2="${x+w}" y2="${y+h/2}" stroke="#1F3D4D" stroke-width="2" opacity=".4"/><line x1="${x+w/2}" y1="${y}" x2="${x+w/2}" y2="${y+h}" stroke="#1F3D4D" stroke-width="2" opacity=".4"/></g>`;
}

const ILLUSTRATIONS = {

  /* RESUME — a learner and a recruiter reviewing a printed resume
     together across a desk, in a real little office. */
  'resume': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(30,40,64,84)}
    ${plantSVG(340,225,0.95)}
    ${frameSVG(310,50,44,32,'#2EA8C7')}
    ${deskSVG(115,182,190)}
    <rect x="168" y="128" width="86" height="60" rx="6" fill="white" stroke="#2EA8C7" stroke-width="3"/>
    <rect x="180" y="140" width="40" height="7" rx="3" fill="#1F3D4D"/>
    <rect x="180" y="154" width="60" height="5" rx="2" fill="#EAF8FC"/>
    <rect x="180" y="164" width="50" height="5" rx="2" fill="#EAF8FC"/>
    <rect x="180" y="174" width="55" height="5" rx="2" fill="#EAF8FC"/>
    ${personSVG(140,155,0.78,'#C68B5E','#1F3D4D','#2EA8C7','point')}
    ${personSVG(285,158,0.8,'#F2C4A0','#6B3F21','#F5CF57','reach')}
    <circle cx="255" cy="118" r="14" fill="#F5CF57"/>
    <path d="M249 118l4 4 8-9" stroke="#1F3D4D" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  /* COVER LETTER — a learner at a desk drafting a letter, with a small
     "sent" paper airplane storytelling detail drifting toward the window. */
  'cover-letter': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(280,44,74,96)}
    ${plantSVG(60,222,0.9)}
    ${deskSVG(110,190,190)}
    <rect x="150" y="128" width="110" height="70" rx="6" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <path d="M150 136l55 40 55-40" fill="none" stroke="#2EA8C7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="168" y="170" width="40" height="5" rx="2" fill="#EAF8FC"/>
    <rect x="168" y="182" width="55" height="5" rx="2" fill="#EAF8FC"/>
    ${personSVG(150,165,0.85,'#EAB28B','#3A2418','#1F3D4D','typing')}
    ${coffeeCup(255,178)}
    <path d="M270 100q28-14 40 6q-10 10-24 8" fill="#F5CF57" opacity=".9"/>
    <path d="M260 96q30-20 60 10" stroke="#2EA8C7" stroke-width="2" fill="none" stroke-dasharray="3 6" opacity=".6"/>
  </svg>`,

  /* INTERVIEW SKILLS — candidate and interviewer shaking hands after a
     good conversation, chairs and a shared table between them. */
  'interview-skills': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(24,36,66,88)}
    ${frameSVG(316,44,48,34,'#F5CF57')}
    ${plantSVG(350,222,0.9)}
    <rect x="40" y="210" width="320" height="10" rx="5" fill="#1F3D4D" opacity=".12"/>
    ${personSVG(150,178,0.95,'#8D5A3B','#2B2B2B','#1F3D4D','reach')}
    ${personSVG(255,178,0.95,'#F2C4A0','#6B3F21','#F5CF57','reach')}
    <path d="M178 210q22-10 44 0" stroke="#1F3D4D" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="90" y="205" width="60" height="30" rx="8" fill="white" stroke="#2EA8C7" stroke-width="2"/>
    <rect x="255" y="205" width="60" height="30" rx="8" fill="white" stroke="#F5CF57" stroke-width="2"/>
    <circle cx="200" cy="72" r="26" fill="#2EA8C7" opacity=".18"/>
    <path d="M188 72q12-14 24 0" stroke="#2EA8C7" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="200" cy="57" r="4" fill="#2EA8C7"/>
  </svg>`,

  /* SALARY NEGOTIATION — two people at a table with a number card
     between them, mid-conversation, confident and calm. */
  'salary-negotiation': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(300,40,70,90)}
    ${plantSVG(50,222,0.85)}
    ${deskSVG(90,195,220)}
    ${personSVG(140,168,0.9,'#8D5A3B','#2B2B2B','#1F3D4D','point')}
    ${personSVG(260,168,0.9,'#F2C4A0','#6B3F21','#2EA8C7','reach')}
    <rect x="176" y="150" width="48" height="46" rx="8" fill="#F5CF57"/>
    <text x="200" y="180" font-size="24" text-anchor="middle" fill="#1F3D4D" font-family="Plus Jakarta Sans" font-weight="700">$</text>
    <path d="M170 130q30 18 60 0" stroke="#F5CF57" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`,

  /* FIRST DAY — new hire arriving to a welcoming office, a colleague
     waving hello from behind a desk with a WELCOME sign. */
  'first-day': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(300,36,68,88)}
    ${plantSVG(50,222,0.9)}
    ${frameSVG(30,60,44,32,'#2EA8C7')}
    <rect x="130" y="56" width="170" height="26" rx="8" fill="#F5CF57"/>
    <text x="215" y="74" font-size="13" text-anchor="middle" fill="#1F3D4D" font-family="Plus Jakarta Sans" font-weight="700">WELCOME</text>
    ${deskSVG(215,196,150)}
    ${personSVG(260,168,0.8,'#C68B5E','#1F3D4D','#2EA8C7','wave')}
    ${personSVG(130,205,0.9,'#F2C4A0','#6B3F21','#F5CF57','wave')}
    <rect x="100" y="230" width="30" height="24" rx="3" fill="#1F3D4D" opacity=".8"/>
  </svg>`,

  /* PROFESSIONAL GROWTH — a learner climbing bar-chart-like career
     steps toward a small flag, city skyline through the window. */
  'professional-growth': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(280,40,86,110)}
    <rect x="292" y="86" width="14" height="52" fill="#1F3D4D" opacity=".5"/>
    <rect x="312" y="70" width="14" height="68" fill="#2EA8C7" opacity=".5"/>
    <rect x="332" y="96" width="14" height="42" fill="#1F3D4D" opacity=".4"/>
    ${plantSVG(60,222,0.9)}
    <rect x="110" y="190" width="46" height="40" fill="#2EA8C7" opacity=".85"/>
    <rect x="160" y="160" width="46" height="70" fill="#2EA8C7" opacity=".95"/>
    <rect x="210" y="122" width="46" height="108" fill="#1F3D4D"/>
    <path d="M256 122l32-32M288 90h-16v16" stroke="#F5CF57" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${personSVG(233,108,0.68,'#EAB28B','#2B2B2B','#F5CF57','wave')}
  </svg>`,

  /* NETWORKING — a small mixer: three people mingling, connecting
     dotted lines, one holding a drink, one making an introduction. */
  'networking': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(24,40,60,80)}
    ${plantSVG(350,222,0.95)}
    <rect x="40" y="215" width="320" height="10" rx="5" fill="#1F3D4D" opacity=".1"/>
    ${personSVG(115,190,0.85,'#EAB28B','#3A2418','#F5CF57','wave')}
    ${personSVG(290,190,0.85,'#C68B5E','#1F3D4D','#2EA8C7','stand')}
    ${personSVG(205,135,0.7,'#F2C4A0','#2B2B2B','#1F3D4D','point')}
    <circle cx="115" cy="70" r="17" fill="white" stroke="#2EA8C7" stroke-width="2.5"/>
    <path d="M109 70h12M115 64v12" stroke="#2EA8C7" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="290" cy="80" r="13" fill="white" stroke="#F5CF57" stroke-width="2.5"/>
    <path d="M283 80h14" stroke="#F5CF57" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M135 100q40 -10 60 20" stroke="#2EA8C7" stroke-width="2" fill="none" stroke-dasharray="4 6" opacity=".6"/>
    <path d="M270 110q-30 -6 -50 20" stroke="#F5CF57" stroke-width="2" fill="none" stroke-dasharray="4 6" opacity=".7"/>
    <rect x="330" y="205" width="34" height="24" rx="4" fill="white" stroke="#1F3D4D" stroke-width="2"/>
  </svg>`,

  /* BANK ACCOUNTS — a learner at the teller counter, handing over a
     card, real bank facade with columns overhead. */
  'bank-accounts': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    <polygon points="200,50 300,100 100,100" fill="#1F3D4D"/>
    <rect x="105" y="100" width="190" height="14" fill="#2EA8C7"/>
    <rect x="122" y="120" width="15" height="66" fill="#1F3D4D"/>
    <rect x="155" y="120" width="15" height="66" fill="#1F3D4D"/>
    <rect x="228" y="120" width="15" height="66" fill="#1F3D4D"/>
    <rect x="261" y="120" width="15" height="66" fill="#1F3D4D"/>
    <rect x="100" y="192" width="200" height="14" rx="4" fill="#1F3D4D"/>
    <rect x="150" y="206" width="100" height="24" rx="4" fill="white" stroke="#1F3D4D" stroke-width="2"/>
    ${personSVG(320,238,0.72,'#C68B5E','#1F3D4D','#F5CF57','reach')}
    ${personSVG(80,238,0.72,'#F2C4A0','#6B3F21','#2EA8C7','reach')}
    <rect x="185" y="220" width="30" height="20" rx="3" fill="#F5CF57" stroke="#1F3D4D" stroke-width="2"/>
  </svg>`,

  /* CREDIT SCORES — a learner at a desk checking their score on a
     laptop, gauge dial and a confidence checkmark badge. */
  'credit-scores': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(300,40,70,90)}
    ${plantSVG(50,222,0.85)}
    ${deskSVG(95,195,215)}
    <rect x="140" y="130" width="180" height="66" rx="10" fill="#1F3D4D"/>
    <rect x="158" y="148" width="40" height="24" rx="5" fill="#F5CF57"/>
    <rect x="158" y="178" width="86" height="7" rx="3" fill="white" opacity=".85"/>
    <circle cx="280" cy="163" r="22" fill="none" stroke="#2EA8C7" stroke-width="6"/>
    <path d="M280 163 L280 145 A18 18 0 0 1 295 173 Z" fill="#2EA8C7"/>
    ${personSVG(105,168,0.75,'#8D5A3B','#2B2B2B','#2EA8C7','typing')}
    <circle cx="335" cy="95" r="18" fill="#F5CF57" opacity=".9"/>
    <path d="M326 95l6 6 11-12" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  /* BUDGETING — a learner at a desk with a laptop, a savings jar
     filling with coins, and a bank building visible through the window. */
  'budgeting': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(300,34,74,80)}
    <polygon points="337,44 358,60 316,60" fill="#1F3D4D" opacity=".6"/>
    ${plantSVG(50,222,0.9)}
    ${deskSVG(105,195,210)}
    <rect x="150" y="150" width="90" height="70" rx="10" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <ellipse cx="195" cy="150" rx="45" ry="12" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <ellipse cx="195" cy="150" rx="45" ry="12" fill="none" stroke="#2EA8C7" stroke-width="2" stroke-dasharray="3 5"/>
    <circle cx="182" cy="124" r="14" fill="#F5CF57"/>
    <circle cx="208" cy="110" r="18" fill="#F5CF57"/>
    <text x="208" y="116" font-size="14" text-anchor="middle" fill="#1F3D4D" font-family="Plus Jakarta Sans" font-weight="700">$</text>
    ${personSVG(115,170,0.8,'#F2C4A0','#6B3F21','#2EA8C7','typing')}
    ${laptopSVG(280,190,0.85)}
    ${personSVG(300,208,0.7,'#C68B5E','#1F3D4D','#F5CF57','reach')}
  </svg>`,

  /* TAXES — a real workspace: desk covered in receipts, a calculator,
     a laptop, and a learner double-checking totals. */
  'taxes': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(300,40,66,86)}
    ${plantSVG(50,222,0.85)}
    ${deskSVG(90,196,220)}
    <rect x="115" y="128" width="110" height="140" rx="10" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="132" y="148" width="55" height="7" rx="3" fill="#1F3D4D"/>
    <rect x="132" y="166" width="80" height="5" rx="2" fill="#EAF8FC"/>
    <rect x="132" y="178" width="60" height="5" rx="2" fill="#EAF8FC"/>
    <circle cx="146" cy="200" r="7" fill="#2EA8C7"/>
    <path d="M143 200l2 2 5-6" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="160" y="196" width="50" height="5" rx="2" fill="#EAF8FC"/>
    <circle cx="146" cy="220" r="7" fill="#F5CF57"/>
    <path d="M143 220l2 2 5-6" stroke="#1F3D4D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="160" y="216" width="50" height="5" rx="2" fill="#EAF8FC"/>
    <rect x="245" y="168" width="52" height="66" rx="6" fill="#1F3D4D"/>
    <rect x="253" y="178" width="36" height="18" rx="3" fill="#F5CF57"/>
    <rect x="253" y="202" width="10" height="10" fill="#2EA8C7"/>
    <rect x="267" y="202" width="10" height="10" fill="#2EA8C7"/>
    <rect x="281" y="202" width="10" height="10" fill="#2EA8C7"/>
    <rect x="253" y="216" width="10" height="10" fill="#2EA8C7"/>
    <rect x="267" y="216" width="10" height="10" fill="#2EA8C7"/>
    ${personSVG(320,206,0.7,'#8D5A3B','#3A2418','#2EA8C7','typing')}
  </svg>`,

  /* EMERGENCY FUNDS — a learner tucking savings under a protective
     umbrella, rain outside the window kept safely at bay. */
  'emergency-funds': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(280,36,80,96)}
    <line x1="292" y1="52" x2="286" y2="66" stroke="#2EA8C7" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <line x1="308" y1="48" x2="302" y2="64" stroke="#2EA8C7" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <line x1="324" y1="52" x2="318" y2="66" stroke="#2EA8C7" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    ${plantSVG(50,222,0.85)}
    <path d="M200 100c-52 0-84 42-84 74h168c0-32-32-74-84-74z" fill="#2EA8C7"/>
    <rect x="196" y="162" width="8" height="50" fill="#1F3D4D"/>
    <ellipse cx="200" cy="216" rx="16" ry="6" fill="#1F3D4D" opacity=".3"/>
    <ellipse cx="150" cy="240" rx="46" ry="30" fill="#F5CF57"/>
    <circle cx="185" cy="228" r="4" fill="#1F3D4D"/>
    <rect x="140" y="218" width="14" height="8" rx="3" fill="#F5CF57" stroke="#1F3D4D" stroke-width="2"/>
    ${personSVG(268,212,0.72,'#F2C4A0','#1F3D4D','#F5CF57','reach')}
  </svg>`,

  /* INVESTING BASICS — a learner at a desk watching a rising chart on
     a laptop, small coin stacks growing beside it. */
  'investing-basics': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(280,36,76,96)}
    ${plantSVG(50,222,0.85)}
    ${deskSVG(90,195,215)}
    <polyline points="130,175 175,150 210,163 250,120 300,95" fill="none" stroke="#2EA8C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M285 95h20v20" stroke="#2EA8C7" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="175" cy="150" r="6" fill="#1F3D4D"/>
    <circle cx="210" cy="163" r="6" fill="#1F3D4D"/>
    <circle cx="250" cy="120" r="6" fill="#1F3D4D"/>
    <circle cx="150" cy="210" r="15" fill="#F5CF57"/>
    <circle cx="172" cy="218" r="12" fill="#F5CF57" opacity=".7"/>
    ${personSVG(115,168,0.68,'#C68B5E','#2B2B2B','#1F3D4D','point')}
  </svg>`,

  /* FINANCIAL PLANNING — a learner charting a course with a compass
     and roadmap pinned above a desk. */
  'financial-planning': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(28,40,64,84)}
    ${plantSVG(345,222,0.9)}
    ${deskSVG(140,225,150)}
    <circle cx="215" cy="140" r="62" fill="white" stroke="#1F3D4D" stroke-width="4"/>
    <path d="M215 140l-21-12 7 23z" fill="#F5CF57"/>
    <path d="M215 140l21 12-7-23z" fill="#2EA8C7"/>
    <circle cx="215" cy="140" r="6" fill="#1F3D4D"/>
    <circle cx="215" cy="90" r="4" fill="#1F3D4D"/>
    <circle cx="265" cy="140" r="4" fill="#1F3D4D"/>
    <circle cx="215" cy="190" r="4" fill="#1F3D4D"/>
    <circle cx="165" cy="140" r="4" fill="#1F3D4D"/>
    ${personSVG(115,200,0.72,'#EAB28B','#3A2418','#2EA8C7','point')}
    ${bookStack(330,222,['#2EA8C7','#F5CF57'])}
  </svg>`,

  /* SCHOLARSHIPS — an advisor handing a scholarship certificate to a
     learner, a small celebratory moment. */
  'scholarships': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(300,38,68,88)}
    ${plantSVG(50,222,0.85)}
    ${personSVG(150,178,0.95,'#EAB28B','#2B2B2B','#1F3D4D','reach')}
    ${personSVG(255,178,0.85,'#8D5A3B','#3A2418','#2EA8C7','reach')}
    <rect x="180" y="168" width="46" height="34" rx="4" fill="white" stroke="#F5CF57" stroke-width="3"/>
    <path d="M188 178h30M188 188h20" stroke="#1F3D4D" stroke-width="2.5" stroke-linecap="round"/>
    <polygon points="150,96 190,112 150,128 110,112" fill="#1F3D4D"/>
    <polygon points="150,96 190,112 150,128 110,112" fill="none" stroke="#F5CF57" stroke-width="2"/>
    <rect x="146" y="112" width="8" height="30" fill="#1F3D4D"/>
    <circle cx="154" cy="146" r="6" fill="#F5CF57"/>
    <circle cx="330" cy="110" r="16" fill="#F5CF57" opacity=".5"/>
    <path d="M320 110l6 6 10-11" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  /* TIME MANAGEMENT — a learner at a desk with a big analog clock, a
     planner, and sticky-note reminders on the wall. */
  'time-management': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${frameSVG(30,50,40,40,'#F5CF57')}
    ${frameSVG(76,56,30,30,'#2EA8C7')}
    ${plantSVG(345,222,0.9)}
    ${deskSVG(140,225,175)}
    <circle cx="230" cy="140" r="66" fill="white" stroke="#1F3D4D" stroke-width="5"/>
    <path d="M230 140V95M230 140l34 18" stroke="#1F3D4D" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="230" cy="140" r="6" fill="#F5CF57"/>
    <circle cx="230" cy="80" r="4" fill="#2EA8C7"/>
    <circle cx="290" cy="140" r="4" fill="#2EA8C7"/>
    <circle cx="230" cy="200" r="4" fill="#2EA8C7"/>
    <circle cx="170" cy="140" r="4" fill="#2EA8C7"/>
    ${personSVG(150,200,0.72,'#8D5A3B','#2B2B2B','#F5CF57','point')}
  </svg>`,

  /* STUDY SKILLS — two students sharing an open book at a lamp-lit
     desk, notes and a mug close by. */
  'study-skills': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(300,38,66,84)}
    ${plantSVG(45,222,0.85)}
    ${deskSVG(90,196,220)}
    <path d="M140 132h75v90q-38-13-75 0z" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <path d="M290 132h-75v90q38-13 75 0z" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <line x1="215" y1="132" x2="215" y2="222" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="152" y="150" width="42" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="152" y="164" width="32" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="234" y="150" width="42" height="6" rx="3" fill="#EAF8FC"/>
    <circle cx="290" cy="100" r="20" fill="#F5CF57"/>
    <path d="M290 88v9M281 100h18" stroke="#1F3D4D" stroke-width="3" stroke-linecap="round"/>
    ${personSVG(105,180,0.75,'#F2C4A0','#1F3D4D','#2EA8C7','sit')}
    ${coffeeCup(320,208)}
  </svg>`,

  /* MENTAL WELLNESS — a learner walking a quiet outdoor path, journal
     in hand, trees and open sky around them. */
  'mental-wellness': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${outdoorBG('#EAF8FC','#DCEFE6')}
    ${cloudSVG(90,60,1)}
    ${cloudSVG(300,45,0.8)}
    ${treeSVG(65,235,1)}
    ${treeSVG(340,240,0.85)}
    <path d="M20 250q160-60 360 10" stroke="#1F3D4D" stroke-width="4" fill="none" stroke-dasharray="9 9" opacity=".35"/>
    ${personSVG(200,205,0.95,'#EAB28B','#2B2B2B','#1F3D4D','reach')}
    <rect x="222" y="222" width="20" height="16" rx="2" fill="#F5CF57"/>
    <path d="M150 100q10-16 26-6" stroke="#2EA8C7" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
    <path d="M280 108q-10-16-26-6" stroke="#F5CF57" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
  </svg>`,

  /* MANAGING ANXIETY — a learner sitting calmly, breathing, in a soft
     lamp-lit room with a journal and plant nearby. */
  'managing-anxiety': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(300,40,72,92)}
    ${plantSVG(50,222,1)}
    <rect x="150" y="210" width="100" height="20" rx="8" fill="#1F3D4D" opacity=".12"/>
    ${personSVG(200,195,1.05,'#F2C4A0','#1F3D4D','#F5CF57','sit')}
    <path d="M140 95q10-20 30-8" stroke="#2EA8C7" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M250 85q14-16 32 0" stroke="#2EA8C7" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
    <circle cx="120" cy="135" r="8" fill="#2EA8C7" opacity=".3"/>
    <circle cx="290" cy="125" r="6" fill="#2EA8C7" opacity=".3"/>
    <rect x="170" y="228" width="34" height="24" rx="3" fill="white" stroke="#1F3D4D" stroke-width="2"/>
    <path d="M177 236h20M177 244h14" stroke="#EAF8FC" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  /* APARTMENT RENTING — an agent showing a renter around a bright
     first apartment, moving boxes waiting by the door. */
  'apartment-renting': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#FFF9EF','#EAF8FC')}
    ${windowSVG(150,50,90,84)}
    ${plantSVG(320,222,0.95)}
    ${boxSVG(50,200,44,36,'#C68B5E')}
    ${boxSVG(95,210,36,28,'#F5CF57')}
    ${personSVG(200,190,0.85,'#8D5A3B','#2B2B2B','#2EA8C7','point')}
    ${personSVG(280,195,0.8,'#EAB28B','#6B3F21','#F5CF57','wave')}
    <rect x="150" y="220" width="90" height="10" rx="4" fill="#1F3D4D" opacity=".15"/>
    <circle cx="345" cy="90" r="14" fill="#2EA8C7" opacity=".25"/>
  </svg>`,

  /* INTERNSHIPS — a supervisor mentoring an intern at a shared desk,
     pointing something out on the screen together. */
  'internships': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${roomBG('#EAF8FC','#FFF9EF')}
    ${windowSVG(280,40,74,94)}
    ${plantSVG(50,222,0.85)}
    ${deskSVG(95,196,220)}
    <rect x="160" y="140" width="90" height="58" rx="8" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="172" y="152" width="20" height="16" fill="#2EA8C7"/>
    <rect x="200" y="152" width="20" height="16" fill="#2EA8C7"/>
    <rect x="186" y="176" width="24" height="16" fill="#F5CF57"/>
    ${personSVG(140,168,0.78,'#C68B5E','#3A2418','#2EA8C7','point')}
    ${personSVG(290,175,0.78,'#F2C4A0','#1F3D4D','#F5CF57','reach')}
    <rect x="60" y="210" width="56" height="40" rx="6" fill="#F5CF57" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="76" y="200" width="24" height="14" rx="4" fill="none" stroke="#1F3D4D" stroke-width="3"/>
  </svg>`,

  /* GRADUATION PLANNING — a graduate at a fork in the road, looking
     ahead at several signposted paths forward. */
  'graduation-planning': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${outdoorBG('#FFF9EF','#EAF8FC')}
    ${cloudSVG(80,55,0.9)}
    ${cloudSVG(320,42,0.75)}
    ${pathCurve('#1F3D4D')}
    ${personSVG(190,195,1,'#F2C4A0','#2B2B2B','#1F3D4D','wave')}
    <polygon points="190,120 240,138 190,156 140,138" fill="#1F3D4D"/>
    <polygon points="190,120 240,138 190,156 140,138" fill="none" stroke="#F5CF57" stroke-width="2"/>
    <rect x="186" y="138" width="8" height="30" fill="#1F3D4D"/>
    <circle cx="194" cy="170" r="6" fill="#F5CF57"/>
    <rect x="300" y="190" width="6" height="46" fill="#8D5A3B"/>
    <rect x="288" y="188" width="60" height="18" rx="4" fill="#2EA8C7"/>
    <rect x="70" y="205" width="6" height="40" fill="#8D5A3B"/>
    <rect x="30" y="203" width="52" height="16" rx="4" fill="#F5CF57"/>
    ${boxSVG(340,240,36,28,'#C68B5E')}
  </svg>`,
};

function renderIllustration(key){ return ILLUSTRATIONS[key] || ''; }
