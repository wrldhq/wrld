# WRLD Website V19 — Changelog

Five changes only, per spec. Every existing feature, page, style,
Playbook, Program, and prior V18 fix (mobile audit, Orbit AI, founder
section, pillar copy) is untouched except where explicitly noted below.

## 1. Secure user deletion for Owners

- **New:** `supabase/functions/delete-user/index.ts` — Owner-only,
  service-role Edge Function. Validates the caller's real session role,
  blocks self-deletion, blocks deleting the final active Owner, cleans/
  anonymizes associated records (see `DELETION-BEHAVIOR-V19.md`), then
  calls the real Auth Admin API.
- **New:** `showConfirmModal()` in `app.js` + matching CSS in
  `styles.css` — WRLD had no modal system before this; both Part 1 and
  Part 2 needed one.
- **Changed:** `owner-dashboard.html` — "Delete User" button added to
  each user row (styled like the existing Ban button, not more
  prominent), wired to a confirmation modal showing name/email/role/
  status, then the Edge Function.
- **Changed:** `supabase/config.toml` — added `[functions.delete-user]`.

## 2. Secure mentor-application deletion for Owners

- **New:** `delete_mentor_application()` — a `security definer` Postgres
  RPC in migration `035`, Owner-only. Deletes only that application's
  own storage files and row; never touches the applicant's account or
  role.
- **Changed:** `owner-dashboard.html` — "Delete Application" button
  added inside the application detail view, wired to a confirmation
  modal showing applicant/status/date/attachment count.

## 3. Editable account names for every role

- **New:** migration `035` adds `first_name`/`last_name` to `profiles`
  and `update_own_name()`, a `security definer` RPC any authenticated
  user can call for their own row only.
- **Changed:** `auth.js` — new `updateOwnName()` wrapper; mirrors the
  name into Auth metadata; refreshes the session cache live.
- **Changed:** `supabase-client.js` — maps the two new columns into the
  cached user object.
- **Changed:** `account-settings.html` — new "Your Name" card with
  First Name (required) / Last Name (optional) fields, save button,
  live update of the page heading and header nav with no logout
  required.

## 4. Dedicated Administrator Dashboard

- **New:** `administrator-dashboard.html` — a full new page: Overview,
  Users (non-destructive actions only), Mentor Operations, Volunteer
  Operations, Community & Content Moderation, Support & Notifications
  (honestly labeled Coming Soon — no fake support-ticket data invented).
  Reuses the exact same underlying functions/RPCs as the Owner Command
  Centre and Moderator Dashboard rather than duplicating logic or
  inventing a new content system.
- **Changed:** `auth.js` — `canAccessOwnerDashboard()` is now
  Owner-only (was Administrator+); new `canAccessAdministratorDashboard()`
  (Administrator+); `ROLE_DESTINATIONS[admin]` now points to
  `administrator-dashboard.html`.
- **Changed:** `app.js` — the account-menu dropdown and mobile menu now
  show separate "Administrator Dashboard" and "Owner Command Centre"
  links, gated correctly per role, instead of one shared/relabeled link.

## 5. Owner Command Centre navigation reorganization

- **Changed:** `owner-dashboard.html` — the flat 10–12-button tab row is
  now 5 collapsible categories (Dashboard; People and Access; Content
  and Community; Organization and Planning; Security and System). Every
  existing tab/section is preserved — this is a navigation
  reorganization only. The category containing the active tab always
  stays visually open; other categories' open/closed state persists for
  the browser session via `sessionStorage`. Built with real `<button>`
  elements and `aria-expanded`/`aria-controls` for keyboard/
  screen-reader access.
- **New CSS:** `.owner-nav-group`, `.owner-nav-group-head`,
  `.owner-nav-group-body`, `.owner-nav-chevron` in `styles.css`, plus a
  small mobile touch-target rule inside the existing 720px breakpoint.

## Files changed

| File | Change |
|---|---|
| `administrator-dashboard.html` | **New** |
| `supabase/functions/delete-user/index.ts` | **New** |
| `supabase/migrations/20260729080000_035_name_editing_and_application_deletion.sql` | **New** |
| `DEPLOYMENT-V19.md`, `PERMISSION-MATRIX-V19.md`, `DELETION-BEHAVIOR-V19.md`, `TESTING-SUMMARY-V19.md`, `CHANGES-V19.md` | **New** |
| `auth.js` | `updateOwnName()`; `canAccessOwnerDashboard()` now Owner-only; new `canAccessAdministratorDashboard()`; `ROLE_DESTINATIONS[admin]` changed |
| `app.js` | `showConfirmModal()`; nav menu Administrator/Owner link split |
| `supabase-client.js` | maps `first_name`/`last_name` into the cached user object |
| `account-settings.html` | new Name card |
| `owner-dashboard.html` | Delete User + Delete Application buttons/modals; collapsible nav categories |
| `styles.css` | modal styles; collapsible nav-group styles |
| `supabase/config.toml` | added `[functions.delete-user]` |

Every other file (every image, every Playbook/Program in `data.js`,
`orbit.js`, `orbit-knowledge.js`, every V18 mobile/Orbit-AI fix, every
prior migration, every prior documentation file, the About page, all
public pages) is untouched.
