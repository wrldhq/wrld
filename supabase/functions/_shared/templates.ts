// supabase/functions/_shared/templates.ts
//
// Real source of truth for every mentor-application email's HTML/subject,
// as already documented in email-templates/mentor/*.html's own header
// comments (e.g. "real source of truth is
// supabase/functions/_shared/templates.ts → ownerMentorNotificationEmail()").
// Those .html files are static reference previews with placeholder data —
// this file is what actually generates each email with real applicant
// data at send time. Content and branding here are written to match those
// previews exactly (WRLD navy/blue/yellow/cream, Arial/Helvetica fallback
// stack, single-column table layout, no JS, no web fonts, no interactive
// form elements — see email-templates/README.md's "Design constraints").

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://ourwrld.org";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>WRLD</title></head>
<body style="margin:0; padding:0; background-color:#FFF9EF; font-family:Arial, Helvetica, sans-serif;">
  <span style="display:none; font-size:1px; color:#FFF9EF; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF9EF; padding:32px 16px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden;">
      <tr><td style="background-color:#1F3D4D; padding:24px 32px;"><span style="font-size:20px; font-weight:800; color:#ffffff; letter-spacing:.02em;">WRLD</span></td></tr>
      <tr><td style="padding:32px;">
${bodyHtml}
      </td></tr>
      <tr><td style="padding:20px 32px; border-top:1px solid #EFEAE0;"><p style="margin:0; font-size:12px; color:#6B7A80; line-height:1.6;">WRLD — the curriculum for adulthood.<br>Questions? Reply to this email or write to <a href="mailto:hello@ourwrld.org" style="color:#2EA8C7;">hello@ourwrld.org</a>.</p></td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:999px; background-color:#2EA8C7;"><a href="${href}" style="display:inline-block; padding:13px 26px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:999px;">${escapeHtml(label)}</a></td></tr></table>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 12px; font-size:14px; color:#2B2B2B; line-height:1.6;">${text}</p>`;
}

export interface MentorApplicationData {
  name: string;
  email: string;
  occupation?: string | null;
  expertise?: string | null;
}

/** Sent to OWNER_NOTIFICATION_EMAIL when a new mentor_applications row is inserted. */
export function ownerMentorNotificationEmail(app: MentorApplicationData) {
  const name = escapeHtml(app.name);
  const email = escapeHtml(app.email);
  const expertise = escapeHtml(app.expertise || app.occupation || "General mentorship");
  const html = shell(
    `New mentor application from ${app.name}`,
    `<h1 style="margin:0 0 12px; font-size:20px; color:#1F3D4D;">New Mentor Application</h1>
${p(`<strong>${name}</strong> (${email}) just applied to become a WRLD Mentor — expertise: ${expertise}.`)}
${p("Review the full application, résumé, and supporting documents in the Owner Dashboard.")}
${button(`${SITE_URL}/owner-dashboard.html#mentors`, "Review Application")}
<p style="margin:0; font-size:12.5px; color:#6B7A80;">This link opens the Mentors tab of the Owner Dashboard. You'll need to be signed in with an Administrator or Owner account.</p>`
  );
  return { subject: `New Mentor Application — ${app.name}`, html };
}

/** Sent to the applicant immediately after they submit. */
export function applicantReceivedEmail(app: MentorApplicationData) {
  const firstName = escapeHtml((app.name || "there").split(" ")[0]);
  const html = shell(
    "We've received your WRLD Mentor application",
    `<h1 style="margin:0 0 12px; font-size:20px; color:#1F3D4D;">We've got your application 🎉</h1>
${p(`Hi ${firstName},`)}
${p("Thanks for applying to become a WRLD Mentor. Our team reviews every application by hand, so it may take a little while — we'll email you as soon as there's an update, whether that's a decision or a request for more information.")}
${p("In the meantime, there's nothing else you need to do.")}`
  );
  return { subject: "We've received your WRLD Mentor application", html };
}

/** Sent to the applicant when set_mentor_application_status() sets new_status = 'approved'. */
export function applicantApprovedEmail(app: MentorApplicationData) {
  const firstName = escapeHtml((app.name || "there").split(" ")[0]);
  const html = shell(
    "Your WRLD Mentor application was approved",
    `<h1 style="margin:0 0 12px; font-size:20px; color:#1F3D4D;">You're a WRLD Mentor! 🤝</h1>
${p(`Hi ${firstName},`)}
${p("Great news — your Mentor application has been approved. Your account now has Mentor access, including Mentor Studio, where you can publish live sessions and edit your public Mentor profile.")}
${button(`${SITE_URL}/login.html`, "Go to Mentor Studio")}`
  );
  return { subject: "You're a WRLD Mentor! 🤝", html };
}

/** Sent to the applicant when new_status = 'declined'. */
export function applicantDeclinedEmail(app: MentorApplicationData, note?: string | null) {
  const firstName = escapeHtml((app.name || "there").split(" ")[0]);
  const noteHtml = note
    ? p(`<strong>Note from our team:</strong> ${escapeHtml(note)}`)
    : "";
  const html = shell(
    "An update on your WRLD Mentor application",
    `<h1 style="margin:0 0 12px; font-size:20px; color:#1F3D4D;">An update on your Mentor application</h1>
${p(`Hi ${firstName},`)}
${p("Thank you for your interest in mentoring on WRLD. After review, we're not able to move forward with your application at this time.")}
${noteHtml}
${p("You're welcome to keep learning and participating in the WRLD community, and to apply again in the future.")}`
  );
  return { subject: "An update on your WRLD Mentor application", html };
}

/** Sent to the applicant when new_status = 'more_information_requested'. */
export function applicantMoreInfoEmail(app: MentorApplicationData, note?: string | null) {
  const firstName = escapeHtml((app.name || "there").split(" ")[0]);
  const noteHtml = note
    ? p(`<strong>What we need:</strong> ${escapeHtml(note)}`)
    : "";
  const html = shell(
    "We need a bit more information — WRLD Mentor application",
    `<h1 style="margin:0 0 12px; font-size:20px; color:#1F3D4D;">We'd like a bit more information</h1>
${p(`Hi ${firstName},`)}
${p("We're reviewing your Mentor application and would like a little more information before we can make a decision.")}
${noteHtml}
${p("Reply to this email with the details, and we'll continue the review.")}
${button(`${SITE_URL}/become-mentor.html`, "View My Application")}`
  );
  return { subject: "We need a bit more information — WRLD Mentor application", html };
}

/** Sent to the applicant when new_status = 'under_review', only if EMAIL_SEND_UNDER_REVIEW=true. */
export function applicantUnderReviewEmail(app: MentorApplicationData) {
  const firstName = escapeHtml((app.name || "there").split(" ")[0]);
  const html = shell(
    "Your WRLD Mentor application is under review",
    `<h1 style="margin:0 0 12px; font-size:20px; color:#1F3D4D;">Your application is under review</h1>
${p(`Hi ${firstName},`)}
${p("Just a quick note — your WRLD Mentor application is now being actively reviewed by our team. We'll follow up with a decision soon.")}`
  );
  return { subject: "Your WRLD Mentor application is under review", html };
}
