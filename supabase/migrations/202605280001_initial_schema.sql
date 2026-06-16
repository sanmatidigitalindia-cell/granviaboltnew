create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'employer', 'guard', 'sub_admin')),
  full_name text,
  mobile text unique,
  email text,
  avatar_url text,
  account_status text not null default 'active',
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  contact_person_name text,
  city text,
  state text,
  pincode text,
  is_aadhaar_verified boolean not null default false,
  aadhaar_verification_status text not null default 'pending',
  aadhaar_verified_at timestamptz,
  aadhaar_last_four text,
  created_from text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employer_aadhaar_verifications (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  aadhaar_number_hash text,
  aadhaar_last_four text,
  verification_status text not null default 'pending',
  otp_hash text,
  otp_sent_to text,
  otp_channel text not null default 'email',
  otp_expires_at timestamptz,
  otp_verified_at timestamptz,
  otp_attempts integer not null default 0,
  resend_count integer not null default 0,
  provider_name text not null default 'email_otp',
  provider_reference_id text,
  verification_response jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  document_type text,
  file_path text not null,
  file_url text,
  verification_status text not null default 'pending',
  admin_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_sites (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  site_name text not null,
  site_type text,
  address text,
  city text,
  state text,
  pincode text,
  contact_person text,
  contact_mobile text,
  latitude numeric,
  longitude numeric,
  shift_details text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  site_id uuid not null references public.company_sites(id) on delete cascade,
  title text not null,
  category text,
  guard_type text,
  guards_required integer,
  gender_preference text,
  min_age integer,
  max_age integer,
  experience_required text,
  salary_amount numeric,
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
  latitude numeric,
  longitude numeric,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guard_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  mobile text,
  city text,
  state text,
  skills text[],
  languages text[],
  experience_years numeric,
  is_available boolean not null default true,
  latitude numeric,
  longitude numeric,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts(id) on delete cascade,
  guard_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  site_id uuid not null references public.company_sites(id) on delete cascade,
  status text not null default 'applied',
  expected_salary numeric,
  remarks text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, guard_user_id)
);

