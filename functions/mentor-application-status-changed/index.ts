// supabase/functions/mentor-application-status-changed/index.ts
//
// Database Webhook receiver for INSERT on
// public.mentor_application_status_history — one row per real call to
// set_mentor_application_status() (see supabase/migrations/032). Sends
// the matching applicant email for the new status. See
// EMAIL-AUTOMATION-SETUP.md sections 1–4 for the full architecture.

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/mailer.ts";
import {
  applicantApprovedEmail,
  applicantDeclinedEmail,
  applicantMoreInfoEmail,
  applicantUnderReviewEmail,
} from "../_shared/templates.ts";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string; // mentor_application_status_history.id
    application_id: string;
    new_status: string;
    note: string | null;
    applicant_email_sent: boolean;
  };
}

Deno.serve(async (req: Request) => {
  try {
    const expectedSecret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
    const providedSecret = req.headers.get("x-webhook-secret");
    if (!expectedSecret || providedSecret !== expectedSecret) {
      console.error("mentor-application-status-changed: missing/incorrect x-webhook-secret");
      return new Response(JSON.stringify({ ok: false, reason: "unauthorized" }), { status: 200 });
    }

    const payload = (await req.json()) as WebhookPayload;
    const record = payload?.record;
    if (!record?.id || !record.application_id || !record.new_status) {
      console.error("mentor-application-status-changed: payload missing required fields");
      return new Response(JSON.stringify({ ok: false, reason: "bad payload" }), { status: 200 });
    }

    // Already sent (e.g. a webhook retry) — nothing to do.
    if (record.applicant_email_sent) {
      return new Response(JSON.stringify({ ok: true, skipped: "already sent" }), { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: application, error: fetchError } = await supabase
      .from("mentor_applications")
      .select("name, email")
      .eq("id", record.application_id)
      .single();

    if (fetchError || !application?.email) {
      console.error("mentor-application-status-changed: could not load application", fetchError);
      return new Response(JSON.stringify({ ok: false, reason: "application not found" }), { status: 200 });
    }

    const appData = { name: application.name, email: application.email };
    const sendUnderReview = (Deno.env.get("EMAIL_SEND_UNDER_REVIEW") || "false").toLowerCase() === "true";

    let emailToSend: { subject: string; html: string } | null = null;
    switch (record.new_status) {
      case "approved":
        emailToSend = applicantApprovedEmail(appData);
        break;
      case "declined":
        emailToSend = applicantDeclinedEmail(appData, record.note);
        break;
      case "more_information_requested":
        emailToSend = applicantMoreInfoEmail(appData, record.note);
        break;
      case "under_review":
        if (sendUnderReview) emailToSend = applicantUnderReviewEmail(appData);
        break;
      default:
        // 'submitted' / 'withdrawn' / anything else — no email defined.
        break;
    }

    if (!emailToSend) {
      // Nothing to send for this status (or under-review emails are
      // disabled) — not an error, just nothing to do.
      return new Response(JSON.stringify({ ok: true, skipped: "no email for status" }), { status: 200 });
    }

    try {
      await sendEmail({ to: application.email, subject: emailToSend.subject, html: emailToSend.html });
      await supabase
        .from("mentor_application_status_history")
        .update({ applicant_email_sent: true })
        .eq("id", record.id);
    } catch (err) {
      console.error("mentor-application-status-changed: send failed", err);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("mentor-application-status-changed: unhandled error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 200 });
  }
});
