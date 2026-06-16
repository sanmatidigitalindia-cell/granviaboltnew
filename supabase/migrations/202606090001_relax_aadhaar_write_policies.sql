-- Relax write policies: remove is_employer_aadhaar_verified() requirement.
-- Uses inline admin check since is_super_admin() may not exist on all environments.

drop policy if exists "company_sites_write_verified_employer_or_admin" on public.company_sites;
drop policy if exists "job_posts_write_verified_employer_or_admin" on public.job_posts;
drop policy if exists "employer_companies_insert_policy" on public.employer_companies;

create policy "company_sites_write_verified_employer_or_admin" on public.company_sites
for all using (
  employer_user_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
)
with check (
  employer_user_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);

create policy "job_posts_write_verified_employer_or_admin" on public.job_posts
for all using (
  employer_user_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
)
with check (
  employer_user_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);

create policy "employer_companies_insert_policy" on public.employer_companies
for insert with check (
  employer_user_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);
