# WRLD Website V21.1 — Change Log

Two narrowly-scoped mobile formatting fixes on top of V21. Nothing else was touched.

## Fix 1: Tools page — mobile horizontal overflow

**Root cause:** the site-wide `.btn` rule sets `white-space:nowrap`. Inside the Tools
page's result panels, a couple of generated CTAs — e.g. "⬇️ Generate My Downloadable
Budget Plan" — are long enough that, left unwrapped, they render wider than a phone
viewport. No ancestor clips overflow, so the button's box silently extended past the
right edge: invisible on load, only revealed when the page was dragged horizontally.

**Fix:** scoped to `.tool-panel` (the 5 Tools cards) only —
- `.tool-panel .btn` now wraps its label instead of forcing nowrap on mobile.
- `.tool-panel .card` padding reduced slightly on mobile (matches the same treatment
  already used for `.pillar`/`.value-card`/`.diff-card` elsewhere in the file), giving
  wrapped labels more room.
- Added `overflow-x:hidden` to `html` (in addition to the existing rule on `body`) as a
  containment safeguard — iOS Safari can still reveal an overflowing descendant via
  elastic drag even when only `body` is clipped. This has no visual effect on any page
  unless something overflows.

No other page uses `.tool-panel`, so no other button on the site is affected.

## Fix 2: Individual program detail pages — mobile layout

**Root cause:** the hero row (badges/title/tagline + enrolment card) is a `.flex` row
with `min-width:300px` on the main column and `min-width:280px; max-width:320px` on the
enrolment card. The existing V21 rule that zeroes inline `min-width` on mobile removed
the floor that used to force wrapping — so instead of stacking, the browser kept both
columns side-by-side and just kept shrinking them, squeezing the program content into a
narrow strip with the enrolment card shrunk down over it.

**Fix:** added three new classes to `program.html`'s hero markup only —
`prog-hero-row`, `prog-hero-main`, `prog-hero-enroll`. On mobile these force the row to
`flex-direction:column`, each child to full width, and let the enrolment card's own
buttons wrap. Because `program.html` is the single shared template every individual
program page renders through (`getProgram(id)`), this fixes all program detail pages,
not just Summer Leadership Intensive.

These are new, dedicated classes — several other pages use the same generic
`.flex.justify-between.items-start` combo for unrelated UI, so nothing outside
`program.html`'s hero is affected.

## Files changed

- `program.html` — added `prog-hero-row` / `prog-hero-main` / `prog-hero-enroll`
  classes to the existing hero markup (no structural/content changes).
- `styles.css` — appended two new, clearly-commented, media-query-scoped rule blocks
  at the end of the file (`max-width:720px` only). No existing rule was edited or
  removed.

No other files were modified.

## Desktop / tablet

Both fixes are scoped to `@media(max-width:720px)`. Desktop and tablet layouts for
Tools, Programs listing, and program detail pages are byte-for-byte unchanged in
their applicable CSS.

## Not touched

Programs listing page, Orbit (mobile preview, launcher, desktop assistant), header,
footer, navigation, auth/signup/login/onboarding, assessment, dashboards, volunteer
tracker, download previews, Community Commons, playbooks, learning paths, live
learning, colours, typography, images, illustrations, spacing, Supabase integration,
account-scoped state.

## Database

No database migration required. No Supabase schema, RLS, or function changes.
