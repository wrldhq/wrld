# WRLD Website V21 — Mobile Orbit Preview Enhancement & Repository Cleanup

Source of truth: the completed WRLD Website V20.6.3 project from earlier in this conversation. This release has exactly two goals — improve Orbit's mobile behavior, and remove obsolete revision-only documentation. Nothing else changed.

## 1. Mobile Orbit preview enhancement

**What it does now:** on mobile screens only (≤720px, the breakpoint already used elsewhere in `styles.css`), Orbit's existing small "guide" bubble automatically shows one short, page-relevant message plus a short action line (e.g. "Tap me for more →") for about five seconds, then collapses smoothly to just the circular launcher. The bubble is the same element that already sat next to the launcher on every screen size — it isn't a new panel. Interactions:

- Tapping the launcher toggles the compact preview open/closed on mobile (single tap, no double-tap).
- Tapping the preview's text/action line opens Orbit's existing full assistant panel and closes the compact preview — the two never show at once.
- The preview's own "✕" collapses it immediately and prevents it from auto-showing again for the rest of the session (same session-wide dismissal WRLD already had).
- A tap outside the preview collapses it; scrolling or resizing never reopens it; beginning to interact with it (a tap, or focusing its close button) cancels the automatic collapse.
- Pages that are a form or the onboarding flow itself (signup, login, forgot/reset password, welcome, owner-setup) are unaffected, same as before.
- `aria-hidden`/`tabindex` are kept in sync with visibility, the launcher and the "✕" are real keyboard-operable buttons, and the site's existing global `prefers-reduced-motion` rule already makes every transition here instant for those users — no extra motion-handling code was needed.

**Desktop is unchanged.** The guide bubble still shows its full contextual tip permanently, with no timer, no auto-collapse, and no action line (the action-line element is `display:none` outside the mobile media query). The only two additions that touch desktop at all are accessibility-only and don't change appearance or timing: the bubble and the launcher are now genuinely keyboard-operable (Enter/Space), and the whole bubble (not just its text) is now a real click target — see the bugfix below for why that was necessary either way.

**One necessary adjacent fix.** While wiring up the compact preview, `app.js`'s `setGuideMessage()` was found to call `.textContent` on the *entire* bubble wrapper — which also contains the "✕" button (and, as of this release, the action line). Setting `.textContent` deletes all of an element's children, so every page load was silently removing the bubble's own click target and its dismiss button from the DOM, on every screen size, before a visitor ever saw them. Orbit never looked broken because the separate circular avatar icon has its own working click handler — but the bubble's own tap area and "✕" had been non-functional. This was fixed by giving the message text its own `#guide-bubble-text` span and targeting that instead; it was a required fix for the new mobile feature to work at all (the compact preview's own close button and message-tap depend on the bubble's children surviving), not a separate change.

