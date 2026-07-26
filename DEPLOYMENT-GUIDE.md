# WRLD — Version 14 Deployment Guide

Exact order for taking this release live. Steps marked **(manual/dashboard)** cannot be completed by deploying static files alone — they require direct action in the Supabase Dashboard, a SMTP provider's dashboard, and/or GitHub, and are called out explicitly so nothing gets silently skipped.

## 1. Back up Version 13

Before touching anything, snapshot what's currently live:

```bash
# If the current live site is a git repo already:
git tag v13-pre-v14-backup
git push origin v13-pre-v14-backup
```

If V13 isn't in git yet, copy the deployed folder aside (e.g. `WRLD-Website-V13-backup/`) before deploying V14 over it.

## 2. Back up Supabase **(manual/dashboard)**

Supabase Dashboard → **Database → Backups**. Take (or confirm you have) a recent backup/restore point before applying new migrations. On paid tiers this is automatic (point-in-time recovery); on the free tier, export a manual backup via **Database → Backups → Download** or `pg_dump` against the connection string in **Project Settings → Database**.

## 3. Review migrations

Read through `supabase/migrations/027` onward (everything added in this pass) before applying — confirm none of them are destructive (none in this pass drop tables or delete rows; they only add columns/tables/policies/functions). Migrations `001`–`026` were already applied in the V13 pass.

## 4. Apply migrations

Apply `supabase/migrations/027` through the newest file, **in filename order**, using either:

- The Supabase MCP `apply_migration` tool (what was used to build/verify this release), or
- `supabase db push` (Supabase CLI), or
- Pasting each file's contents into the Dashboard's **SQL Editor**, one at a time, in order.

After applying, run **Database → Advisors** (or the `get_advisors` tool) for both Security and Performance — this release leaves no unresolved WARN/ERROR beyond expected INFO-level "unused index" notices on a low-traffic project (see `VERSION-13.1-CHANGELOG.md` for the exact list already checked).

## 5. Configure production URLs **(manual/dashboard)**

Follow `SUPABASE-REDIRECT-SETUP.md` exactly: set **Site URL** to `https://ourwrld.org` and add every redirect target listed there to the allow-list.

## 6. Configure custom SMTP **(manual/dashboard + SMTP provider)**

Follow `SUPABASE-SMTP-SETUP.md`: create/verify a provider account, verify the `ourwrld.org` sending domain (SPF/DKIM), and enter the SMTP host/port/username/password into the Supabase Dashboard's Auth SMTP settings. **Never enter these into any file in this repo.**

## 7. Set the email limit to 100/hour **(manual/dashboard)**

Dashboard → **Authentication → Rate Limits** — confirm the email-sending limit is at least 100/hour (see `SUPABASE-SMTP-SETUP.md` step 3).

## 8. Configure CAPTCHA **(manual/dashboard + Cloudflare)**

Follow `AUTH-SECURITY-SETUP.md` section 1: create a Turnstile widget, put the **secret** key in the Supabase Dashboard's CAPTCHA settings, and put the **site** key in `supabase-config.js` (`WRLD_CAPTCHA_SITE_KEY`) before this next deploy.

## 9. Deploy Edge Functions **(manual/CLI)**

```bash
supabase secrets set SMTP_HOST=... SMTP_PORT=... SMTP_USERNAME=... SMTP_PASSWORD=... \
  EMAIL_FROM=hello@ourwrld.org EMAIL_FROM_NAME=WRLD OWNER_NOTIFICATION_EMAIL=hello@ourwrld.org \
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... EMAIL_WEBHOOK_SECRET=... \
  PUBLIC_SITE_URL=https://ourwrld.org EMAIL_SEND_UNDER_REVIEW=false

supabase functions deploy mentor-application-submitted
supabase functions deploy mentor-application-status-changed
```

Then wire up the two Database Webhooks per `EMAIL-AUTOMATION-SETUP.md` section 3.

## 10. Add environment variables

Beyond the Edge Function secrets in step 9, the only other "environment variable"-shaped value the static frontend needs is already in `supabase-config.js` (the publishable key + Turnstile site key, both intentionally public). There is no build step and no `.env` file consumed by the frontend — everything else lives in Supabase's own dashboard-managed secret storage, not in this repo.

## 11. Upload to GitHub

```bash
git add .
git status   # review — confirm no secrets, no local absolute paths, nothing under "never commit" in AUTH-SECURITY-SETUP.md's secret table
git commit -m "WRLD Website V14: production auth, email workflows, mentor management, Playbook UX"
git push origin main
```

## 12. Publish the site

If using Cloudflare Pages (see `DEPLOYMENT.md` for the original V13 walkthrough), pushing to `main` auto-deploys. For any other static host, point it at the repo root — no build command, no build output directory beyond `/`.

## 13. Test on ourwrld.org

Run through `TESTING-CHECKLIST.md` in full against the **live production URL**, not localhost — several of this release's fixes (redirects, SMTP volume, CAPTCHA) can only be genuinely verified against the real domain and a real email provider.

## 14. Roll back safely if necessary

- **Frontend**: redeploy the V13 backup (step 1) — since there's no build step, this is just serving the older files again.
- **Database**: migrations `027`+ are additive (new tables/columns/policies/functions) and don't drop or rewrite existing V13 data, so rolling back the frontend alone is safe even without reverting the schema. If a specific migration needs reverting, write a new forward migration that undoes it (e.g. `drop function`, `alter table ... drop column`) rather than editing/deleting the already-applied migration file — this keeps the migration history honest and matches the "no destructive resets, ordered clearly" rule in `supabase/migrations/`.
- **Edge Functions**: disable the two Database Webhooks (see `EMAIL-AUTOMATION-SETUP.md` section 8) to silence mentor-application emails without touching anything else; the application workflow itself keeps working.

## Summary: what can and can't be done by deploying static files alone

| Task | Static file deploy? | Needs manual dashboard/provider step |
|---|---|---|
| HTML/CSS/JS changes (Playbook reorder, dashboard UI, etc.) | ✅ Yes | — |
| Database schema/RLS (migrations) | ❌ No | Apply via Supabase Dashboard/CLI/MCP |
| SMTP provider connection | ❌ No | Supabase Dashboard + SMTP provider dashboard |
| Redirect URL allow-list | ❌ No | Supabase Dashboard |
| CAPTCHA secret key | ❌ No | Supabase Dashboard + Cloudflare |
| Edge Function deploy + secrets | ❌ No | Supabase CLI |
| Database Webhooks (email triggers) | ❌ No | Supabase Dashboard |
| Leaked-password protection | ❌ No | Supabase Dashboard |
