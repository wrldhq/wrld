# WRLD Website — Version 13: Change Summary

**WRLD Website Version 13** is the first production-candidate release. It's the result of "Revision Pass 13 — Final Production Readiness, Security Audit & Owner Dashboard Enhancement," built on top of Revision Pass 12's production Supabase backend (see below for that history). See `CLAUDE.md` for the living, permanent reference — this file is a point-in-time summary of what changed in each pass.

## Revision Pass 13 — Final Production Readiness, Security Audit & Owner Dashboard Enhancement

### Security audit findings & fixes (Priority 1)

| Issue | Fix |
|---|---|
| `volunteer_entries`: a user could write their own `status`/`confidence` directly, spoofing "verified/high confidence" without real review | New `compute_volunteer_verification()` guard trigger recomputes both server-side from the same heuristic (`hours`, `proof`, `organization`, `reflection` length) for any non-admin write — migration `019` |
| `community_posts`: a user could set their own held/blocked post to `status='approved'` | New `guard_community_post_updates()` trigger forces `status='held'` on any non-admin update — migration `019` |
| `community_trust`: a user could inflate their own `approved_count`/trust level | New `guard_community_trust_updates()` trigger blocks self-changes to trust counters — migration `019` |
| The three new trigger functions above were callable directly as RPC endpoints | Revoked — migration `020` |
| Stored XSS in `community.html`'s Mentor directory (`name`/`tagline`/`bio`/`expertise` rendered into `innerHTML` unescaped) | Wrapped in `escapeHtml()` |
| `syncVolunteerEntriesToSupabase()` built a raw string-interpolated PostgREST `.not('id','in', ...)` filter | Rewritten to fetch real IDs and use `.in('id', staleIds)` with an actual array |
| The four new Owner Dashboard `admin_*` functions (below) were callable by the unauthenticated `anon` role by Supabase's default grant, independent of `revoke ... from public` | Revoked explicitly — migration `026` (same class of bug as `get_mentor_directory()` in migration `015`) |

Every fix above was verified by simulating a real `anon` or non-admin `authenticated` Postgres session (`set local role ...; set local request.jwt.claims = ...`) inside a rolled-back transaction — not just tested via the privileged service connection, which doesn't exercise RLS/grants the same way.

### Owner Dashboard major enhancement (Priority 6)

- Four new server-side aggregation functions — `admin_platform_overview()`, `admin_most_popular_playbooks()`, `admin_most_active_users()`, `admin_user_list()` (migrations `022`–`026`, each self-guarded with an internal `role_at_least('admin')` check) — replace client-side full-table fetch-and-reduce for the **Overview** and **Users** tabs, so the dashboard scales to a real, growing platform instead of pulling every account over the wire.
- **Overview**: Total/Active(30d)/New Today-Week-Month Users, Email Verified %, Active Sessions, Total Volunteer Hours, Total Playbooks Completed, Avg. Completed/User, Most Popular Playbooks, Most Active Users, Recent Sign Ups, Recent Activity.
- **Users**: real search/filter(role, status, verification)/sort(newest, oldest, most-active, alphabetical)/pagination, a live mini progress bar per row, and an expandable per-user drill-down (completion %, in-progress/recently-completed Playbooks by title, quiz count, Assessment status). **Ban/Unban** wired to the UI for the first time (the underlying functions already existed in `auth.js`).
- New **Roadmap** tab — honest "Coming Soon" cards for Zoom/live-video integration, Discussion Boards, Donations, Scholarships, Event Ticketing/RSVPs, deeper Analytics exports, and automated Email Campaigns.

### Navigation & Orbit (Priorities 3–4)

- `.nav` rewritten from `flex; justify-content:space-between` to CSS Grid (`grid-template-columns:auto 1fr auto`), with a new `.nav-right` wrapper around the auth controls + mobile menu button — a structural guarantee (not incidental) that nav links stay centered and auth controls stay pinned right at every breakpoint and auth state.
- `orbit.js` gained `ORBIT_AUTO_SHOW_EXCLUDED_PAGES` so the mobile auto-show behavior never covers a form or onboarding flow (signup, login, forgot/reset-password, welcome, owner-setup).

### Data & sync (Priority 5)

