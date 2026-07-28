# WRLD Website V19 — Testing Summary

As with prior passes: this is a code-level verification (syntax checks,
TypeScript checks, RLS/logic tracing, diff-based scope confirmation),
not physical multi-account manual QA against a live Supabase project.
Read `MOBILE-TESTING-SUMMARY.md` (from V18) for the same honesty framing
applied here.

## What was actually verified

- `node --check` on every modified `.js` file and every inline
  `<script>` block across all 32 HTML pages — all pass.
- `tsc` type-checked `delete-user/index.ts` (and `orbit-ai/index.ts`
  alongside it) against Deno-runtime stubs — zero real errors.
- CSS brace-balance check on `styles.css`.
- Traced every server-side check in `delete-user/index.ts` by reading
  the code path directly: caller-session validation → role check →
  self-deletion check → final-active-Owner count check → associated-data
  cleanup → Auth Admin API call. Each branch's logic was read and
  confirmed to short-circuit correctly (e.g., the self-deletion check
  runs before any deletion occurs).
- Traced `delete_mentor_application()`'s SQL directly: role check first,
  row lookup, storage deletes scoped to that row's own path columns only,
  then the row delete — confirmed no cross-application or cross-user
  file path is ever referenced.
- Traced `update_own_name()`'s SQL: empty-first-name rejection,
  `auth.uid()` scoping (the `where id = caller` clause makes it
  structurally impossible to update any row but the caller's own).
- Confirmed via reading that `owner-dashboard.html`'s access guard
  changed from Administrator+ to Owner-only, and that
  `administrator-dashboard.html` guards on Administrator+, by reading
  `requireCapability()`'s call in each file.

## What this method does NOT verify, and isn't claimed

- Real behavior against a live Supabase project with real accounts — no
  actual delete-user call was made against a real `auth.users` table, no
  actual RLS policy was evaluated by a real Postgres instance.
- Whether the unseen, pre-existing `profiles` table structure (migration
  001, never included in any upload of this project) has a column name
  or constraint that conflicts with `first_name`/`last_name`. The
  migration uses `add column if not exists`, which is safe even if it
  doesn't, but this wasn't verified against the real schema.
- Concurrent-request race conditions (e.g., two Owners trying to delete
  the last two active Owner accounts at the exact same moment) — the
  final-Owner check is a read-then-act pattern without a database
  transaction lock, which is a known limitation worth hardening before
  a high-concurrency production launch.
- Visual/manual testing of the confirmation modal, the new Administrator
  Dashboard's layout, or the collapsible nav groups on an actual screen.

## Recommended pre-launch checklist (matches the spec's own list)

**User deletion**
- [ ] Owner can delete an Explorer, Mentor, and Administrator
- [ ] Owner cannot delete their own account (confirm the exact message
      appears and no request is sent)
- [ ] Final active Owner cannot be deleted; a second Owner can be, when
      at least one other active Owner remains
- [ ] Administrator/Mentor/Explorer accounts get a 403 calling the
      function directly (not just a hidden button)
- [ ] Deleted user can no longer sign in
- [ ] `learner_state`/`volunteer_entries`/`mentor_profiles`/
      `mentor_applications`/`live_sessions` rows for that user are gone
- [ ] `community_posts`/`community_reports`/`moderation_log` rows are
      anonymized, not deleted
- [ ] User totals and the visible list refresh; search/filter state
      survives the refresh
- [ ] A forced failure (e.g., temporarily revoke the function's DB
      access) leaves the user visible with an error, never a false
      success

**Mentor-application deletion**
- [ ] Owner can delete applications in each status
- [ ] Administrator gets a permission error calling the RPC directly
- [ ] Applicant's account and (if approved) Mentor role are untouched
      after deletion
- [ ] Only that application's own storage files are removed; an
      unrelated application's files remain reachable
- [ ] Totals refresh; a forced failure leaves the record visible

**Editable names**
- [ ] Each role can update their own name
- [ ] First-name-only, first+last, adding/removing a last name, and
      hyphen/apostrophe names (`Anne-Marie`, `O'Connor`) all save
      correctly
- [ ] Empty first name is rejected client-side and server-side
- [ ] The name updates immediately in the header without logout
- [ ] The name is still correct after a real logout/login
- [ ] Calling `update_own_name` for a different user's id is not
      possible (the function has no such parameter — verify no other
      code path allows it)

**Administrator Dashboard**
- [ ] Administrator and Owner can open it; Explorer/Mentor direct-URL
      access redirects instead of rendering
- [ ] User search, Mentor Operations status changes, and Community
      moderation actions all work against real data
- [ ] No Owner-only control (Delete User, Delete Application,
      Administrators panel, Security panel, Organization/Roadmap) is
      reachable from this page

**Owner Command Centre navigation**
- [ ] Every pre-existing tab is still reachable through some category
- [ ] The category containing the active tab stays open across a tab
      switch within it
- [ ] Keyboard (Tab/Enter/Space) opens and activates each control
- [ ] No horizontal overflow at 320–430px

**Regression**
- [ ] Explorer Dashboard, Mentor Studio, existing forms, Orbit, Orbit
      AI's fallback, Playbooks, Programs, and every public page behave
      exactly as they did in V18.
