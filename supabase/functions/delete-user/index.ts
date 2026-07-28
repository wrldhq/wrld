// supabase/functions/delete-user/index.ts
//
// Permanent user deletion — Owner-only. This cannot be done from
// browser-side JavaScript because deleting an auth.users row requires
// the Supabase Auth Admin API, which requires the service_role key.
// This function is the one legitimate server-side place that key is
// ever used for this purpose (same pattern already established for
// mentor-application emails in _shared/mailer.ts and for the mentor
// application idempotency columns in mentor-application-submitted).
//
// Enforces, server-side (never trusting the client):
//  - the caller has a valid session
//  - the caller's real, database-recorded role is exactly 'owner'
//  - the caller is not deleting their own account
//  - the target is not the final remaining active Owner account
//
// See DELETION-BEHAVIOR.md for exactly what is deleted, anonymized, and
// retained for each associated table.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Two clients: one scoped to the CALLER's own JWT (to verify who
    // they really are via Supabase's own session validation, not a
    // client-supplied claim), and one with the service role (for the
    // actual privileged deletion). Never trust a role/id sent in the
    // request body — only what the validated session resolves to.
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerAuth, error: callerAuthError } = await callerClient.auth.getUser();
    if (callerAuthError || !callerAuth?.user) {
      return jsonResponse({ ok: false, error: "You need to be signed in to do that." }, 401);
    }
    const callerId = callerAuth.user.id;

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();
    if (callerProfileError || !callerProfile || callerProfile.role !== "owner") {
      // Deliberately generic — never confirms/denies role details to a
      // non-Owner caller beyond "not allowed."
      return jsonResponse({ ok: false, error: "Only the Owner can permanently delete a user." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = (body?.userId || "").toString();
    if (!targetUserId) {
      return jsonResponse({ ok: false, error: "Missing user ID." }, 400);
    }

    if (targetUserId === callerId) {
      return jsonResponse({ ok: false, error: "You cannot delete the account you are currently using." }, 400);
    }

    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("id, role, suspended, deactivated, banned")
      .eq("id", targetUserId)
      .single();
    if (targetError || !targetProfile) {
      return jsonResponse({ ok: false, error: "That user could not be found." }, 404);
    }

    if (targetProfile.role === "owner") {
      // "Active" here mirrors the same fields the Users tab already
      // treats as active/inactive elsewhere in the dashboard — not a new
      // definition invented for this check.
      const { count, error: countError } = await adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "owner")
        .eq("suspended", false)
        .eq("deactivated", false)
        .eq("banned", false);
      if (countError) {
        console.error("delete-user: final-owner count check failed", countError);
        return jsonResponse({ ok: false, error: "Could not verify Owner safety — try again." }, 500);
      }
      const targetIsActive = !targetProfile.suspended && !targetProfile.deactivated && !targetProfile.banned;
      if (targetIsActive && (count ?? 0) <= 1) {
        return jsonResponse(
          { ok: false, error: "The final remaining active Owner account cannot be deleted." },
          400
        );
      }
    }

    // ---- Associated data: anonymize what's meant to preserve aggregate
    // history, delete what's strictly user-owned. See
    // DELETION-BEHAVIOR.md for the full table-by-table breakdown this
    // implements. Each step is best-effort and logged, not fatal to the
    // overall deletion — an orphaned secondary row is a lesser failure
    // than silently leaving the Auth account (and login access) intact.
    const cleanupErrors: string[] = [];

    // User-owned, deleted outright: their own progress/log rows,
    // mentor profile (if any), volunteer entries, own mentor
    // application(s), own live sessions as a mentor.
    const deleteTables: [string, string][] = [
      ["learner_state", "user_id"],
      ["volunteer_entries", "user_id"],
      ["mentor_profiles", "user_id"],
      ["mentor_applications", "user_id"],
      ["live_sessions", "mentor_id"],
    ];
    for (const [table, column] of deleteTables) {
      const { error } = await adminClient.from(table).delete().eq(column, targetUserId);
      if (error) cleanupErrors.push(`${table}: ${error.message}`);
    }

    // Community content: anonymize authorship rather than delete outright
    // — a post/reply is shared conversation content other users may have
    // replied to; deleting it out from under that conversation would
    // orphan replies. Anonymize the author reference instead of removing
    // the content, per spec ("anonymize instead of retaining personally
    // identifying information" for preserved aggregate/shared content).
    //
    // V20 fix: this table/column list previously used `community_posts.
    // user_id` and `moderation_log.target_user_id` — neither column
    // exists on the live schema (the real columns are `author_id` and
    // `actor_id`), so this whole step was silently failing the
    // `.includes("does not exist")` check and treating it as "this
    // table isn't provisioned yet," when the table WAS provisioned and
    // the anonymization simply never ran. Two concrete, confirmed
    // consequences on the live project:
    //  1. `community_posts.author_id` has `ON DELETE CASCADE` to
    //     auth.users — with the anonymize step silently failing, the
    //     subsequent `auth.admin.deleteUser()` call below would cascade
    //     -DELETE the user's posts/replies outright (and, transitively,
    //     any replies to them via `parent_id`'s own cascade), the exact
    //     opposite of the documented "anonymize, don't delete shared
    //     conversation content" policy.
    //  2. `moderation_log.actor_id`, `mentor_applications.reviewed_by`,
    //     `mentor_application_status_history.reviewer_id`, and
    //     `volunteer_entries.verified_by` are all `ON DELETE NO ACTION`
    //     (RESTRICT-like) — deleting any Administrator/Owner who had
    //     ever moderated a post, reviewed a mentor application, or
    //     verified a volunteer entry would make `auth.admin.deleteUser()`
    //     fail outright with an unhandled FK-violation, surfaced to the
    //     Owner as a generic "Could not delete the account" 500.
    // Every row below must be anonymized BEFORE the Auth delete call so
    // neither failure mode above can happen.
    const anonymizeTables: [string, string][] = [
      ["community_posts", "author_id"],
      ["community_reports", "reporter_id"],
      ["moderation_log", "actor_id"],
      ["mentor_applications", "reviewed_by"],
      ["mentor_application_status_history", "reviewer_id"],
      ["volunteer_entries", "verified_by"],
      ["featured_picks", "mentor_user_id"],
      // Same "shared conversation, don't orphan other people's replies"
      // reasoning as community_posts — playbook Q&A also cascades on
      // author_id today; anonymizing first preserves the thread.
      ["playbook_questions", "author_id"],
      ["playbook_question_replies", "author_id"],
    ];
    for (const [table, column] of anonymizeTables) {
      const { error } = await adminClient.from(table).update({ [column]: null }).eq(column, targetUserId);
      // Missing table/column on a given project is not fatal — some of
      // these stores are still per-browser/localStorage-only per
      // CLAUDE.md and may not exist as real tables yet.
      if (error && !error.message.includes("does not exist")) cleanupErrors.push(`${table}: ${error.message}`);
    }

    // Finally, delete the profiles row, then the real Auth account —
    // this is the actual login-blocking, irreversible step.
    await adminClient.from("profiles").delete().eq("id", targetUserId);

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (authDeleteError) {
      console.error("delete-user: auth.admin.deleteUser failed", authDeleteError);
      return jsonResponse({ ok: false, error: "Could not delete the account — please try again." }, 500);
    }

    if (cleanupErrors.length) {
      console.error("delete-user: partial cleanup errors (account deletion still succeeded)", cleanupErrors);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("delete-user: unhandled error", err);
    return jsonResponse({ ok: false, error: "Something went wrong — please try again." }, 500);
  }
});
