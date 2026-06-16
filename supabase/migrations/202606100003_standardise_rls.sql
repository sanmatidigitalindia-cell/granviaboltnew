-- ============================================================
-- STANDARDISED RLS — single source of truth
-- Safe to re-run. Skips tables that don't exist in live DB.
-- ============================================================
-- Pattern used everywhere:
--   get_my_claim_role() = 'super_admin'  → full access
--   owner column = auth.uid()            → own rows only
-- ============================================================

-- ── Helper function (no recursion, security definer) ─────────
create or replace function public.get_my_claim_role()
returns text language sql security definer stable set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

-- ── Drop ALL existing public policies then recreate cleanly ──
do $$
declare r record;
begin
  for r in select policyname, tablename
           from pg_policies
           where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Drop storage policies by known names
do $$
declare pol text;
begin
  foreach pol in array array[
    'storage_select','storage_insert','storage_update','storage_delete',
    'storage_read_own_or_admin','storage_write_own_folder',
    'storage_update_own_or_admin','storage_delete_own_or_admin'
  ] loop
    execute format('drop policy if exists %I on storage.objects', pol);
  end loop;
end $$;

-- ── Macro: apply policy only if table exists ─────────────────
-- All policies are created inside DO blocks with existence checks.

do $$
begin

  -- ── profiles ──────────────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles') then
    execute $p$ create policy "profiles_all" on public.profiles for all
      using    (id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── roles ─────────────────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='roles') then
    execute $p$ create policy "roles_read" on public.roles for select using (true) $p$;
    execute $p$ create policy "roles_write_admin" on public.roles for all
      using    (get_my_claim_role() = 'super_admin')
      with check (get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── employer_profiles ─────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='employer_profiles') then
    execute $p$ create policy "employer_profiles_all" on public.employer_profiles for all
      using    (user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── employer_aadhaar_verifications ────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='employer_aadhaar_verifications') then
    execute $p$ create policy "aadhaar_verifications_all" on public.employer_aadhaar_verifications for all
      using    (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── employer_companies ────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='employer_companies') then
    execute $p$ create policy "employer_companies_all" on public.employer_companies for all
      using    (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── company_documents ─────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='company_documents') then
    execute $p$ create policy "company_documents_all" on public.company_documents for all
      using    (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── company_sites (guards need SELECT for job search) ─────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='company_sites') then
    execute $p$ create policy "company_sites_select" on public.company_sites for select using (true) $p$;
    execute $p$ create policy "company_sites_write" on public.company_sites for all
      using    (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── job_posts (guards need SELECT for active jobs) ────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='job_posts') then
    execute $p$ create policy "job_posts_select" on public.job_posts for select
      using (status = 'active' or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
    execute $p$ create policy "job_posts_write" on public.job_posts for all
      using    (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── guard_profiles ────────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='guard_profiles') then
    execute $p$ create policy "guard_profiles_own_or_admin" on public.guard_profiles for all
      using    (user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
    execute $p$ create policy "guard_profiles_employer_read" on public.guard_profiles for select
      using (exists (
        select 1 from public.job_applications ja
        where ja.guard_user_id = guard_profiles.user_id and ja.employer_user_id = auth.uid()
      )) $p$;
  end if;

  -- ── job_applications ──────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='job_applications') then
    execute $p$ create policy "job_applications_all" on public.job_applications for all
      using    (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── application_status_logs ───────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='application_status_logs') then
    execute $p$ create policy "application_logs_all" on public.application_status_logs for all
      using (get_my_claim_role() = 'super_admin' or exists (
        select 1 from public.job_applications a
        where a.id = application_id and (a.guard_user_id = auth.uid() or a.employer_user_id = auth.uid())
      ))
      with check (get_my_claim_role() = 'super_admin' or exists (
        select 1 from public.job_applications a
        where a.id = application_id and (a.guard_user_id = auth.uid() or a.employer_user_id = auth.uid())
      )) $p$;
  end if;

  -- ── interview_requests ────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='interview_requests') then
    execute $p$ create policy "interview_requests_all" on public.interview_requests for all
      using    (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── job_offers ────────────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='job_offers') then
    execute $p$ create policy "job_offers_all" on public.job_offers for all
      using    (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── agreements ────────────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='agreements') then
    execute $p$ create policy "agreements_all" on public.agreements for all
      using    (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── attendance_records ────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='attendance_records') then
    execute $p$ create policy "attendance_all" on public.attendance_records for all
      using    (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── employer_wallets ──────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='employer_wallets') then
    execute $p$ create policy "employer_wallets_all" on public.employer_wallets for all
      using    (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── wallet_transactions ───────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='wallet_transactions') then
    execute $p$ create policy "wallet_transactions_all" on public.wallet_transactions for all
      using    (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── payments ──────────────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='payments') then
    execute $p$ create policy "payments_all" on public.payments for all
      using    (employer_user_id = auth.uid() or guard_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or guard_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── invoices ──────────────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='invoices') then
    execute $p$ create policy "invoices_all" on public.invoices for all
      using    (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (employer_user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── notifications ─────────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='notifications') then
    execute $p$ create policy "notifications_all" on public.notifications for all
      using    (user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── support_tickets ───────────────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='support_tickets') then
    execute $p$ create policy "support_tickets_all" on public.support_tickets for all
      using    (user_id = auth.uid() or get_my_claim_role() = 'super_admin')
      with check (user_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

  -- ── support_ticket_messages ───────────────────────────────
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='support_ticket_messages') then
    execute $p$ create policy "support_messages_all" on public.support_ticket_messages for all
      using (sender_id = auth.uid() or get_my_claim_role() = 'super_admin' or exists (
        select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()
      ))
      with check (sender_id = auth.uid() or get_my_claim_role() = 'super_admin') $p$;
  end if;

end $$;

-- ── storage.objects ───────────────────────────────────────────
create policy "storage_select" on storage.objects
  for select using (
    get_my_claim_role() = 'super_admin'
    or bucket_id in ('company-logos', 'profile-images')
    or owner = auth.uid()
  );
create policy "storage_insert" on storage.objects
  for insert with check (owner = auth.uid() or get_my_claim_role() = 'super_admin');
create policy "storage_update" on storage.objects
  for update
  using    (owner = auth.uid() or get_my_claim_role() = 'super_admin')
  with check (owner = auth.uid() or get_my_claim_role() = 'super_admin');
create policy "storage_delete" on storage.objects
  for delete using (owner = auth.uid() or get_my_claim_role() = 'super_admin');
