-- V20.2: deprecate public.delete_mentor_application(uuid)
--
-- Root cause of the reported "Direct deletion from storage tables is not
-- allowed. Use the Storage API instead." error: this function's previous
-- body (from migration 037) ran
--   delete from storage.objects where bucket_id = 'mentor-applications' and name = ...
-- directly in SQL. Supabase does not permit direct DELETEs against
-- storage.objects — doing so does not remove the underlying file from
-- the object store even when it's allowed, and here it isn't allowed at
-- all, so every call to this function failed as soon as an application
-- had an attached file.
--
-- Mentor-application deletion is now handled entirely by the
-- `delete-mentor-application` Edge Function (see
-- supabase/functions/delete-mentor-application/index.ts), which uses
-- the real Supabase Storage API (`storage.from(bucket).remove(paths)`)
-- to remove attachments before deleting the application row, all under
-- service-role credentials after verifying the caller is an active
-- Owner. This RPC is kept in place (rather than dropped) purely as a
-- safety net — if anything still calls it directly, it now fails fast
-- with a clear, actionable message instead of silently doing a partial,
-- storage-policy-rejected deletion.
create or replace function public.delete_mentor_application(p_application_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  raise exception 'Mentor application deletion must go through the delete-mentor-application Edge Function. It uses the Supabase Storage API to remove attachments before deleting the record — direct SQL deletion of storage.objects is not permitted and this RPC can no longer perform it.';
end;
$function$;
