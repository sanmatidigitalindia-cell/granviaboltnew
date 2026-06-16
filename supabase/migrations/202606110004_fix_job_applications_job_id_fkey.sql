-- The live DB's job_applications table predates these migrations and has a
-- job_id FK constraint pointing to a different table (not job_posts).
-- Drop it and re-add it correctly so guards can apply for jobs.

alter table public.job_applications
  drop constraint if exists job_applications_job_id_fkey;

alter table public.job_applications
  add constraint job_applications_job_id_fkey
  foreign key (job_id) references public.job_posts(id) on delete cascade;
