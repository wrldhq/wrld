/* =====================================================================
   WRLD — Supabase project configuration

   These two values are the PUBLIC project URL and PUBLIC ("publishable" /
   anon) API key. Unlike a service_role/secret key, this key is designed
   by Supabase to be shipped to browsers — every request it makes is still
   constrained by the Row Level Security policies in supabase/migrations/,
   so it cannot read or write anything a signed-in (or anonymous) user
   isn't allowed to per those policies. This is why it's safe to commit
   this file, unlike a real secret.

   WRLD is a 100%-static, no-build-step site (see CLAUDE.md), so there is
   no bundler to inject environment variables at build time the way a
   typical Node/Vite app would. This file *is* WRLD's env-var mechanism
   for the two values that are safe to ship client-side. The service_role
   key is NEVER placed here or anywhere else in this repo — if a future
   feature needs it (e.g. a privileged Cloudflare Pages Function), it
   belongs only in that function's real server-side environment variable,
   configured in the Cloudflare dashboard, never committed. See
   .env.example for the full list and where each value is actually used.
   ===================================================================== */

const WRLD_SUPABASE_URL = 'https://hnmpcjdlhuhetgkzgdgl.supabase.co';
const WRLD_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_roFmGXF9yLyTx9193r-BEg_-s_g_Kvf';

/* CAPTCHA (V14) — Cloudflare Turnstile SITE key only. This is the public
   half of the pair and is meant to be shipped to the browser (same
   safety model as the Supabase publishable key above) — the matching
   SECRET key is configured only inside the Supabase Dashboard
   (Authentication → Attack Protection), never here, never in any
   frontend file. Left blank by default: every page that renders the
   Turnstile widget checks `WRLD_CAPTCHA_SITE_KEY` first and skips
   rendering entirely if it's empty, so signup/login/password-reset work
   exactly as before until a real site key is set here. See
   AUTH-SECURITY-SETUP.md for how to get a site key and enable
   CAPTCHA protection in the Supabase Dashboard to match. */
const WRLD_CAPTCHA_SITE_KEY = '';
