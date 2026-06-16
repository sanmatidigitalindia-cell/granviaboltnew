-- Remove the legacy wallet system and related tables from the live database.
-- This avoids stale wallet constraints/references during employer deletion.

-- Drop any wallet-related policies that may still exist.
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wallets') then
    execute 'drop policy if exists wallets_own_or_admin on public.wallets';
  end if;

  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wallet_transactions') then
    execute 'drop policy if exists wallet_transactions_own_or_admin on public.wallet_transactions';
  end if;

  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'employer_wallets') then
    execute 'drop policy if exists wallets_own_or_admin on public.employer_wallets';
  end if;
end $$;

-- Drop wallet tables and dependent objects.
drop table if exists public.wallet_transactions cascade;
drop table if exists public.employer_wallets cascade;
drop table if exists public.wallets cascade;

-- Remove any orphaned wallet references from the delete function path by recreating
-- the employer-delete RPC without wallet table interactions.
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
