# WRLD — Authentication Security Setup

Covers CAPTCHA/abuse protection, the role hierarchy and capability-based authorization model (including how the Owner account gets cross-dashboard access without ever changing its role), and other auth-security configuration that lives in the Supabase Dashboard rather than in code.

## 1. CAPTCHA / abuse protection

WRLD uses **Cloudflare Turnstile** (free, privacy-respecting, no visible puzzle for most users) on the three highest-risk public auth actions: signup (`signup.html`), password recovery (`forgot-password.html`), and resend-verification (folded into `check-your-email.html`'s resend button via the same signup-page token when applicable).

### Site key vs. secret key

- **Site key** (public, safe to ship to the browser): goes in `supabase-config.js` as `WRLD_CAPTCHA_SITE_KEY`. This is the *only* Turnstile value that ever appears in this repository.
- **Secret key** (private, verifies tokens server-side): configured **only** inside the Supabase Dashboard → **Authentication → Attack Protection → CAPTCHA** (Supabase verifies the Turnstile token server-side during `signUp()`/`resetPasswordForEmail()`/etc. itself — WRLD's own code never sees or needs the secret key). It is never placed in any file in this repo, any environment file committed to git, or any Edge Function — Supabase's own auth service is the only thing that needs it, and that's configured entirely through the dashboard.

### Setup steps

1. Create a free Cloudflare account (if you don't have one) and add a **Turnstile** widget at [dash.cloudflare.com/?to=/:account/turnstile](https://dash.cloudflare.com) → note the **Site Key** and **Secret Key** it generates.
2. In Supabase Dashboard → **Authentication → Attack Protection**, enable **CAPTCHA protection**, select **Turnstile**, and paste the **Secret Key** there.
3. In `supabase-config.js`, set:
   ```js
   const WRLD_CAPTCHA_SITE_KEY = 'your-real-site-key';
   ```
4. That's it — `signup.html` and `forgot-password.html` already contain the widget markup (`#turnstile-widget`) and conditional script-injection logic that only loads Turnstile's script and renders the widget if `WRLD_CAPTCHA_SITE_KEY` is non-empty (so the site works fine, CAPTCHA-free, in local development before you've set a real key — it just won't be abuse-protected until you do).

### Behavior

- Low-friction: Turnstile's "managed" mode usually passes silently for real users with no visible challenge; it only shows an interactive check when its risk signals are ambiguous.
- Accessible: Turnstile supports keyboard/screen-reader interaction natively when a challenge does render.
- Errors: if the token expires before submission, `wrldOnCaptchaExpire()` clears `window.__wrldCaptchaToken`, and `signUp()`/`requestPasswordReset()` will surface Supabase's own "CAPTCHA verification failed" error through the existing `friendlyAuthError()` translation layer rather than a raw/confusing message.

## 2. Role hierarchy and the capability-based authorization model

### The hierarchy

```text
Explorer  →  Mentor  →  Administrator (admin)  →  Owner
```

Defined once, in `auth.js`:

```js
const ROLES = { EXPLORER: 'explorer', MENTOR: 'mentor', ADMIN: 'admin', OWNER: 'owner' };
const ROLE_HIERARCHY = [ROLES.EXPLORER, ROLES.MENTOR, ROLES.ADMIN, ROLES.OWNER];
```

Each role **inherits every permission of every role below it** — an Owner can do everything an Administrator, Mentor, and Explorer can do; an Administrator can do everything a Mentor and Explorer can do; and so on. This inheritance is enforced by `roleAtLeast(user, minRole)`, which checks the user's position in `ROLE_HIERARCHY` against the required minimum — never by comparing `user.role === 'admin'` directly (an exact-equality check would incorrectly exclude the Owner from anything gated to "Administrator or above").

### The bug this model fixes

Before this pass, several route guards used `requireRole([ROLES.MENTOR, ROLES.ADMIN])` — **exact array membership**, not hierarchy-aware. Since that list didn't include `'owner'`, an Owner account visiting Mentor Studio was denied and silently redirected to the Explorer Dashboard, even though an Owner should always be able to reach anything a Mentor can. The same exact-match bug existed on the Moderator Dashboard's guard. Both are now fixed by switching to the capability functions below, which are hierarchy-aware by construction.

### Capability functions (`auth.js`)

Rather than scattering `role === 'mentor'`-style checks across every page, every dashboard/experience has one named capability check:

```js
function canAccessExplorerDashboard(user)     { return roleAtLeast(user, ROLES.EXPLORER); }
function canAccessMentorStudio(user)          { return roleAtLeast(user, ROLES.MENTOR); }
function canAccessModerationDashboard(user)   { return roleAtLeast(user, ROLES.ADMIN); }
function canAccessOwnerDashboard(user)        { return roleAtLeast(user, ROLES.ADMIN); }
function canAccessAdministratorsPanel(user)   { return roleAtLeast(user, ROLES.OWNER); }
function canAccessSecurityPanel(user)         { return roleAtLeast(user, ROLES.OWNER); }
```

And one reusable guard that any gated page's inline script calls at the top, mirroring the existing `requireAuth()`/`requireRole()`/`requireMinRole()` shape so it drops into the established pattern:

```js
function requireCapability(canAccessFn, redirectTo) {
  const user = getCurrentUser();
  if (!user) return requireAuth();
  if (!canAccessFn(user)) { location.href = redirectTo || 'dashboard.html'; return false; }
  return true;
}
```

Current usage:
- `mentor-studio.html` → `requireCapability(canAccessMentorStudio)` (previously `requireRole([ROLES.MENTOR, ROLES.ADMIN])` — the exact bug above)
- `moderation-dashboard.html` → `requireCapability(canAccessModerationDashboard)` (same bug, same fix)
- `owner-dashboard.html` → `requireCapability(canAccessOwnerDashboard)` (was already correct via `requireMinRole`, switched for consistency)

**Adding a future role-specific experience**: define one new `canAccessX(user)` function using `roleAtLeast()` against whichever role should be the minimum, call `requireCapability(canAccessX)` at the top of that page's inline script, and — if the Owner should be able to preview/inspect it (which, per the hierarchy, they always can unless you deliberately design otherwise) — no further change is needed; the Owner already satisfies `roleAtLeast(user, ROLES.OWNER) → true` for any `minRole` in the hierarchy.

### Real enforcement is server-side, not just these functions

`requireCapability()` and friends control what the **UI shows/allows navigating to** — they are a UX layer, not the actual security boundary. The real boundary is Postgres Row Level Security: every table a page reads from is independently protected by its own RLS policies (see `supabase/migrations/`), keyed off `role_at_least()` evaluated against the *server's* knowledge of the caller's role from `public.profiles`, using the caller's own authenticated session — never a frontend-supplied value. A malicious user editing `localStorage`, calling `requireCapability()` bypassed via dev tools, or hitting a page's URL directly gains nothing: any Supabase query they make still runs through RLS as their real, database-recorded role. This is why the master spec's instruction "do not authorize based on frontend visibility, localStorage, or JS role overrides" is already satisfied structurally, not just by convention — there is no code path where the frontend's opinion of a user's role is what a table query actually trusts.

## 3. The Owner's cross-dashboard access ("master keyring") model

### The requirement

The Owner account must be able to move between **My Explorer Dashboard**, **Mentor Studio**, and **Owner Command Centre** without ever changing accounts, losing the `owner` role, or being redirected to the wrong destination — and without WRLD auto-listing the Owner as a public Mentor just because they can access Mentor Studio.

### How it works

1. **The Owner's `profiles.role` never changes.** It stays `'owner'` permanently — nothing in this model promotes, demotes, or duplicates the Owner's role to grant access to a lower experience.
2. **Access to every lower experience is a consequence of the hierarchy, not a separate grant.** Because `ROLE_HIERARCHY` places Owner above Mentor above Explorer, `canAccessMentorStudio(ownerUser)` and `canAccessExplorerDashboard(ownerUser)` both evaluate `true` automatically — the same one-line capability functions used everywhere else, no Owner-specific special-casing required.
3. **The dashboard switcher** (in the profile menu / nav, added to `app.js`'s `loggedInNavCTA()` and the mobile menu) shows Owner-specific labels — **"My Explorer Dashboard"** and **"👑 Owner Command Centre"** — routing to `dashboard.html` and `owner-dashboard.html` respectively, plus a link into Mentor Studio. This nav lives inside the logged-in profile/account area, which stays pinned to the **far right** of the nav toolbar at every breakpoint (per the Priority-3 nav-grid work — `.nav-right` wraps `.nav-cta` + the burger menu so auth controls never drift toward center).
4. **Visiting Mentor Studio as Owner does not require a public Mentor application.** `mentor_profiles` (the table that drives the public Mentor directory) is only populated when an account explicitly creates/saves one via Mentor Studio's own profile editor (`saveMentorProfile()`). The Owner reaching Mentor Studio doesn't touch that table at all — inspecting the Studio and being *listed publicly as a Mentor* are two independent things. `get_mentor_directory()` (migration `027`) reinforces this at the database level: it only shows an Admin/Owner row if a real `mentor_profiles` row exists for them — an Owner who never fills out a Mentor profile is never shown in the public directory, regardless of how many times they visit Mentor Studio.
5. **Back/forward navigation and direct URLs just work**, because access is re-evaluated fresh on every page load from the real session (`window.wrldAuthReady` → `getCurrentUser()` → `canAccessX()`), not cached in a way that could go stale — refreshing Mentor Studio re-runs the same capability check and reaches the same conclusion every time, on any device, for as long as the Owner's session is valid.
6. **No sign-out, no duplicate account, no data loss.** Switching between the three destinations is plain navigation between three existing pages that all read the same Supabase-backed session and the same `profiles` row — there's exactly one Owner account throughout, exactly as before.

### What this model deliberately does NOT do

- It does not create an "effective role" or "acting as" concept — the Owner is always, only, `role='owner'` in the database.
- It does not grant access via URL parameters, `localStorage`/`sessionStorage` flags, hidden buttons, or any client-editable value — every one of the three destinations independently re-checks the real session on load.
- It does not require a second account, a Mentor application, or a Mentor-role promotion for the Owner to use Mentor Studio.
- It does not auto-populate a public Mentor profile — that remains a deliberate, explicit action the Owner (or any Mentor/Administrator) takes if they want to be publicly listed.

## 4. Password security

**Leaked password protection** (checks new passwords against the HaveIBeenPwned breach corpus) is **not yet enabled** on the live Supabase project — confirmed via `get_advisors(security)`, which currently reports this as a WARN. Enable it before public launch:

Supabase Dashboard → **Authentication → Policies** (or **Auth → Providers → Email**, depending on dashboard version) → enable **"Leaked password protection"**.

This is a dashboard-only toggle — there is no corresponding code change in this repo.

## 5. Summary of where every secret actually lives

| Secret | Lives in | Never appears in |
|---|---|---|
| Supabase service_role key | Edge Function secrets (`supabase secrets set`) only | Any file in this repo, any frontend JS |
| SMTP credentials (auth emails) | Supabase Dashboard SMTP settings only | Any file in this repo |
| SMTP credentials (mentor emails) | Edge Function secrets only | Any file in this repo |
| Turnstile secret key | Supabase Dashboard CAPTCHA settings only | Any file in this repo |
| Turnstile **site** key | `supabase-config.js` (`WRLD_CAPTCHA_SITE_KEY`) — intentionally public | N/A — safe to commit |
| Supabase publishable/anon key | `supabase-config.js` — intentionally public, RLS-protected | N/A — safe to commit |
| `EMAIL_WEBHOOK_SECRET` | Edge Function secrets + the Database Webhook's own header config | Any file in this repo |
