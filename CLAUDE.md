# WRLD — Project Reference (CLAUDE.md)

This file lives permanently in the root of the WRLD website folder. It is the single source of truth for what WRLD is, how it's built, and what state it's in. Read this before touching any file.

---

## 🟢 Start Here in a New Chat

Before making **any** change, do all of the following, in order:

1. **Read this entire file first.** It describes the real, current state of the codebase — don't assume anything about WRLD from general web-project conventions.
2. **List the folder and open the actual files you're about to touch** before editing them. This project has gone through many iterative phases; the file on disk is the only reliable source of truth, not this document's prose descriptions of it (though this doc is kept accurate — see the maintenance rule at the bottom).
3. **Never rebuild a page, file, or feature from scratch** if it already exists and works. WRLD is a mature, working platform, not a prototype. Read the existing implementation and extend or edit it surgically. If you think something needs a full rewrite, say so and explain why before doing it.
4. **Preserve every existing working feature.** Authentication, the Owner/Moderator dashboards, the Volunteer Tracker, Community moderation, the Assessment, Orbit, and all 22 Playbooks are fully built and functional. Don't remove, simplify, or "clean up" any of this unless the user explicitly asks.
5. **Match the existing conventions exactly** — see "Naming & Coding Conventions" below. New code that doesn't match the established patterns (localStorage-store shape, `initPage()` usage, `.pb-card`/`.card`/`.pill` class system, script load order) will look and behave inconsistently with the rest of the site.
6. **Verify before you say you're done.** At minimum: `node --check` every `.js` file and every inline `<script>` block you touched, confirm no broken local `href`/`src` links, and confirm no leftover placeholder/lorem-ipsum/TODO language. This project has a strong "never fabricate content or features" ethic — see below.
7. **Update this file** (the "Maintaining This File" section at the bottom has the rule) whenever you make a meaningful change — new page, new data store, new dashboard section, changed account flow, etc.

If the user's request is ambiguous about which existing page/section it affects, open the relevant files and confirm before guessing.

---

## What WRLD Is

WRLD ("the curriculum for adulthood") is a free educational platform teaching practical life skills school doesn't cover — resumes, budgeting, credit, taxes, apartment hunting, mental wellness, and more — through long-form guided lessons called **Playbooks**, sequenced **Learning Paths**, live **Programs**, downloadable **worksheets**, an AI-personalized **Assessment**, a **Community** with real moderation, a **Volunteer Hours Tracker**, and a full **account/role system** with Explorer, Mentor, Administrator, and Owner tiers.

The founder is Desiree Yhap (see `about.html`). The brand is warm, honest, and explicitly non-corporate — copy throughout the codebase actively avoids sounding like generic SaaS marketing, and the project has a strong, repeated internal rule: **never invent content, stats, testimonials, or features that don't exist.** Anything not yet built is labeled "Coming Soon" confidently rather than faked.

## Current Architecture (Read This Before Assuming Anything)

**WRLD V12 is a 100% static site — HTML, CSS, and vanilla JavaScript, no build step, no framework, no backend server.** There is no Node/React/Vue anywhere in this codebase. Every file is opened directly by the browser. (V12 = V11 plus real custom-illustrated Playbook artwork; see "Illustrations" below — no architectural changes.)

All "backend" behavior — accounts, sessions, posts, moderation queues, volunteer logs, mentor applications, announcements — is implemented as **plain objects in the browser's `localStorage`**, read and written through a small set of functions in `auth.js` and `app.js`. This is a deliberate, documented architecture choice (see the comment blocks at the top of both files): every store function is shaped exactly like a future real API call (`signUp()`, `logIn()`, `getState()`/`setState()`, etc.) so that a real backend can later be swapped in by changing only the *inside* of these functions — every page that calls them keeps working unchanged.

**This means:** all data is per-browser and per-device. There is no real multi-user sync, no real email delivery, no real file upload storage (only file *metadata* — name/size/type — is captured for uploads), and "platform-wide" stats in the Owner Dashboard actually mean "this browser's local data." The codebase is honest about this in its own UI copy rather than pretending otherwise — preserve that honesty in any new copy you write.

---

## File Map

All files sit flat in the project root (no subfolders except the image library referenced below).

### Core JS modules (loaded in this exact order on every page)
`data.js` → (`illustrations.js`, only on `index.html`, `playbooks.html`, `playbook.html`) → `auth.js` → `app.js` → `orbit.js` → page's own inline `<script>`.

