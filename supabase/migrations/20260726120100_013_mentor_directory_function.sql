-- ============================================================
-- 013: community.html's public Mentor directory needs name + avatar
-- (profiles) joined with tagline/bio/expertise (mentor_profiles) for
-- every approved Mentor/Admin/Owner. Now that profiles SELECT is
-- restricted to "own row or admin" (migration 012), a plain join query
-- from a regular Explorer would return nothing for other users' names.
-- A narrow security definer function exposes only the safe, already-
-- public-by-design fields — never email, warnings, suspension status,
-- or anything else from profiles.
-- ============================================================
create or replace function public.get_mentor_directory()
returns table (
  user_id uuid,
  name text,
  avatar_url text,
  role public.wrld_role,
  tagline text,
  bio text,
  expertise jsonb
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.name, p.avatar_url, p.role,
         mp.tagline, mp.bio, mp.expertise
  from public.profiles p
  left join public.mentor_profiles mp on mp.user_id = p.id
  where p.role in ('mentor','admin','owner')
    and p.deactivated = false and p.banned = false;
$$;

revoke all on function public.get_mentor_directory() from public;
grant execute on function public.get_mentor_directory() to authenticated;
