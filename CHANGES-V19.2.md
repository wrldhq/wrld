# WRLD Website V19.2 — Changelog

Three priorities only, per spec. No unrelated design, branding, content,
mobile, dashboard, playbook, program, illustration, or Orbit change was
made.

## 1. Delete User — root cause and fix

**Root cause**: not a code defect. The client call
(`sbClient.functions.invoke('delete-user', ...)`), the function's folder
name (`supabase/functions/delete-user/`), its CORS/OPTIONS handling, and
its server-side Owner/self/final-Owner checks were all already correct
and already matched each other exactly. "Failed to send a request to
the Edge Function" is the standard symptom of the function never having
been deployed to the connected Supabase project.

**What changed**:
- Added an explicit `Access-Control-Allow-Methods` CORS header (real
  hardening — some browsers/proxies are stricter about this being
  present than others).
- Added `friendlyBackendError()` in `app.js`, mapping this exact error
  string to the spec's required message: *"The secure deletion service
  is not currently available. Confirm that the Supabase Edge Function
  has been deployed."*
- Wrote exhaustive, exact deployment/verification steps in
  `V19.2-BACKEND-SETUP.md` — this is the actual fix path, since I cannot
  deploy to your live Supabase project myself.

## 2. Delete Mentor Application — root cause and fix

**Root cause**: same category of issue. `delete_mentor_application(p_application_id uuid)`
was correctly defined in the prior migration with the exact name and
argument the client calls — the reported "not found in schema cache"
error is the standard symptom of a migration that was written but never
applied (or applied without a subsequent schema-cache refresh).

**What changed**:
- New migration `036` re-declares the function (`create or replace`,
  safe to reapply, preserves all existing applications/users/roles) and
  adds `notify pgrst, 'reload schema';` immediately after — this
  specifically fixes the case where a direct SQL Editor paste doesn't
  trigger PostgREST's automatic reload the CLI's `db push` does.
- `friendlyBackendError()` also maps this exact error to the spec's
  required message: *"The required database function has not been
  installed. Apply the V19.2 Supabase migration and try again."*

## 3. Community system — real, shared, public, cross-device

**Root cause**: confirmed genuinely broken as reported. `community_posts`
and any comment/reply equivalent never existed as real Supabase tables
anywhere in this project's migration history — the entire system was
`localStorage` (`wrld_community_posts_v1`), exactly as described.

**What changed**:
- New migration `036`: `public.community_posts` / `public.community_replies`
  tables, full RLS (public read of approved content — including
  logged-out/anon visitors; authenticated insert-as-self only; author-or-
  Administrator+ delete), plus `moderation_set_community_status()` and
  `report_community_content()` RPCs.
- Rewrote every community function in `app.js`
  (`getCommunityPosts`, `communityPostsFor`, `createCommunityPost`,
  `addCommunityReply`, `reportCommunityItem`, `moderationSetStatus`,
  `moderationClearReports`, `getModerationQueue`, `getReportedItems`,
  plus `computeCommunityBadges`, `getPlatformOverview`,
  `getRecentActivityFeed`, `getSystemAlerts`) from synchronous
  `localStorage` reads/writes to real, async Supabase calls.
- Added `deleteOwnCommunityPost()` / `deleteOwnCommunityReply()` —
  enforced by RLS (author or Administrator+), not just a hidden button.
- `community.html`: rewired posting/reading to the new async functions;
  added a "⋯ Delete" control on posts and replies for the author or a
  moderator, wired to the existing `showConfirmModal()` (from V19) with
  the exact confirmation wording the spec requires; logged-out visitors
  can still read the board (RLS-backed, not just a client-side
  assumption) but see a "Create a free account" prompt if they try to
  report content.
- `owner-dashboard.html`, `administrator-dashboard.html`,
  `moderation-dashboard.html`, `journey-passport.html`: every call site
  that read the old synchronous community functions updated to `await`
  the new async versions.

### Documented decisions (per spec's explicit requirements)

- **Display names**: community content shows the name captured at
  posting time (`author_name`, stored on the row), not a live join to
  the profiles table. This is a deliberate, documented divergence from
  the spec's stated *preference* for the live name — the stored copy is
  what remains visible if the author's account is later deleted (at
  which point `author_id` is anonymized to `null` by `delete-user`, but
  the post itself is preserved per the existing anonymization policy).
  A future pass could switch to a live join if historical-name drift
  becomes undesirable.
- **Deleting a post deletes its replies**: via `on delete cascade` on
  `community_replies.post_id` — a real database-enforced cascade, not
  client-side cleanup.

## Files changed

**New:**
- `supabase/migrations/20260730080000_036_community_tables_and_deletion_repair.sql`
- `V19.2-BACKEND-SETUP.md`, `CHANGES-V19.2.md`, `TESTING-SUMMARY-V19.2.md`, `FILE-INVENTORY-V19.2.md`

**Changed:**
- `supabase/functions/delete-user/index.ts` — CORS hardening only
- `app.js` — community system rewritten async; `friendlyBackendError()` added
- `owner-dashboard.html` — Overview/Community/Notifications panels made
  async-aware; friendly error messages wired into both delete handlers
- `administrator-dashboard.html` — Community panel and its two action
  handlers made async-aware
- `moderation-dashboard.html`, `journey-passport.html` — call sites
  updated to `await` the now-async community functions
- `community.html` — full posting/reading flow rewired to Supabase;
  delete-post/delete-comment controls added

**Untouched:** every other file — all V19 features (Administrator
Dashboard's other tabs, Owner Command Centre's collapsible nav, editable
names), all V18 features (mobile fixes, Orbit AI), every Playbook/
Program, every image, every prior migration and Edge Function, all
public pages.
