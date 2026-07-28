// supabase/functions/delete-mentor-application/index.ts
//
// Permanent mentor-application deletion — Owner-only. Removes the
// application's attachments (resume, certifications) from Supabase
// Storage and then deletes the application row itself.
//
// V20.2 root-cause fix: the previous implementation was a Postgres RPC
// (public.delete_mentor_application) that ran `delete from
// storage.objects where bucket_id = 'mentor-applications' and name =
// ...` directly in SQL. Supabase does not permit direct DELETEs against
// storage.objects — the actual file in the underlying object store is
// never removed that way, and Supabase's own policies reject the
// statement outright with "Direct deletion from storage tables is not
// allowed. Use the Storage API instead." That RPC has been redefined
// (see migration 20260801100000_038_deprecate_direct_storage_delete.sql)
// to simply raise that same guidance if anything ever calls it again —
// deletion now happens here, using the real Storage API
// (`storage.from(bucket).remove(paths)`), which is the only supported
// way to delete an object's underlying file, not just its metadata row.
//
// Enforces, server-side (never trusting the client):
//  - the caller has a valid session
//  - the caller's real, database-recorded role is exactly 'owner'
//    (Administrators are not permitted to permanently delete a mentor
//    application — see CHANGES-V20.2.md for the reasoning)
//  - the application exists
//  - deleting an approved application's file record never touches the
//    applicant's auth account, profile, or Mentor role — those are
//    managed entirely separately (see delete-user / role changes)

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "mentor-applications";

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

    // Two clients, same pattern as delete-user: one scoped to the
    // CALLER's own JWT (to verify who they really are via Supabase's
    // own session validation, not a client-supplied claim), and one
    // with the service role (for the actual privileged Storage +
    // database operations).
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
      // non-Owner caller beyond "not allowed." Administrators are
      // intentionally not granted this — see the file header comment.
      return jsonResponse({ ok: false, error: "Only the Owner can permanently delete a mentor application." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const applicationId = (body?.applicationId || "").toString();
    if (!applicationId) {
      return jsonResponse({ ok: false, error: "Missing application ID." }, 400);
    }

    const { data: application, error: fetchError } = await adminClient
      .from("mentor_applications")
      .select("id, resume_file_path, certs_path")
      .eq("id", applicationId)
      .single();
    if (fetchError || !application) {
      return jsonResponse({ ok: false, error: "That application could not be found." }, 404);
    }

    // Collect only the attachment paths this specific application
    // actually has — never a bucket-wide or wildcard path, so a bug
    // here cannot remove another application's files.
    const filePaths = [application.resume_file_path, application.certs_path].filter(
      (p): p is string => typeof p === "string" && p.length > 0
    );

    if (filePaths.length) {
      const { data: removed, error: removeError } = await adminClient.storage.from(BUCKET).remove(filePaths);
      if (removeError) {
        // Storage cleanup failed — do not delete the application record.
        // The record stays visible and the Owner can retry, rather than
        // silently orphaning files or reporting a false success.
        console.error("delete-mentor-application: storage removal failed", removeError);
        return jsonResponse(
          { ok: false, error: "Could not remove the application's attached files — nothing was deleted. Try again." },
          500
        );
      }
      // The Storage API's remove() does not error for a path that no
      // longer exists (already-removed files) — it simply omits that
      // path from the returned list. That's treated as success here:
      // the end state (no file at that path) is what actually matters,
      // and it's already true.
      console.log(`delete-mentor-application: removed ${removed?.length ?? 0}/${filePaths.length} file(s) for application ${applicationId}`);
    }

    // Deleting the application record is deliberately separate from,
    // and has no effect on, the applicant's auth account, profile, or
    // role — an approved Mentor's account and Mentor Studio access are
    // completely untouched by this.
    const { error: deleteError } = await adminClient.from("mentor_applications").delete().eq("id", applicationId);
    if (deleteError) {
      console.error("delete-mentor-application: record delete failed", deleteError);
      return jsonResponse({ ok: false, error: "Files were removed, but the application record could not be deleted — try again." }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("delete-mentor-application: unhandled error", err);
    return jsonResponse({ ok: false, error: "Something went wrong — please try again." }, 500);
  }
});
