// supabase/functions/_shared/mailer.ts
//
// Shared SMTP sender for both mentor-application Edge Functions. This is
// the piece that was missing from the project entirely — EMAIL-AUTOMATION-SETUP.md
// documented this architecture, but no supabase/functions/ directory ever
// existed in the codebase, so no mentor-application email (owner
// notification, applicant receipt, or any status-change email) could ever
// actually send. This file, templates.ts, and the two index.ts functions
// are the real implementation of what that doc already described.
//
// Uses denomailer (Deno-native SMTP client) via an npm-compatible URL
// import, which Supabase Edge Functions (Deno runtime) support directly —
// no bundler, no package.json needed.

import { SMTPClient } from "npm:denomailer@1.6.0";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

function requiredEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

// A single shared client per invocation — Edge Functions are short-lived,
// so there's no benefit to pooling/reusing a connection across requests.
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const host = requiredEnv("SMTP_HOST");
  const port = Number(requiredEnv("SMTP_PORT"));
  const username = requiredEnv("SMTP_USERNAME");
  const password = requiredEnv("SMTP_PASSWORD");
  const fromEmail = requiredEnv("EMAIL_FROM");
  const fromName = Deno.env.get("EMAIL_FROM_NAME") || "WRLD";

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username, password },
    },
  });

  try {
    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: input.to,
      replyTo: input.replyTo || fromEmail,
      subject: input.subject,
      content: input.text || "This email requires an HTML-capable client to view.",
      html: input.html,
    });
  } finally {
    // denomailer requires an explicit close, or the function can hang
    // until Deno's own timeout kills it.
    await client.close();
  }
}
