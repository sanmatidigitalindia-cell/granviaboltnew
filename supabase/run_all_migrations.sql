-- ================================================================
-- Reconciliation migration: adapts the live DB schema to match
-- what the Granvia app services expect.
-- Safe to re-run: uses IF NOT EXISTS / DO-block guards throughout.
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. profiles  (table exists, some columns are named differently)
-- ────────────────────────────────────────────────────────────────
-- App uses `mobile`; live DB only has `phone`. Add both.
alter table public.profiles add column if not exists mobile text;
alter table public.profiles add column if not exists email_verified boolean not null default false;

-- ────────────────────────────────────────────────────────────────
-- 2. company_sites  (table exists but column names differ)
--    Live DB: name, contact_name, contact_phone
--    App expects: site_name, site_type, city, state, pincode,
--                 contact_person, contact_mobile, shift_details, notes,
--                 employer_user_id
-- ────────────────────────────────────────────────────────────────
alter table public.company_sites add column if not exists site_name text;
alter table public.company_sites add column if not exists site_type text;
alter table public.company_sites add column if not exists city text;
alter table public.company_sites add column if not exists state text;
alter table public.company_sites add column if not exists pincode text;
alter table public.company_sites add column if not exists contact_person text;
alter table public.company_sites add column if not exists contact_mobile text;
alter table public.company_sites add column if not exists shift_details text;
alter table public.company_sites add column if not exists notes text;
alter table public.company_sites add column if not exists employer_user_id uuid references auth.users(id) on delete cascade;

-- Back-fill site_name from the existing `name` column where blank
update public.company_sites set site_name = name where site_name is null and name is not null;

-- ────────────────────────────────────────────────────────────────
-- 3. job_applications  (table exists but columns unknown — add what app needs)
-- ────────────────────────────────────────────────────────────────
alter table public.job_applications add column if not exists job_id uuid;
alter table public.job_applications add column if not exists guard_user_id uuid;
alter table public.job_applications add column if not exists employer_user_id uuid;
alter table public.job_applications add column if not exists company_id uuid;
alter table public.job_applications add column if not exists site_id uuid;
alter table public.job_applications add column if not exists status text not null default 'pending';
alter table public.job_applications add column if not exists applied_at timestamptz not null default now();
alter table public.job_applications add column if not exists updated_at timestamptz not null default now();
alter table public.job_applications add column if not exists notes text;

-- ────────────────────────────────────────────────────────────────
-- 4. payments  (table exists, add expected columns)
-- ────────────────────────────────────────────────────────────────
alter table public.payments add column if not exists guard_user_id uuid;
alter table public.payments add column if not exists employer_user_id uuid;
alter table public.payments add column if not exists company_id uuid;
alter table public.payments add column if not exists job_id uuid;
alter table public.payments add column if not exists application_id uuid;
alter table public.payments add column if not exists amount numeric(12,2) not null default 0;
alter table public.payments add column if not exists payment_method text;
alter table public.payments add column if not exists payment_status text not null default 'pending';
alter table public.payments add column if not exists payment_date timestamptz;
alter table public.payments add column if not exists created_at timestamptz not null default now();
alter table public.payments add column if not exists updated_at timestamptz not null default now();

-- ────────────────────────────────────────────────────────────────
-- 5. wallet_transactions  (table exists, add expected columns)
-- ────────────────────────────────────────────────────────────────
alter table public.wallet_transactions add column if not exists wallet_id uuid;
alter table public.wallet_transactions add column if not exists employer_user_id uuid;
alter table public.wallet_transactions add column if not exists transaction_type text not null default 'credit';
alter table public.wallet_transactions add column if not exists amount numeric(12,2) not null default 0;
alter table public.wallet_transactions add column if not exists purpose text;
alter table public.wallet_transactions add column if not exists status text not null default 'completed';
alter table public.wallet_transactions add column if not exists created_at timestamptz not null default now();

-- ────────────────────────────────────────────────────────────────
-- 6. agreements  (table exists, add expected columns)
-- ────────────────────────────────────────────────────────────────
alter table public.agreements add column if not exists offer_id uuid;
alter table public.agreements add column if not exists job_id uuid;
alter table public.agreements add column if not exists guard_user_id uuid;
alter table public.agreements add column if not exists employer_user_id uuid;
alter table public.agreements add column if not exists company_id uuid;
alter table public.agreements add column if not exists site_id uuid;
alter table public.agreements add column if not exists terms jsonb;
alter table public.agreements add column if not exists employer_confirmation_status text not null default 'pending';
alter table public.agreements add column if not exists guard_confirmation_status text not null default 'pending';
alter table public.agreements add column if not exists platform_confirmation_status text not null default 'pending';
alter table public.agreements add column if not exists status text not null default 'pending';
alter table public.agreements add column if not exists created_at timestamptz not null default now();
alter table public.agreements add column if not exists updated_at timestamptz not null default now();

