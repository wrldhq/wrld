-- ============================================================
-- 027: get_mentor_directory() previously listed EVERY Administrator and
-- the Owner publicly, regardless of whether they'd ever created a
-- mentor_profiles row — so simply promoting someone to Admin, or the
-- Owner just opening Mentor Studio to test it, would publicly display
-- them as an approved Mentor. Per the V14 multi-experience access model,
-- Owner/Admin access to Mentor Studio is an administrative *capability*,
-- not automatic public Mentor status. role='mentor' accounts (the only
-- role created via the real become-mentor.html application review) still
-- always show, since that IS their defining purpose; Admin/Owner now
-- only show if they've explicitly opted in by saving a real
-- mentor_profiles row (Mentor Studio's "Save Profile").
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
  where p.deactivated = false and p.banned = false
    and (
      p.role = 'mentor'
      or (p.role in ('admin','owner') and mp.user_id is not null)
    );
$$;