- `profiles.email_verified` (migration `021`) — a real, admin-readable column kept current by a trigger on `auth.users`, since `auth.users` itself isn't queryable by the client. Threaded through to `user.emailVerified` in `auth.js`/`supabase-client.js`.

### Verification (Priority 7)

`node --check` on every `.js` file and every page's inline `<script>` block (28 pages, all pass); a static scan for broken local `href`/`src` links (none — the few regex hits were JS template-literal expressions); a scan for leftover TODO/lorem-ipsum/placeholder language (none); `get_advisors` (security + performance) re-run after every migration.

### Files changed this pass

`owner-dashboard.html` (Overview/Users tabs rewritten, Roadmap tab added, Ban/Unban wired), `styles.css` (`.nav` grid rewrite, `.owner-filter-row`/`.owner-pagination`/`.owner-mini-progress`/`.owner-list-item`/`.owner-rank`), `orbit.js` (`ORBIT_AUTO_SHOW_EXCLUDED_PAGES`), `community.html` (XSS fix), `app.js` (`syncVolunteerEntriesToSupabase()` fix), `supabase-client.js` (`emailVerified` in `wrldBuildUserFromCache()`), `auth.js` (`emailVerified` in `mapProfileRow()`), `supabase/migrations/019`–`026` (8 new migrations), `CLAUDE.md`.

---

# WRLD — Revision Pass 12: Change Summary

Covers the three-priority revision requested: Orbit mobile behavior, navigation bar consistency, and a production Supabase backend. See `CLAUDE.md` for the living, permanent reference — this file is a point-in-time summary of what changed in this pass.

## Files created

| File | Purpose |
|---|---|
| `supabase-config.js` | Public Supabase project URL + publishable key (safe to commit) |
| `supabase-client.js` | Shared Supabase client, Remember Me storage adapter, the sync/async auth-cache bridge (`window.wrldAuthReady`) |
| `supabase/migrations/001`–`014_*.sql` | Full database schema: roles/profiles, learner progress, volunteer log, community, mentors/sessions, admin content, storage buckets, and five hardening/fix passes |
| `.env.example` | Documents the two client-safe env values and the explicit service_role-key warning |
| `SUPABASE_SETUP.md` | How to stand up the Supabase side from scratch, incl. Owner bootstrap |
| `DEPLOYMENT.md` | GitHub + Cloudflare Pages deployment steps |
| `MIGRATION.md` | Strategy for pre-existing localStorage demo accounts (see below) |
| `TESTING.md` | Manual desktop/tablet/mobile test plan |
| `CHANGES.md` | This file |

## Files substantially modified

