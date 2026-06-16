-- Full cascade delete for employer — single SECURITY DEFINER function.
-- Bypasses RLS on all tables so client-side RLS blocking is irrelevant.
-- Deletes every related row then removes the auth.users entry.

create or replace function public.admin_delete_employer(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  app_ids uuid[];
begin
  if public.get_my_claim_role() <> 'super_admin' then
    raise exception 'Only super admins can delete employers.';
  end if;

  if not exists (
    select 1 from public.profiles where id = target_user_id and role = 'employer'
  ) then
    raise exception 'Employer not found.';
  end if;

  -- collect application ids for child cleanup
  select array_agg(id) into app_ids
  from public.job_applications where employer_user_id = target_user_id;

  if app_ids is not null then
    delete from public.application_status_logs where application_id = any(app_ids);
  end if;

  delete from public.interview_requests             where employer_user_id = target_user_id;
  delete from public.job_offers                     where employer_user_id = target_user_id;
  delete from public.agreements                     where employer_user_id = target_user_id;
  delete from public.attendance_records             where employer_user_id = target_user_id;
  delete from public.job_applications               where employer_user_id = target_user_id;
  delete from public.company_documents              where employer_user_id = target_user_id;
  delete from public.company_sites                  where employer_user_id = target_user_id;
  delete from public.job_posts                      where employer_user_id = target_user_id;
  delete from public.employer_aadhaar_verifications where employer_user_id = target_user_id;
  delete from public.payments                       where employer_user_id = target_user_id;
  delete from public.invoices                       where employer_user_id = target_user_id;
  delete from public.employer_companies             where employer_user_id = target_user_id;
  delete from public.employer_profiles              where user_id          = target_user_id;
  delete from public.profiles                       where id               = target_user_id;
  delete from auth.users                            where id               = target_user_id;
end;
$$;
