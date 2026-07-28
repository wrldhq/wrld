# WRLD Website V19 — Permission Matrix

This reflects both the UI (which links/buttons a role sees) and the
backend enforcement (RLS, `security definer` RPCs, Edge Functions) —
every row below is enforced in both places, not just hidden in the
interface. See `auth.js`'s `ROLE_PERMISSIONS`, `canAccess*()` functions,
and `requireCapability()` for the UI-layer enforcement, and
`supabase/migrations/035` + `supabase/functions/delete-user` for the
backend layer.

| Capability | Explorer | Mentor | Administrator | Owner |
|---|---|---|---|---|
| Explorer Dashboard | ✅ | ✅ | ✅ | ✅ |
| Mentor Studio | ❌ | ✅ | only if also independently Mentor | ✅ |
| **Administrator Dashboard** (new) | ❌ | ❌ | ✅ | ✅ |
| **Owner Command Centre** | ❌ | ❌ | ❌ *(changed in V19 — see below)* | ✅ |
| Edit own name | ✅ | ✅ | ✅ | ✅ |
| Edit another user's name | ❌ | ❌ | ❌ | ❌ |
| View user list, search, filter | ❌ | ❌ | ✅ | ✅ |
| Promote Explorer → Mentor | ❌ | ❌ | ✅ | ✅ |
| Suspend / reactivate a user | ❌ | ❌ | ✅ | ✅ |
| Deactivate / ban a user | ❌ | ❌ | ❌ *(Owner Command Centre only)* | ✅ |
| **Permanently delete a user** | ❌ | ❌ | ❌ | ✅, with protections below |
| Review mentor applications, change status | ❌ | ❌ | ✅ | ✅ |
| **Permanently delete a mentor application** | ❌ | ❌ | ❌ | ✅ |
| Review/moderate community content | ❌ | ❌ | ✅ | ✅ |
| View operational metrics (Overview) | ❌ | ❌ | ✅ | ✅ |
| View sensitive/organization-level analytics | ❌ | ❌ | ❌ | ✅ |
| Manage Administrators (promote/demote) | ❌ | ❌ | ❌ | ✅ |
| Organization settings, Roadmap | ❌ | ❌ | ❌ | ✅ |
| Security panel | ❌ | ❌ | ❌ | ✅ |
| Transfer ownership | ❌ | ❌ | ❌ | ✅ |
| View/use service-role secrets, API keys | ❌ | ❌ | ❌ | ❌ *(no role — server-only, ever)* |

## What changed from V18

**Before V19**, Administrators shared `owner-dashboard.html` with the
Owner (Owner-only tabs like Administrators/Security were hidden inside
that same page). **As of V19**, Administrators are routed to their own
new `administrator-dashboard.html` instead, and `owner-dashboard.html`
(the Owner Command Centre) is now Owner-exclusive —
`canAccessOwnerDashboard()` in `auth.js` changed from
`roleAtLeast(user, ROLES.ADMIN)` to `roleAtLeast(user, ROLES.OWNER)`.
An Administrator who bookmarked the old URL is redirected to their
dashboard by `requireCapability()`, the same server-checked route guard
already used everywhere else — never just a hidden nav link.

Owners retain access to all four workspaces (Explorer Dashboard, Mentor
Studio, Administrator Dashboard, Owner Command Centre) via the existing
"master keyring" model documented in `AUTH-SECURITY-SETUP.md` — nothing
about that model changed, it simply now also covers the new
Administrator Dashboard.

## Owner-only deletion protections (enforced server-side)

- An Owner cannot delete their own account (checked in
  `delete-user/index.ts` before anything else runs).
- The final remaining active Owner account cannot be deleted — this is
  computed live in the Edge Function against real active-Owner counts
  at the moment of deletion, not a static database constraint, so it
  correctly allows deleting a second Owner as long as at least one
  active Owner remains.
- Both checks happen inside the Edge Function itself, using the
  caller's real session-validated identity — never a value the client
  sends in the request body.
