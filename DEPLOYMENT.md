# WRLD Website V13 — Deployment (GitHub + Cloudflare Pages)

WRLD is a static site with no build step, which makes deployment simple: point a static host at the repo root and it works as-is. These steps use GitHub + Cloudflare Pages, but the same project would deploy the same way to Netlify, Vercel, or any static host.

## 1. Push the project to GitHub

From the project root:

```bash
git init
git add .
git status   # review what's staged — see the checklist below before committing
git commit -m "WRLD Website V13: production readiness, security audit, Owner Dashboard scalability"
```

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/<your-org-or-user>/<repo-name>.git
git branch -M main
git push -u origin main
```

**Before your first commit, double-check:**
- `supabase-config.js` contains only the **publishable/anon** key — never the service_role/secret key. Search the whole repo for the string `service_role` before pushing if you're ever unsure.
- No `.env` file with real secrets is staged (only `.env.example`, which contains placeholders, should be committed).
- If you ever *did* accidentally commit a secret key, rotate it immediately in the Supabase dashboard (Project Settings → API → "roll" the key) — removing it from a later commit doesn't remove it from git history.

## 2. Connect Cloudflare Pages

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize and select the GitHub repository you just pushed.
3. Build settings — since there's no build step:
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `/` (the repo root — every HTML file is already at the top level, per WRLD's file structure)
4. Click **Save and Deploy**. Cloudflare will serve every `.html` file directly; `index.html` is the default document at the root.

## 3. Set the production URL in Supabase

Once you have your Cloudflare Pages URL (e.g. `https://wrld.pages.dev`, or a custom domain attached in **Custom domains**), go back to the Supabase dashboard → **Authentication → URL Configuration** and update:
- **Site URL** → your Cloudflare Pages URL
- **Redirect URLs** → add `https://your-domain/reset-password.html`, `https://your-domain/login.html`, and any other page a real auth email might redirect to

Without this step, password-reset and email-confirmation links will redirect to the wrong place (or fail entirely) in production, even though everything works fine when testing against `localhost`.

## 4. Custom domain (optional)

In Cloudflare Pages → your project → **Custom domains**, add your domain and follow the DNS instructions Cloudflare provides. If your domain's DNS already lives in Cloudflare, this is usually a one-click "Activate domain" step; otherwise you'll add a CNAME record pointing at your `*.pages.dev` subdomain.

## 5. Every future push auto-deploys

Once connected, Cloudflare Pages redeploys automatically on every push to `main` (or your configured production branch) — no separate deploy step. Pull request branches get their own preview URLs automatically too, which is useful for testing a change against the *same* Supabase project before merging (just make sure your Supabase redirect URLs include the preview domain pattern if you want auth flows to work on previews, or test those specific flows against `main`/production instead).

## Note on WRLD's own "Coming Soon" honesty rule

If you deploy this before community/mentor/admin-content data sync (see CLAUDE.md's Outstanding/Roadmap) is finished, remember that those features still only work per-browser, not across devices, on the live deployment too — the honesty principle that runs through this codebase's own UI copy applies just as much once it's live on a real domain as it did during development.
