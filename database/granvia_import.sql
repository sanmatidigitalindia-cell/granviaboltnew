-- Granvia database import script for PostgreSQL / Supabase.
-- Generated from the current app storage types and src/data/*.json seed files.

begin;

drop table if exists invoices cascade;
drop table if exists payments cascade;
drop table if exists wallet_transactions cascade;
drop table if exists employer_wallets cascade;
drop table if exists agreements cascade;
drop table if exists job_offers cascade;
drop table if exists interview_requests cascade;
drop table if exists company_sites cascade;
drop table if exists employer_documents cascade;
drop table if exists employer_aadhaar_verifications cascade;
drop table if exists applications cascade;
drop table if exists attendance cascade;
drop table if exists jobs cascade;
drop table if exists employers cascade;
drop table if exists guards cascade;
drop table if exists users cascade;
drop table if exists app_settings cascade;

create table users (
  id text primary key,
  email text not null unique,
  password text not null,
  name text not null,
  role text not null check (role in ('superadmin', 'admin')),
  avatar text,
  created_at timestamptz not null
);

create table guards (
  id text primary key,
  full_name text not null,
  mobile text not null,
  email text not null unique,
  password text not null,
  gender text not null,
  dob date,
  address text not null,
  city text not null,
  state text not null,
  current_location text not null,
  latitude text not null,
  longitude text not null,
  skills jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  experience text not null,
  aadhaar_status text not null check (aadhaar_status in ('Pending', 'Verified', 'Rejected')),
  police_verification text not null check (police_verification in ('Pending', 'Verified', 'Rejected')),
  bank_details jsonb,
  status text not null check (status in ('Active', 'Blocked')),
  avatar text,
  created_at timestamptz not null
);

create table employers (
  id text primary key,
  company_name text not null,
  contact_person_name text not null,
  designation text not null,
  mobile text not null,
  email text not null unique,
  password text not null,
  company_address text not null,
  billing_address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  business_type text not null,
  gst_number text not null default '',
  pan_number text not null default '',
  website text not null default '',
  logo text,
  description text not null default '',
  verification_status text not null check (verification_status in ('Pending', 'Verified', 'Rejected')),
  account_status text not null check (account_status in ('Pending', 'Active', 'Blocked')),
  role text not null default 'employer' check (role = 'employer'),
  created_from text not null check (created_from in ('app', 'super_admin')),
  created_by text,
  profile_status text not null check (profile_status in ('Incomplete', 'Pending', 'Complete')),
  is_aadhaar_verified boolean not null default false,
  aadhaar_verification_status text not null check (aadhaar_verification_status in ('pending', 'otp_sent', 'verified', 'failed', 'expired')),
  aadhaar_verified_at timestamptz,
  aadhaar_last_four text not null default '',
  admin_remarks text not null default '',
  rejection_reason text not null default '',
  created_at timestamptz not null
);

create table jobs (
  id text primary key,
  title text not null,
  company text not null,
  employer_id text,
  site_id text,
  category text,
  guard_type text,
  gender_preference text,
  age_range text,
  duty_hours text,
  start_date date,
  end_date date,
  police_verification_required boolean,
  uniform_required boolean,
  food_facility boolean,
  accommodation_facility boolean,
  special_instructions text,
  city text not null,
  state text not null,
  location text not null,
  latitude text not null,
  longitude text not null,
  salary text not null,
  salary_type text not null,
  shift text not null,
  duration text not null,
  skills jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  experience text not null,
  openings integer not null,
  description text not null,
  status text not null check (status in ('Draft', 'Active', 'Paused', 'Closed', 'Archived', 'Inactive', 'Pending')),
  posted_by text not null,
  posted_at timestamptz not null,
  match_score integer not null
);

create table attendance (
  id text primary key,
  guard_id text not null references guards(id) on delete cascade,
  employer_id text,
  job_id text,
  site_id text,
  date date not null,
  in_time text,
  out_time text,
  location text not null,
  latitude text not null,
  longitude text not null,
  status text not null check (status in ('Present', 'Absent', 'Half Day', 'Pending Verification', 'Approved', 'Rejected', 'Late', 'Completed')),
  hours text not null,
  employer_remarks text
);

create table applications (
  id text primary key,
  guard_id text not null references guards(id) on delete cascade,
  job_id text not null references jobs(id) on delete cascade,
  applied_at timestamptz not null,
  status text not null check (status in ('Pending', 'Applied', 'Viewed', 'Shortlisted', 'Rejected', 'Selected', 'Offer Sent', 'Accepted by Guard', 'Declined by Guard', 'Joined', 'Completed', 'Cancelled')),
  notes text not null default '',
  rejection_reason text,
  status_history jsonb,
  unique (guard_id, job_id)
);

create table employer_aadhaar_verifications (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  aadhaar_number_hash text not null default '',
  aadhaar_last_four text not null default '',
  verification_status text not null check (verification_status in ('pending', 'otp_sent', 'verified', 'failed', 'expired')),
  otp_hash text not null default '',
  otp_sent_to text not null default '',
  otp_channel text not null check (otp_channel in ('email', 'sms', 'api')),
  otp_expires_at timestamptz,
  otp_verified_at timestamptz,
  otp_attempts integer not null default 0,
  resend_count integer not null default 0,
  provider_name text not null check (provider_name in ('email_otp', 'aadhaar_api')),
  provider_reference_id text not null default '',
  verification_response text not null default '',
  verified_at timestamptz,
  last_otp text,
  last_otp_visible_until timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table employer_documents (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  type text not null,
  file_name text not null,
  file_size integer not null,
  file_type text not null,
  uploaded_at timestamptz not null,
  status text not null check (status in ('Pending', 'Verified', 'Rejected'))
);

create table company_sites (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  site_name text not null,
  site_type text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  contact_person text not null,
  contact_mobile text not null,
  maps_location text not null,
  latitude text not null,
  longitude text not null,
  shift_details text not null,
  notes text not null,
  status text not null check (status in ('Active', 'Inactive')),
  created_at timestamptz not null
);

create table interview_requests (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  job_id text not null references jobs(id) on delete cascade,
  guard_id text not null references guards(id) on delete cascade,
  request_type text not null check (request_type in ('Phone Call', 'Video Call', 'In-person', 'Other')),
  preferred_date date not null,
  preferred_time text not null,
  message text not null,
  status text not null check (status in ('Requested', 'Accepted', 'Completed', 'Missed', 'Cancelled')),
  created_at timestamptz not null
);

create table job_offers (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  job_id text not null references jobs(id) on delete cascade,
  guard_id text not null references guards(id) on delete cascade,
  site_id text not null,
  offered_salary text not null,
  duty_hours text not null,
  shift_type text not null,
  start_date date not null,
  end_date date,
  terms_summary text not null,
  status text not null check (status in ('Sent', 'Accepted', 'Rejected', 'Cancelled', 'Expired')),
  created_at timestamptz not null
);

create table agreements (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  job_id text not null references jobs(id) on delete cascade,
  guard_id text not null references guards(id) on delete cascade,
  site_id text not null,
  salary_terms text not null,
  duty_hours text not null,
  start_date date not null,
  duration text not null,
  terms text not null,
  employer_confirmed boolean not null default false,
  guard_confirmed boolean not null default false,
  platform_confirmed boolean not null default false,
  status text not null check (status in ('Draft', 'Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled')),
  created_at timestamptz not null
);

create table employer_wallets (
  employer_id text primary key references employers(id) on delete cascade,
  balance numeric(12,2) not null default 0,
  updated_at timestamptz not null
);

create table wallet_transactions (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  type text not null check (type in ('Credit', 'Debit')),
  amount numeric(12,2) not null,
  purpose text not null,
  reference_id text not null,
  status text not null check (status in ('Pending', 'Completed', 'Failed')),
  created_at timestamptz not null
);

create table payments (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  job_id text not null references jobs(id) on delete cascade,
  guard_id text not null references guards(id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null check (status in ('Pending', 'Paid to Platform', 'Failed', 'Refunded', 'Confirmed', 'Settled to Guard', 'Cash Requested', 'Cash Confirmed')),
  method text not null check (method in ('Gateway', 'Wallet', 'Cash', 'Pending Gateway')),
  otp_hash text,
  otp_expires_at timestamptz,
  attempts integer,
  created_at timestamptz not null
);

create table invoices (
  id text primary key,
  employer_id text not null references employers(id) on delete cascade,
  payment_id text not null references payments(id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null check (status in ('Issued', 'Paid', 'Cancelled')),
  issued_at timestamptz not null
);

create table app_settings (
  key text primary key,
  value jsonb not null
);

insert into users (id, email, password, name, role, avatar, created_at) values
('admin-001', 'admin@granvia.com', 'admin123', 'Super Admin', 'superadmin', null, '2024-01-01T00:00:00Z');

insert into guards (
  id, full_name, mobile, email, password, gender, dob, address, city, state,
  current_location, latitude, longitude, skills, languages, experience,
  aadhaar_status, police_verification, bank_details, status, avatar, created_at
) values
('GRD-0001', 'Rajesh Kumar', '9876543210', 'rajesh@example.com', 'guard123', 'Male', '1990-05-15', '123, MG Road, Sector 12', 'Mumbai', 'Maharashtra', 'Andheri West, Mumbai', '19.1136', '72.8697', '["CCTV Monitoring","Access Control","Fire Safety"]'::jsonb, '["Hindi","English","Marathi"]'::jsonb, '5 years', 'Pending', 'Verified', null, 'Active', null, '2024-01-15T10:00:00Z'),
('GRD-0002', 'Suresh Patil', '9765432109', 'suresh@example.com', 'guard456', 'Male', '1988-11-22', '45, Shivaji Nagar', 'Pune', 'Maharashtra', 'Koregaon Park, Pune', '18.5362', '73.8939', '["Patrolling","Emergency Response","First Aid"]'::jsonb, '["Hindi","Marathi"]'::jsonb, '8 years', 'Verified', 'Pending', null, 'Active', null, '2024-02-01T09:00:00Z'),
('GRD-0003', 'Amit Singh', '9654321098', 'amit@example.com', 'guard789', 'Male', '1992-07-08', '78, Gandhi Road', 'Delhi', 'Delhi', 'Connaught Place, Delhi', '28.6315', '77.2167', '["VIP Security","Crowd Management","Communication"]'::jsonb, '["Hindi","English","Punjabi"]'::jsonb, '3 years', 'Verified', 'Verified', null, 'Blocked', null, '2024-03-10T08:00:00Z');

insert into jobs (
  id, title, company, employer_id, site_id, category, guard_type, gender_preference,
  age_range, duty_hours, start_date, end_date, police_verification_required,
  uniform_required, food_facility, accommodation_facility, special_instructions,
  city, state, location, latitude, longitude, salary, salary_type, shift, duration,
  skills, languages, experience, openings, description, status, posted_by, posted_at, match_score
) values
('JOB-001', 'Security Guard - Night Shift', 'Reliance Mall', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Mumbai', 'Maharashtra', 'Andheri East, Mumbai', '19.1136', '72.8697', '18000', 'Monthly', 'Night', '6 months', '["Patrolling","CCTV Monitoring"]'::jsonb, '["Hindi","Marathi"]'::jsonb, '2+ years', 5, 'Reliance Mall requires trained security guards for night shift duties. Candidates must be physically fit and alert.', 'Active', 'employer-001', '2024-05-01T10:00:00Z', 92),
('JOB-002', 'Gate Security Officer', 'Tech Park Solutions', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Pune', 'Maharashtra', 'Hinjewadi, Pune', '18.5912', '73.7389', '22000', 'Monthly', 'Day', '12 months', '["Access Control","Communication"]'::jsonb, '["Hindi","Marathi","English"]'::jsonb, '1+ years', 3, 'Tech Park is looking for professional gate security officers. Smart appearance and communication skills required.', 'Active', 'employer-002', '2024-05-05T11:00:00Z', 85),
('JOB-003', 'VIP Escort Security', 'Elite Hospitality Group', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Delhi', 'Delhi', 'Aerocity, Delhi', '28.5562', '77.0999', '35000', 'Monthly', 'Rotational', 'Permanent', '["VIP Security","Emergency Response","First Aid"]'::jsonb, '["Hindi","English"]'::jsonb, '5+ years', 2, 'Elite Hospitality requires experienced VIP escort security personnel. Prior hotel security experience preferred.', 'Active', 'employer-003', '2024-05-08T09:00:00Z', 78),
('JOB-004', 'Bank Security Guard', 'Axis Bank Ltd', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Mumbai', 'Maharashtra', 'BKC, Mumbai', '19.0661', '72.8652', '20000', 'Monthly', 'Day', 'Permanent', '["Access Control","CCTV Monitoring","Communication"]'::jsonb, '["Hindi","English","Marathi"]'::jsonb, '3+ years', 8, 'Axis Bank requires security guards for branch protection. Police verification mandatory.', 'Active', 'employer-004', '2024-05-10T10:00:00Z', 88),
('JOB-005', 'Residential Complex Guard', 'Lodha Group', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Thane', 'Maharashtra', 'Majiwada, Thane', '19.2165', '72.9819', '16000', 'Monthly', 'Night', 'Permanent', '["Patrolling","Emergency Response"]'::jsonb, '["Hindi","Marathi"]'::jsonb, '1+ years', 10, 'Lodha residential complexes require security guards for night patrolling and gate management.', 'Active', 'employer-005', '2024-05-12T08:00:00Z', 95);

insert into attendance (
  id, guard_id, employer_id, job_id, site_id, date, in_time, out_time,
  location, latitude, longitude, status, hours, employer_remarks
) values
('ATT-001', 'GRD-0001', null, null, null, '2024-05-13', '08:02', '17:45', 'Andheri West, Mumbai', '19.1136', '72.8697', 'Present', '9h 43m', null),
('ATT-002', 'GRD-0001', null, null, null, '2024-05-12', '07:58', '18:02', 'Andheri West, Mumbai', '19.1136', '72.8697', 'Present', '10h 04m', null),
('ATT-003', 'GRD-0002', null, null, null, '2024-05-13', '09:00', '18:30', 'Koregaon Park, Pune', '18.5362', '73.8939', 'Present', '9h 30m', null);

insert into applications (
  id, guard_id, job_id, applied_at, status, notes, rejection_reason, status_history
) values
('APP-001', 'GRD-0001', 'JOB-001', '2024-05-10T14:30:00Z', 'Pending', '', null, null),
('APP-002', 'GRD-0002', 'JOB-002', '2024-05-11T09:15:00Z', 'Selected', 'Interview scheduled', null, null);

insert into app_settings (key, value) values
('appName', '"Granvia"'::jsonb),
('adminEmail', '"admin@granvia.com"'::jsonb),
('contactPhone', '"+91-9999999999"'::jsonb),
('supportEmail', '"support@granvia.com"'::jsonb),
('coinValue', '10'::jsonb),
('commissionRate', '5'::jsonb),
('maxRadius', '50'::jsonb),
('defaultCity', '"Mumbai"'::jsonb),
('maintenanceMode', 'false'::jsonb),
('version', '"1.0.0"'::jsonb);

commit;
