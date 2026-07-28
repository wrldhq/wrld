# WRLD Website V20.2 — Changelog

Final visual polish and mentor-application-deletion repair, built on top of the completed V20.1 project. Three in-scope areas only, driven directly by the attached screenshots — no redesign, no unrelated changes.

---

## 1. Homepage hero transition line — permanently removed

**Exact element that caused it:** `.divider-curve`, the inline `<svg>` at the bottom of `.home-hero` in `index.html` (`<svg class="divider-curve" viewBox="0 0 1440 100" ...>`).

**Root cause:** the SVG has no explicit `width`/`height` attributes — only `viewBox="0 0 1440 100"` plus `width:100%` in CSS. Its rendered pixel height is therefore derived by each browser from the intrinsic 1440:100 aspect ratio and rounded to a device pixel. That rounding is not guaranteed to land exactly on `.home-hero`'s own bottom edge in every browser/viewport/DPR combination. Whenever the SVG's rendered box came up a fraction of a pixel short, a hairline of `.home-hero`'s own blue gradient background showed through directly above the cream "School teaches you equations..." section, reading as a thin blue-grey line.

The V20.1 attempt (a Safari-only `margin-top: -4px` nudge via `@supports (-webkit-hyphens:none)`) patched the specific case it was tuned against but didn't address the underlying rounding uncertainty — which is why the line was still visible in the V20.2 bug report's screenshot.

**Actual fix — `styles.css`:**
```css
.home-hero::after{
  content:""; position:absolute; left:0; right:0; bottom:0;
  height:8px; background:var(--cream); z-index:0; pointer-events:none;
}
```
This paints a solid cream safety strip directly behind the curve SVG, pinned to the exact bottom edge of `.home-hero`. Everywhere the curve's own cream fill reaches — which is effectively its entire bottom edge, since even the highest point of the wave path stays well above the last few pixels of the SVG's box — this strip is completely invisible, hidden under the SVG's own paint. In the sub-pixel sliver where the SVG's rendered height falls short, this strip is what gets exposed instead of raw hero background, and it's already the exact cream the next section uses. There is no longer any color that can render as a visible line, in any browser, at any viewport width or zoom level, because the fix doesn't depend on the SVG's height being exactly right anymore — it guarantees what's *behind* the SVG's edge instead.

The old Safari-only `margin-top` rule was removed rather than left in place, since it's no longer needed and stacking it with the new fix would only add complexity for no benefit.

**Verified unchanged:** curve shape, hero height, section spacing, all other browsers' rendering (this fix doesn't touch anything Chrome/Firefox/Edge were already doing correctly).

**Caveat:** this sandboxed environment has no real Safari (or any) browser renderer available to take a literal screenshot for pixel comparison. The fix is architecturally guaranteed rather than tuned-by-observation this time — it removes the failure mode entirely rather than nudging around it — but a quick visual confirmation in real Safari is still the right final check before calling this fully closed.

---

## 2. Learn-section alignment and Orbit recommendation centering

**Pages reviewed (all of them):** `learning-paths.html`, `programs.html`, `program.html`, `events.html`, `downloads.html`, `worksheet.html`, `assessment.html`, `dashboard.html`, `community.html`. (`program.html` and `assessment.html` were reviewed and found already correct — `assessment.html` is in fact the reference implementation the rest of the site was measured against.)

**Confirmed root cause of the off-center recommendation panels:** `assessment.html`'s Orbit panel (the approved reference, `<div class="assess-orbit-line" style="max-width:520px; margin:0 auto ...">`) has always centered itself with `margin: 0 auto`. Five other pages' equivalent panels did not:

| File | Element | Before | After |
|---|---|---|---|
| `programs.html` | `#programs-orbit-line` | `style="max-width:640px;"` (no auto margin — flush left) | `margin:0 auto 24px` added |
| `learning-paths.html` | `#start-here-orbit-line` | `style="max-width:640px;"` | `margin:0 auto 24px` added |
| `downloads.html` | `#dl-orbit-line` | `style="max-width:640px; margin:0 0 20px;"` (top/bottom only) | `margin:0 auto 20px` |
| `events.html` | `#sessions-orbit-line` | `style="max-width:640px;"` | `margin:0 auto 24px` added |
| `dashboard.html` | greeting bar (`#orbit-dash-line`) | left-aligned, tied to the page's own left-aligned "Welcome back" heading | left as-is — see note below |

