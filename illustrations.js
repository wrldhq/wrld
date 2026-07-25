/* =====================================================================
   WRLD — Illustration Gallery
   Hand-built flat-vector SVG scenes in WRLD's signature style:
   rounded geometric shapes, warm blue/gold palette, diverse simple
   figures, soft gradients. This is the seed of a reusable illustration
   system — every future Playbook can draw from this same visual language.
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
  return `
  <g>
    <path d="${armPath}" stroke="${outfit}" stroke-width="${9*s}" fill="none" stroke-linecap="round"/>
    <path d="M${cx-26*s},${cy+95*s} Q${cx},${cy+120*s} ${cx+26*s},${cy+95*s} L${cx+22*s},${cy+34*s} Q${cx},${cy+18*s} ${cx-22*s},${cy+34*s} Z" fill="${outfit}"/>
    <circle cx="${cx}" cy="${cy}" r="${26*s}" fill="${skin}"/>
    <path d="M${cx-26*s},${cy-6*s} Q${cx-28*s},${cy-38*s} ${cx},${cy-40*s} Q${cx+28*s},${cy-38*s} ${cx+26*s},${cy-6*s} Q${cx+18*s},${cy-20*s} ${cx},${cy-22*s} Q${cx-18*s},${cy-20*s} ${cx-26*s},${cy-6*s} Z" fill="${hair}"/>
  </g>`;
}

function blobBG(color, opacity){
  return `<path d="M60 240c-30-90 20-190 130-210 100-18 190 40 210 130 18 84-30 170-120 195-100 28-195-30-220-115z" fill="${color}" opacity="${opacity||1}"/>`;
}

const ILLUSTRATIONS = {

  'resume': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <rect x="130" y="60" width="150" height="190" rx="14" fill="white" stroke="#2EA8C7" stroke-width="3"/>
    <rect x="150" y="86" width="70" height="10" rx="5" fill="#1F3D4D"/>
    <rect x="150" y="106" width="110" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="150" y="120" width="90" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="150" y="144" width="50" height="8" rx="4" fill="#F5CF57"/>
    <rect x="150" y="164" width="110" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="150" y="178" width="100" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="150" y="192" width="110" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="150" y="214" width="50" height="8" rx="4" fill="#F5CF57"/>
    <rect x="150" y="230" width="80" height="6" rx="3" fill="#EAF8FC"/>
    <circle cx="270" cy="66" r="16" fill="#F5CF57"/>
    <path d="M263 66l5 5 9-10" stroke="#1F3D4D" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${personSVG(90,190,0.85,'#C68B5E','#1F3D4D','#2EA8C7','typing')}
  </svg>`,

  'interview-skills': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <rect x="40" y="210" width="320" height="14" rx="7" fill="#1F3D4D" opacity=".15"/>
    ${personSVG(140,175,0.95,'#8D5A3B','#2B2B2B','#1F3D4D','stand')}
    ${personSVG(270,175,0.95,'#F2C4A0','#6B3F21','#F5CF57','wave')}
    <rect x="80" y="205" width="70" height="34" rx="8" fill="white" stroke="#2EA8C7" stroke-width="2"/>
    <rect x="250" y="205" width="70" height="34" rx="8" fill="white" stroke="#F5CF57" stroke-width="2"/>
    <circle cx="200" cy="70" r="30" fill="#2EA8C7" opacity=".18"/>
    <path d="M188 70q12-14 24 0" stroke="#2EA8C7" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="200" cy="55" r="4" fill="#2EA8C7"/>
  </svg>`,

  'networking': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    ${personSVG(110,190,0.85,'#EAB28B','#3A2418','#F5CF57','wave')}
    ${personSVG(290,190,0.85,'#C68B5E','#1F3D4D','#2EA8C7','stand')}
    ${personSVG(200,130,0.7,'#F2C4A0','#2B2B2B','#1F3D4D','stand')}
    <circle cx="110" cy="70" r="18" fill="white" stroke="#2EA8C7" stroke-width="2.5"/>
    <path d="M104 70h12M110 64v12" stroke="#2EA8C7" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="290" cy="80" r="14" fill="white" stroke="#F5CF57" stroke-width="2.5"/>
    <path d="M283 80h14" stroke="#F5CF57" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M130 100q40 -10 60 20" stroke="#2EA8C7" stroke-width="2" fill="none" stroke-dasharray="4 6" opacity=".6"/>
    <path d="M270 110q-30 -6 -50 20" stroke="#F5CF57" stroke-width="2" fill="none" stroke-dasharray="4 6" opacity=".7"/>
  </svg>`,

  'credit-scores': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <rect x="120" y="110" width="180" height="110" rx="16" fill="#1F3D4D"/>
    <rect x="140" y="130" width="40" height="26" rx="5" fill="#F5CF57"/>
    <rect x="140" y="170" width="90" height="8" rx="4" fill="white" opacity=".85"/>
    <rect x="140" y="186" width="60" height="8" rx="4" fill="white" opacity=".5"/>
    <circle cx="265" cy="180" r="22" fill="none" stroke="#2EA8C7" stroke-width="6"/>
    <path d="M265 180 L265 162 A18 18 0 0 1 280 190 Z" fill="#2EA8C7"/>
    ${personSVG(90,215,0.7,'#8D5A3B','#2B2B2B','#2EA8C7','stand')}
    <circle cx="310" cy="90" r="20" fill="#F5CF57" opacity=".8"/>
    <path d="M300 90l7 7 13-14" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'budgeting': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <rect x="150" y="150" width="100" height="80" rx="10" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <ellipse cx="200" cy="150" rx="50" ry="14" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <ellipse cx="200" cy="150" rx="50" ry="14" fill="none" stroke="#2EA8C7" stroke-width="2" stroke-dasharray="3 5"/>
    <circle cx="185" cy="120" r="16" fill="#F5CF57"/>
    <circle cx="215" cy="105" r="20" fill="#F5CF57"/>
    <circle cx="245" cy="122" r="14" fill="#F5CF57"/>
    <text x="215" y="112" font-size="16" text-anchor="middle" fill="#1F3D4D" font-family="Plus Jakarta Sans" font-weight="700">$</text>
    ${personSVG(110,200,0.8,'#F2C4A0','#6B3F21','#2EA8C7','typing')}
    ${personSVG(300,205,0.7,'#C68B5E','#1F3D4D','#F5CF57','stand')}
  </svg>`,

  'scholarships': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    ${personSVG(200,190,1,'#EAB28B','#2B2B2B','#1F3D4D','stand')}
    <polygon points="200,90 260,112 200,134 140,112" fill="#1F3D4D"/>
    <polygon points="200,90 260,112 200,134 140,112" fill="none" stroke="#F5CF57" stroke-width="2"/>
    <rect x="196" y="112" width="8" height="34" fill="#1F3D4D"/>
    <circle cx="204" cy="150" r="6" fill="#F5CF57"/>
    <circle cx="90" cy="120" r="22" fill="#2EA8C7" opacity=".2"/>
    <circle cx="320" cy="150" r="16" fill="#F5CF57" opacity=".5"/>
    <path d="M310 150l6 6 10-11" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'managing-anxiety': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    ${personSVG(200,190,1.05,'#F2C4A0','#1F3D4D','#F5CF57','stand')}
    <path d="M140 90q10-20 30-8" stroke="#2EA8C7" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M250 80q14-16 32 0" stroke="#2EA8C7" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
    <circle cx="120" cy="130" r="8" fill="#2EA8C7" opacity=".3"/>
    <circle cx="290" cy="120" r="6" fill="#2EA8C7" opacity=".3"/>
    <path d="M160 230q40 20 80 0" stroke="#1F3D4D" stroke-width="2" fill="none" stroke-dasharray="2 6" opacity=".4"/>
  </svg>`,

  'apartment-renting': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <polygon points="200,70 290,140 110,140" fill="#1F3D4D"/>
    <rect x="130" y="140" width="140" height="90" rx="6" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="150" y="160" width="30" height="30" rx="4" fill="#2EA8C7"/>
    <rect x="220" y="160" width="30" height="30" rx="4" fill="#2EA8C7"/>
    <rect x="185" y="196" width="30" height="34" rx="4" fill="#F5CF57"/>
    <circle cx="205" cy="213" r="2.5" fill="#1F3D4D"/>
    ${personSVG(330,215,0.7,'#8D5A3B','#2B2B2B','#2EA8C7','wave')}
  </svg>`,

  'cover-letter': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <rect x="120" y="100" width="170" height="120" rx="10" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <path d="M120 108l85 60 85-60" fill="none" stroke="#2EA8C7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="150" y="150" width="60" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="150" y="164" width="80" height="6" rx="3" fill="#EAF8FC"/>
    <circle cx="300" cy="90" r="20" fill="#F5CF57"/>
    <path d="M292 92l16-16M296 76h12v12" stroke="#1F3D4D" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${personSVG(100,215,0.8,'#EAB28B','#3A2418','#1F3D4D','typing')}
  </svg>`,

  'salary-negotiation': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <rect x="60" y="200" width="280" height="16" rx="8" fill="#1F3D4D" opacity=".15"/>
    ${personSVG(140,175,0.9,'#8D5A3B','#2B2B2B','#1F3D4D','stand')}
    ${personSVG(270,175,0.9,'#F2C4A0','#6B3F21','#2EA8C7','wave')}
    <circle cx="200" cy="95" r="26" fill="#F5CF57"/>
    <text x="200" y="103" font-size="26" text-anchor="middle" fill="#1F3D4D" font-family="Plus Jakarta Sans" font-weight="700">$</text>
    <path d="M170 110q15 12 30 0" stroke="#F5CF57" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`,

  'first-day': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <rect x="150" y="90" width="110" height="140" rx="6" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="150" y="90" width="110" height="140" rx="6" fill="none" stroke="#2EA8C7" stroke-width="2"/>
    <circle cx="242" cy="160" r="4" fill="#1F3D4D"/>
    <rect x="120" y="60" width="170" height="26" rx="8" fill="#F5CF57"/>
    <text x="205" y="78" font-size="13" text-anchor="middle" fill="#1F3D4D" font-family="Plus Jakarta Sans" font-weight="700">WELCOME</text>
    ${personSVG(200,230,0.85,'#C68B5E','#1F3D4D','#2EA8C7','wave')}
    <circle cx="90" cy="140" r="14" fill="#F5CF57" opacity=".6"/>
    <circle cx="320" cy="110" r="10" fill="#2EA8C7" opacity=".4"/>
  </svg>`,

  'professional-growth': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <rect x="110" y="190" width="40" height="40" fill="#2EA8C7" opacity=".8"/>
    <rect x="160" y="160" width="40" height="70" fill="#2EA8C7" opacity=".9"/>
    <rect x="210" y="120" width="40" height="110" fill="#1F3D4D"/>
    <path d="M260 120l30-30M290 90h-16v16" stroke="#F5CF57" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${personSVG(225,105,0.65,'#EAB28B','#2B2B2B','#F5CF57','wave')}
  </svg>`,

  'bank-accounts': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <polygon points="200,60 290,105 110,105" fill="#1F3D4D"/>
    <rect x="115" y="105" width="170" height="14" fill="#2EA8C7"/>
    <rect x="130" y="125" width="16" height="70" fill="#1F3D4D"/>
    <rect x="165" y="125" width="16" height="70" fill="#1F3D4D"/>
    <rect x="220" y="125" width="16" height="70" fill="#1F3D4D"/>
    <rect x="255" y="125" width="16" height="70" fill="#1F3D4D"/>
    <rect x="110" y="200" width="180" height="16" rx="4" fill="#1F3D4D"/>
    ${personSVG(320,225,0.7,'#C68B5E','#1F3D4D','#F5CF57','stand')}
    <rect x="300" y="235" width="34" height="22" rx="4" fill="#F5CF57" stroke="#1F3D4D" stroke-width="2"/>
  </svg>`,

  'taxes': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <rect x="140" y="70" width="130" height="160" rx="10" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="158" y="92" width="60" height="8" rx="4" fill="#1F3D4D"/>
    <rect x="158" y="112" width="94" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="158" y="126" width="70" height="6" rx="3" fill="#EAF8FC"/>
    <circle cx="175" cy="150" r="8" fill="#2EA8C7"/>
    <path d="M171 150l3 3 6-7" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="190" y="146" width="60" height="6" rx="3" fill="#EAF8FC"/>
    <circle cx="175" cy="174" r="8" fill="#F5CF57"/>
    <path d="M171 174l3 3 6-7" stroke="#1F3D4D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="190" y="170" width="60" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="158" y="200" width="94" height="6" rx="3" fill="#EAF8FC"/>
    ${personSVG(315,205,0.72,'#8D5A3B','#3A2418','#2EA8C7','typing')}
    <circle cx="90" cy="120" r="16" fill="#2EA8C7" opacity=".2"/>
  </svg>`,

  'emergency-funds': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <path d="M200 90c-50 0-80 40-80 70h160c0-30-30-70-80-70z" fill="#2EA8C7"/>
    <rect x="196" y="150" width="8" height="50" fill="#1F3D4D"/>
    <ellipse cx="200" cy="205" rx="16" ry="6" fill="#1F3D4D" opacity=".3"/>
    <ellipse cx="150" cy="235" rx="46" ry="30" fill="#F5CF57"/>
    <circle cx="185" cy="222" r="4" fill="#1F3D4D"/>
    <rect x="140" y="212" width="14" height="8" rx="3" fill="#F5CF57" stroke="#1F3D4D" stroke-width="2"/>
    ${personSVG(290,205,0.72,'#F2C4A0','#1F3D4D','#2EA8C7','stand')}
  </svg>`,

  'investing-basics': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <polyline points="100,220 160,180 210,200 260,140 320,100" fill="none" stroke="#2EA8C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M300 100h20v20" stroke="#2EA8C7" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="160" cy="180" r="6" fill="#1F3D4D"/>
    <circle cx="210" cy="200" r="6" fill="#1F3D4D"/>
    <circle cx="260" cy="140" r="6" fill="#1F3D4D"/>
    <circle cx="120" cy="245" r="18" fill="#F5CF57"/>
    <circle cx="150" cy="255" r="14" fill="#F5CF57" opacity=".7"/>
    ${personSVG(90,190,0.65,'#C68B5E','#2B2B2B','#1F3D4D','stand')}
  </svg>`,

  'financial-planning': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <circle cx="210" cy="150" r="70" fill="white" stroke="#1F3D4D" stroke-width="4"/>
    <path d="M210 150l-24-14 8 26z" fill="#F5CF57"/>
    <path d="M210 150l24 14-8-26z" fill="#2EA8C7"/>
    <circle cx="210" cy="150" r="6" fill="#1F3D4D"/>
    <circle cx="210" cy="92" r="4" fill="#1F3D4D"/>
    <circle cx="268" cy="150" r="4" fill="#1F3D4D"/>
    <circle cx="210" cy="208" r="4" fill="#1F3D4D"/>
    <circle cx="152" cy="150" r="4" fill="#1F3D4D"/>
    ${personSVG(100,220,0.7,'#EAB28B','#3A2418','#2EA8C7','stand')}
  </svg>`,

  'time-management': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <circle cx="200" cy="145" r="72" fill="white" stroke="#1F3D4D" stroke-width="5"/>
    <path d="M200 145V95M200 145l38 20" stroke="#1F3D4D" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="200" cy="145" r="6" fill="#F5CF57"/>
    <circle cx="200" cy="80" r="4" fill="#2EA8C7"/>
    <circle cx="265" cy="145" r="4" fill="#2EA8C7"/>
    <circle cx="200" cy="210" r="4" fill="#2EA8C7"/>
    <circle cx="135" cy="145" r="4" fill="#2EA8C7"/>
    ${personSVG(310,225,0.65,'#8D5A3B','#2B2B2B','#F5CF57','wave')}
  </svg>`,

  'study-skills': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <path d="M120 110h80v110q-40-14-80 0z" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <path d="M280 110h-80v110q40-14 80 0z" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <line x1="200" y1="110" x2="200" y2="220" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="135" y="130" width="45" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="135" y="146" width="35" height="6" rx="3" fill="#EAF8FC"/>
    <rect x="220" y="130" width="45" height="6" rx="3" fill="#EAF8FC"/>
    <circle cx="280" cy="80" r="22" fill="#F5CF57"/>
    <path d="M280 66v10M270 82h20" stroke="#1F3D4D" stroke-width="3" stroke-linecap="round"/>
    ${personSVG(90,215,0.72,'#F2C4A0','#1F3D4D','#2EA8C7','stand')}
  </svg>`,

  'mental-wellness': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <path d="M200 230c0-60-40-90-40-140 0 50-40 80-40 140z" fill="#2EA8C7" opacity=".85"/>
    <path d="M240 230c0-50-30-75-30-115 0 40-30 65-30 115z" fill="#F5CF57" opacity=".8"/>
    ${personSVG(190,215,0.75,'#EAB28B','#2B2B2B','#1F3D4D','stand')}
    <path d="M120 100q10-16 26-6" stroke="#2EA8C7" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
    <path d="M300 110q-10-16-26-6" stroke="#F5CF57" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
  </svg>`,

  'internships': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#EAF8FC',1)}
    <polygon points="260,70 320,110 200,110" fill="#1F3D4D"/>
    <rect x="210" y="110" width="100" height="80" fill="white" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="230" y="130" width="16" height="16" fill="#2EA8C7"/>
    <rect x="264" y="130" width="16" height="16" fill="#2EA8C7"/>
    <rect x="248" y="160" width="20" height="30" fill="#F5CF57"/>
    <rect x="110" y="180" width="60" height="44" rx="6" fill="#F5CF57" stroke="#1F3D4D" stroke-width="3"/>
    <rect x="128" y="170" width="24" height="14" rx="4" fill="none" stroke="#1F3D4D" stroke-width="3"/>
    ${personSVG(150,150,0.7,'#C68B5E','#3A2418','#2EA8C7','wave')}
  </svg>`,

  'graduation-planning': `
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    ${blobBG('#FFF9EF',1)}
    <path d="M80 230q120-70 240 0" stroke="#1F3D4D" stroke-width="4" fill="none" stroke-dasharray="10 10" opacity=".4"/>
    ${personSVG(200,180,1,'#F2C4A0','#2B2B2B','#1F3D4D','wave')}
    <polygon points="200,110 250,128 200,146 150,128" fill="#1F3D4D"/>
    <polygon points="200,110 250,128 200,146 150,128" fill="none" stroke="#F5CF57" stroke-width="2"/>
    <rect x="196" y="128" width="8" height="28" fill="#1F3D4D"/>
    <circle cx="204" cy="160" r="6" fill="#F5CF57"/>
    <circle cx="320" cy="200" r="14" fill="#2EA8C7" opacity=".6"/>
    <circle cx="90" cy="180" r="10" fill="#F5CF57" opacity=".6"/>
  </svg>`,
};

function renderIllustration(key){ return ILLUSTRATIONS[key] || ''; }
