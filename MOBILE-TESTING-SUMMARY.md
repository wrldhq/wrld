# WRLD Website V18 — Mobile Testing Summary

**Read this before assuming "tested" means "verified on a physical
device."** This summary is deliberately specific about method and limits,
because an inflated claim of device testing would be actively misleading
for a production launch decision.

## Method actually used

This was a **code-level responsive audit**, not physical or emulator
device testing:

- Read every media query in `styles.css` (9 blocks, breakpoints at
  1080px, 980px, 720px, 560px, 400px) and traced which CSS classes each
  one covers.
- Searched all 31 HTML pages for patterns known to cause the specific
  failures listed in the request: inline `grid-template-columns:repeat(N)`
  overrides not covered by a `!important` mobile rule, fixed pixel
  `width:` values that could force horizontal scroll below 400px, and
  large `min-width` floors on flex children.
- Cross-referenced every match against the existing mobile CSS to
  determine whether it was already handled, and fixed the ones that
  weren't (see `CHANGES-V18.md`).
- Verified every inline `<script>` block on every page still parses
  (`node --check`) after the one-line `orbit-knowledge.js` insertion, and
  that the insertion touched nothing else.

## What this method reliably catches

- Grids/columns that don't collapse at all on narrow screens (found and
  fixed one real instance: `.assess-rings-grid`)
- Missing `!important` on a mobile override that an inline style could
  silently defeat (found and hardened one: `.owner-metric-row`)
- Structural overflow risks from fixed pixel widths or unneeded
  `min-width` floors (none found beyond what's already neutralized)
- Whether a responsive rule *exists* for a given component

## What this method does NOT verify, and wasn't claimed

- Real rendering on a physical iPhone/Android device or browser engine
  quirks (Safari-specific `dvh`/safe-area support, virtual keyboard
  behavior, momentum scrolling)
- Real touch-target ergonomics under an actual thumb
- Real form-field-into-view scrolling when a mobile keyboard opens
- Visual polish/spacing judgment calls that require an actual screen —
  a media query "existing and targeting the right class" is not the same
  as "looks great at 375px"
- The dozens of authenticated-state screens (specific Owner Dashboard
  tabs mid-workflow, Mentor Studio's live session list with real data,
  etc.) that only render fully once populated with real Supabase data —
  these were reviewed for CSS/markup structure only, not with live data
  loaded in a browser

## Breakpoints the existing CSS already targets (unchanged by this pass)

320–375px (compact phones, via the 400px rule), 375–414px, 414–430px
(via the 720px rule), 768–820px tablets and nav collapse (via the 980px
rule), and 1024px+ (via the 1080px rule for the article/dashboard
two-column layouts). No new breakpoint was added — the existing ones
already span the requested device range; this pass added fixes *within*
them.

## Recommendation

Before a production launch, run this same page set through real device
testing (or, at minimum, Chrome/Safari device emulation) — particularly
Owner Dashboard, Mentor Studio, and any form with a mobile keyboard —
since those are the areas this audit method is least able to fully
verify.
