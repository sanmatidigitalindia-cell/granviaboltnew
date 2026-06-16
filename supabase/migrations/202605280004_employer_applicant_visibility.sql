-- Allow employers to read guard_profiles for guards who applied to their job postings.
-- Needed so employer views (applicants, interviews, attendance, etc.) can show guard names.
create policy "guard_profiles_employer_applicant_read" on public.guard_profiles
for select using (
  user_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1 from public.job_applications ja
    where ja.guard_user_id = guard_profiles.user_id
      and ja.employer_user_id = auth.uid()
  )
);
