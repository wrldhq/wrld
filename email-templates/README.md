# WRLD Email Templates

Two different delivery mechanisms send WRLD's transactional emails, so the templates for each live in two different places:

## `auth/` — Supabase Auth's own emails (this folder)

Signup confirmation, password reset, magic link, invite, and email-change emails are sent directly by Supabase Auth using your project's configured SMTP provider (see `SUPABASE-SMTP-SETUP.md`). Supabase Auth does **not** read template files from this repo — you copy/paste each `.html` file in this folder into **Supabase Dashboard → Authentication → Email Templates** for the matching template type. Supabase's own Go-template variables (`{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`) are used inside these files exactly as Supabase expects — don't rename them.

| File | Paste into template type |
|---|---|
| `confirm-signup.html` | Confirm signup |
| `reset-password.html` | Reset Password |
| `magic-link.html` | Magic Link |
| `invite-user.html` | Invite user |
| `change-email.html` | Change Email Address |

Each has a matching `.txt` plain-text version — Supabase's template editor doesn't currently accept a separate plain-text body for every client (HTML is primary), but the `.txt` files are kept here as the canonical plain-text copy for reference, accessibility, and for reuse if you ever move off Supabase's built-in emailer.

## `mentor/` — mentor-application workflow emails (reference copies)

The **real** source of truth for these is `supabase/functions/_shared/templates.ts` — the Edge Functions (`mentor-application-submitted`, `mentor-application-status-changed`) generate these HTML strings in code so subject lines, applicant names, and links are correctly filled in per email. The `.html` files in `mentor/` are static reference renders (with placeholder data) so you can preview the branding without deploying — if you edit the branding, edit `templates.ts` and regenerate these previews, not the other way around.

## Design constraints (both folders)

Every template here follows the same rules, per the V14 spec: single-column table layout, inline styles only, WRLD's real brand colors (`#2EA8C7` blue, `#1F3D4D` navy, `#F5CF57` yellow, `#FFF9EF` cream), no JavaScript, no web fonts (Arial/Helvetica fallback stack only — email clients strip `@import`/`<link>` font loading unreliably), no interactive form elements, sender name "WRLD", sender/reply-to `hello@ourwrld.org`.
