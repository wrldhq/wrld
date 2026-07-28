# WRLD Website — Deployment Guide

WRLD is a 100%-static, no-build-step site (no bundler, no framework, no `npm run build`). "Deploying" the frontend means uploading every file in this project (outside `supabase/`) to static hosting, exactly as-is, with the same filenames and relative paths (scripts are loaded by exact filename, with cache-busting `?v=` query strings — see each page's `<script src="...">`/`<link href="...">` tags). The backend (Postgres schema, RLS policies, RPC functions, Edge Functions) lives in Supabase and is **not** touched by a frontend deploy — it's deployed separately, via the steps below.

This is the single, current deployment reference for this project — earlier per-release deployment notes (V13 through V20.2) have been superseded and removed as part of V21's documentation cleanup; see `CHANGES-V21.md`.

---

## 1. Initial hosting setup (GitHub + Cloudflare Pages, or any static host)

### Push the project to GitHub

```bash
git init
git add .
git status   # review what's staged before committing
git commit -m "WRLD Website: initial commit"
git remote add origin https://github.com/<your-org-or-user>/<repo-name>.git
git branch -M main
git push -u origin main
```

**Before your first commit, double-check:**
- `supabase-config.js` contains only the **publishable/anon** key — never the `service_role`/secret key. Search the whole repo for the string `service_role` before pushing if you're ever unsure.
- No file with real secrets (SMTP credentials, CAPTCHA secret key, service_role key) is staged — see `AUTH-SECURITY-SETUP.md`'s "never commit" table.
- If a secret key is ever accidentally committed, rotate it immediately in the Supabase dashboard (Project Settings → API → "roll" the key) — removing it from a later commit doesn't remove it from git history.

### Connect Cloudflare Pages (or Netlify/Vercel/any static host)

1. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, and select this repository.
2. Build settings — since there's no build step:
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `/` (the repo root — every HTML file is already at the top level)
3. **Save and Deploy.** Every push to `main` (or your configured production branch) auto-deploys afterward — no separate deploy step for the frontend. Pull-request branches get their own preview URLs automatically.

### Set the production URL in Supabase

Once you have a production URL (Cloudflare Pages URL, or a custom domain attached under **Custom domains**), go to Supabase Dashboard → **Authentication → URL Configuration** and set:
- **Site URL** → your production URL
- **Redirect URLs** → add every page a real auth email might redirect to (`reset-password.html`, `login.html`, `email-verified.html`, etc.)

Without this, password-reset and email-confirmation links redirect to the wrong place (or fail) in production, even though everything works against `localhost` during development.

### Custom domain (optional)

Cloudflare Pages → your project → **Custom domains** → add your domain and follow the DNS instructions provided (usually a one-click "Activate domain" if your DNS already lives in Cloudflare, otherwise a CNAME record pointing at your `*.pages.dev` subdomain).

---

## 2. Applying database migrations

Every file under `supabase/migrations/` must be applied, **in filename order** (they're timestamp-prefixed, so alphabetical order is the correct order — later ones depend on tables/columns/functions earlier ones create). On the existing production project these are already applied; this section matters most when standing up a **fresh** Supabase project from this codebase.

### Option A — Supabase CLI
```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B — SQL Editor (manual, no CLI)
Open Dashboard → **SQL Editor**, and run each file under `supabase/migrations/` in filename order.

---

## 3. Deploying Edge Functions

The current functions under `supabase/functions/` (real slugs, not placeholders):

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy delete-user
supabase functions deploy delete-mentor-application
supabase functions deploy mentor-application-submitted
supabase functions deploy mentor-application-status-changed
supabase functions deploy orbit-ai
```

### Required secrets (set once per project)
```bash
supabase secrets set SUPABASE_URL=<your project URL>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service role key — Dashboard → Project Settings → API — never commit this>
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically inside the Edge Function runtime for functions deployed via the CLI/Dashboard against their own project — confirm both are present under Dashboard → Edge Functions → *(function name)* → Secrets if a manual deploy ever reports them missing.

`mentor-application-submitted` and `mentor-application-status-changed` additionally need the SMTP secrets described in `EMAIL-AUTOMATION-SETUP.md` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `OWNER_NOTIFICATION_EMAIL`, `EMAIL_WEBHOOK_SECRET`, `PUBLIC_SITE_URL`). `orbit-ai` needs its own LLM provider key — see `ORBIT-AI-SETUP.md` for that function's specific secret name.

**Reminder:** pushing to GitHub does not apply migrations and does not deploy Edge Functions — those live in Supabase and require the steps above, every time `supabase/migrations/` or `supabase/functions/` changes.

### Database Webhooks

`mentor-application-submitted` and `mentor-application-status-changed` are triggered by Database Webhooks, not called directly by the frontend — configure these per `EMAIL-AUTOMATION-SETUP.md` section 3. `supabase/config.toml` keeps `verify_jwt = true` on every function; the webhooks are set up to send the `service_role` key as the Bearer token, so this stays on rather than being disabled.

---

## 4. Auth security setup (CAPTCHA, SMTP, rate limits)

Follow `AUTH-SECURITY-SETUP.md` for: enabling Cloudflare Turnstile (CAPTCHA) on signup/login/password-reset, configuring custom SMTP so signup/password-reset emails don't hit Supabase's default low-volume sending limit, and the project's full role/capability model. Follow `EMAIL-AUTOMATION-SETUP.md` for the mentor-application email workflow specifically.

---

## 5. Rolling back safely

- **Frontend**: since there's no build step, rolling back is just re-deploying the previous set of static files (e.g. `git revert`/`git checkout` the prior commit and push).
- **Database**: migrations in this project are additive (new tables/columns/policies/functions) and don't drop or rewrite existing data, so rolling back the frontend alone is normally safe even without reverting the schema. If a specific migration ever needs reverting, write a new forward migration that undoes it (e.g. `drop function`, `alter table ... drop column`) rather than editing/deleting an already-applied migration file — this keeps the migration history honest.
- **Edge Functions**: redeploy the previous version of the function (`supabase functions deploy <slug>` from the prior commit), or disable the relevant Database Webhook to silence a specific email workflow without touching anything else.

---

## Summary: what a static-file deploy can and can't do alone

| Task | Static file deploy? | Needs a separate manual/CLI step |
|---|---|---|
| HTML/CSS/JS changes | ✅ Yes | — |
| Database schema/RLS (migrations) | ❌ No | Supabase Dashboard/CLI (§2 above) |
| Edge Function deploy + secrets | ❌ No | Supabase CLI (§3 above) |
| Database Webhooks (email triggers) | ❌ No | Supabase Dashboard (§3 above) |
| SMTP / CAPTCHA / redirect URLs | ❌ No | Supabase Dashboard + provider dashboard (§4 above) |