| File | Lines | Purpose |
|---|---|---|
| `data.js` | ~1620 | The single source of truth for all content: Playbooks, Learning Paths, Programs, Downloads, Volunteer directory, Community categories, navigation structure. No page-rendering logic — pure data + small pure lookup functions. |
| `auth.js` | ~474 | Authentication, sessions, and RBAC (roles/permissions). Fully documented inline. |
| `app.js` | ~1560 | Everything else: shared header/footer rendering, progress state, community posts + moderation, volunteer log + AI-style verification, mentor applications, Owner Dashboard metrics, Orbit's supporting helpers, UI utilities (toasts, confetti, accordions, quizzes, checklists, calendar rendering). |
| `orbit.js` | ~365 | Orbit's conversational response engine — a rule-based matcher (`ORBIT_RULES`), not a real AI/LLM call. |
| `illustrations.js` | ~513 | Hand-built inline SVG illustration system — **now a fallback only** (see "Illustrations" under Design System below). 22 keys, one per Playbook, built from a shared prop library (`personSVG`, `roomBG`, `windowSVG`, `deskSVG`, etc.). Still wired into `playbook.html` as the hero fallback if a real photo is missing. |
| `styles.css` | ~762 | The entire design system — see "Design System" below. |
| `founder-desiree.jpg` | — | Founder photo, used on `about.html`. |
| `images/playbooks/*.jpg` | 44 files, ~6MB total | Real custom-illustrated Card + Hero art for all 22 Playbooks, named `<slug>-card.jpg` / `<slug>-hero.jpg`. The only subfolder in the project. See "Illustrations" below. |

### HTML pages (28 total)

**Public / marketing:**
- `index.html` — homepage (hero, four pillars, Playbook preview, Learning Paths preview, Programs preview, live impact stats, community teaser, support/donate section)
- `about.html` — mission, "why WRLD exists," vision, founder story (with photo), values, honest impact section
- `playbooks.html` — searchable/filterable Playbook Library grid (all 22)
- `playbook.html` — single Playbook template, reads `?slug=` from the URL, renders from `data.js`
- `learning-paths.html` — the 6 live Learning Paths + 2 "Coming Soon" ones
- `programs.html` / `program.html` — Programs list + single-program template (`?id=`)
- `events.html` — "Live Learning" hub: browse programs and any real scheduled live sessions (never fake ones)
- `downloads.html` / `worksheet.html` — Download Center (19 worksheets) + single worksheet/template generator template (`?type=`)
- `tools.html` — interactive calculators (Career Readiness Assessment, Financial Confidence Quiz, Resume Scorecard, Interview Simulator, Budget Calculator)
- `community-guidelines.html` — static guidelines page, also used as an acceptance-gate modal source

**Account & auth:**
- `signup.html`, `login.html` (single unified login for all roles), `forgot-password.html`, `reset-password.html`, `account-settings.html` (change password), `owner-setup.html` (one-time Owner password bootstrap), `welcome.html` (first-login onboarding with Orbit)

**Signed-in experience:**
- `dashboard.html` — personalized learner dashboard (streak, saved/completed Playbooks, recommendations, achievements)
- `assessment.html` — the Adulting Readiness Assessment (multi-section, builds `sectionScores`, drives personalization everywhere)
- `journey-passport.html` — cumulative record of Learning Path progress, milestones, community/volunteer recognition
- `volunteer-tracker.html` — personal volunteer hours log with PDF export (jsPDF, loaded via CDN only on this page)
- `community.html` — Community Commons hub: discussion, volunteer directory, mentors, office hours, Study Groups/Accountability Partners ("Coming Soon" cards, feature-flag controlled)
- `become-mentor.html` — in-app Mentor application (no `mailto:`, ever)
- `mentor-studio.html` — Mentor-only tool for scheduling live sessions and editing their public mentor profile

**Admin / moderation (role-gated):**
- `owner-dashboard.html` — the command center; tabs for Overview, Users/Members, Mentors, Volunteer, Community, Content, Organization, Analytics, Administrators (Owner-only), Security (Owner-only)
- `moderation-dashboard.html` — narrower moderator-focused view of reports/held posts/actions

Two dynamic-title pages (`playbook.html`, `program.html`, `worksheet.html`) set `<title id="page-title">` via JS rather than a static `<title>`.

---

## Design System (`styles.css`)

**Fonts:** `Plus Jakarta Sans` (headings/UI labels, 500–800 weight) + `Inter` (body, 400–700 weight), loaded via Google Fonts `@import`.