create table if not exists public.application_status_logs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  changed_by uuid references auth.users(id),
  old_status text,
  new_status text,
  remarks text,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.job_applications(id) on delete cascade,
  job_id uuid not null references public.job_posts(id) on delete cascade,
  guard_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  request_type text,
  preferred_date date,
  preferred_time time,
  message text,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.job_applications(id) on delete cascade,
  job_id uuid not null references public.job_posts(id) on delete cascade,
  guard_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  site_id uuid not null references public.company_sites(id) on delete cascade,
  offered_salary numeric,
  duty_hours text,
  shift_type text,
  start_date date,
  end_date date,
  terms_summary text,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.job_offers(id) on delete cascade,
  job_id uuid not null references public.job_posts(id) on delete cascade,
  guard_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  site_id uuid not null references public.company_sites(id) on delete cascade,
  terms jsonb,
  employer_confirmation_status text not null default 'pending',
  guard_confirmation_status text not null default 'pending',
  platform_confirmation_status text not null default 'pending',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts(id) on delete cascade,
  guard_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.employer_companies(id) on delete cascade,
  site_id uuid not null references public.company_sites(id) on delete cascade,
  attendance_date date,
  in_time timestamptz,
  out_time timestamptz,
  checkin_latitude numeric,
  checkin_longitude numeric,
  checkout_latitude numeric,
  checkout_longitude numeric,
  total_hours numeric,
  status text not null default 'pending_verification',
  employer_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employer_wallets (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric not null default 0,
  currency text not null default 'INR',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.employer_companies(id) on delete set null,
  transaction_type text,
  amount numeric,
  purpose text,
  reference_id uuid,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.employer_companies(id) on delete set null,
  job_id uuid references public.job_posts(id) on delete set null,
  guard_user_id uuid references auth.users(id) on delete set null,
  amount numeric,
  payment_method text,
  payment_status text not null default 'pending',
  provider_reference_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.employer_companies(id) on delete set null,
  job_id uuid references public.job_posts(id) on delete set null,
  invoice_number text unique,
  amount numeric,
  tax_amount numeric not null default 0,
  total_amount numeric,
  payment_status text not null default 'pending',
  invoice_date date not null default current_date,
  due_date date,
  pdf_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  message text,
  type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.employer_companies(id) on delete set null,
  subject text,
  category text,
  priority text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text,
  attachment_path text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_mobile_idx on public.profiles(mobile);
create index if not exists employer_profiles_user_id_idx on public.employer_profiles(user_id);
create index if not exists employer_companies_employer_idx on public.employer_companies(employer_user_id);
create index if not exists company_documents_company_idx on public.company_documents(company_id);
create index if not exists company_sites_company_idx on public.company_sites(company_id);
create index if not exists job_posts_company_idx on public.job_posts(company_id);
create index if not exists job_posts_status_idx on public.job_posts(status);
create index if not exists job_applications_job_idx on public.job_applications(job_id);
create index if not exists job_applications_guard_idx on public.job_applications(guard_user_id);
create index if not exists attendance_records_company_idx on public.attendance_records(company_id);
create index if not exists payments_company_idx on public.payments(company_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'employer_profiles',
    'employer_aadhaar_verifications',
    'employer_companies',
    'company_documents',
    'company_sites',
    'job_posts',
    'guard_profiles',
    'job_applications',
    'interview_requests',
    'job_offers',
    'agreements',
    'attendance_records',
    'employer_wallets',
    'payments',
    'support_tickets'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
      and account_status = 'active'
  );
$$;

create or replace function public.is_employer_aadhaar_verified()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.employer_profiles
    where user_id = auth.uid()
      and is_aadhaar_verified = true
      and aadhaar_verification_status = 'verified'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text;
begin
  selected_role := coalesce(new.raw_user_meta_data->>'role', 'guard');

  insert into public.profiles (id, role, full_name, mobile, email, email_verified)
  values (
    new.id,
    selected_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mobile',
    new.email,
    new.email_confirmed_at is not null
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  if selected_role = 'employer' then
    insert into public.employer_profiles (
      user_id,
      contact_person_name,
      city,
      state,
      pincode,
      created_from,
      created_by
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'contact_person_name', new.raw_user_meta_data->>'full_name'),
      new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'state',
      new.raw_user_meta_data->>'pincode',
      coalesce(new.raw_user_meta_data->>'created_from', 'app'),
      nullif(new.raw_user_meta_data->>'created_by', '')::uuid
    )
    on conflict (user_id) do nothing;

    insert into public.employer_wallets (employer_user_id)
    values (new.id)
    on conflict (employer_user_id) do nothing;

    if coalesce(new.raw_user_meta_data->>'company_name', '') <> '' then
      insert into public.employer_companies (
        employer_user_id,
        company_name,
        business_type,
        registered_address,
        billing_address,
        gst_number,
        pan_number,
        website,
        company_email,
        company_phone,
        city,
        state,
        pincode,
        verification_status,
        account_status
      )
      values (
        new.id,
        new.raw_user_meta_data->>'company_name',
        new.raw_user_meta_data->>'business_type',
        new.raw_user_meta_data->>'company_address',
        new.raw_user_meta_data->>'company_address',
        new.raw_user_meta_data->>'gst_number',
        new.raw_user_meta_data->>'pan_number',
        new.raw_user_meta_data->>'website',
        new.email,
        new.raw_user_meta_data->>'mobile',
        new.raw_user_meta_data->>'city',
        new.raw_user_meta_data->>'state',
        new.raw_user_meta_data->>'pincode',
        'pending',
        'active'
      );
    end if;
  end if;

  if selected_role = 'guard' then
    insert into public.guard_profiles (user_id, full_name, mobile, city, state)
    values (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'mobile',
      new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'state'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email_verified = new.email_confirmed_at is not null,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
after update of email_confirmed_at on auth.users
for each row execute function public.sync_email_verified();

create or replace function public.log_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.application_status_logs (application_id, changed_by, old_status, new_status, remarks)
    values (new.id, auth.uid(), old.status, new.status, new.remarks);
  end if;
  return new;
end;
$$;

drop trigger if exists job_application_status_change on public.job_applications;
create trigger job_application_status_change
after update of status on public.job_applications
for each row execute function public.log_application_status_change();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'employer_profiles',
    'employer_aadhaar_verifications',
    'employer_companies',
    'company_documents',
    'company_sites',
    'job_posts',
    'guard_profiles',
    'job_applications',
    'application_status_logs',
    'interview_requests',
    'job_offers',
    'agreements',
    'attendance_records',
    'employer_wallets',
    'wallet_transactions',
    'payments',
    'invoices',
    'notifications',
    'support_tickets',
    'support_ticket_messages'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy "profiles_select_own_or_admin" on public.profiles
for select using (id = auth.uid() or public.is_super_admin());
create policy "profiles_insert_own_or_admin" on public.profiles
for insert with check (id = auth.uid() or public.is_super_admin());
create policy "profiles_update_own_or_admin" on public.profiles
for update using (id = auth.uid() or public.is_super_admin())
with check (id = auth.uid() or public.is_super_admin());

create policy "employer_profiles_own_or_admin" on public.employer_profiles
for all using (user_id = auth.uid() or public.is_super_admin())
with check (user_id = auth.uid() or public.is_super_admin());

create policy "aadhaar_verifications_own_or_admin" on public.employer_aadhaar_verifications
for all using (employer_user_id = auth.uid() or public.is_super_admin())
with check (employer_user_id = auth.uid() or public.is_super_admin());

create policy "companies_select_own_or_admin" on public.employer_companies
for select using (employer_user_id = auth.uid() or public.is_super_admin());
create policy "companies_insert_verified_employer_or_admin" on public.employer_companies
for insert with check ((employer_user_id = auth.uid() and public.is_employer_aadhaar_verified()) or public.is_super_admin());
create policy "companies_update_own_or_admin" on public.employer_companies
for update using (employer_user_id = auth.uid() or public.is_super_admin())
with check (employer_user_id = auth.uid() or public.is_super_admin());

create policy "company_documents_own_or_admin" on public.company_documents
for all using (employer_user_id = auth.uid() or public.is_super_admin())
with check (employer_user_id = auth.uid() or public.is_super_admin());

create policy "company_sites_select_own_or_admin" on public.company_sites
for select using (employer_user_id = auth.uid() or public.is_super_admin());
create policy "company_sites_write_verified_employer_or_admin" on public.company_sites
for all using (employer_user_id = auth.uid() or public.is_super_admin())
with check ((employer_user_id = auth.uid() and public.is_employer_aadhaar_verified()) or public.is_super_admin());

create policy "job_posts_guard_active_select" on public.job_posts
for select using (
  status = 'active'
  or employer_user_id = auth.uid()
  or public.is_super_admin()
);
create policy "job_posts_write_verified_employer_or_admin" on public.job_posts
for all using (employer_user_id = auth.uid() or public.is_super_admin())
with check ((employer_user_id = auth.uid() and public.is_employer_aadhaar_verified()) or public.is_super_admin());

create policy "guard_profiles_own_or_admin" on public.guard_profiles
for all using (user_id = auth.uid() or public.is_super_admin())
with check (user_id = auth.uid() or public.is_super_admin());

create policy "applications_visibility" on public.job_applications
for select using (
  guard_user_id = auth.uid()
  or employer_user_id = auth.uid()
  or public.is_super_admin()
);
create policy "applications_insert_guard_self" on public.job_applications
for insert with check (guard_user_id = auth.uid());
create policy "applications_update_owner_or_admin" on public.job_applications
for update using (employer_user_id = auth.uid() or guard_user_id = auth.uid() or public.is_super_admin())
with check (employer_user_id = auth.uid() or guard_user_id = auth.uid() or public.is_super_admin());

create policy "application_logs_related_or_admin" on public.application_status_logs
for select using (
  public.is_super_admin()
  or exists (
    select 1 from public.job_applications a
    where a.id = application_id
      and (a.guard_user_id = auth.uid() or a.employer_user_id = auth.uid())
  )
);

create policy "interview_requests_related_or_admin" on public.interview_requests
for all using (guard_user_id = auth.uid() or employer_user_id = auth.uid() or public.is_super_admin())
with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or public.is_super_admin());

create policy "job_offers_related_or_admin" on public.job_offers
for all using (guard_user_id = auth.uid() or employer_user_id = auth.uid() or public.is_super_admin())
with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or public.is_super_admin());

