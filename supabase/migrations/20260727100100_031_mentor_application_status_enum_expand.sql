-- ============================================================
-- 031: mentor_applications.status (application_status enum) only had
-- pending/approved/rejected — V14's mentor review workflow (section 14)
-- needs the fuller, more honest status set the Owner Dashboard now
-- exposes. Adding enum values must be its own migration/transaction —
-- Postgres won't let a newly-added enum value be used in the same
-- transaction that added it.
-- ============================================================
alter type public.application_status add value if not exists 'submitted';
alter type public.application_status add value if not exists 'under_review';
alter type public.application_status add value if not exists 'more_information_requested';
alter type public.application_status add value if not exists 'withdrawn';