**CSS custom properties** (all in `:root`, use these — never hardcode hex colors in new work):
- Brand: `--blue:#2EA8C7`, `--blue-dark:#1F3D4D`, `--blue-deep:#163040`, `--yellow:#F5CF57`, `--yellow-deep:#E0B92E`, `--navy:#1F3D4D`, `--charcoal:#2B2B2B`, `--cream:#FFF9EF`, `--sky:#EAF8FC`, `--gray:#F5F7F8`, `--white`
- Tinted variants: `--blue-05/10/15/25`, `--yellow-15/30`, `--navy-06/10` (all `rgba()`)
- Status: `--success` / `--success-bg`, `--warn` / `--warn-bg`, `--danger` / `--danger-bg`
- Text: `--ink-soft`, `--ink-faint`
- Shadows: `--shadow-xs/sm/md/lg`, `--shadow-blue`, `--shadow-yellow`
- Radii: `--r-xs` (10px) through `--r-xl` (36px), `--r-full` (999px)
- Type scale: `--fs-2xs` through `--fs-3xl`
- Layout: `--container` (1240px), `--container-narrow` (760px), `--ease` (the site's one standard cubic-bezier easing)

**Naming convention:** utility-first + component classes, no BEM, no CSS-in-JS, no preprocessor. Class names are short and purpose-named: `.card`, `.card.hoverable`, `.pill`, `.pill-blue/yellow/navy/success/sample`, `.btn`, `.btn-primary/outline/ghost/dark/sm/lg/block`, `.eyebrow`, `.pb-card`/`.pb-thumb`/`.pb-body`/`.pb-meta`/`.pb-footer` (Playbook cards, reused across `index.html`, `playbooks.html`, `dashboard.html`, `playbook.html`, `assessment.html`), `.dash-grid`/`.dash-stat-row`/`.dash-stat`, `.assess-*` (Assessment-specific), `.owner-*` (Owner Dashboard-specific), `.callout-fact/example/mistake/tip/protip/warn/note` (Playbook lesson callout boxes), `.reveal`/`.reveal-d1..d5` (scroll-in animation classes, activated by `initReveal()` in `app.js`).

**Responsive breakpoints in use:** `max-width: 1080px`, `980px`, `720px`, `560px`, `400px`. Also `prefers-reduced-motion: reduce` and `print` media queries are respected — don't add animation-only content that ignores `prefers-reduced-motion`.

**Illustrations (V12 — real custom artwork, SVG system now a fallback only):** Every Playbook's Card image and Hero image are real illustrated JPGs living in `images/playbooks/`, named directly off the permanent `slug` — `images/playbooks/<slug>-card.jpg` and `images/playbooks/<slug>-hero.jpg`. All 22 Playbooks have both (44 files total). There is **no separate mapping field for these** — the path is built directly from `p.slug` at render time, so a renamed slug (already a "never do this without updating every reference" action per the convention below) automatically keeps working.
  - **Card images** are cropped to a consistent 16:9 by the artist before upload; `.pb-thumb` renders them at `aspect-ratio:16/9` with `object-fit:cover`, so every card in the Playbook Library (and every other `.pb-card` grid — Dashboard recommendations, related Playbooks, Assessment recommendations) looks uniform.
  - **Hero images** are *not* a uniform aspect ratio artist-to-artist (some are 3:2, some 4:3, some 16:9) — `.pb-hero-illustration` deliberately does **not** force a fixed ratio; it's `width:100%` with the `<img>` at `height:auto`, so each hero renders at its own native ratio, full-bleed across the article body column, never cropped or letterboxed. This was an explicit product decision (see "Important Decisions" below) — don't "fix" the inconsistency by adding `aspect-ratio`/`object-fit:cover` back in without checking with the team first.
  - **Fallback chain:** if a `<slug>-card.jpg` is ever missing, the card's `onerror` hides the `<img>` and the Playbook's `emoji` (already rendered underneath) shows through — no broken-image icon. If a `<slug>-hero.jpg` is missing, `playbook.html` falls back to the original hand-built inline SVG scene in `illustrations.js` (still fully intact, unchanged, keyed by `p.heroIllustration` which equals `p.slug` for all 22). If neither exists, the hero block hides itself. **This means `illustrations.js` is no longer the primary source for Playbook art, but must be kept working** — it's the safety net for any future Playbook that launches before its custom art is ready.
  - Card images are resized to max-width 900px, hero images to max-width 1400px, both re-encoded as quality-85 JPEG (~140KB average) to keep the static site light — the originals supplied by the artist were full-resolution PNGs (~2MB each, 94MB total for all 44).

---

## Naming & Coding Conventions

- **No framework, no bundler, no `import`/`export` (ES modules).** Everything is global-scope script tags loaded in a fixed order. New JS must follow this pattern — don't introduce a module system partway through.
- **Every page's inline script ends with a call to `initPage(activeKey, customGuideMessage?)`** (from `app.js`) — this renders the shared header/footer, wires up the mobile menu, sets Orbit's contextual line, and starts scroll-reveal animations. `activeKey` matches a `NAV_GROUPS` item key from `data.js` (or `null` if the page isn't in top nav).
- **All persistent data goes through a `getX()`/`saveX()` or `getX()`/`setX()` pair** wrapping a single `localStorage` key, following the exact pattern of `getState()`/`setState()` in `app.js`. Never call `localStorage` directly from a page's inline script — always go through the shared accessor so the "swap for a real API later" architecture stays intact.
- **Route guards** (`requireAuth()`, `requireRole(roles)`, `requireMinRole(role)` in `auth.js`) are called at the very top of a gated page's inline script, before any rendering.
- **Role checks** use `hasPermission(user, 'permission_name')` or `roleAtLeast(user, ROLES.X)` — never compare `user.role === 'admin'` directly in new code; use the helpers so the Owner (who should pass every Admin check too) isn't accidentally excluded.
- **IDs and localStorage keys are prefixed `wrld_`** and versioned (`_v1` suffix) — see the full list under "Data Model" below. Follow this pattern for any new store.
- **Playbook `slug`s are kebab-case and permanent** — they're the join key across `data.js`, `illustrations.js` (`heroIllustration`), `RELATED_PLAYBOOKS`, `LEARNING_PATHS.steps`, `SECTION_RECS`, bookmarks/completed arrays in learner state, URL query strings (`playbook.html?slug=...`), **and now `images/playbooks/<slug>-card.jpg` / `<slug>-hero.jpg` filenames directly**. Never rename an existing slug without updating every one of those references (including re-exporting/renaming the two image files).
- **No emojis in copy unless matching existing tone** — WRLD's existing copy uses emoji sparingly and purposefully (section eyebrows, pillar icons, milestone badges) — check existing pages for the pattern before adding more.
- **Honesty rule (important, repeated throughout the codebase in comments):** never fabricate testimonials, user counts, activity, or "coming soon" features presented as live. If something isn't real yet, either build it for real or label it "Coming Soon" the way `LEARNING_PATHS_COMING_SOON`, `COMMUNITY_FEATURES` (`status:'coming-soon'`), and the Owner Dashboard's Certificates card already do.

---

## Account System & Roles

Full implementation in `auth.js`. Four roles, strict hierarchy (each inherits everything below it): **Explorer → Mentor → Administrator → Owner**.

- **Public sign-up (`signup.html`) only ever creates Explorer accounts.** There is no role selector anywhere in the public UI.
- **Becoming a Mentor** happens exactly one way: a real application via `become-mentor.html` → stored in `wrld_mentor_applications_v1` → reviewed by an Administrator/Owner in the Owner Dashboard's Mentors tab → `setMentorApplicationStatus(id, 'approved')` calls `promoteUserRole()`, which upgrades that user's existing Explorer account to Mentor. There is no self-service Mentor signup.
- **Becoming an Administrator** happens exactly one way: an existing Owner/Administrator promotes an existing account from the Owner Dashboard's Administrators tab (Owner-only panel). Never selectable at signup, never self-service.
- **The Owner role exists exactly once, forever.** `ensureOwnerBootstrap()` runs on every page load and creates a single Owner account (`hello@ourwrld.org`, `id:'owner_root'`) with `passwordHash: null` if one doesn't already exist. The Owner cannot log in until they complete the one-time `owner-setup.html` flow (`setupOwnerPassword()`), which permanently disables itself once a password is set. Ownership can be transferred to an existing Administrator via `transferOwnership()` (Owner-only, demotes the previous Owner to Administrator — there is always exactly one Owner, never zero, never two).
- **Login (`login.html`) is a single unified page for every role** — there is no separate Owner or Administrator login screen. After login, routing to the right destination is the calling page's responsibility.
- **Duplicate-email signup** shows a friendly "An account with this email already exists" message with direct paths to Log In / Forgot Password — never a raw error, never a duplicate account.
- **Passwords** are SHA-256 hashed client-side via `crypto.subtle` before being stored (with a same-file-documented fallback for ancient browsers) — explicitly **not** production-grade security (no salt, no rate limiting, no server). This is intentional architecture scaffolding, not a bug — see the comment block at the top of `auth.js`.
- **Password reset** (`forgot-password.html` → `reset-password.html`) generates a real, time-limited (30 min) token but has no real email delivery (no backend) — the UI hands the reset link directly to the user, labeled honestly as a stand-in for what a real email would deliver.
- **Moderation account actions** available to Administrators/Owner: `suspendUser`/`unsuspendUser` (conduct-based, tied to the moderation system), `deactivateUser`/`reactivateUser` (administrative closure, distinct from suspension), `banUser`/`unbanUser` (escalation past suspend, also sets `suspended`). All three are surfaced separately in the Owner Dashboard rather than conflated.
- **`deleteOrganizationData()`** — Owner-only, irreversible, wipes every `wrld_`-prefixed `localStorage` key in the browser. This is the honest local-storage equivalent of "delete the organization" since there's no real backend database to drop.

### Permissions reference (`ROLE_PERMISSIONS` in `auth.js`)
- Explorer: `complete_playbooks`, `save_progress`, `earn_certificates`, `build_avatar`, `register_sessions`, `track_volunteer_hours`, `save_favorites`, `view_dashboard`, `interact_orbit`
- Mentor (adds): `host_workshops`, `schedule_sessions`, `publish_events`, `upload_resources`, `mentor_learners`, `manage_own_sessions`
- Administrator (adds): `manage_users`, `approve_mentors`, `manage_events`, `manage_volunteer_opportunities`, `publish_resources`, `feature_content`, `moderate_platform`, `access_analytics`, `edit_content`
- Owner-only (adds): `manage_administrators`, `transfer_ownership`, `access_security`, `manage_organization`, `delete_organization`

---

## Orbit

Orbit is WRLD's mascot and the primary in-product guide — a small blue circular character with a yellow leaf-shaped accent, drawn as inline SVG (see the `ORBIT_AVATAR_SVG_SM` pattern reused per-page, and the full character markup embedded directly in `orbit.js`/relevant HTML). **Orbit's visual design is fixed and should not be redrawn or restyled** — treat it like a locked brand asset; only animations, positioning, expressions, and copy are open to iteration.

Functionally, Orbit is a **chat-style panel** (`openOrbitPanel()`/`closeOrbitPanel()` in `orbit.js`) with:
- A personalized greeting (`orbitGreeting()`) that uses **real** local data only — first name if logged in, real streak/completed count from `getState()`, and assessment-driven recommendations if the user has taken the Assessment. Never invents stats.
- A rule-based response engine (`getOrbitResponse()` → `ORBIT_RULES`, an ordered array of `{test, respond}` pairs, first match wins) covering: progress check-ins, emotional/conversational prompts (overwhelm, stress), Playbook-specific help (resume, interview, budgeting, credit, scholarships), navigation to every major page, Learning Path/recommendation logic (assessment-aware), Community questions (including why posting might be locked), and small talk.
- **This is explicitly not a real AI/LLM integration.** The file's top comment documents that `getOrbitResponse()` is written as a single pure function specifically so a real LLM-backed API call can later replace its body without touching any caller. Don't claim or imply real AI in new copy unless this architecture actually changes.
- Orbit never claims a feature exists if it doesn't — e.g. the Certificate and Accountability Partner responses explicitly explain those are rolling out rather than pretending they're live.

---

## Content Model (`data.js`)

### Playbooks (22 total, in `PLAYBOOKS`)
Full-length guided lessons. Fields per Playbook: `slug` (permanent, kebab-case, primary key), `outcome`, `title`, `pillar` (`work`/`resilience`/`learning`/`development`), `flagship` (bool — 8 of the 22 are flagship/featured), `heroIllustration` (key into `illustrations.js`), `category` (`Career`/`Money`/`School`/`Mental Wellness`/`Housing`/`Life Skills`), `emoji`, `color` (`blue`/`yellow`), `difficulty` (`Beginner`/`Intermediate`/`Advanced`), `readTime`, `completionTime`, `author`, `dateUpdated`, `dek`, `objectives[]`, `sections[]` (each `{h, p[], callout?:{type,title,text}, table?:{headers,rows}, mini?:{q,options,correct,explain}}` for an inline mini-check), `practiceExercises[]`, `checklist[]`, `reflection[]`, `quiz[]` (`{q,options,correct,explain}`), `faq[]` (`{q,a}`), `download` (matching `DOWNLOADS.type`), `journeys[]` (Learning Path keys this Playbook belongs to), `nextInJourney` (slug).

Curated (not auto-generated) cross-links live in `RELATED_PLAYBOOKS` (slug → 3 related slugs) — guarantees "Keep Going"/"Related" sections never render empty.

### Learning Paths (`LEARNING_PATHS`, 6 live + `LEARNING_PATHS_COMING_SOON`, 2 planned)
Ordered `steps[]` of Playbook slugs toward a real outcome. Live: `career-readiness`, `financial-confidence`, `university-success`, `workplace-communication`, `becoming-independent`, `mental-wellness-path`. Coming soon (shown honestly, not populated with fake lessons): `leadership`, `entrepreneurship`. `pathEstimatedTime()` in `app.js` computes duration live from each step's real `completionTime` — never hardcoded.

### Programs (`PROGRAMS`, 8 total)
Live, cohort-based digital programs (Career Bootcamp, Financial Literacy Academy, Future Leaders, First Job Program, Mentorship Network, Volunteer Hub, Youth Entrepreneurship, Summer Leadership Institute). Each has `modules[]`, `outcomes[]`, `projects[]`, `downloads[]` (linked worksheet types), `faqs[]`.

### Downloads (`DOWNLOADS`, 19 worksheets/templates)
`{type, title, icon, pillar, desc}`. Rendered by `worksheet.html?type=...`. `DOWNLOAD_NEXT_STEP` hand-maps each download to a natural next Playbook (or `null` where none fits, pointing to Community instead).

### Assessment support data
`SECTION_RECS` (8 life-area keys → recommended Playbooks/program/path), `STAGES` (Explorer/Navigator/Builder/Trailblazer, by score threshold), `SECTION_META` (titles/icons for the 8 areas). `weakestAssessmentSection()` finds the lowest-scoring area to drive personalized recommendations across Assessment results, Dashboard, Journey Passport, and Orbit.

### Community & Volunteer data
`COMMUNITY_FEATURES` (feature cards, each `status: 'live'` or `'coming-soon'`), `COMMONS_CATEGORIES` (5: introductions, celebrations, general, accountability, announcements — `announcements` is `restricted:true`, postable only by Mentor+), `VOLUNTEER_OPPORTUNITIES` (8 curated **real, existing, third-party** platforms — Idealist, Catchafire, UNV Online Volunteering, Translators without Borders, Smithsonian Digital Volunteers, DoSomething, Zooniverse, Be My Eyes — WRLD does not run its own placements, so this intentionally links out rather than inventing WRLD-run opportunities), `VOLUNTEER_SKILL_BADGES` (fixed taxonomy of 10 tags).

### Navigation (`NAV_GROUPS`)
4 dropdown groups — Explore, Learn, Connect, About WRLD — each with 3-5 items. This is what drives the header's dropdown nav; add new pages here to get them into navigation, matching an `initPage()` `activeKey`.

---

## Dashboards

### Learner Dashboard (`dashboard.html`)
Personal, real-only stats from `getState()`/`getProgressSummary()`: streak (`updateStreak()`), completed Playbooks, saved bookmarks, achievements (`computeAchievements()`), next-step recommendation, Learning Path progress.

### Owner Dashboard (`owner-dashboard.html`)
Gated `requireMinRole(ROLES.ADMIN)`; two extra Owner-only tabs (Administrators, Security) are conditionally shown via `roleAtLeast(user, ROLES.OWNER)`. Tabs: **Overview** (`getPlatformOverview()` — real, live-computed metrics from every store, explicitly caveated as single-browser data, not multi-device analytics), **Users/Members** (`getMembersStats()` — total/daily-signups/returning/online-now/Explorer-Mentor breakdown), **Mentors** (pending applications queue, approved Mentor roster, scheduled sessions), **Volunteer** (verification queue, org totals), **Community** (moderation queue, reports, new discussions, newest members), **Content** (publish announcements via `addAnnouncement()`, feature a Playbook via `setFeaturedPlaybook()`, highlight a Mentor via `setFeaturedMentor()`), **Organization** (feature toggles — Study Groups/Accountability Partners on/off), **Analytics**, **Administrators** (Owner-only — promote/demote Admins, transfer ownership), **Security** (Owner-only).

### Moderator Dashboard (`moderation-dashboard.html`)
Narrower, moderator-focused view: held/reported posts queue, moderation action history, member list — a subset of what Owner Dashboard's Community tab shows, for Administrators who don't need the full command center.

### Mentor Studio (`mentor-studio.html`)
Mentor-only. Publish/cancel live sessions (`publishLiveSession()`/`cancelLiveSession()`, stored in `wrld_live_sessions_v1`, read live by `events.html`), edit public Mentor profile (`saveMentorProfile()` — tagline, bio, expertise, shown on Community's "Current Mentors" directory).

---

## Community & Moderation System

Multi-layer, all real (not simulated), implemented in `app.js`:

1. **Gating** — `canParticipateInCommunity(user)`/`communityGateReason(user)`: posting requires an account and completing at least one Playbook (never anonymous, never open to brand-new signups).
2. **Guidelines acceptance** — `hasAcceptedGuidelines()`/`acceptGuidelines()`, a modal gate (`openGuidelinesModal()`) before first post.
3. **Automated content screening** — `moderateContent(text)`: pattern-matches against categories `selfHarm`, `violence`, `graphicViolence`, `harassment`, `bullying`, `hateSpeech`, `explicitContent`, `dangerousAdvice`, `scam`, `phishing`, `selfPromotion`, plus `personal-info`/`external-link` flags for email/phone/URL, plus a small keyword layer (`flagged-language`). The most severe categories (`self-harm`, `violence`, `graphic-violence`, `dangerous-advice`, `explicit-content`, `hate-speech`) **block outright**; anything else with flags is **held** for human review; clean content is **approved** automatically. Explicitly documented as rule-based pattern matching, not a real ML/AI model — don't claim otherwise in UI copy.
4. **Repeat-offender escalation** — `recordViolationAndMaybeEscalate()`: 3 held/blocked posts from one account auto-suspends it (`VIOLATION_SUSPEND_THRESHOLD = 3`), logged either way.
5. **Progressive trust** — `getTrustState()`/`trustLevel()`/`canPostToday()`: new members get modest daily post/reply limits that grow with real approved participation history.
6. **Reporting** — any user can report a post/reply (`reportCommunityItem()`, `REPORT_HOLD_THRESHOLD = 3` reports auto-hides pending review); Administrators clear or set status (`moderationSetStatus()`) via `moderationClearReports()`.
7. **Full audit log** — `logModerationEvent()`/`getModerationLog()`, every action (auto or manual) recorded with target and flags, visible in Owner/Moderator Dashboards.

## Volunteer System

`volunteer-tracker.html` (personal log) + Community's Volunteer directory + Owner Dashboard's Volunteer tab. Entries (`getVolunteerEntries()`/`addVolunteerEntry()`/`updateVolunteerEntry()`/`deleteVolunteerEntry()`) run through `evaluateVolunteerProof(entry)` — a heuristic scoring function (proof file attached, plausible date range vs. logged hours, organization name present, reflection length) that assigns `confidence: high/medium/low` → `status: verified/pending_review/needs_info`. High-confidence entries auto-verify; medium-confidence entries queue for Administrator manual override (`setVolunteerVerification()`); this is explicitly documented as heuristic scoring, not a trained ML model. `volunteer-tracker.html` also exports a real PDF (Volunteer Record + Scholarship Report) via jsPDF, loaded only on that page from a CDN (`cdnjs.cloudflare.com/.../jspdf.umd.min.js`) — the only external script dependency in the entire project.

---

## Data Model — Every `localStorage` Key

All keys are prefixed `wrld_` and versioned (`_v1`). This is the complete list as of V12 (unchanged from V11 — the V12 illustration work touched no data model):

| Key | Owner file | Shape / purpose |
|---|---|---|
| `wrld_users_v1` | `auth.js` | Array of user objects: `id, name, email, passwordHash, role, createdAt, lastLoginAt, loginCount, warnings, suspended, deactivated, banned, violations` |
| `wrld_session_v1` | `auth.js` | `{userId, token, expiresAt}` — 30-day persistent session |
| `wrld_reset_tokens_v1` | `auth.js` | `{[token]: {email, expiresAt}}` — 30-minute password reset tokens |
| `wrld_state_v1` | `app.js` | Per-browser learner state: `{bookmarks[], completed[], checklists{}, quizScores{}, streak, lastVisit, recentlyViewed[], guidelinesAcceptedAt, assessment}` |
| `wrld_live_sessions_v1` | `app.js` | Array of Mentor-published live sessions (never fake/seeded) |
| `wrld_trust_v1` | `app.js` | `{postsToday, repliesToday, lastDate, approvedCount}` — progressive community trust |
| `wrld_community_posts_v1` | `app.js` | Array of Community Commons posts/replies, each with moderation status |
| `wrld_moderation_log_v1` | `app.js` | Full audit log of moderation actions |
| `wrld_volunteer_log_v1` | `app.js` | Array of personal volunteer entries + verification state |
| `wrld_mentor_profiles_v1` | `app.js` | `{[userId]: {tagline, bio, expertise[]}}` |
| `wrld_mentor_applications_v1` | `app.js` | Array of Become-a-Mentor applications, `status: pending/approved/rejected` |
| `wrld_feature_toggles_v1` | `app.js` | `{studyGroups, accountabilityPartners}` — Owner-controlled feature flags |
| `wrld_announcements_v1` | `app.js` | Array of Owner-published announcements (shown on Dashboard/Community) |
| `wrld_featured_v1` | `app.js` | `{playbookSlug, mentorUserId}` — Owner's featured picks |

`deleteOrganizationData()` in `auth.js` wipes every key with the `wrld_` prefix — keep every new store on this prefix so that function stays comprehensive.

---

## Current Limitations (Be Honest About These)

- **No backend server.** Everything above is `localStorage`-only. Data does not sync across devices or browsers, and clearing browser storage deletes everything.
- **No real email delivery.** Password reset and mentor-application "notifications" are simulated honestly in the UI, not actually sent.
- **No real file storage.** Uploads (e.g. mentor application resume) only capture file metadata (name/size/type), never the actual file bytes.
- **No real payment/donation processing** — the "Support WRLD" sections are informational, not a working payment flow (verify current state of `about.html#donate` before assuming otherwise).
- **Passwords are client-side-hashed only** — not production-grade auth (no salt, no rate-limiting, no HTTPS-enforced session cookies, since there's no server to enforce any of that).
- **Certificates are not yet issued** — Journey Passport shows eligibility tracking only; the Owner Dashboard explicitly marks this "Coming Soon."
- **Study Groups, Accountability Partners, "Ask a Mentor," and "Success Stories"** are architecturally ready (feature-flagged, have UI shells) but not fully live — `COMMUNITY_FEATURES` marks each `status: 'coming-soon'` honestly.
- **Owner Dashboard "Online Now" / "Returning Users" metrics** are real but single-device approximations, not true multi-device analytics — the dashboard says so in its own copy.

---

## Completed Work (High-Level)

The full build history is long (100+ discrete work items across many sessions). At a high level, all of the following are **fully built and working** as of V12://
- Complete design system, content engine, and every core page listed in the File Map above
- All 22 Playbooks at full "flagship" depth (objectives, multi-section lessons with callouts/tables/mini-checks, practice exercises, checklist, reflection, quiz, FAQ) — not placeholders
- Orbit v2 conversational companion with assessment-aware personalization
- The Adulting Readiness Assessment + Journey Passport + Learning Paths system
- Full 4-role authentication/RBAC system with Owner bootstrap, unified login, friendly duplicate-signup handling, password management
- Owner Dashboard command center (all tabs listed above) and a separate Moderator Dashboard
- 5-layer real community moderation system (gating, guidelines, auto-screening, escalation, trust, reporting, audit log)
- Volunteer Hours Tracker with heuristic AI-style verification and real PDF export
- Mentor system: in-app application → Admin review → promotion → Mentor Studio → public directory
- **V12: Real custom-illustrated artwork for all 22 Playbooks** (44 files — Card + Hero each) in `images/playbooks/`, replacing the hand-built SVG system as the primary Playbook art everywhere a `.pb-thumb`/`.pb-hero-illustration` appears (Playbook Library, homepage flagship preview, Dashboard recommendations, related Playbooks, "Keep Going" next-step, Assessment recommendations, individual Playbook hero). The original hand-built SVG illustration system (`illustrations.js`, 22 scenes from a shared prop library) is preserved unchanged as an automatic fallback if a photo is ever missing for a slug.
- **V12: Favicon added site-wide.** `favicon.svg` (the existing locked Orbit avatar mark, unmodified — same circle+leaf path used everywhere else) is now linked via `<link rel="icon" type="image/svg+xml" href="favicon.svg">` in all 28 pages' `<head>`, right before the `styles.css` link. There was previously no favicon anywhere in the codebase.
- Full mobile-responsive pass (no horizontal overflow, hero decorations that don't overlap content, nav that keeps the logged-in avatar visible at every breakpoint)
- Repeated content-honesty audits removing any placeholder/lorem-ipsum/fabricated-stat language

## Outstanding / Roadmap Work (Known, Not Yet Done)

- Real backend/API layer (the entire localStorage architecture is explicitly designed to be swapped for this later without touching calling code)
- Real email delivery for password reset and notifications
- Real file storage for mentor application uploads
- Certificate issuance (Journey Passport tracks eligibility only)
- Full launch of Study Groups, Accountability Partners, Ask-a-Mentor matching, Success Stories
- Real payment/donation processing if "Support WRLD" is meant to actually collect funds
- 2FA / stronger production-grade auth once a real backend exists
- ~~A newer illustration pass was explored in a separate branch...~~ **Done as of V12** — see "Illustrations" under Design System and the Completed Work entry above.

### Polish Backlog (identified during the V12 pass, not yet acted on)

Reviewed during the V12 illustration integration but deliberately left for a future, explicitly-scoped session rather than changed unprompted — flagging them here so they don't need rediscovering:

- **No skip-to-content link** on any page — a real accessibility gap for keyboard/screen-reader users given the shared header/nav is re-rendered on every page via `initPage()`. Would need to be added once, centrally, in the header-render logic in `app.js`.
- **Small square Playbook icon badges still show emoji only, not the new artwork** — the 76–88px "Start Here" / "Next Step" callouts on `assessment.html`, `dashboard.html`, and `worksheet.html` (distinct from the full `.pb-card` grid tiles, which *do* now show real art). Left alone intentionally: a wide illustrated scene compressed into a ~80px square would need actual cropping, which conflicts with the "never crop" rule for these images. Would need either a separate square-cropped export from the artist or a different treatment (e.g. a softly-blurred background swatch) rather than reusing the existing card/hero files as-is.
- **No systematic color-contrast or full keyboard-navigation audit** has been done across all 28 pages — the design system's palette looks compliant at a glance (dark navy text on light backgrounds throughout) but hasn't been checked page-by-page against WCAG AA.
- **No sitemap.xml / robots.txt / Open Graph meta tags** — relevant if/when this goes to a real public domain instead of being opened as local files.

## Important Decisions & Rationale (Don't Silently Reverse These)

- **Static site, localStorage-first architecture** was a deliberate choice to build the full product experience and information architecture before investing in backend infrastructure — every store function is written to make that migration a drop-in replacement later.
- **Explorer-only public registration; Mentor/Admin are never self-service** — a trust and safety decision, not an oversight.
- **Exactly one Owner account, bootstrapped automatically, one-time password setup** — prevents lockout while keeping Owner creation out of any public flow.
- **Single unified login page for all roles** — no separate "admin login" that would advertise privileged-account existence.
- **"Coming Soon" instead of fake data** — a recurring, explicit product principle across Learning Paths, Community features, and Certificates. Do not populate these with invented content to make them "look done."
- **Volunteer directory links to real third-party platforms** rather than fabricating WRLD-run opportunities WRLD doesn't actually operate.
- **Orbit and the moderation/verification systems are rule-based, not real AI**, but are product-framed with AI-adjacent language ("AI-assisted verification," etc.) — keep this framing honest in any new copy: describe *what it actually does*, don't claim a model that isn't there.
- **Hero illustrations render at each image's own native aspect ratio, never a forced/uniform one.** The 22 custom Hero images aren't all the same shape (3:2, 4:3, 16:9 all appear). The deliberate call was to show every image in full, uncropped, rather than force visual uniformity across Playbook pages — a one-off size difference between two Playbooks is preferable to cropping an artist's work. Card images, by contrast, *are* uniform 16:9 (that's how they were supplied), so `.pb-thumb` does use a fixed `aspect-ratio:16/9`.

---

## Maintaining This File

**Update this CLAUDE.md whenever you make a meaningful change** — a new page, a new localStorage store, a changed account/role flow, a new dashboard section, a renamed Playbook slug, a new external dependency, or a shift in what's "Coming Soon" vs. live. A meaningful change is anything a future Claude chat would need to know to avoid re-discovering it from scratch or, worse, contradicting it.

Small wording tweaks, copy edits, or minor styling adjustments don't need an update here. When in doubt, err toward updating — this file is only useful if it stays accurate. If you update it, briefly note in your response to the user that you did, and what section changed.