`community.html` and `playbook.html`'s panels already had `margin:0 auto` and needed no change.

Each of these pages' preceding `.section-head` (the "🎯 Recommended for You" / "Where Orbit would start" style label+heading) also had text-align left by default; added the `.center` modifier class (`.section-head center`, already defined in `styles.css` as `text-align:center`) to `programs.html`, `learning-paths.html`, `downloads.html`, and `events.html` so the label and heading are visibly centered above the now-centered panel, matching the approved label → heading → panel → cards structure.

**Dashboard greeting bar note:** `dashboard.html`'s Orbit line at the very top isn't a "Recommended for You"-style labeled panel — it's a personal greeting directly beneath the page's own left-aligned `<h2>Welcome back 👋</h2>`. Centering the Orbit panel while leaving its own heading left-aligned would have created a new inconsistency in the opposite direction, so this one was left as-is; it isn't one of the labeled recommendation panels the centering requirement targets.

**Eye preview icons not centered in their circular buttons — root cause found:** `.btn-icon` (used by the 👁️ preview button on every download card, and by the calendar's ←/→ buttons in `app.js`) was missing `display:flex`/centering entirely:
```css
/* before */
.btn-icon{width:44px; height:44px; padding:0; border-radius:50%; background:var(--gray); flex-shrink:0;}
```
Without it, the emoji glyph inside was positioned by ordinary inline-text line-height/baseline rules rather than the circle's actual center — which is exactly the visible off-center eye in the screenshot. Fixed at the shared class level so every button using it is corrected everywhere, not just on the photographed page:
```css
.btn-icon{display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; padding:0; border-radius:50%; background:var(--gray); flex-shrink:0; line-height:1; font-size:16px; text-decoration:none;}
```

**Single/partial-row recommendation cards sitting awkwardly to one side — root cause found:** the recommendation grids (`#recommended-programs-grid`, `#recommended-dl-grid`) used a fixed `grid-template-columns:repeat(N,1fr)`. When fewer cards render than the fixed column count (e.g. exactly one recommended program), CSS Grid still reserves all N columns for that row and places the lone card in column 1 — pinned left with empty un-collapsed columns beside it. This is also why the download picks screenshot showed 4 cards in a clean row but the 5th card alone, left-aligned, on the row below.

Fixed with a new shared class, using flexbox instead of grid specifically because flexbox treats each wrapped row as an independent line (grid shares one column template across every row, so `auto-fit` alone does not fix a short final row):
```css
.grid-recommend{display:flex; flex-wrap:wrap; justify-content:center; gap:24px;}
.grid-recommend > *{flex:1 1 260px; max-width:340px;}
```
Applied to `#recommended-programs-grid` (`programs.html`) and `#recommended-dl-grid` (`downloads.html`), replacing their previous fixed inline `grid-template-columns`. A full row still fills edge-to-edge as before; a partial final row or a single card now centers itself instead of hugging the left edge. This is inherently responsive — no separate mobile breakpoint was needed, since at phone widths only one 340px-max card fits per line, naturally becoming the same single-column stack already used elsewhere on mobile.

**Files changed:** `styles.css`, `programs.html`, `learning-paths.html`, `downloads.html`, `events.html`.

**Not changed (reviewed, already correct):** `community.html`, `playbook.html`, `assessment.html`, `program.html`, `worksheet.html`'s own "next step" panel (it lives inside an already-centered, fixed-width wrapper and fills it edge-to-edge by design), `dashboard.html`'s "More to Explore" grid (always renders exactly 4 items via `.slice(0,4)`, so it never hits the partial-row case), `learning-paths.html`'s "Coming soon" grid (always exactly 2 items in `LEARNING_PATHS_COMING_SOON`, always fills its 2-column row completely).

---

## 3. Delete Mentor Application — now genuinely functional

**Confirmed root cause of the reported error:** the previous `public.delete_mentor_application(uuid)` Postgres RPC (from migration 037) ran SQL directly against `storage.objects`:
```sql
delete from storage.objects where bucket_id = 'mentor-applications' and name = app_row.resume_file_path;
```
Supabase does not permit direct `DELETE`s against `storage.objects` — this is exactly what produced "Direct deletion from storage tables is not allowed. Use the Storage API instead." every time an application with an attached file was deleted.

**Fix — new Edge Function, `delete-mentor-application`:**
- Validates the caller's session via their own JWT.
- Verifies the caller's real, database-recorded role is exactly `owner` (Administrators are no longer permitted to permanently delete — see the Permission Matrix note below).
- Loads the application's `resume_file_path` and `certs_path`.
- Removes only that application's specific attachment paths via the real Storage API: `adminClient.storage.from('mentor-applications').remove(filePaths)`.
- If storage removal fails, the function stops there and returns an error — the application record is **not** deleted, so nothing is silently orphaned or falsely reported as successful.
- If storage removal succeeds (including the case where a path was already gone — the Storage API doesn't error on that, it just omits it from the result), the application row is deleted.
- Returns structured JSON (`{ok:true}` / `{ok:false, error}`) in every case, including CORS/`OPTIONS` handling matching the rest of the project's Edge Functions.
- Never touches `profiles`, `auth.users`, or the applicant's role — deleting an approved application's record has zero effect on that person's WRLD account or Mentor Studio access.

**Old RPC's fate:** kept in the database (not dropped) as a safety net, but its body now just raises a clear, actionable exception pointing at the new Edge Function, so if anything ever calls it directly again it fails immediately and obviously instead of silently attempting a storage-policy-rejected deletion:
```sql
raise exception 'Mentor application deletion must go through the delete-mentor-application Edge Function...';
```

**Permission Matrix — Owner-only:** the new Edge Function enforces Owner-only server-side regardless of what any client shows. Client-side, the Delete button:
- Continues to appear on `owner-dashboard.html`'s Mentors tab (Owner-only page).
- Was removed from `administrator-dashboard.html`'s per-application card rendering unless `me.role === 'owner'` — since Administrators can also reach that dashboard (`canAccessAdministratorDashboard()` allows Admin-or-Owner), but Administrators are no longer allowed to delete, so the button no longer appears for them at all rather than appearing and then failing. Approve / Decline / Mark Under Review remain available to Administrators exactly as before.

**Client integration (both dashboards):**
```js
const { data, error } = await sbClient.functions.invoke('delete-mentor-application', { body: { applicationId: id } });
if(error || !data?.ok){ /* modal stays open, record stays visible, safe error shown */ }
```
Same confirmation modal, wording, and post-success behavior (close modal, toast "Mentor application deleted successfully.", list + totals refresh) as before — only the underlying call changed.

**Files changed:** new `supabase/functions/delete-mentor-application/index.ts`; new `supabase/migrations/20260801090000_038_deprecate_direct_storage_delete.sql`; `owner-dashboard.html`; `administrator-dashboard.html`.

**Live-verified on the production database** (not just reviewed as code): confirmed the redefined `delete_mentor_application` RPC is live and now raises the deprecation message; confirmed the `delete-mentor-application` Edge Function is deployed and `ACTIVE`; confirmed the `mentor-applications` storage bucket and its existing application rows' `resume_file_path`/`certs_path` values match the path format the new function expects. An actual end-to-end delete was not executed against the live applications visible in the database (they appeared to be real/test data belonging to the account, and deleting them is irreversible) — see `V20.2-TESTING-SUMMARY.md` for exactly what was and wasn't exercised live.

---

## Full file inventory

**Frontend, changed:**
- `index.html` — no markup change; see `styles.css`
- `styles.css` — hero seam fix, `.btn-icon` centering fix, new `.grid-recommend` class
- `programs.html` — centered recommendation section, `.grid-recommend`
- `learning-paths.html` — centered recommendation section
- `downloads.html` — centered recommendation section, `.grid-recommend`
- `events.html` — centered recommendation section
- `owner-dashboard.html` — mentor deletion now calls the Edge Function
- `administrator-dashboard.html` — mentor deletion now calls the Edge Function; delete button gated to Owner only

**Backend, new:**
- `supabase/functions/delete-mentor-application/index.ts` (new Edge Function, deployed, version 1, `ACTIVE`)
- `supabase/migrations/20260801090000_038_deprecate_direct_storage_delete.sql` (applied to production)

**Reviewed, confirmed already correct, not changed:**
- `community.html`, `playbook.html`, `assessment.html`, `program.html`, `worksheet.html`, `dashboard.html`

**Preserved, untouched:** everything else — branding, colors, typography, all playbooks and programs, Community Commons, the Volunteer Tracker fix, the Community username cleanup, Explorer Dashboard, Mentor Studio, Owner Command Centre, Account Settings, Authentication, Supabase integrations, Orbit's floating assistant, Orbit AI fallback, existing users, existing mentor applications, existing progress and database records.
