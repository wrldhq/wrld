// supabase/functions/mentor-application-submitted/index.ts
//
// Database Webhook receiver for INSERT on public.mentor_applications.
// Sends two emails: an owner notification to OWNER_NOTIFICATION_EMAIL
// (this is the specific email that was reported as not arriving at
// hello@ourwrld.org) and a receipt to the applicant. See
// EMAIL-AUTOMATION-SETUP.md sections 1–4 for the full architecture this
// implements, and _shared/mailer.ts's header comment for why this file
// didn't previously exist.
//
// Security: requires BOTH a valid Supabase JWT (Authorization header,
// checked automatically by the platform since verify_jwt=true for this
// function — see supabase/config.toml) AND the x-webhook-secret header
// matching EMAIL_WEBHOOK_SECRET, exactly as documented in
// EMAIL-AUTOMATION-SETUP.md section 3's webhook configuration.

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/mailer.ts";
import { ownerMentorNotificationEmail, applicantReceivedEmail } from "../_shared/templates.ts";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    name: string;
    email: string;
    occupation: string | null;
    expertise: string | null;
    owner_notification_sent_at: string | null;
    applicant_receipt_sent_at: string | null;
  };
}

Deno.serve(async (req: Request) => {
  try {
    // Defense in depth on top of verify_jwt, per EMAIL-AUTOMATION-SETUP.md §3.
    const expectedSecret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
    const providedSecret = req.headers.get("x-webhook-secret");
    if (!expectedSecret || providedSecret !== expectedSecret) {
      console.error("mentor-application-submitted: missing/incorrect x-webhook-secret");
      // Return 200 anyway — an unauthorized/malformed call is not something
      // Supabase's webhook retry mechanism should keep re-attempting (see
      // EMAIL-AUTOMATION-SETUP.md §6 on why failures return 200).
      return new Response(JSON.stringify({ ok: false, reason: "unauthorized" }), { status: 200 });
    }

    const payload = (await req.json()) as WebhookPayload;
    const record = payload?.record;
    if (!record?.id || !record.email) {
      console.error("mentor-application-submitted: payload missing record/id/email");
      return new Response(JSON.stringify({ ok: false, reason: "bad payload" }), { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // Service-role key used only here, only to clear the idempotency
    // columns after a successful send — see AUTH-SECURITY-SETUP.md's
    // "Summary of where every secret actually lives" table.
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ownerEmail = Deno.env.get("OWNER_NOTIFICATION_EMAIL");
    if (!ownerEmail) throw new Error("OWNER_NOTIFICATION_EMAIL is not set");

    const appData = {
      name: record.name,
      email: record.email,
      occupation: record.occupation,
      expertise: record.expertise,
    };

    // Owner notification — idempotent via owner_notification_sent_at.
    if (!record.owner_notification_sent_at) {
      try {
        const { subject, html } = ownerMentorNotificationEmail(appData);
        await sendEmail({ to: ownerEmail, subject, html });
        await supabase
          .from("mentor_applications")
          .update({ owner_notification_sent_at: new Date().toISOString() })
          .eq("id", record.id);
      } catch (err) {
        // Logged, not thrown — a failure here shouldn't block the
        // applicant receipt below. See EMAIL-AUTOMATION-SETUP.md §6/§7
        // for how failures are surfaced (logs) and retried (manual).
        console.error("mentor-application-submitted: owner notification failed", err);
      }
    }

    // Applicant receipt — idempotent via applicant_receipt_sent_at.
    if (!record.applicant_receipt_sent_at) {
      try {
        const { subject, html } = applicantReceivedEmail(appData);
        await sendEmail({ to: record.email, subject, html });
        await supabase
          .from("mentor_applications")
          .update({ applicant_receipt_sent_at: new Date().toISOString() })
          .eq("id", record.id);
      } catch (err) {
        console.error("mentor-application-submitted: applicant receipt failed", err);
      }
    }

    // Always 200 — see EMAIL-AUTOMATION-SETUP.md §6 on why partial/full
    // failures still return 200 (prevents Supabase from re-sending an
    // email that actually succeeded on a previous attempt).
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("mentor-application-submitted: unhandled error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 200 });
  }
});