### Files modified
- **`orbit.js`** — replaced the previous "auto-open the full chat panel, then auto-close it" mobile behavior with the compact-preview system described above (`showOrbitCompactPreview()`, `collapseOrbitCompactPreview()`, `dismissOrbitCompactPreview()`, `orbitLauncherTap()`, `orbitOpenFullFromPreview()`, `orbitCompactPreviewText()`, `contextualOrbitPreviewAction()`, `orbitRenderGuideBubbleContent()`); auto-collapse timer changed from 6.5s to 5s; added a re-entrancy guard so `initOrbitAutoBehavior()` can never register duplicate timers/listeners. The full assistant panel's own code (`openOrbitPanel()`, `closeOrbitPanel()`, chat history, response engine) is untouched.
- **`app.js`** — `renderFooter()`'s guide-bubble markup gained an `id` on the message span, a new (desktop-hidden) action-line element, and working `onclick`/`onkeydown` handlers on the bubble wrapper and the launcher. `setGuideMessage()`/`guideTip()` fixed per the bugfix above and now delegate to `orbit.js`'s `orbitRenderGuideBubbleContent()`. No other function in this file changed.
- **`styles.css`** — added the mobile-only (`@media(max-width:720px)`) show/collapse state for `.guide-bubble` (opacity/transform, never `display`, so the launcher's position never shifts) and the action-line style; added one desktop-scoped `display:none` base rule for the action line. No existing rule's values changed.
- Every other `.html` page — cache-busting only (`?v=21` on `app.js`, `orbit.js`, and `styles.css`, the three files this release touches). No other line changed — verified with a full recursive diff against the V20.6.3 baseline.

### Confirmed unchanged
Desktop Orbit's layout, copy, width, positioning, animation, timing, and full assistant; every other page and feature (Homepage, header/footer/nav, Playbooks, Learning Paths, Programs, Live Learning, Download Centre and previews, Community Commons, Volunteer Tracker, Explorer Dashboard, Mentor Studio, Administrator Dashboard, Owner Command Centre, Account Settings, authentication, signup/login/logout, email verification, onboarding, the Adulting Readiness Assessment, Supabase client logic, RLS policies, Edge Functions, email automation); Orbit's character artwork.

## 2. Repository documentation cleanup

Removed 30 obsolete, revision-only files that only ever documented a completed past release (every `CHANGES-Vx.md` from V18 through V20.6.3, the original un-suffixed `CHANGES.md`, every version-specific testing/regression/onboarding/cache-state summary, `FILE-INVENTORY-V19.2.md`, `V19.2-BACKEND-SETUP.md`, and four superseded per-release deployment guides). Every removed file was checked for references from HTML, JS, CSS, Supabase config/functions, and email templates first — none were found; only in-code comments in `app.js`/`auth.js`/`supabase-client.js` mention a few of these filenames by name for historical context, and those files were left untouched (out of scope for this release) rather than edited to scrub the mentions.

Two version-suffixed files were deliberately **kept** despite their `-V19` names, because their content is still the accurate, current description of live, unchanged behavior: `DELETION-BEHAVIOR-V19.md` (still exactly what the live `delete-user` Edge Function does) and `PERMISSION-MATRIX-V19.md` (still exactly today's role/capability model in `auth.js`). `MIGRATION.md` was kept for the same reason — it explains the still-live `checkLegacyAccountNotice()` behavior.

The five overlapping deployment guides (`DEPLOYMENT.md`, `DEPLOYMENT-GUIDE.md`, `DEPLOYMENT-V19.md`, `V20.1-DEPLOYMENT.md`, `V20.2-DEPLOYMENT.md`) were consolidated into one current `DEPLOYMENT.md`, folding in the still-needed generic hosting setup, the full current migration/Edge-Function list, and required secrets from the ones removed, rather than leaving a dangling cross-reference to a deleted file.

`README.md`, `CLAUDE.md`, `AUTH-SECURITY-SETUP.md`, `EMAIL-AUTOMATION-SETUP.md`, and `ORBIT-AI-SETUP.md` were kept unchanged — all are current, actively referenced by live code/config, and not version-pinned.

Folders `email-templates/`, `images/`, `local-simulation/`, and `supabase/` were all verified as still required (email templates are the real Supabase Auth/mentor-notification templates; images are used across every page; `supabase/` is the live backend; `local-simulation/` holds the Node test harnesses this project already used to verify `auth.js`/`supabase-client.js`, both unchanged this release) and were left in place. A new harness, `local-simulation/simulate_orbit_mobile.js`, was added alongside the existing two — it drives the real `orbit.js` mobile state machine (auto-show, timer, toggle, dismiss, tap-outside, desktop no-op) against a minimal hand-rolled fake DOM.

### Full list of removed files
`CHANGES-V18.md`, `CHANGES-V19.md`, `CHANGES-V19.2.md`, `CHANGES-V20.md`, `CHANGES-V20.1.md`, `CHANGES-V20.2.md`, `CHANGES-V20.4.md`, `CHANGES-V20.5.md`, `CHANGES-V20.6.md`, `CHANGES-V20.6.1.md`, `CHANGES-V20.6.2.md`, `CHANGES-V20.6.3.md`, `CHANGES.md`, `TESTING-SUMMARY-V19.md`, `TESTING-SUMMARY-V19.2.md`, `V20.2-TESTING-SUMMARY.md`, `V20.4-TESTING-SUMMARY.md`, `V20.5-TESTING-SUMMARY.md`, `V20.6-TESTING-SUMMARY.md`, `V20.6.1-ONBOARDING-TEST.md`, `V20.6.2-CACHE-STATE-TESTING.md`, `V20.6.3-LIVE-SESSION-TESTING.md`, `DESKTOP-REGRESSION-SUMMARY.md`, `MOBILE-TESTING-SUMMARY.md`, `FILE-INVENTORY-V19.2.md`, `V19.2-BACKEND-SETUP.md`, `DEPLOYMENT-V19.md`, `V20.1-DEPLOYMENT.md`, `V20.2-DEPLOYMENT.md`, `DEPLOYMENT-GUIDE.md`.

## Cache busting

`app.js`, `orbit.js`, and `styles.css` are the only files this release changes, so their references are the only ones bumped, to `?v=21`, across all 31 pages (`styles.css` and `orbit.js` had no or inconsistent versioning before this release — every reference to both is now consistently `?v=21`). No other script/stylesheet reference was touched.

## Database migration

None required or included. This release is entirely static frontend files (HTML/CSS/JS) plus documentation housekeeping — nothing in `supabase/migrations/` or `supabase/functions/` changed.

## Testing performed

- **Static validation**: `node --check` on `app.js` and `orbit.js`; a brace-balance check on `styles.css`; a full recursive `diff` against the V20.6.3 baseline confirming every non-JS/CSS page's only change is its three cache-busting version bumps.
- **Local simulation**: `local-simulation/simulate_orbit_mobile.js` loads the real `orbit.js` in a sandboxed VM against a minimal fake DOM and asserts 25 checks covering the automatic preview, the ~5s auto-collapse, manual dismiss + session-wide suppression, single-tap toggle, opening the full assistant from the preview (no overlap), canceling auto-collapse on interaction, excluded pages, desktop no-op behavior, the re-entrancy guard, and the ~120-character truncation. All 25 pass.
- **Not performed**: hosted or real-device browser testing (no live deployment or physical/emulated device access in this session) — Safari iPhone, Chrome iPhone, Chrome Android, and real 320px-width rendering were not visually confirmed. The CSS reuses the project's existing mobile breakpoint and safe-area handling (already relied on by the pre-existing guide bubble and Orbit panel), and the state-machine logic itself was verified directly, but an actual on-device check is recommended before considering this fully verified in production, same as prior releases' documented limitations.
