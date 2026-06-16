-- The live DB's job_applications.guard_id FK points to a stale pre-migration table.
-- Drop it and re-add it pointing to auth.users so guards can apply for jobs.

alter table public.job_applications
  drop constraint if exists job_applications_guard_id_fkey;

alter table public.job_applications
  add constraint job_applications_guard_id_fkey
  foreign key (guard_id) references auth.users(id) on delete cascade;
