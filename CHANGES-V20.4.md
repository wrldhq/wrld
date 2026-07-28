# WRLD Website V20.4 — Changelog

Two narrowly scoped fixes on top of V20.3: the download-preview page falsely showing a logged-out header, and Announcements posting not actually being restricted to Mentor/Administrator/Owner at the database level. No design, layout, spacing, typography, or content changes anywhere.

---

## Fix 1: Download preview showed a false logged-out header

**Exact cause:** `worksheet.html` (the document-preview page every "👁️ Preview" link on Download Center, Playbooks, Programs, Assessment, and Dashboard cards points to) never loaded the Supabase SDK, `supabase-config.js`, or `supabase-client.js`. Its script list was:

```
data.js → orbit-knowledge.js → [inline script] → auth.js → app.js → orbit.js
```

Every other page, including `downloads.html` (where the user starts), loads:

```
supabase-js (CDN) → supabase-config.js → supabase-client.js → data.js → ... → auth.js → app.js → orbit.js
```

This is the same class of bug fixed on `volunteer-tracker.html` in V20.3, manifesting differently here because `worksheet.html` doesn't gate access (it's intentionally a public preview page) — so instead of a wrongful redirect, the visible symptom was a wrongful **header**.

The header is rendered by `initPage()` (in `app.js`), which does:
```js
if(typeof window.wrldAuthReady !== 'undefined') await window.wrldAuthReady;
renderHeader(activeKey);
```
Because `window.wrldAuthReady` was never assigned on this page (it's only ever assigned inside `supabase-client.js`), `typeof window.wrldAuthReady !== 'undefined'` was `false`, so the `await` was skipped entirely and `renderHeader()` ran immediately against `getCurrentUser()` — which also always returned `null` here, since the cache-building function it depends on (`wrldBuildUserFromCache`, also only defined in `supabase-client.js`) didn't exist. The header therefore rendered as logged-out unconditionally, regardless of the visitor's real session — and never re-rendered afterward, since nothing on this page ever re-triggers it. That's exactly the reported behavior: sign in, open a preview, see "Log In / Sign Up," go back to Download Center, see the real signed-in header again (because `downloads.html` loads the three scripts correctly and gets it right).

**Fix:** added the three missing `<script>` tags to `worksheet.html`, in the same order every other page already uses, immediately before `data.js`. That is the entire functional change to this page.

**Does the preview use the shared Supabase client? Yes** — now identically to every other page: same `sbClient` instance, same project URL/anon key (from `supabase-config.js`), same `persistSession`/`autoRefreshToken`/storage configuration. No second or conflicting client was ever created, and none was created by this fix — there was previously no client on this page at all, not a competing one.

**Why nothing else needed to change:** the loading → authenticated → unauthenticated model this fix relies on is the same shared mechanism verified in V20.3 — `window.wrldAuthReady` doesn't resolve until both the session and the matching `profiles` row have loaded, so there's no separate "profile still loading" state to mishandle. Share (`sharePage()`) and Print/Save as PDF (`printPage()`) are both self-contained (`navigator.share`/`window.print()`), don't touch auth at all, and were never affected by this bug or this fix. The document layout, worksheet rendering logic, and every visual element on the page are untouched.

**Files changed:** `worksheet.html` only.

---

## Fix 2: Announcements posting — restricted to Mentor/Administrator/Owner

**What the audit found:** the frontend gating logic in `community.html` was already correct before this release. `renderCommons()` only runs after `await window.wrldAuthReady`, so role data is always fully resolved by the time the composer-visibility decision is made; the Announcements category (`restricted:true` in `COMMONS_CATEGORIES`, `data.js`) already hides `#commons-composer` (the entire form, not just the button — it's `display:none` via the `.hidden` class, so it can't be submitted while hidden) and shows the existing `#commons-restricted-note` ("Only WRLD Mentors and Administrators can post Announcements — everyone can read them here.") for anyone without `publish_resources` permission or the `mentor` role. This was verified by tracing the exact condition for Explorer, Mentor, Administrator, and Owner and confirming each resolves correctly.

**The real, confirmed gap was server-side.** The `posts_insert_own` Row Level Security policy on `public.community_posts` — queried directly from the live database — was:
```sql
with check ( auth.uid() = author_id )
```
That's it. No category check at all. Any authenticated user of any role could call `createCommunityPost({category:'announcements', body:'...'})` directly (e.g. from the browser console, bypassing the UI entirely) and it would succeed, because the database itself never checked who's allowed to post into which category — only that you're posting as yourself. This is what "Explorer users... can create an announcement" actually referred to: not a visible UI bug, but the fact that nothing was stopping it below the UI layer.

**Fix — migration `20260802090000_039_restrict_announcements_posting.sql`:**
```sql
alter policy "posts_insert_own" on public.community_posts
  with check (
    (( select auth.uid() ) = author_id)
    and (
      category <> 'announcements'::post_category
      or role_at_least('mentor'::wrld_role)
    )
  );
```
This tightens the existing policy in place — it does not add a second, separately-OR'd policy (which would only ever loosen access, never restrict it), and it does not touch the `posts_select*`, `posts_update_own_or_mod`, or `posts_delete_own_or_mod` policies at all. For every category other than `announcements`, the second clause is trivially true, so behavior is byte-for-byte identical to before. For `announcements`, `role_at_least('mentor'::wrld_role)` — the same role-hierarchy helper function already used throughout this project's other RLS policies — evaluates true only for `mentor`, `admin`, and `owner` (confirmed against the live `wrld_role` enum: `explorer < mentor < admin < owner`), and false for `explorer`. Unauthenticated (`anon`) requests were already rejected outright, since this policy only ever applied to the `authenticated` role and there has never been an `anon` INSERT policy on this table.

**Real role values used** (confirmed against the live database, not assumed): the `post_category` enum is `introductions | celebrations | general | accountability | announcements`; the `wrld_role` enum is `explorer | mentor | admin | owner` — both lowercase, both matched exactly as stored.

**Existing posts:** untouched. RLS policies only govern new writes; no existing row's author, timestamp, category, or content was read, altered, or could be altered by this change.

**Minor frontend hardening (no behavior change):** `community.html`'s gating condition changed `user.role==='mentor'` to `user?.role==='mentor'`. This branch was never actually reachable with a null `user` (the preceding `if(!gate.ok)` check already returns false — and therefore routes away — for any null user before this line is reached), so this is a defensive-only change, not a bug fix, and does not alter any visible behavior for any role.

**Files changed:** `community.html` (comment + defensive `?.`), new migration `supabase/migrations/20260802090000_039_restrict_announcements_posting.sql`.

---

## Scope check — other Community boards

Introductions, Celebrating Achievements, General Questions, and Accountability & Study Partners all keep the exact same posting rule they had before this release (any authenticated user who has passed the existing onboarding gate — assessment taken, first Playbook completed, guidelines accepted). Only `announcements` gained the additional Mentor-or-above requirement, at both the UI layer (already correct) and the database layer (now enforced). Comments, replies, reporting, and both author- and moderator-initiated deletion were not touched anywhere in this release.

---

## Full file inventory

**Changed:**
- `worksheet.html` — added the three missing shared Supabase scripts (Fix 1)
- `community.html` — defensive `?.` only, plus explanatory comments (Fix 2)
- `supabase/migrations/20260802090000_039_restrict_announcements_posting.sql` — new, applied to production (Fix 2)

**Not changed:** every other file in the project — every dashboard, every playbook, every program, Volunteer Tracker, Account Settings, Authentication pages, Orbit, Orbit AI, `styles.css` (confirmed byte-for-byte identical via diff), all images and illustrations, all navigation, all other Community Commons boards.

## Backend

One migration was required and applied (see above) — genuinely necessary because the vulnerability was in server-side enforcement (RLS), which no frontend-only change could close. No Edge Function was created or modified; this release didn't touch Storage, Edge Functions, or any table other than the single policy alteration on `community_posts`. No changes were made to the download-preview bug's backend — it was purely a missing `<script>` tag, confirmed by tracing the code, not assumed.
