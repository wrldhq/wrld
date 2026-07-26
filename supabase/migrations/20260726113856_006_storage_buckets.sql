-- ============================================================
-- 006: Storage — replaces the "file metadata only, no real bytes" era.
-- Three buckets:
--   avatars              public read, owner-write   (profile photos)
--   mentor-applications   private                    (resume uploads)
--   volunteer-proof       private                    (volunteer proof files)
-- Path convention for the two private buckets: <user_id>/<filename>, so
-- the RLS policy can check the first path segment against auth.uid().
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('mentor-applications', 'mentor-applications', false),
  ('volunteer-proof', 'volunteer-proof', false)
on conflict (id) do nothing;

-- avatars: served by public URL directly (bucket is public:true), so no
-- SELECT policy is added here — see 007 for why a broad one was removed.
create policy "avatars_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- mentor-applications: private — owner + Administrator/Owner only.
create policy "mentor_uploads_owner_or_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'mentor-applications' and ((storage.foldername(name))[1] = auth.uid()::text or public.role_at_least('administrator')));

create policy "mentor_uploads_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mentor-applications' and (storage.foldername(name))[1] = auth.uid()::text);

-- volunteer-proof: private — owner + Administrator/Owner only.
create policy "volunteer_proof_owner_or_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'volunteer-proof' and ((storage.foldername(name))[1] = auth.uid()::text or public.role_at_least('administrator')));

create policy "volunteer_proof_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'volunteer-proof' and (storage.foldername(name))[1] = auth.uid()::text);
