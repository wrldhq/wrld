# WRLD Website V19.2 — File Inventory

Diffed directly against the prior V19 project. Every changed/new file is
listed below; nothing else in the project differs.

## New files

| File | Purpose |
|---|---|
| `supabase/migrations/20260730080000_036_community_tables_and_deletion_repair.sql` | Real `community_posts`/`community_replies` tables + RLS + moderation/report RPCs; re-declares `delete_mentor_application()` with a forced PostgREST schema reload |
| `V19.2-BACKEND-SETUP.md` | Exact migration/deploy/verify commands and steps |
| `CHANGES-V19.2.md` | This pass's changelog |
| `TESTING-SUMMARY-V19.2.md` | What was and wasn't verified, and how |
| `FILE-INVENTORY-V19.2.md` | This file |

## Changed files

| File | What changed |
|---|---|
| `supabase/functions/delete-user/index.ts` | Added explicit `Access-Control-Allow-Methods` CORS header |
| `app.js` | Entire community post/reply/report/moderation system rewritten from synchronous `localStorage` to async Supabase calls (`getCommunityPosts`, `communityPostsFor`, `createCommunityPost`, `addCommunityReply`, `deleteOwnCommunityPost`, `deleteOwnCommunityReply`, `reportCommunityItem`, `moderationSetStatus`, `moderationClearReports`, `getModerationQueue`, `getReportedItems`, `computeCommunityBadges`, `getPlatformOverview`, `getRecentActivityFeed`, `getSystemAlerts`); added `friendlyBackendError()`; `submitReport()` made async |
| `community.html` | `renderCommons`/`renderCommonsList`/`commonsThreadCard`/`postCommonsMessage`/`postCommonsReply` rewired to the new async functions; added author/moderator "⋯ Delete" controls on posts and replies wired to `showConfirmModal()`; added a login prompt for logged-out visitors attempting to report content |
| `owner-dashboard.html` | Overview, Community, and Notifications panels converted to the async self-painting pattern; both delete handlers now use `friendlyBackendError()` |
| `administrator-dashboard.html` | Community panel and its `adModApprove`/`adModRemove` handlers made async-aware |
| `moderation-dashboard.html` | Already async-aware from its original implementation — confirmed compatible with the new backend, no functional change needed |
| `journey-passport.html` | Already correctly `await`ing `computeCommunityBadges()` — confirmed compatible, no functional change needed |

## Untouched (confirmed by diff, not just assumed)

Every image, every Playbook/Program in `data.js`, `auth.js`,
`orbit.js`, `orbit-knowledge.js`, `styles.css`, `supabase-client.js`,
every prior migration, every prior Edge Function
(`orbit-ai`, `mentor-application-submitted`,
`mentor-application-status-changed`, their `_shared/` modules),
`account-settings.html`, every public page, the About page, all V18
mobile fixes, all V19 Owner Command Centre/Administrator Dashboard
features beyond what's listed above.
