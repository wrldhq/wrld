# WRLD Website V20 — Stability, Content Integrity & Community Update

Scope per spec: no redesign, no layout/typography/spacing/mobile changes. Every change below is a functional bug fix, a content restoration, or a database migration — verified directly against the live Supabase project (`hnmpcjdlhuhetgkzgdgl`).

---

## 1. Community Commons — root cause found and fixed

**Root cause**: migration `036_community_tables_and_deletion_repair.sql` (written to fix the V19.2 community bugs) was **never applied to the live database** — confirmed via `list_migrations` (live history jumped straight from `035` to nothing; `036` doesn't appear). It also assumed a schema that never matched production: a separate `community_replies` table, a free-text `category` column, and `post_status` values `approved/held/removed/edits_requested`. The REAL live `community_posts` table (already in production before this repo's history begins) instead models replies as rows with `parent_id` set on the same table, uses a real `post_category` enum that `data.js`'s `COMMONS_CATEGORIES` already matched exactly, and a `post_status` enum of `approved/held/blocked`.

Because `app.js` had already been rewritten (in V19.2) to call the *never-applied* migration's tables/RPCs, essentially every Community Commons write was failing silently against production:
- `createCommunityPost()` inserted an `author_name` column that didn't exist → every post failed.
- `addCommunityReply()` / `deleteOwnCommunityReply()` targeted a `community_replies` table that didn't exist → replying and deleting replies were both completely broken.
- `reportCommunityItem()` / `moderationSetStatus()` called `report_community_content()` / `moderation_set_community_status()` RPCs that didn't exist → reporting and moderation actions silently no-op'd (and reporting's success toast fired regardless, lying to the user).
- A separate, undocumented `guard_community_post_updates()` trigger unconditionally forced every non-admin insert to `status='held'`, even with zero flags — meaning even a working insert would never actually show up "approved" the way the UI promised.
- Every SELECT policy on `community_posts` was scoped `to authenticated` only — logged-out visitors saw a permanently empty board (RLS silently returns 0 rows, no error).

**What changed**:
- New migration `037_v20_community_and_mentor_repair.sql` (applied to the live project): adds the missing `author_name` column, extends `post_status` with `edits_requested`/`removed` (already wired to real buttons in the moderation dashboards), adds an `anon`-scoped SELECT policy for `status='approved'` content, reworks the guard trigger so a clean insert with no client-side flags publishes immediately as `approved` (while still preventing any self-approval of flagged content or resurrection of held/blocked content via a later edit), creates the two missing RPCs (`moderation_set_community_status`, `report_community_content`) against the real schema, and adds `community_posts` to the `supabase_realtime` publication (previously nothing in the project was realtime-enabled).
- Rewrote every community function in `app.js` (`getCommunityPosts`, `communityPostFromRow`, `createCommunityPost`, `addCommunityReply`, `deleteOwnCommunityReply`, `moderationClearReports`) to target the real `parent_id`-based schema — replies are now correctly modeled as `community_posts` rows, not a separate table.
- Fixed `getPlatformOverview()`'s `flaggedPosts` metric, which was reading `.length` off an un-awaited Promise (always `undefined`).
- Migration `036` was left in the repo (for history) but now carries an explicit "DO NOT APPLY" header explaining why, so it's never run by accident.

## 2. Playbook content — the actual bug behind "empty containers"

The reported symptom (Building an Emergency Fund From Zero showing empty Action Checklist / Reflection / Quiz / FAQ / Key Takeaways) was **not missing data** — every field was already populated. It was a **rendering crash**:

- 10 of the 23 Playbooks (bank-accounts, taxes, emergency-funds, investing-basics, financial-planning, time-management, study-skills, mental-wellness, internships, graduation-planning) have a lesson section that nests `mini:{q,options,correct,explain}` as an object alongside real `h`/`p`/`callout` content. `playbook.html`'s renderer only handled the *other* valid shape (`mini:true`, a section that IS the mini-check). Calling `renderMiniCheck(s)` on the nested-object shape read `s.q`/`s.options` — both `undefined` — and `undefined.map(...)` threw. Because this happened inside the `.map()` building `sections-container`'s HTML, the exception aborted `loadPlaybook()` at that point, and every container rendered afterward (Practice Exercises, Action Checklist, Reflection, Quiz, FAQ, Takeaways) simply never ran, even though their data was fully populated. **Fixed** in `playbook.html`: the section renderer now handles both `mini` shapes correctly, rendering the section's real content plus the mini-check for the nested-object case.
- The same 10 Playbooks stored `practiceExercises` as `{title,body}` objects, while `renderChecklist()` in `app.js` assumed plain strings — rendering the literal text `"[object Object]"` for every item. **Fixed**: `renderChecklist()` now handles both shapes; the 10 affected Playbooks' `practiceExercises` were also converted to the plain-string format used everywhere else on the site (and expanded from 2 to 4 items each) for consistency.

## 3. Complete playbook content audit (all 23)

Audited every Playbook against `resume` ("Build Your First Resume") as the reference bar (6 objectives / 9 sections / 4 practice exercises / 8 checklist items / 5 reflection questions / 6 quiz questions / 6 FAQ / 6 takeaways). Findings:

- **No playbook had a genuinely empty or missing field** (no `[]`, no absent keys) — the "empty container" reports all traced back to the two rendering bugs above.
- 20 of 23 Playbooks were noticeably thinner than the bar on quiz (many at 2–3 questions), FAQ (3–4 items), and reflection (3–4 items); several also had thin checklists or takeaways. `resume`, `interview-skills`, and `first-vehicle` already matched or exceeded the bar and were left untouched.
- **Restored**: every quiz was brought to 5–6 questions, every FAQ to 6 items, every reflection section to 5 questions (all testing/reflecting on material already taught in that Playbook's own lesson sections — no invented facts), plus targeted checklist/takeaways top-ups where flagged (cover-letter, networking, salary-negotiation, professional-growth, financial-planning, credit-scores, managing-anxiety).
- **Fixed a mismatched download**: `credit-scores` pointed its worksheet download at `tax-checklist` (a copy-paste artifact — that resource is about filing taxes, not credit). Added a new, real `credit-building-tracker` download + worksheet (score check-in log, starting-option fields, a good-credit-habits checklist) and repointed `credit-scores` to it.
- **Fixed missing journey tags**: `managing-anxiety` and `apartment-renting` had empty `journeys:[]` arrays despite belonging to real Learning Paths ("Mental Wellness & Resilience" and "Becoming Independent" respectively) — both now carry the matching tag so they're eligible for the Dashboard's "recommended for you" logic.
- Verified programmatically (Node, not just by eye): all 23 slugs have matching `-card.jpg`/`-hero.jpg` files, every `download` reference resolves to a real entry in `DOWNLOADS` *and* a matching `WORKSHEET_SPECS` entry in `worksheet.html`, every `nextInJourney` resolves to a real slug, every `LEARNING_PATHS` step and `RELATED_PLAYBOOKS`/`SECTION_RECS` reference resolves, no duplicate slugs, and every quiz question has exactly 4 options with a valid `correct` index.

## 4. Mentor Application Deletion

- **Root cause of the Decline button failing**: `set_mentor_application_status()` has always accepted `'declined'` as a valid input, but the live `application_status` enum only ever had `'rejected'` — every Decline click failed at the final cast. Fixed by additively extending the enum (migration `037`).
- **Root cause of "Owner/Admin must be able to delete"**: `delete_mentor_application()` was Owner-only, and the Administrator Dashboard had no delete control at all ("Permanent application deletion is Owner-only" was explicit, deliberate copy). Per the V20 spec, widened the RPC to Administrator+ (migration `037`) and added the same delete-with-confirmation control (with file-count summary, warning text, and immediate list refresh) to `administrator-dashboard.html`'s Mentor Operations panel, matching the Owner Dashboard's existing flow exactly.
- Verified end-to-end: delete button exists on both dashboards, confirmation modal exists (`showConfirmModal`), the RPC deletes the application row + its own stored résumé/certs files (scoped to that row's exact paths only) + cascades its status-history rows, the UI re-fetches and re-renders immediately on success, and errors keep the row visible with a friendly message rather than a false success.
- Also fixed: the Owner Dashboard's Overview/Analytics tabs and Recent Activity Feed were reading mentor application counts from a stale, unused `localStorage` key (`getMentorApplications()` was legacy pre-Supabase code, never migrated) — real applications never showed up in those stats. Rewired to query `public.mentor_applications` directly, and corrected several `'pending'`/`'rejected'` status-filter checks to the real enum values (`'submitted'`/`'under_review'`, `'declined'`).

## 5. User Deletion — re-verified, one serious bug found and fixed

The `delete-user` Edge Function was already deployed and its Owner-only/self-delete/final-Owner checks were correct. However, its "anonymize associated records" step used **column names that don't exist on the live schema** (`community_posts.user_id`, `moderation_log.target_user_id` — the real columns are `author_id` and `actor_id`), and the resulting errors were silently swallowed as "table not provisioned yet." Checked the actual live foreign-key constraints and found two real consequences:

1. `community_posts.author_id` is `ON DELETE CASCADE` — with anonymization silently failing, deleting a user would **cascade-delete all of their community posts and replies outright**, the opposite of the documented "anonymize, don't destroy shared conversation" policy.
2. `moderation_log.actor_id`, `mentor_applications.reviewed_by`, `mentor_application_status_history.reviewer_id`, and `volunteer_entries.verified_by` are all `ON DELETE NO ACTION` — deleting any Administrator/Owner who had ever moderated a post, reviewed a mentor application, or verified a volunteer entry would make the deletion **fail outright** with an unhandled foreign-key violation.

**Fixed**: corrected the column names and added the four missing anonymize steps (plus `featured_picks.mentor_user_id` and, for the same "don't orphan a shared thread" reasoning, `playbook_questions.author_id`/`playbook_question_replies.author_id`). Redeployed the function (now version 2). Re-confirmed: removes the real Auth user, removes the profile, cleans/anonymizes every associated table correctly, and the Owner Dashboard's confirmation modal + immediate re-fetch behavior was already correct.

## 6. Owner Dashboard QA

- Confirmed real, server-side search/filter/sort/pagination for Users (`admin_user_list` RPC) and Platform Overview/Analytics (`admin_platform_overview`, `admin_most_popular_playbooks`, `admin_most_active_users`) — all match their live RPC signatures exactly.
- Fixed the mentor-application stats/activity-feed bug described in §4.
- Fixed `moderationClearReports()`, which branched between a real `community_posts` table and a nonexistent `community_replies` table depending on whether the target was a reply — now always targets the real table.

## 7. Final production QA pass

- `node --check` passed on every standalone `.js` file and every inline `<script>` block across all 28 HTML pages (extracted and checked individually).
- Checked every local `href`/`src` reference across all pages — no broken links found (the only matches requiring manual review were dynamic template-literal URLs, e.g. `images/playbooks/${p.slug}-card.jpg`, all separately verified to resolve for all 23 slugs).
- Searched for leftover TODO/FIXME/lorem-ipsum/placeholder text — none found.
- Ran Supabase's security and performance advisors after every schema change — no new issues introduced (remaining items are pre-existing, intentional `SECURITY DEFINER` patterns already used consistently throughout the project).
- Checked Postgres and Edge Function logs for the affected services — no unexpected errors after the fixes above.

## Files changed

**New:**
- `supabase/migrations/20260731090000_037_v20_community_and_mentor_repair.sql`
- `CHANGES-V20.md` (this file)

**Changed:**
- `app.js` — Community Commons functions rewritten against the real schema; `getMentorApplications()` rewritten from stale localStorage to real Supabase query; `getPlatformOverview()`/`getRecentActivityFeed()`/`getSystemAlerts()` await/status-filter fixes; `renderChecklist()` now handles both plain-string and `{title,body}` object items.
- `playbook.html` — section renderer now handles both `mini:true` and nested `mini:{...}` shapes without crashing.
- `owner-dashboard.html` — Analytics tab awaits `getMentorApplications()` and uses correct status values.
- `administrator-dashboard.html` — added mentor-application delete control with confirmation modal.
- `supabase/functions/delete-user/index.ts` — corrected anonymization table/column list; redeployed (v2).
- `supabase/migrations/20260730080000_036_community_tables_and_deletion_repair.sql` — marked with a "do not apply" header (kept for history).
- `data.js` — quiz/FAQ/reflection/checklist/takeaways expanded across 20 Playbooks to match the `resume` reference bar; 10 Playbooks' `practiceExercises` converted from `{title,body}` objects to plain strings and expanded to 4 items each; `credit-scores`' download reference fixed; `managing-anxiety`/`apartment-renting` given real `journeys` tags; new `credit-building-tracker` download entry added.
- `worksheet.html` — new `credit-building-tracker` worksheet spec added.

**Untouched**: all visual design, layout, typography, spacing, colors, mobile formatting, illustrations, and branding — no redesign of any kind, per spec. Every other V19.2 feature (name editing, real mentor application fields, playbook Q&A, Orbit AI) is unchanged.
