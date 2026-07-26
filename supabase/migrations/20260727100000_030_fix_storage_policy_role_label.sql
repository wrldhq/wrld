-- ============================================================
-- 030: migration 006's mentor-applications/volunteer-proof read policies
-- called `public.role_at_least('administrator')` — but the real
-- public.wrld_role enum only has 'explorer'/'mentor'/'admin'/'owner'
-- (see migration 010/011's explicit "admin, not administrator" fix,
-- already applied to every other role check in the codebase). Passing
-- 'administrator' to role_at_least(public.wrld_role) requires an
-- implicit text->enum cast that has no matching value, so evaluating
-- either policy raised a runtime error rather than simply denying
-- access — meaning Administrators/Owner could never actually read
-- another applicant's mentor-application or volunteer-proof file via
-- these policies. Found while wiring up real signed-URL access for the
-- Owner Dashboard's mentor application review (V14).
-- ============================================================
drop policy if exists "mentor_uploads_owner_or_admin_read" on storage.objects;
create policy "mentor_uploads_owner_or_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'mentor-applications' and ((storage.foldername(name))[1] = auth.uid()::text or coalesce(public.role_at_least('admin'::public.wrld_role), false)));

drop policy if exists "volunteer_proof_owner_or_admin_read" on storage.objects;
create policy "volunteer_proof_owner_or_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'volunteer-proof' and ((storage.foldername(name))[1] = auth.uid()::text or coalesce(public.role_at_least('admin'::public.wrld_role), false)));
