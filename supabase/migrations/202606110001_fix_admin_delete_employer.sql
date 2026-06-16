-- Recreate the employer-delete RPC with the full cascade used by the admin UI.
-- This is the fix for live Supabase projects that still have the older
-- "auth.users only" version of the function.

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

  select array_agg(id)
  into app_ids
  from public.job_applications
  where employer_user_id = target_user_id;

  if app_ids is not null then
    delete from public.application_status_logs
    where application_id = any(app_ids);
  end if;

  -- Legacy/live-schema cleanup: remove stale wallet rows before the employer is deleted.
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wallets') then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'wallets' and column_name = 'employer_user_id') then
      delete from public.wallets where employer_user_id = target_user_id;
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wallet_transactions') then
    delete from public.wallet_transactions where employer_user_id = target_user_id;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'employer_wallets') then
    delete from public.employer_wallets where employer_user_id = target_user_id;
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