-- ────────────────────────────────────────────────────────────────
-- 7. notifications  (table exists, add expected columns)
-- ────────────────────────────────────────────────────────────────
alter table public.notifications add column if not exists user_id uuid;
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists type text not null default 'info';
alter table public.notifications add column if not exists is_read boolean not null default false;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

-- ────────────────────────────────────────────────────────────────
-- 8. support_tickets  (table exists, add expected columns)
-- ────────────────────────────────────────────────────────────────
alter table public.support_tickets add column if not exists user_id uuid;
alter table public.support_tickets add column if not exists subject text;
alter table public.support_tickets add column if not exists description text;
alter table public.support_tickets add column if not exists status text not null default 'open';
alter table public.support_tickets add column if not exists priority text not null default 'medium';
alter table public.support_tickets add column if not exists created_at timestamptz not null default now();
alter table public.support_tickets add column if not exists updated_at timestamptz not null default now();

-- ────────────────────────────────────────────────────────────────
-- 9. employer_profiles  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  contact_person_name text,
  designation text,
  city text,
  state text,
  pincode text,
  is_aadhaar_verified boolean not null default false,
  aadhaar_verification_status text not null default 'pending',
  aadhaar_verified_at timestamptz,
  aadhaar_last_four text,
  profile_status text not null default 'incomplete',
  verification_status text not null default 'pending',
  admin_remarks text,
  rejection_reason text,
  created_from text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.employer_profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='employer_profiles' and policyname='employer_profiles_own_or_admin') then
    execute 'create policy employer_profiles_own_or_admin on public.employer_profiles for all using (user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 10. employer_aadhaar_verifications  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.employer_aadhaar_verifications (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  aadhaar_number_hash text,
  aadhaar_last_four text,
  verification_status text not null default 'pending',
  otp_sent_to text,
  otp_channel text not null default 'email',
  otp_expires_at timestamptz,
  otp_verified_at timestamptz,
  otp_attempts integer not null default 0,
  resend_count integer not null default 0,
  provider_name text not null default 'email_otp',
  verification_response jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.employer_aadhaar_verifications enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='employer_aadhaar_verifications' and policyname='aadhaar_own_or_admin') then
    execute 'create policy aadhaar_own_or_admin on public.employer_aadhaar_verifications for all using (employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 11. employer_companies  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.employer_companies (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  business_type text,
  registration_type text,
  gst_number text,
  pan_number text,
  company_email text,
  company_phone text,
  website text,
  logo_url text,
  description text,
  registered_address text,
  billing_address text,
  city text,
  state text,
  pincode text,
  verification_status text not null default 'pending',
  account_status text not null default 'active',
  admin_remarks text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.employer_companies enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='employer_companies' and policyname='employer_companies_own_or_admin') then
    execute 'create policy employer_companies_own_or_admin on public.employer_companies for all using (employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 12. company_documents  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  document_type text,
  file_path text not null,
  file_url text,
  file_size bigint,
  file_type text,
  verification_status text not null default 'pending',
  admin_remarks text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.company_documents enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='company_documents' and policyname='company_documents_own_or_admin') then
    execute 'create policy company_documents_own_or_admin on public.company_documents for all using (employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 13. job_posts  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.employer_companies(id) on delete set null,
  site_id uuid references public.company_sites(id) on delete set null,
  title text not null,
  category text,
  guard_type text,
  guards_required integer not null default 1,
  gender_preference text not null default 'Any',
  experience_required text,
  salary_amount numeric(12,2),
  payment_type text,
  duty_hours text,
  shift_type text,
  start_date date,
  end_date date,
  duration_type text,
  required_skills text[],
  language_requirements text[],
  police_verification_required boolean not null default false,
  uniform_required boolean not null default false,
  food_facility boolean not null default false,
  accommodation_facility boolean not null default false,
  description text,
  special_instructions text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.job_posts enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='job_posts' and policyname='job_posts_employer_or_admin') then
    execute 'create policy job_posts_employer_or_admin on public.job_posts for all using (employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
  if not exists (select 1 from pg_policies where tablename='job_posts' and policyname='job_posts_guard_read_active') then
    execute 'create policy job_posts_guard_read_active on public.job_posts for select using (status = ''active'')';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 14. attendance_records  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  guard_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.employer_companies(id) on delete set null,
  job_id uuid references public.job_posts(id) on delete set null,
  site_id uuid references public.company_sites(id) on delete set null,
  attendance_date date not null,
  in_time timestamptz,
  out_time timestamptz,
  total_hours numeric(5,2),
  status text not null default 'pending_verification',
  employer_remarks text,
  guard_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.attendance_records enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='attendance_records' and policyname='attendance_own_guard') then
    execute 'create policy attendance_own_guard on public.attendance_records for all using (guard_user_id = auth.uid() or employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 15. invoices  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.employer_companies(id) on delete set null,
  invoice_number text,
  amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  payment_status text not null default 'pending',
  invoice_date date not null default current_date,
  due_date date,
  paid_at timestamptz,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.invoices enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='invoices' and policyname='invoices_own_or_admin') then
    execute 'create policy invoices_own_or_admin on public.invoices for all using (employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 16. employer_wallets  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.employer_wallets (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric(12,2) not null default 0,
  currency text not null default 'INR',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.employer_wallets enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='employer_wallets' and policyname='wallets_own_or_admin') then
    execute 'create policy wallets_own_or_admin on public.employer_wallets for all using (employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 17. interview_requests  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.interview_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.job_applications(id) on delete cascade,
  job_id uuid references public.job_posts(id) on delete cascade,
  guard_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.employer_companies(id) on delete set null,
  request_type text not null default 'Phone Call',
  preferred_date date,
  preferred_time time,
  message text,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.interview_requests enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='interview_requests' and policyname='interview_requests_parties') then
    execute 'create policy interview_requests_parties on public.interview_requests for all using (guard_user_id = auth.uid() or employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 18. job_offers  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.job_applications(id) on delete cascade,
  job_id uuid references public.job_posts(id) on delete cascade,
  guard_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.employer_companies(id) on delete set null,
  site_id uuid references public.company_sites(id) on delete set null,
  offered_salary numeric(12,2),
  duty_hours text,
  shift_type text,
  start_date date,
  terms_summary text,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.job_offers enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='job_offers' and policyname='job_offers_parties') then
    execute 'create policy job_offers_parties on public.job_offers for all using (guard_user_id = auth.uid() or employer_user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 19. guard_profiles  (MISSING — create fresh)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.guard_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  mobile text,
  gender text,
  dob date,
  address text,
  city text,
  state text,
  pincode text,
  latitude numeric(10,6),
  longitude numeric(10,6),
  skills text[],
  languages text[],
  experience text,
  aadhaar_status text not null default 'pending',
  police_verification_status text not null default 'pending',
  verification_status text not null default 'pending',
  bank_account_number text,
  bank_ifsc text,
  bank_name text,
  account_holder_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.guard_profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='guard_profiles' and policyname='guard_profiles_own_or_admin') then
    execute 'create policy guard_profiles_own_or_admin on public.guard_profiles for all using (user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin''))';
  end if;
  if not exists (select 1 from pg_policies where tablename='guard_profiles' and policyname='guard_profiles_employer_applicant_read') then
    execute 'create policy guard_profiles_employer_applicant_read on public.guard_profiles for select using (user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = ''super_admin'') or exists (select 1 from public.job_applications ja where ja.guard_user_id = guard_profiles.user_id and ja.employer_user_id = auth.uid()))';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 20. Indexes on new tables
-- ────────────────────────────────────────────────────────────────
create index if not exists employer_profiles_user_id_idx on public.employer_profiles(user_id);
create index if not exists employer_companies_employer_idx on public.employer_companies(employer_user_id);
create index if not exists job_posts_employer_idx on public.job_posts(employer_user_id);
create index if not exists job_posts_company_idx on public.job_posts(company_id);
create index if not exists job_posts_status_idx on public.job_posts(status);
create index if not exists job_applications_job_idx on public.job_applications(job_id);
create index if not exists job_applications_guard_idx on public.job_applications(guard_user_id);
create index if not exists job_applications_employer_idx on public.job_applications(employer_user_id);
create index if not exists attendance_guard_idx on public.attendance_records(guard_user_id);
create index if not exists attendance_company_idx on public.attendance_records(company_id);
create index if not exists guard_profiles_user_id_idx on public.guard_profiles(user_id);
