# WRLD — Mentor-Application Email Automation Setup

This covers the two Supabase Edge Functions that send every mentor-application email (owner notification, applicant receipt, and the four status-change emails). Auth emails (signup, password reset, etc.) are a **separate** system — see `SUPABASE-SMTP-SETUP.md` and `SUPABASE-REDIRECT-SETUP.md` for those.

## Why Edge Functions, not browser JavaScript

Sending email requires SMTP credentials. Credentials can never live in frontend code (they'd be visible to anyone who opens dev tools), so the actual sending has to happen server-side. Supabase Edge Functions are the server-side compute WRLD already has available (no separate backend to stand up) and run with their own private environment variables, invisible to the browser.

## Architecture

```text
mentor_applications (INSERT)
        │
        ▼  Database Webhook
supabase/functions/mentor-application-submitted/
        │
        ├─► email: owner notification → OWNER_NOTIFICATION_EMAIL
        └─► email: applicant receipt   → applicant's email
        (sets owner_notification_sent_at / applicant_receipt_sent_at)

mentor_application_status_history (INSERT)
   — one row per real call to set_mentor_application_status()
        │
        ▼  Database Webhook
supabase/functions/mentor-application-status-changed/
        │
        └─► email matching new_status → applicant's email
        (sets applicant_email_sent = true on that history row)
```

Both functions are pure webhook receivers — nothing calls them directly from the browser. They live in `supabase/functions/mentor-application-submitted/index.ts` and `supabase/functions/mentor-application-status-changed/index.ts`, with shared code in `supabase/functions/_shared/mailer.ts` (SMTP sending) and `supabase/functions/_shared/templates.ts` (branded HTML/text templates).

## 1. Required environment variables

Set these as **function secrets** (never in any file in this repo):

```text
SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=hello@ourwrld.org
EMAIL_FROM_NAME=WRLD
OWNER_NOTIFICATION_EMAIL=hello@ourwrld.org
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
EMAIL_WEBHOOK_SECRET=
PUBLIC_SITE_URL=https://ourwrld.org
EMAIL_SEND_UNDER_REVIEW=false
```

Notes on each:
- `SMTP_*` / `EMAIL_FROM*` — can point at the same provider configured in `SUPABASE-SMTP-SETUP.md`, or a separate transactional-email account; either works, since these functions send independently of Supabase Auth's own emailer.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — used only inside the Edge Function, only to update the idempotency columns (`*_sent_at`, `applicant_email_sent`) after a successful send. **This is the one legitimate server-side use of the service-role key in this project** — it never appears in any browser-loaded file.
- `EMAIL_WEBHOOK_SECRET` — a random string you generate yourself (e.g. `openssl rand -hex 32`); the Database Webhook is configured to send it as a header, and the function refuses any request that doesn't present it — defense in depth on top of Supabase's own `verify_jwt`.
- `EMAIL_SEND_UNDER_REVIEW` — optional per spec section 16 ("support this notification if enabled by the owner"); leave `false` to skip the under-review email entirely.

### Setting secrets

```bash
supabase secrets set SMTP_HOST=smtp.yourprovider.com SMTP_PORT=587 SMTP_USERNAME=... SMTP_PASSWORD=... \
  EMAIL_FROM=hello@ourwrld.org EMAIL_FROM_NAME=WRLD OWNER_NOTIFICATION_EMAIL=hello@ourwrld.org \
  SUPABASE_URL=https://hnmpcjdlhuhetgkzgdgl.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
  EMAIL_WEBHOOK_SECRET=$(openssl rand -hex 32) PUBLIC_SITE_URL=https://ourwrld.org EMAIL_SEND_UNDER_REVIEW=false
```

## 2. Deploying the functions

```bash
supabase functions deploy mentor-application-submitted
supabase functions deploy mentor-application-status-changed
```

Both keep `verify_jwt = true` (see `supabase/config.toml`) — the Database Webhook below is configured to send a valid Authorization header, so this doesn't need to be disabled.

## 3. Wiring up the Database Webhooks

In the Supabase Dashboard → **Database → Webhooks → Create a new webhook**:

**Webhook 1 — mentor-application-submitted**
- **Table**: `mentor_applications`
- **Events**: `INSERT` only
- **Type**: HTTP Request
- **URL**: `https://<project-ref>.supabase.co/functions/v1/mentor-application-submitted`
- **HTTP Headers**: add `Authorization: Bearer <service_role key>` (so `verify_jwt` passes) and `x-webhook-secret: <the EMAIL_WEBHOOK_SECRET you generated>`

**Webhook 2 — mentor-application-status-changed**
- **Table**: `mentor_application_status_history`
- **Events**: `INSERT` only
- **Type**: HTTP Request
- **URL**: `https://<project-ref>.supabase.co/functions/v1/mentor-application-status-changed`
- **HTTP Headers**: same two headers as above

The `Authorization` header value (service_role key) is stored by Supabase itself inside the webhook's own configuration — it is never entered into this repository.

## 4. How duplicate messages are prevented

- **mentor-application-submitted**: checks `owner_notification_sent_at`/`applicant_receipt_sent_at` on the row before sending each half, and sets them immediately after a successful send. A webhook retry (Supabase retries failed deliveries) re-checks these and skips anything already sent.
- **mentor-application-status-changed**: checks `applicant_email_sent` on the specific history row before sending, sets it true after. Since `set_mentor_application_status()` inserts exactly one history row per real status change (see migration `032`), this function only ever fires once per real decision — not once per page reload or duplicate button click, because the RPC itself (not the browser) is what creates the row.

## 5. Testing each email

1. Submit a real mentor application via `become-mentor.html` while logged in as a test Explorer account with a real inbox. Confirm both the owner notification (at `OWNER_NOTIFICATION_EMAIL`) and the applicant receipt arrive.
2. From the Owner Dashboard's Mentors tab, click **Approve** on that test application. Confirm the "You're a WRLD Mentor!" email arrives.
3. Submit a second test application and click **Decline**, optionally adding a note. Confirm the decline email arrives with the note included.
4. Submit a third test application and click **Request More Info** with a note. Confirm that email arrives.
5. (Optional) Set `EMAIL_SEND_UNDER_REVIEW=true` and click **Mark Under Review** on a test application to confirm that email path too, then set it back to `false` if you don't want it live.

## 6. Inspecting failures

```bash
supabase functions logs mentor-application-submitted
supabase functions logs mentor-application-status-changed
```

Or use the `get_logs` MCP tool / **Edge Functions → Logs** in the dashboard. Both functions log the specific failure reason (`console.error`) and still return HTTP 200 to the webhook on a partial/full failure — this is deliberate, so Supabase's webhook retry mechanism doesn't re-attempt an email that actually succeeded on a previous try, since retries are keyed off HTTP status. Failures need to be caught by watching the logs, not by expecting automatic retries.

## 7. Safe retry after a failure

If a specific email genuinely failed to send (confirmed via the logs, not just "the applicant says they didn't get it" — check spam first):

1. For an owner-notification/applicant-receipt failure: manually `update public.mentor_applications set owner_notification_sent_at = null where id = '<id>'` (or the applicant-receipt column) in the SQL Editor, then re-trigger by re-invoking the function directly with that row's payload, or re-fire the webhook from the Dashboard's webhook logs "Retry" action if available.
2. For a status-change email failure: `update public.mentor_application_status_history set applicant_email_sent = false where id = '<history row id>'`, then retry the same way.

Never re-run `set_mentor_application_status()` just to resend an email — that would create a second, misleading status-history entry for a status that didn't actually change.

## 8. Disabling the workflow

To turn off mentor-application emails entirely without touching code: delete or disable both Database Webhooks in the Dashboard. The application/status-change flow itself keeps working normally (the RPCs don't depend on the webhooks); only the emails stop sending.
