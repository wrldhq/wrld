# WRLD Website V21.3 — Change Log

One narrowly-scoped repair on top of V21.2: the mobile new-user route
(signup → Orbit welcome → assessment → dashboard). Nothing else was touched.

## Where the mobile route actually failed

Traced the full sequence (signup.html → account creation → welcome.html →
assessment.html → dashboard.html) rather than re-touching the signup page again.

**Signup itself is fine.** The V21.2 fix (`.signup-shell`) still works: the form is in
the DOM, visible, correctly sized, and submits normally on mobile.

**The actual failure point is `welcome.html` (the dedicated Orbit welcome/onboarding
page).** It uses the exact same `.auth-shell` wrapper as signup —
`min-height:calc(100vh - 400px)` + `display:flex; align-items:center; justify-content:
center`. V21.2's fix for this pattern (dropping the vh-centering on mobile) was
deliberately scoped to signup only via a new `.signup-shell` class, so `welcome.html`
never received it and kept the original behavior. On mobile this vertically centers the
welcome card — Orbit avatar, four fading-in greeting lines, and the "Let's Get
Started →" button — inside an oversized, `100vh`-based box. The avatar can render
inside the initial viewport while the greeting text and the "Let's Get Started →"
button (the only way to continue to the assessment) are centered further down, outside
the initial viewport — reproducing the "large white card, Orbit centered, blank screen
below, no usable continue control" symptom. This is the exact point the new-user
journey got stuck: not a duplicated floating Orbit, and not signup — the dedicated
Orbit welcome page itself, still on the pre-V21.2 `.auth-shell` behavior.

**Secondary issue found on `assessment.html`:** it was not in `orbit.js`'s
`ORBIT_AUTO_SHOW_EXCLUDED_PAGES` list, so the separate floating Orbit mobile preview/
launcher (fixed at the bottom-right corner) could initialize there. The assessment's
own "Continue →" button sits at the bottom-right of the question card — the same
corner the floating launcher docks in — so it could sit on top of that control on a
short mobile screen. `signup.html` and `welcome.html` were already excluded;
`assessment.html` was the one page in the new-user route missing from that list.

**Nothing else in the route is broken.** `assessment.html`'s own layout (`.assess-shell`,
`.assess-card`, question/answer controls) uses normal document flow already and needed
no changes. Authentication/session logic (`auth.js`, `supabase-client.js`,
`postAuthDestination()`) was inspected and is untouched — the desktop route proves it's
already correct; the break was in layout and Orbit-preview scoping only, not auth.

## Fix

1. **`welcome.html`** — added a new `welcome-shell` class alongside the existing
   `auth-shell` class on its wrapper `<section>`, mirroring the signup fix exactly.
2. **`styles.css`** — added `@media(max-width:720px){ .welcome-shell{min-height:0;
   display:block;} }`. On mobile this drops the vh-based centering in favor of normal
   top-down document flow (header → Orbit avatar → greeting → continue button),
   matching the required layout. `.auth-shell` itself (still used by login,
   forgot-password, reset-password, become-mentor) and the existing `.signup-shell`
   rule are both untouched.
3. **`orbit.js`** — added `'assessment.html'` to `ORBIT_AUTO_SHOW_EXCLUDED_PAGES`, so
   the floating Orbit mobile preview/launcher no longer initializes during the initial
   assessment, the same way it was already suppressed on signup and welcome. The
   assessment's own inline Orbit avatar/quote (the dedicated onboarding content) is
   untouched — only the separate floating preview is excluded.
4. **Cache busting** — bumped `styles.css?v=21` → `?v=21.3` and `orbit.js?v=21` →
   `?v=21.3` across every page that loads them (both files' contents changed, and
   every page shares the same two files, so every reference needed the same bump to
   avoid mobile devices serving a stale cached copy). No other version strings
   (`app.js`, `auth.js`, `supabase-client.js`) were touched, since those files were not
   modified.

## Files changed

- `welcome.html` — added `welcome-shell` class (no content/script changes) + cache-bust bump.
- `styles.css` — added one new mobile-only rule block (`.welcome-shell`). No existing rule edited or removed.
- `orbit.js` — added one entry to an existing array. No other logic touched.
- All 31 HTML pages — `styles.css`/`orbit.js` cache-bust query strings updated (`?v=21` → `?v=21.3`). No other change to any of these pages; `program.html` and `signup.html` retain only their existing V21.1/V21.2 class additions plus this same version bump.

## Desktop behaviour

Both new rules are scoped to `@media(max-width:720px)` and/or a class not referenced
in any desktop-only CSS path. Desktop signup, Orbit welcome, assessment, and dashboard
are visually and functionally unchanged. Desktop Orbit is unaffected — the excluded-
pages check in `orbitCurrentPageExcludedFromAutoShow()` is only ever consulted by
`initOrbitAutoBehavior()`, which already returns immediately on desktop
(`if(!orbitIsMobile()) return;`) before it ever checks the page list.

## Previously fixed issues, reconfirmed preserved

- Tools page mobile horizontal overflow (V21.1): `.tool-panel` rules untouched.
- Program detail mobile layout (V21.1): `.prog-hero-*` rules untouched.
- Signup mobile blank page (V21.2): `.signup-shell` rule and `html`/`body`
  `overscroll-behavior-x` rule both untouched.
- Orbit's ordinary five-second mobile preview/auto-collapse/launcher: untouched on
  every page except the three now-excluded auth/onboarding pages, where it was never
  meant to compete with dedicated onboarding content in the first place.

## Testing performed

All testing in this pass was **static code inspection and manual reasoning** — reading
the actual HTML/CSS/JS, computing the CSS cascade and box model by hand, and tracing
the route logic (`requireAuth()`, `wrldRunWelcomeEntry()`, `postAuthDestination()`,
`beginJourney()`) end to end. This session's sandbox has no headless browser or mobile
device/emulator available, so **no rendered-in-browser or live-device verification was
performed** for this change. The diagnosis (welcome.html's unconverted `.auth-shell`,
and assessment.html's missing Orbit-preview exclusion) is based on directly reading the
same CSS mechanism already confirmed to have caused the identical, already-fixed
signup bug in V21.2, applied to the one remaining page in the new-user route that still
had it. Recommend a real-device or emulator pass on the full signup → welcome →
assessment → dashboard route before wide rollout.

## Database

No database migration required. No Supabase schema, RLS, function, or auth-flow
changes. `auth.js`, `supabase-client.js`, and `supabase-config.js` were not modified.
