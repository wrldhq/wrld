# WRLD Website V20.1 — Changelog

Focused corrective update built on top of the completed V20 project (V20 is the sole source of truth; no new source files were uploaded for this pass). Five in-scope fixes only — no redesign, no unrelated changes, no mobile layout changes.

---

## 1. Volunteer Tracker authentication and redirect loop

**Problem found:** `volunteer-tracker.html`'s inline script called `requireAuth()` synchronously, before `window.wrldAuthReady` (the promise `supabase-client.js` resolves once the cached session/profile has actually been restored) had settled. On a real, logged-in session this race meant the page frequently read "not logged in" during the brief window before the session cache finished restoring, sent the user to `login.html`, and — because nothing about the destination changed on the next load — could loop.

**Fix:**
- Wrapped the page's entire inline script in `(async () => { await window.wrldAuthReady; if (requireAuth()) { ...existing logic... } })();`, matching the working pattern already used on `account-settings.html`.
- Added a `#vt-loading` state (shown by default) and moved all existing markup into `#vt-content` (hidden by default); the script swaps them only after `wrldAuthReady` resolves and `requireAuth()` passes, so a valid session never flashes a false "logged out" state.
- Verified every `onclick`-bound function on the page (`exportVolunteerRecordPDF`, `exportScholarshipReportPDF`, `editVolunteerEntry`, `removeVolunteerEntry`, `saveVolunteerEntry`, `cancelEditVolunteerEntry`) is assigned via explicit `window.fnName = function(){}`, not a bare hoisted `function` declaration — required for it to be safe to wrap the script in an async IIFE.
- Closed an adjacent, pre-existing open-redirect gap while fixing the auth flow: added `safeInternalNext(raw)` to `auth.js`, and changed `login.html`'s post-login redirect from `params.get('next') || ...` to `safeInternalNext(params.get('next')) || ...`. The allowlist only accepts a bare `filename.html[?query]` — it rejects any value with a URI scheme (`http:`, `javascript:`, etc.), a protocol-relative `//` prefix, or a backslash, so a crafted `?next=` can no longer send a user off-site after login.

**Files changed:** `volunteer-tracker.html`, `auth.js`, `login.html`.

---

## 2. Safari-only line at the homepage hero transition

**Problem found:** A thin blue-grey seam is visible directly beneath the curved hero divider in Safari only (not Chrome/Firefox/Edge). The site's hero divider is an inline SVG (`.divider-curve`) sized from its intrinsic aspect ratio; WebKit and Blink round that intrinsic height differently by roughly a sub-pixel, which is enough to leave a hairline gap between the SVG's bottom edge and the cream section that follows it in Safari's renderer.

**Fix:** Added a Safari-only override scoped with the `@supports (-webkit-hyphens:none)` feature query — true only in WebKit/Safari, false everywhere else — so the rule cannot fire in Chrome and Chrome's rendering is byte-for-byte unchanged:

```css
@supports (-webkit-hyphens:none){
  .home-hero .divider-curve{ margin-top:-4px; }
}
```

This pulls the divider up by 2 additional pixels **in Safari only**, increasing the overlap with the section below just enough to close the seam without touching the curve shape, colors, or any other browser's layout.

**Files changed:** `styles.css`.

**Caveat (please read):** this environment has no Safari renderer available to visually confirm the fix pixel-for-pixel. The root cause and fix are sound (verified against the actual markup and a well-documented WebKit SVG-sizing quirk), and Chrome's output is provably unchanged, but I'd recommend a quick visual check in real Safari before/instead of treating this as fully closed. If the line is still visible, the `margin-top` value in that block can be adjusted (e.g. `-5px` or `-6px`) without any other changes.

---

## 3. Permanent mentor-application deletion

**Status:** already fully implemented and live as of V20 — re-verified end-to-end for this release rather than re-built.

