# WRLD Website V19 — What Happens When You Delete Something

## Deleting a user (Owner only, `delete-user` Edge Function)

### Permanently deleted
- The real Supabase Auth account (`auth.users` row) — via
  `supabase.auth.admin.deleteUser()`. The person can no longer sign in.
- `public.profiles` row for that user.
- `learner_state` (their playbook/quiz/streak progress).
- `volunteer_entries` (their volunteer log).
- `mentor_profiles` (their public Mentor profile, if any).
- `mentor_applications` they submitted (their own, by `user_id`).
- `live_sessions` they published as a Mentor.

### Anonymized (kept for aggregate history, personal link removed)
- `community_posts.user_id` → set to `null`. The post's content stays
  (other users may have replied to it — deleting it out from under a
  conversation would orphan those replies), but it's no longer
  attributed to the deleted account.
- `community_reports.reporter_id` → set to `null`. The report itself
  (useful for moderation history) is kept; who filed it is not.
- `moderation_log.target_user_id` → set to `null`. The action taken is
  kept in the log; which now-deleted account it targeted is not.

*(If any of these tables don't yet exist as real Supabase tables on a
given project — some community features are still `localStorage`-only
per `CLAUDE.md` — that step is simply skipped; it isn't treated as a
failure.)*

### Never touched
- Any content or data belonging to other users.
- Shared WRLD content (Playbooks, Programs, Downloads) — never deleted
  just because a user interacted with it.

### Why anonymize instead of delete outright
A community post or a moderation log entry is shared context — other
people's replies, or the platform's own safety history — not solely the
deleted user's property. Deleting it outright would either orphan other
users' replies or erase a real moderation record. Anonymizing removes
the personally identifying link while preserving the shared content and
aggregate history, matching the spec's explicit instruction to
anonymize rather than retain identifying information where the content
itself should be preserved.

## Deleting a mentor application (Owner only, `delete_mentor_application()`)

### Permanently deleted
- The `mentor_applications` row itself.
- Its own uploaded files in the `mentor-applications` storage bucket
  (résumé, certifications) — identified by the exact stored paths on
  that specific row, never a broader sweep, so no other application's
  or user's file is ever touched.
- `mentor_application_status_history` rows for that application (via
  the existing `on delete cascade` foreign key from migration `032` —
  not a new behavior, just how that relationship has always worked).

### Never touched — deliberately, by design
- **The applicant's WRLD account.** Deleting an application record is
  not the same action as deleting a user.
- **The applicant's Mentor role**, if they were approved. The role was
  granted by a real, separate decision (`set_mentor_application_status()`
  setting `new_status='approved'`, which promotes the profile's `role`
  column) — deleting the historical application record that led to that
  decision doesn't undo the decision itself, any more than deleting an
  old job application would revoke someone's current job.
- **Mentor Studio access** for an approved mentor — unaffected, since it
  depends on the profile's `role` column, not on the application record
  existing.

### If you actually want to remove someone's Mentor role too
That's a separate, deliberate action: use the existing "Revert to
Explorer" control in the Users tab (calls `promoteUserRole(userId,
'explorer')`) — exactly the same control that already existed before
V19. Deleting their application record never does this automatically.

## Editable names — where the truth lives

- **`public.profiles.name`** remains the single field every existing
  display in the app reads (header, dashboards, Orbit, mentor listings,
  certificates, etc.) — nothing that already reads `user.name` needed
  to change.
- **`public.profiles.first_name` / `last_name`** (new in V19) are the
  editable source of truth for the Account Settings name form. On every
  save, `update_own_name()` recomputes `name` from these two fields, so
  there is exactly one function that ever writes `name`, and it can
  never drift out of sync with what the person actually entered.
- **Supabase Auth's `raw_user_meta_data.name`** is mirrored (best-effort,
  via `supabase.auth.updateUser()`) on every save, since `signUp()`
  already wrote a `name` there at signup time — kept in sync rather than
  left stale, per the spec. It is not read back from anywhere in the
  app; `profiles.name` remains the actual source of truth for display.