create policy "agreements_related_or_admin" on public.agreements
for all using (guard_user_id = auth.uid() or employer_user_id = auth.uid() or public.is_super_admin())
with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or public.is_super_admin());

create policy "attendance_related_or_admin" on public.attendance_records
for all using (guard_user_id = auth.uid() or employer_user_id = auth.uid() or public.is_super_admin())
with check (guard_user_id = auth.uid() or employer_user_id = auth.uid() or public.is_super_admin());

create policy "wallets_own_or_admin" on public.employer_wallets
for select using (employer_user_id = auth.uid() or public.is_super_admin());
create policy "wallet_transactions_own_or_admin" on public.wallet_transactions
for select using (employer_user_id = auth.uid() or public.is_super_admin());
create policy "payments_related_or_admin" on public.payments
for select using (employer_user_id = auth.uid() or guard_user_id = auth.uid() or public.is_super_admin());
create policy "invoices_own_or_admin" on public.invoices
for select using (employer_user_id = auth.uid() or public.is_super_admin());

create policy "notifications_own_or_admin" on public.notifications
for all using (user_id = auth.uid() or public.is_super_admin())
with check (user_id = auth.uid() or public.is_super_admin());

create policy "support_tickets_own_or_admin" on public.support_tickets
for all using (user_id = auth.uid() or public.is_super_admin())
with check (user_id = auth.uid() or public.is_super_admin());
create policy "support_messages_related_or_admin" on public.support_ticket_messages
for all using (
  sender_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and t.user_id = auth.uid()
  )
)
with check (sender_id = auth.uid() or public.is_super_admin());

do $$
declare
  bucket_name text;
begin
  foreach bucket_name in array array[
    'company-logos',
    'company-documents',
    'guard-documents',
    'profile-images',
    'invoices',
    'agreements'
  ]
  loop
    insert into storage.buckets (id, name, public)
    values (bucket_name, bucket_name, bucket_name in ('company-logos', 'profile-images'))
    on conflict (id) do nothing;
  end loop;
end $$;

create policy "storage_read_own_or_admin" on storage.objects
for select using (
  public.is_super_admin()
  or bucket_id in ('company-logos', 'profile-images')
  or owner = auth.uid()
);

create policy "storage_write_own_folder" on storage.objects
for insert with check (owner = auth.uid());

create policy "storage_update_own_or_admin" on storage.objects
for update using (owner = auth.uid() or public.is_super_admin())
with check (owner = auth.uid() or public.is_super_admin());

create policy "storage_delete_own_or_admin" on storage.objects
for delete using (owner = auth.uid() or public.is_super_admin());