| File | What changed |
|---|---|
| `auth.js` | Full rewrite: real Supabase Auth calls behind every existing function name/signature (`signUp`, `logIn`, `logOut`, `changePassword`, `requestPasswordReset`, `resetPassword`, `suspendUser`/`banUser`/etc., `promoteUserRole`, `setAdministratorStatus`, `transferOwnership`, `deleteOrganizationData`). New: `getUsers()`/`refreshUsersCache()`, `checkLegacyAccountNotice()`. Owner bootstrap changed from an automatic passwordless account to a one-time manual SQL step (see `SUPABASE_SETUP.md`). |
| `app.js` | `initPage()` is now `async`, awaits `window.wrldAuthReady` before rendering the header. `setState()`/`saveVolunteerEntries()` now write-through to Supabase (`learner_state`/`volunteer_entries`) in the background after their unchanged synchronous localStorage write. New: `pullLearnerStateFromSupabase()`, `pullVolunteerEntriesFromSupabase()`, `syncLearnerStateToSupabase()`, `syncVolunteerEntriesToSupabase()`, mapping helpers. `loggedOutNavCTA()` shortened for mobile ("Sign Up" with "Free" hidden below 400px). |
| `orbit.js` | Added mobile-only (≤720px) auto-show/auto-collapse/session-dismiss behavior (`initOrbitAutoBehavior()`, `dismissOrbitPanel()`). `openOrbitPanel()` gained an `auto` param so auto-opens don't steal focus. Orbit's visuals and response engine are unchanged. |
| `styles.css` | `.pb-thumb`/`.pb-hero-illustration` reworked for real photo art (16:9 cards, native-ratio heroes — see CLAUDE.md's Illustrations section). `@media(max-width:980px)`/`@media(max-width:400px)` reworked so logged-out Login/Sign Up stay visible at every breakpoint (Priority 2 fix). |
| All 28 `.html` pages | Added the Supabase SDK CDN `<script>`, `supabase-config.js`, and `supabase-client.js` tags before `data.js`. |
| `owner-dashboard.html` | Guard wrapped in an async IIFE awaiting `window.wrldAuthReady`; every user-action handler (`odPromote`, `odSuspend`, `odDeactivate`, `odMakeAdmin`, `odTransferOwnership`, `odDeleteOrg`, etc.) now `await`s the now-async `auth.js` functions and re-pulls `getUsers()` before re-rendering; `odResetPassword` now triggers a real Supabase password-reset email instead of a copy-paste link; new "View Progress" per-user drill-down reading real `learner_state`/`volunteer_entries` data. |
| `moderation-dashboard.html` | Same async-guard wrap and action-handler fixes as above for its subset of user actions. |
| `welcome.html`, `account-settings.html`, `mentor-studio.html`, `journey-passport.html`, `volunteer-tracker.html` | Guard (`requireAuth()`/`requireRole()`) wrapped in an async IIFE awaiting `window.wrldAuthReady`, so the route guard runs after the session cache is actually ready. |
| `dashboard.html`, `playbook.html`, `community.html` | Top-level code that reads `getCurrentUser()` outside the main guard pattern (dashboard greeting, Playbook discussion gate, Community posting gate) now also awaits `window.wrldAuthReady` first. `community.html`'s Mentor directory rewritten to call the new `get_mentor_directory()` database function instead of `getUsers()` (which non-Administrators can no longer read in full, by design — see below). |
| `owner-setup.html` | Fully rewritten (post-delivery fix) — real backend-driven Owner claim flow instead of a stale client-side "already done" flag. See "Post-delivery fix" below. |
| `supabase/migrations/016`–`018` | Owner claim function + trigger, a critical EXECUTE-grant fix, and RPC lockdown for the new trigger function — see "Post-delivery fix" below for the full story. |
| `CLAUDE.md` | Extensively updated: new "Authentication & Backend (Supabase)" section, rewritten "Account System & Roles", updated File Map/Data Model/Current Limitations/Completed Work/Outstanding Roadmap/Important Decisions to reflect the real backend. |

## Post-delivery fix: real owner setup (found via user report)

After initial delivery, a real bug was reported: `owner-setup.html` said "Owner setup has already been completed on this device" even though no Owner had ever been created. Root cause: `ownerNeedsSetup()` had been hardcoded to always return `false`, and the page trusted that instead of checking anything real. Fixed properly, not just patched:

- **`owner-setup.html` and `auth.js` rewritten** to check real backend state via a new `public.owner_exists()` database function, and to let the logged-in visitor actually claim Owner access with one click (`claimOwnerRole()`) if none exists yet — no more manual-SQL-only path, though that still works as a documented alternative.
- **While building the trigger to make that claim safe, found and fixed a real privilege-escalation hole**: `profiles` RLS only controlled which *rows* a user could update, not which *columns* — meaning any signed-in Explorer could have called `update profiles set role='admin'` (or un-suspended/un-banned themselves) directly via the client SDK. Closed via a new trigger (`guard_profile_updates()`, migration `016`) that blocks any self-change to `role`/`suspended`/`deactivated`/`banned`/`warnings`/`violations` except the one legitimate case: claiming Owner while none exists.
- **While testing that trigger against a real simulated user session (not the privileged service connection used for all earlier testing), found a second, more severe pre-existing bug**: migration `007` had revoked `authenticated`'s EXECUTE privilege on `role_at_least()` — the function nearly every admin-facing RLS policy in the schema calls to check "is this user an Administrator?". Postgres checks EXECUTE against the real invoking role even when the call happens from inside an RLS policy, not just on direct calls, so this silently broke every admin-branch policy (`profiles`, `learner_state`, `volunteer_entries`, community/mentor tables) for real logged-in users — invisible to every test run against the service-role connection, which bypasses this check entirely. Fixed by migration `017` (re-grants EXECUTE to `authenticated`) — verified by simulating real authenticated sessions directly in SQL, including confirming ordinary self-profile edits, admin actions on other users, self-escalation attempts, and the owner-claim race all behave exactly as intended.
- Migration `018` locks the new trigger function down so it can't be called directly as a public RPC endpoint (it only needs to fire as a trigger).

**Practical impact of the second bug**: every admin action built earlier in this pass (suspend/ban/promote/reset-password/etc. from the Owner Dashboard) would very likely have failed for a real logged-in Administrator, not just the Owner claim — it just never surfaced because all verification up to that point used a privileged database connection that bypasses this exact check. This is now fixed and re-verified with a real simulated session, not just re-tested the same way that missed it the first time.

## Notable engineering decisions made along the way

- **Postgres enum uses `admin`, not `administrator`**, to match the pre-existing `ROLES.ADMIN` constant and `.role-admin` CSS — caught and fixed via two follow-up migrations (`010`, `011`) after the mismatch was found by grepping the existing codebase rather than assuming.
- **`profiles` SELECT policy was tightened** (migration `012`) after review found it initially let any logged-in user read every other user's full profile row (email, suspension status, etc.) via the API — not appropriate for production. A narrow `get_mentor_directory()` function (migration `013`) was added so the public Mentor directory keeps working under the tighter policy.
- **Progress/volunteer sync uses a write-through local cache**, not a full rewrite of every call site to be `async` — `setState()`/`saveVolunteerEntries()` still write to `localStorage` synchronously first (so the dozens of existing inline click-handler call sites keep working unchanged), then push to Supabase in the background. Reads pull fresh data from Supabase automatically once per session via the same `window.wrldAuthReady` chain every page already awaits.
- **Owner bootstrap moved server-side** (one manual SQL statement, see `SUPABASE_SETUP.md`) rather than trying to preserve the old auto-created-passwordless-account trick, which doesn't have a safe equivalent with real Supabase Auth.
- **Account "deletion" was deliberately not implemented as a hard delete** — that requires the `service_role` key, which per this project's explicit constraint never appears client-side. `deactivateUser()` is the real, safe equivalent already wired into the Owner Dashboard.
- **Community posts, mentor applications/profiles, live sessions, announcements, feature toggles, and featured picks are still `localStorage`-only.** Their Postgres tables + RLS already exist; wiring them up is explicitly scoped, tracked, follow-up work (see CLAUDE.md's Outstanding/Roadmap), not done in this pass, and not silently claimed as done anywhere in the UI copy.

## Feature checklist against the original request

**Priority 1 — Orbit mobile chat**
- [x] Shows on load with welcome message, mobile only
- [x] Auto-collapses to icon after ~6–8s
- [x] Tapping icon reopens instantly, full functionality intact
- [x] Collapses immediately if the user scrolls before the timer
- [x] Manual close remembered for the rest of the browsing session
- [x] Never blocks primary content/actions
- [x] Orbit's design/response engine unchanged

**Priority 2 — Navigation bar**
- [x] Identical behavior desktop/tablet/mobile
- [x] Logged-out: Logo, Login, Sign Up, Menu always visible
- [x] Logged-in: Logo, Avatar, Menu always visible
- [x] Logo always left, user controls always right, avatar never centered
- [x] No layout shift on auth-state change
- [x] Branding/styling/responsiveness preserved

**Priority 3 — Supabase production backend**
- [x] Real signup/login/logout, email verification, forgot/reset password
- [x] Persistent sessions + Remember Me + automatic token refresh
- [x] Protected routes / auth guards on every gated page
- [x] Real user profiles in the database (name, email, role, settings, notification prefs, created/last-login, etc.)
- [x] Learning progress + volunteer log synced to the database, cross-device
- [ ] Community posts, mentor data, live sessions, announcements, feature toggles synced (tracked, not done this pass)
- [x] Owner Dashboard: real user list, search, view real progress, suspend/reactivate, real password reset, change roles
- [ ] Hard account deletion (architecturally requires a server-side service_role function — documented, not built)
- [x] RLS on every table, security-hardening pass via Supabase advisors, no service_role key anywhere client-side
- [x] Migration strategy for pre-existing localStorage demo accounts (`MIGRATION.md`)
- [x] Code follows existing conventions (`getX()/setX()` pattern, `wrld_` prefix, no build step, no framework)
- [x] `.env.example`, Supabase setup instructions, deployment instructions
- [x] Testing instructions (desktop/tablet/mobile)
- [x] This change summary
