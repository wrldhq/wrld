# WRLD Website V18 — Changelog

Two priorities only, per spec: mobile optimization and Orbit AI. Desktop
design, branding, colors, typography, illustrations, page structure,
navigation structure, wording, content, features, dashboards, playbooks,
programs, authentication, Supabase functionality, user roles, working
forms, animations, and Orbit's existing design/personality were all
preserved unchanged. See "Desktop Regression Summary" below for how this
was verified.

## Priority Two: Orbit AI

- **New:** `orbit-knowledge.js` — a knowledge index built automatically
  from `PLAYBOOKS`/`PROGRAMS`/`DOWNLOADS`/`LEARNING_PATHS` in `data.js`.
  Loaded on every page, right after `data.js`.
- **New:** `supabase/functions/orbit-ai/index.ts` — the Edge Function
  that calls a configurable AI provider, grounded strictly in retrieved
  WRLD content, with role-aware guidance (Explorer/Mentor/Admin/Owner),
  rate limiting, input/output limits, and hard safety rules (no
  fabrication, no medical/legal/financial diagnoses, `hello@ourwrld.org`
  as the only real contact address, no secret/other-user-data exposure,
  basic prompt-injection resistance).
- **New:** `supabase/migrations/20260728090000_034_orbit_ai_usage.sql` —
  additive rate-limit table, RLS-locked to the service role only.
- **New:** `supabase/config.toml` entry for `orbit-ai` (`verify_jwt = true`).
- **Changed:** `orbit.js` — `sendOrbitMessage()` now tries Orbit AI first
  via `sbClient.functions.invoke('orbit-ai', ...)`, and falls back to the
  original, unmodified rule-based Orbit (`ORBIT_RULES`,
  `getOrbitResponse()`) if Orbit AI is unreachable or not yet configured.
  The very first fallback in a session shows the specified friendly
  notice ("My AI connection is taking a quick orbit...") once, not on
  every subsequent message.
- **New:** a "Clear conversation" (↺) button in the Orbit panel header,
  wired to `clearOrbitConversation()`.
- **Changed:** `app.js` — one line added to the shared Orbit panel markup
  for the Clear button. No other markup touched.
- **Changed:** `styles.css` — matching styles for the new Clear button;
  Orbit's launcher, avatar, colors, and existing panel styling untouched.
- Orbit's character design, avatar, animations, personality, existing
  scripted messages, seasonal interactions, Easter eggs, and placement
  logic are all byte-for-byte unchanged except where noted below for
  mobile.

## Priority One: Mobile Optimization

This pass was a real, code-level audit — grep-driven searches across all
31 HTML pages and `styles.css` for the specific failure patterns named in
the request (uncovered multi-column grids, fixed pixel widths that could
overflow, missing responsive floors), not a visual pass on physical
devices. See "Mobile Testing Summary" below for exactly what that means
and its limits.

- **Fixed (confirmed real bug):** `.assess-rings-grid` (used for the
  stat rings on Journey Passport and the Volunteer Tracker) had an inline
  `grid-template-columns:repeat(4,1fr)` on both pages with no mobile
  override anywhere in `styles.css` — four stat numbers were staying
  four-across even at 320–375px phone widths. Now forced to 2 columns
  with `!important` at the existing 720px breakpoint, so it collapses
  correctly regardless of any inline style a page sets.
- **Hardened:** `.owner-metric-row`'s existing 980px/560px mobile rules
  didn't use `!important`, so any future inline override on that class
  could silently defeat them the same way `.assess-rings-grid` did. Added
  `!important` to both existing rules as a preventive fix — the current
  inline value already matched, so this changes no visible behavior
  today, only prevents a latent regression.
- **Improved:** the Orbit panel's mobile CSS (`@media(max-width:720px)`)
  now uses `dvh` (dynamic viewport height) instead of a fixed `vh`
  calculation, and adds `env(safe-area-inset-bottom)` padding — so the
  panel resizes correctly when the mobile keyboard opens/closes and the
  input row never sits under the iOS home indicator.
- **Verified, not changed** (already correct on inspection): the
  `[style*="min-width:"]{min-width:0 !important;}` rule at 720px already
  neutralizes every `min-width` floor site-wide below phone breakpoints;
  `.lesson-table-wrap{overflow-x:auto;}` already wraps every dynamically
  rendered table; `.pillars-grid, .pb-grid, .programs-grid, .dash-stat-row,
  .values-grid, .diff-grid` already collapse via `!important` at 980px/720px
  regardless of any inline column count a page sets; touch targets for
  buttons/chips/social icons are already floored at 44×44px in the same
  breakpoint; the homepage hero, nav collapse to hamburger, founder
  portrait, story icons, calendar, and worksheet print layout all already
  have dedicated mobile rules.

## Files changed

| File | Change |
|---|---|
| `orbit-knowledge.js` | **New** |
| `supabase/functions/orbit-ai/index.ts` | **New** |
| `supabase/migrations/20260728090000_034_orbit_ai_usage.sql` | **New** |
| `ORBIT-AI-SETUP.md` | **New** |
| `orbit.js` | Orbit AI wiring (see above) |
| `app.js` | One line: Clear-conversation button markup |
| `styles.css` | Clear-button style, Orbit mobile safe-area/dvh, `.assess-rings-grid` + `.owner-metric-row` mobile hardening |
| `supabase/config.toml` | Added `[functions.orbit-ai]` entry |
| Every other `*.html` (30 files) | One line: `<script src="orbit-knowledge.js"></script>` added after `data.js`, required so the knowledge index loads before `orbit.js` on every page |

Every other file (images, `data.js`, `auth.js`, all migrations from V17,
`email-templates/`, all documentation from V17) is untouched.
