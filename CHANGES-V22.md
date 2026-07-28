# WRLD Website V22 — Changes

Built from the clean V21 baseline only (no V21.1/.2/.3 code reused). Scope was
limited to the three outcomes below — everything else in V21 is unchanged.

## 1. Tools page — mobile horizontal overflow (fixed)
Root cause: the Interview Simulator's `.flip-card` uses a real 3D transform
(`perspective` + `transform-style:preserve-3d` + `rotateY(180deg)` on
`.flip-back`). The flip renders correctly, but on mobile browsers a
3D-transformed element can still inflate the page's scrollable width beyond
its own visual box, letting the page be dragged horizontally into blank
space with nothing visibly out of place.

Fix: `.flip-card-scene{overflow:hidden; max-width:100%;}` added inside the
existing `@media(max-width:720px)` block only. The flip animation and every
other Tools tool are untouched; no `overflow-x:hidden` was added to `html`
or `body` (body already had it from V21; this is what a blanket rule alone
does not catch, since it's `<html>` that mobile browsers actually scroll).

## 2. Program detail pages — mobile layout (fixed)
Root cause: the header row (title/intro column + enrolment card) is a
`flex-wrap` row whose two children carry inline `min-width:300px` /
`min-width:280px` floors sized for desktop/tablet. At phone widths those
floors don't leave enough room to wrap onto separate lines, so the
title/intro column gets compressed into a narrow strip beside the card
instead of the two stacking.

Fix: added two new classes, `prog-hero-row` and `prog-enroll-card`
(`program.html`), with a scoped rule forcing `flex-direction:column` at
≤720px (`styles.css`). The enrolment card already sits second in the DOM,
so this produces the required order (header → badges → title → intro →
details → enrolment card) with no HTML reordering. The main Programs
listing page and desktop Program detail layout are untouched. This is the
shared template every individual program renders through, so the fix
applies to all of them.

## 3. Orbit — mobile behaviour preserved, one isolation gap closed
The V21 mobile compact-preview behaviour (short contextual bubble → ~5s →
auto-collapse → circular launcher) is unchanged and still passes the
existing local simulation suite in full (see Testing below).

One gap found during the isolation audit: `assessment.html` was missing
from Orbit's auto-show exclusion list, so the floating preview could
auto-open on top of the assessment's own built-in Orbit line
(`.assess-orbit-line`) and, on the intro view, over the "Start My Journey"
button. Added `'assessment.html'` to `ORBIT_AUTO_SHOW_EXCLUDED_PAGES` in
`orbit.js`. The launcher remains available for a manual tap, same as every
other excluded page (signup, login, forgot/reset password, welcome,
owner-setup).

## 4. New-user workflow — verified, no code changes required
Audited signup → session handling → welcome → assessment → Explorer
Dashboard end to end (`signup.html`, `auth.js`'s `signUp()`/
`postAuthDestination()`/`needsOnboarding()`/`requireAuth()`, `welcome.html`,
`assessment.html`'s `beginJourney()`). The existing V21 architecture already:
- confirms the new session's `user.id` matches the account just created
  before using it,
- treats a signed-in user with a still-loading or failing profile fetch as
  authenticated (never logs them out for a rendering/loading issue),
- routes `source:'signup'` unconditionally to `welcome.html` (never through
  `login.html`, never inferred from cached state),
- routes `source:'login'` straight to the requested destination or role
  dashboard, never back through onboarding,
- carries a pending `next` destination through welcome → assessment →
  final destination.

No gaps were found in this routing chain, so no changes were made to it.

## Files changed
- `styles.css` — two scoped mobile rules added inside the existing
  `@media(max-width:720px)` block (Tools flip-card containment, Program
  detail hero-row stacking).
- `program.html` — two classes added to existing markup
  (`prog-hero-row`, `prog-enroll-card`); no structural or content changes.
- `orbit.js` — one page filename added to `ORBIT_AUTO_SHOW_EXCLUDED_PAGES`.
- All 31 HTML pages — cache-bust bumped from `styles.css?v=21` /
  `orbit.js?v=21` to `?v=22` (both files changed; `app.js` was not
  modified, so its version string was left at `?v=21`).

## Desktop
Not touched. Every change above is inside a `max-width:720px` media query
or is a JS exclusion-list entry that only affects mobile auto-show
behavior; desktop Orbit, desktop Tools, and desktop Program detail layouts
render exactly as V21.

## Database
No migration required. No Supabase schema, policy, or Edge Function
changes.

## Testing performed
- **Static inspection**: full read-through of `orbit.js`, `auth.js`,
  `styles.css`, `signup.html`, `welcome.html`, `assessment.html`,
  `program.html`, `tools.html`, and the shared header/nav/mobile media
  query rules, tracing each of the three required outcomes to its root
  cause before changing anything.
- **Local simulation (real code, sandboxed VM)**: ran the project's own
  `local-simulation/simulate_orbit_mobile.js`,
  `local-simulation/simulate_auth.js`, and `local-simulation/simulate.js`
  against the modified files — 25/25, 7/7, and 13/13 checks pass,
  confirming the V21 mobile Orbit state machine and the auth/session/
  profile-recovery logic are unaffected by these changes.
- **CSS/JS validation**: brace-balance check on `styles.css`, syntax
  check on `orbit.js`.

## Testing limitations
No real-device, hosted-browser, or connected-Supabase testing was
performed — this environment has no network access and no browser/
Chromium available, so viewport rendering at 320/375/390/430px and the
live signup → welcome → assessment → dashboard journey were verified by
static code tracing and the local simulation suite above, not by loading
the pages. Recommend a quick manual pass at those four widths (Tools tab
switch to Interview Simulator; open a Program detail page; run the new-
user signup journey on an actual phone/emulator) before shipping.
