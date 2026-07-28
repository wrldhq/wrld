-- V20.4: restrict Announcements-category posting to Mentor/Admin/Owner
--
-- Confirmed gap: the existing `posts_insert_own` RLS policy on
-- public.community_posts only checked `auth.uid() = author_id` — any
-- authenticated user, any role, any category, including 'announcements'.
-- The frontend (community.html) already hides the composer for
-- non-mentor+ users on the Announcements tab, but nothing stopped a
-- direct insert (e.g. via browser devtools calling createCommunityPost()
-- or a raw Supabase client call) from writing category='announcements'
-- as an Explorer. This tightens the INSERT policy itself so the rule is
-- enforced regardless of what the client does or doesn't show.
--
-- Additive and narrow: only the 'announcements' category gains a role
-- requirement. Every other category (introductions, celebrations,
-- general, accountability) keeps exactly the same author_id-only check
-- it already had — this does not touch SELECT/UPDATE/DELETE policies,
-- does not touch any other table, and does not affect any existing row
-- (RLS only governs new writes).
alter policy "posts_insert_own" on public.community_posts
  with check (
    (( select auth.uid() ) = author_id)
    and (
      category <> 'announcements'::post_category
      or role_at_least('mentor'::wrld_role)
    )
  );
