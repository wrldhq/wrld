# WRLD Website V21.2 — Change Log

One narrowly-scoped repair on top of V21.1: the mobile signup blank-page regression.
Nothing else was touched.

## Root cause

V21.1 added one *unscoped, page-wide* rule as a defensive safeguard for the Tools page
overflow fix: `html{overflow-x:hidden;}`. It was the only V21.1 rule not scoped to a
specific class (every other V21.1 change targets `.tool-panel` or the new
`.prog-hero-*` classes — neither exists on `signup.html`), which made it the prime
suspect per the requested audit.

`<body>` already had `overflow-x:hidden` (unchanged since V21). By default, when
`<html>` has no overflow of its own, browsers propagate `<body>`'s overflow up to the
actual viewport — that's how the original `body{overflow-x:hidden}` was correctly
preventing horizontal drag on every page. Adding an explicit `overflow-x` on `<html>`
as well turns that propagation off, so `<html>` and `<body>` each manage overflow
independently instead. That's a documented source of mobile Safari bugs around
`100vh`-based sizing and `position:sticky` — and `.auth-shell` (signup's outer wrapper)
uses exactly that combination: `min-height:calc(100vh - 400px)` plus a
`position:sticky` header, which lines up with signup being the page that broke.

## Fix

1. **Removed** `html{overflow-x:hidden;}`, restoring `<html>` to its original V21
   default and restoring standard body→viewport overflow propagation.
2. **Replaced** it with `overscroll-behavior-x:none` on `html, body` — the CSS property
   actually designed to stop the horizontal drag/bounce-reveal gesture, without
   touching `overflow` at all. The Tools page's real overflow source (a long,
   non-wrapping CTA button) was already fixed at its source in V21.1, so this swap
   carries no risk of reopening that fix.
3. **Added** a second, more direct layer scoped only to signup: a new `.signup-shell`
   class on signup.html's `<section class="auth-shell">`. On mobile, it drops the
   `min-height:calc(100vh - 400px)` + flex-centering in favor of normal top-down
   document flow (header → heading → form → submit → login link), matching the
   required mobile layout exactly. `.auth-shell` itself — shared by login,
   forgot-password, reset-password, and become-mentor — is untouched, so none of those
   pages' mobile layouts change.

## Desktop / other pages

Every change above is either invisible by default (`overscroll-behavior-x` has no
effect on normal layout) or scoped to `@media(max-width:720px)` and/or the new
`.signup-shell` class. Desktop signup, login, forgot-password, reset-password, and
become-mentor are all unchanged.

## Files changed

- `signup.html` — added `signup-shell` class to the existing `<section class="auth-shell">` (no content/field changes).
- `styles.css` — removed the one V21.1 `html{overflow-x:hidden}` rule; added `overscroll-behavior-x:none` (html, body) and a mobile-only `.signup-shell` rule.

No other files were modified. `auth.js`, `supabase-client.js`, `supabase-config.js`,
and `orbit.js` are untouched — this was a layout-only fix.

## V21.1 fixes preserved

- Tools page mobile horizontal overflow: `.tool-panel` rules untouched, still fixed.
- Individual program detail mobile layout: `.prog-hero-*` rules untouched, still fixed.
- Orbit mobile preview/auto-collapse and desktop Orbit: untouched.

## Database

No database migration required. No Supabase schema, RLS, or function changes.
