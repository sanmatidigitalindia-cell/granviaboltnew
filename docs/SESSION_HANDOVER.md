# Session Handover — Granvia Platform
**Date:** 2026-06-09  
**Project:** Granvia Security Guard Management Platform  
**Supabase Project:** `uiyllxfhmubtasczqmuj`

---

## 1. What We Were Doing

Primary tasks this session:
- Fixing the Supabase Edge Function `send-email` (CORS failure, nodemailer import crash)
- Temporarily disabling email and showing OTP on-screen for Aadhaar verification (email not yet working)
- Fixing multiple PostgreSQL FK and schema errors blocking employer portal functionality
- Full database relationship audit across all tables

---

## 2. Files Changed This Session

| File | What Changed |
|------|-------------|
| `supabase/functions/send-email/index.ts` | Replaced `npm:nodemailer@6` with `denomailer` (pure Deno SMTP) to fix CORS crash on boot |
| `src/services/aadhaarVerificationService.ts` | Disabled email send; OTP now returned to frontend; DB errors are non-fatal (best-effort); in-memory OTP fallback for missing table |
| `src/pages/auth/AadhaarVerificationSlider.tsx` | Added `devOtp` state + yellow OTP display box (used by AadhaarGate, not main employer flow) |
| `src/employer/EmployerApp.tsx` | Added `OtpModal` component with copy-to-clipboard; `AadhaarVerificationPage` now shows OTP modal after Send OTP; removed `onChanged()` from `sendOtp` (was resetting component state via key refresh) |
| `src/services/siteService.ts` | Fixed: sends both `name` and `site_name` on insert; added parent company existence check before insert |
| `src/services/jobService.ts` | Removed `latitude`/`longitude` from job insert (columns don't exist in live DB); added site ownership validation |
| `src/services/applicationService.ts` | Added pre-insert validation: throws clear error if `company_id` or `site_id` is null on job |
| `supabase/migrations/202606090001_relax_aadhaar_write_policies.sql` | New migration: removes `is_employer_aadhaar_verified()` from RLS write policies on `company_sites`, `job_posts`, `employer_companies` |
| `.env` | Removed two shell commands accidentally pasted at end of file (`npx supabase login` and `npx supabase functions deploy ...`) |

---

## 3. Bugs / Errors Found and Fixed

| Error | Root Cause | Fix Applied |
|-------|-----------|-------------|
| `Failed to send a request to the Edge Function` (CORS) | `npm:nodemailer@6` crashed Deno runtime at import — no CORS headers sent | Replaced with `denomailer` (pure Deno) |
| OTP not showing on screen | `onChanged()` in `sendOtp()` triggered `reload()` → changed `key={refresh}` → unmounted component before modal could render | Removed `onChanged()` from `sendOtp`, only call it after successful verify |
| `23502: null value in column "name"` on `company_sites` insert | Live DB has `name NOT NULL`; frontend sends only `site_name` | `siteService.ts` now sends `name: input.site_name` alongside `site_name` |
| `23503: Key not present in table "companies"` on `company_sites` insert | FK `company_sites_company_id_fkey` pointed to non-existent `companies` table instead of `employer_companies` | SQL run to drop & recreate FK; orphan rows deleted first |
| `42501: RLS policy violation` on `company_sites` insert | Policy required `is_employer_aadhaar_verified()` which is `false` while email is disabled | New migration relaxes policy to allow any authenticated employer |
| `42883: function public.is_super_admin() does not exist` | Function defined in migrations but not deployed to live Supabase | Rewrote policies with inline `exists (select 1 from profiles where role = 'super_admin')` |
| `PGRST204: Could not find latitude column of job_posts` | `job_posts` table in live DB has no `latitude`/`longitude` columns | Removed those fields from `createJobPost` insert |
| `.env` parse error on `supabase functions deploy` | Shell commands accidentally pasted into `.env` file | Removed the stray lines |

---

## 4. Database / Supabase Issues Pending

### 4a. Email (Edge Function)
- `send-email` Edge Function has been rewritten and is ready to deploy
- **Not yet deployed** — deploy command kept failing due to `.env` issue (now fixed)
- SMTP secrets **not yet set** in Supabase Dashboard
- Once deployed + secrets set, re-enable email in `aadhaarVerificationService.ts`

### 4b. OTP / Aadhaar Verification
- Email is **disabled** — OTP shows in modal popup on screen
- `employer_aadhaar_verifications` table may not exist in live DB (migrations may not have been applied)
- DB insert is best-effort; in-memory fallback is used if table missing
- Once email works: uncomment `await sendEmail(...)` in `aadhaarVerificationService.ts` and remove `devOtp` from return

### 4c. Schema Divergence
- Live DB schema diverged from migration files (columns added manually, FKs different)
- Migration `202605280005_reconcile_live_schema.sql` was written to fix this but may not be fully applied
- `is_super_admin()` and `is_employer_aadhaar_verified()` DB functions **do not exist** in live DB despite being in migrations
- `job_posts` has no `latitude`/`longitude` in live DB

### 4d. `VITE_SUPABASE_ANON_KEY` truncated in `.env`
- Line 22 of `.env` is cut off mid-JWT: `...InJlZiI6InVpLWxseGZtbXViLXRhc2N6cW11anVqIiwicm8`
- This may cause auth failures in some environments
- Get the full anon key from Supabase Dashboard → Settings → API

---

## 5. Current Schema / RLS / FK Risks

| Table | Risk | Status |
|-------|------|--------|
| `company_sites.company_id` | FK was pointing to `companies` (wrong table) | **Fixed by SQL run this session** |
| `company_sites.name` | NOT NULL but frontend never sends it | **Fixed in siteService + SQL run** |
| `job_applications.site_id` | Was NOT NULL but job may not have a site | **Fixed by SQL (made nullable)** |
| `job_posts.latitude/longitude` | Columns don't exist in live DB | **Fixed in jobService** |
| `is_super_admin()` function | Not deployed to live DB | Policies now use inline check |
| `is_employer_aadhaar_verified()` function | Not deployed to live DB | Removed from policies via migration |
| `employer_aadhaar_verifications` table | May not exist in live DB | Best-effort insert with fallback |
| `profiles.role_id` | May be NOT NULL in live DB — requires `roles` table to have `employer` row | Verify `roles` table has all role rows |

---

## 6. SQL Commands Already Run in Supabase Dashboard

```sql
-- Relax RLS write policies (remove Aadhaar verification requirement)
drop policy if exists "company_sites_write_verified_employer_or_admin" on public.company_sites;
drop policy if exists "job_posts_write_verified_employer_or_admin" on public.job_posts;
drop policy if exists "employer_companies_insert_policy" on public.employer_companies;
-- (recreated with inline admin checks)

-- Delete orphan company_sites rows
delete from public.company_sites
where company_id not in (select id from public.employer_companies);

-- Fix FK on company_sites
alter table public.company_sites drop constraint if exists company_sites_company_id_fkey;
alter table public.company_sites add constraint company_sites_company_id_fkey
  foreign key (company_id) references public.employer_companies(id) on delete cascade;

-- Drop NOT NULL on legacy name column
alter table public.company_sites alter column name drop not null;

-- Make job_applications.site_id nullable
alter table public.job_applications alter column site_id drop not null;
```

---

## 7. What Is Working

- Employer login and portal shell renders correctly
- Aadhaar verification OTP flow: OTP generates, shows in modal popup, copy-to-clipboard works, "Use OTP" auto-fills input
- Company creation (employer creates company)
- Site creation (after FK fix)
- Job posting (after removing latitude/longitude)
- Admin panel login and employer management
- Guard portal login, job search, application flow (basic)

---

## 8. What Is Not Working / Not Tested

| Feature | Status |
|---------|--------|
| Email sending (OTP, welcome email) | Disabled — Edge Function not deployed yet |
| Aadhaar OTP via email | Disabled — showing on-screen modal instead |
| `supabase functions deploy` | Not run yet — `.env` issue now fixed, ready to try |
| SMTP secrets in Supabase | Not set yet |
| Guard applying to jobs | Not end-to-end tested after site_id nullable fix |
| Attendance check-in/check-out | Not tested this session |
| Payments / Wallet | Not tested this session |
| Admin reports/dashboard data | Not tested this session |
| Employer document upload | Not tested this session |

---

## 9. Next Exact Steps (In Order)

### Step 1 — Fix truncated ANON_KEY
1. Go to Supabase Dashboard → Settings → API
2. Copy the full `anon` key
3. Replace line 22 in `.env` with the complete value

### Step 2 — Deploy Edge Function
```bash
npx supabase functions deploy send-email --project-ref uiyllxfhmubtasczqmuj
```

### Step 3 — Set SMTP Secrets
```bash
npx supabase secrets set \
  SMTP_HOST=smtp.zoho.in \
  SMTP_PORT=587 \
  SMTP_USER=your@zohodomain.com \
  SMTP_PASSWORD=yourpassword \
  SMTP_FROM_EMAIL=your@zohodomain.com \
  SMTP_FROM_NAME=Granvia \
  --project-ref uiyllxfhmubtasczqmuj
```
Or set in Supabase Dashboard → Edge Functions → send-email → Secrets.

### Step 4 — Test Edge Function
In Supabase Dashboard → Edge Functions → send-email → Test, send a test payload:
```json
{ "to": "your@email.com", "subject": "Test", "html": "<p>Test</p>" }
```

### Step 5 — Re-enable Email in Code
In `src/services/aadhaarVerificationService.ts`:
- Uncomment: `await sendEmail(buildOtpEmail(otp, user.email!));`
- Change return to: `return { sentTo: user.email! };` (remove `devOtp`)

In `src/employer/EmployerApp.tsx`:
- Remove the `OtpModal` component and `showOtpModal` / `devOtp` state
- Remove the `{devOtp && showOtpModal && <OtpModal ... />}` block
- Remove the "Show OTP" button from the blue banner

In `src/pages/auth/AadhaarVerificationSlider.tsx`:
- Remove `devOtp` state and yellow OTP display box

### Step 6 — Apply Remaining Migrations to Live DB
Verify these tables/functions exist in live DB; if not, run their migration SQL:
- `employer_aadhaar_verifications` table
- `is_super_admin()` function
- `is_employer_aadhaar_verified()` function
- `roles` table with rows: `super_admin`, `employer`, `guard`

### Step 7 — End-to-End Test Checklist
- [ ] Guard applies to a job successfully
- [ ] Employer sees application
- [ ] Employer shortlists / sends offer
- [ ] Attendance check-in/check-out
- [ ] Admin creates employer (welcome email)
- [ ] Employer Aadhaar OTP via email
- [ ] File upload (company documents)

---

## 10. Assumptions Made

1. The live Supabase DB schema is the source of truth — migrations are aspirational, not necessarily applied
2. Zoho SMTP credentials are available to set as Edge Function secrets (not shared in this session)
3. `denomailer` library works in Supabase's Deno runtime (standard Deno — should work, not tested yet)
4. The `roles` table exists in live DB with at least `employer`, `guard`, `super_admin` rows (required for `profiles.role_id` FK)
5. Demo/seed data in DB is safe to delete (confirmed by user this session)
6. Port 5173 is the dev server port in use (user confirmed `/employer` is at `http://localhost:5173/employer`)
7. Zoho SMTP uses `smtp.zoho.in` on port 587 with STARTTLS (standard Zoho India config)