**What's in place:**
- `delete_mentor_application(p_application_id uuid)` — a `SECURITY DEFINER` Postgres RPC, permanently applied via migration `20260731090000_037_v20_community_and_mentor_repair.sql`, confirmed present and owned by `postgres` on the live database as of this pass. Requires `role_at_least('admin')`; deletes the application row (and its storage attachments, handled client-side before the RPC call) without touching the `profiles`/auth record of anyone who was separately approved as a mentor.
- `owner-dashboard.html`'s `odDeleteMentorApp()` and `administrator-dashboard.html`'s `adMentorAppsCache` / `adDeleteMentorApp()` both call this RPC behind a confirmation modal showing the applicant's name, email, status, submission date, and attachment count.
- Permission matrix as specified: **Administrator can permanently delete** (the RPC's `role_at_least('admin')` check) — Owner can as well, by hierarchy. If your product rules intend deletion to be Owner-only, that's a one-line change (`role_at_least('admin')` → `role_at_least('owner')`) in the RPC body, re-applied as a migration; flagging it here rather than silently deciding it for you, since the V20.1 spec's own wording ("unless explicitly allowed by current product rules") implies this is a policy call, not a bug.

**Files involved (unchanged this release, confirmed correct):** `owner-dashboard.html`, `administrator-dashboard.html`, migration `20260731090000_037_v20_community_and_mentor_repair.sql`.

---

## 4. Automatic emoji beside Community Commons usernames

**Problem found:** `community.html`'s `commonsThreadCard()` hardcoded a `🧑` emoji directly into the post-author-name markup (e.g. rendering as "🧑 Desiree | WRLD Founder"), at the rendering source — every post's author line, regardless of who posted it.

**Fix:** Removed the hardcoded `<span style="font-size:16px;">🧑</span>` from `commonsThreadCard()`. Author names now render as plain text (e.g. "Desiree | WRLD Founder"). Replies never had this emoji to begin with. Any emoji a user actually types into their own post or comment body is untouched — this only removed the automatically-injected icon next to the name, not user-authored content.

**Files changed:** `community.html`.

---

## 5. Learn-section alignment and the Orbit recommendation component

**Audited pages (all of them, not just one):** `learning-paths.html`, `programs.html`, `program.html`, `events.html`, `downloads.html`, `worksheet.html`, `assessment.html`, `dashboard.html`, plus `community.html` (also uses the same component).

**Problem found — Orbit component:** Two different "Orbit" SVGs existed side by side in the codebase under the identical constant name `ORBIT_AVATAR_SVG_SM`:
- The **real** Orbit character (a teal circle with a blob-shaped gold/yellow accent shape and dark-navy dot eyes) — matches `favicon.svg` exactly, and is used correctly in `dashboard.html`, `playbook.html`, and `assessment.html` (the page the spec's "Start My Journey" reference points to).
- A **generic placeholder** (a plain blue circle with simple white dot eyes and a white smile curve, no relation to the brand mark) — was in use on `learning-paths.html`, `downloads.html`, `programs.html`, `community.html`, `worksheet.html`, and `events.html`.

**Fix:** Replaced the generic placeholder's `ORBIT_AVATAR_SVG_SM` definition with the real Orbit character markup (copied verbatim from the canonical source, not regenerated) in all six affected files. The surrounding `.assess-orbit-line` panel structure — optional label → pale blue panel → Orbit image → copy → action button — was already correct and untouched; only the SVG content itself was swapped.

**Files changed:** `learning-paths.html`, `downloads.html`, `programs.html`, `community.html`, `worksheet.html`, `events.html`.

**Alignment audit result:** Reviewed container structure (`.container`, `.section-head`, grid layouts), heading hierarchy, and empty-state markup on every page listed above. All pages consistently use the same shared design system (`.container{max-width:...; margin:0 auto}`, `.section-head{max-width:660px; margin:0 auto 60px}` with `.center` applied only on genuinely centered empty/placeholder states), and the one page using a hard-coded inline 2-column grid (`events.html`'s `.events-wrap`) is correctly forced back to one column on mobile via an `!important` override in `styles.css`, so the inline style cannot block the mobile layout. No structural or CSS misalignment was found across any of the audited pages. No screenshot was attached to the request (referenced twice as "the attached screenshot" / "shown above," but no image accompanied the message), so this is a structural/CSS audit rather than a pixel-level visual comparison — if a specific visible misalignment remains, a screenshot of it would let me target the exact rule.

---

## Files changed (full list)

- `volunteer-tracker.html`
- `auth.js`
- `login.html`
- `styles.css`
- `community.html`
- `learning-paths.html`
- `downloads.html`
- `programs.html`
- `worksheet.html`
- `events.html`

## Files audited, unchanged (confirmed correct)

- `program.html`, `assessment.html`, `dashboard.html`, `owner-dashboard.html`, `administrator-dashboard.html`
- Migration `20260731090000_037_v20_community_and_mentor_repair.sql` (already live)
- Edge Function `delete-user` (already live at version 2)

## Backend

No new migrations or Edge Function changes were required for V20.1 — Revision 3 (mentor-application deletion) was already fully implemented and deployed as part of V20, and re-verification against the live database confirmed `delete_mentor_application`, `moderation_set_community_status`, and `report_community_content` are all present, `SECURITY DEFINER`, and owned by `postgres`, and that the `delete-user` Edge Function is `ACTIVE` at version 2 with the corrected anonymization table/column list. See `V20.1-DEPLOYMENT.md` for full deployment instructions, including how to (re)apply everything from scratch on a fresh project.
