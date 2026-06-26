# Laravel Migration Audit: Supabase Usage

Generated from a static scan of the React project. This audit covers Supabase client imports, Auth usage, PostgREST table usage, mutations, Storage usage, RPC usage, Edge Function calls, and the services that should be moved behind a Laravel API.

## Supabase Client Setup

| File | Usage |
| --- | --- |
| `src/lib/supabaseClient.ts` | Creates and exports the browser `supabase` singleton with persisted sessions. Also exports `createEphemeralSupabaseClient()` for non-persistent auth operations. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. |
| `scripts/seedDemoUsers.mjs` | Creates a Node Supabase client with `SUPABASE_SERVICE_ROLE_KEY` for admin user seeding. |
| `supabase/functions/send-email/index.ts` | Creates an Edge Function scoped Supabase client from `SUPABASE_URL` and `SUPABASE_ANON_KEY`, forwarding the request `Authorization` header. |

## Files Importing Supabase Client

These files import the local Supabase client from `src/lib/supabaseClient.ts`:

| File | Import |
| --- | --- |
| `src/context/AuthContext.tsx` | `supabase` |
| `src/services/aadhaarVerificationService.ts` | `supabase` |
| `src/services/adminEmployerService.ts` | `supabase`, `createEphemeralSupabaseClient` |
| `src/services/applicationService.ts` | `supabase` |
| `src/services/attendanceService.ts` | `supabase` |
| `src/services/authService.ts` | `supabase` |
| `src/services/companyService.ts` | `supabase` |
| `src/services/documentService.ts` | `supabase` |
| `src/services/emailService.ts` | `supabase` |
| `src/services/hiringService.ts` | `supabase` |
| `src/services/jobService.ts` | `supabase` |
| `src/services/notificationService.ts` | `supabase` |
| `src/services/paymentService.ts` | `supabase` |
| `src/services/profileService.ts` | `supabase` |
| `src/services/reportService.ts` | `supabase` |
| `src/services/roleService.ts` | `supabase` |
| `src/services/siteService.ts` | `supabase` |
| `src/services/storageService.ts` | `supabase` |
| `src/services/supportService.ts` | `supabase` |
| `src/services/walletService.ts` | `supabase` |

Other direct `@supabase/supabase-js` imports:

| File | Usage |
| --- | --- |
| `src/lib/supabaseClient.ts` | `createClient`, `SupabaseClient` |
| `src/context/AuthContext.tsx` | `Session`, `User` types |
| `src/services/authService.ts` | `Session`, `User` types |
| `scripts/seedDemoUsers.mjs` | `createClient` |
| `supabase/functions/send-email/index.ts` | Deno `createClient` import from `esm.sh` |

## Auth Calls

| File | Supabase auth calls | Current responsibility |
| --- | --- | --- |
| `src/context/AuthContext.tsx` | `auth.getUser()`, `auth.getSession()`, `auth.onAuthStateChange()` | Browser session bootstrap, session listener, profile loading/creation. |
| `src/services/authService.ts` | `auth.getSession()`, `auth.signInWithPassword()`, `auth.signOut()`, `auth.signUp()`, `auth.resend()` | Login, logout, employer registration, email verification resend, current app session lookup. |
| `src/services/aadhaarVerificationService.ts` | `auth.getUser()` | Requires signed-in employer before Aadhaar status/OTP actions. |
| `src/services/adminEmployerService.ts` | `supabase.auth.getUser()`, `authClient.auth.signUp()` | Reads current admin ID and creates employer accounts through an ephemeral Supabase auth client. |
| `src/services/applicationService.ts` | `auth.getUser()` | Reads guard ID before application actions. |
| `src/services/companyService.ts` | `auth.getUser()` | Reads employer ID before company actions. |
| `src/services/documentService.ts` | `auth.getUser()` | Reads employer ID before document records. |
| `src/services/hiringService.ts` | `auth.getUser()` | Reads employer ID for interview, offer, and agreement actions. |
| `src/services/jobService.ts` | `auth.getUser()` | Reads employer ID for job posting/listing. |
| `src/services/profileService.ts` | `auth.getUser()` | Reads current user before profile updates. |
| `src/services/siteService.ts` | `auth.getUser()` | Reads employer ID before site actions. |
| `src/services/supportService.ts` | `auth.getUser()` | Reads current user before support ticket creation. |
| `scripts/seedDemoUsers.mjs` | `auth.admin.createUser()`, `auth.admin.listUsers()`, `auth.admin.updateUserById()` | Service-role demo user creation/update script. |
| `supabase/functions/send-email/index.ts` | `auth.getUser()` | Edge Function authorization check. |

Migration note: Laravel should become the authority for app auth/session APIs. Either replace Supabase Auth entirely with Laravel Sanctum/Passport/JWT, or keep Supabase Auth temporarily while Laravel validates Supabase JWTs and owns all database access.

## Table Queries

| Table | Files and query purpose |
| --- | --- |
| `profiles` | `AuthContext.tsx` and `authService.ts` load/create current profile; `adminEmployerService.ts` lists employers, checks uniqueness, creates/updates/admin-verifies employer records, verifies deletion; `profileService.ts` reads/updates current profile; `roleService.ts` indirectly helps profile role mapping. |
| `roles` | `roleService.ts` reads role UUID by role key. |
| `employer_profiles` | `aadhaarVerificationService.ts` ensures/reads/updates Aadhaar status; `adminEmployerService.ts` lists/upserts/updates/verifies employer profiles; `profileService.ts` reads/updates current employer profile. |
| `employer_aadhaar_verifications` | `aadhaarVerificationService.ts` inserts OTP verification record, reads latest OTP record, updates verification status. |
| `employer_companies` | `companyService.ts` lists/creates/updates employer companies; `adminEmployerService.ts` lists/reads/inserts/updates/verifies company records; `siteService.ts` validates parent company; `jobService.ts` joins company names; `applicationService.ts` references company IDs from jobs. |
| `company_documents` | `documentService.ts` lists and creates company document records; `adminEmployerService.ts` lists documents. |
| `company_sites` | `siteService.ts` lists/creates/updates sites; `jobService.ts` validates site and joins site data; `adminEmployerService.ts` lists/verifies site records. |
| `job_posts` | `jobService.ts` lists active/employer/pending/admin jobs, creates/updates/deletes jobs; `applicationService.ts` validates job before applying; `adminEmployerService.ts` lists/verifies jobs; `hiringService.ts`, `attendanceService.ts`, `paymentService.ts` join job title/details; `reportService.ts` counts jobs. |
| `job_applications` | `applicationService.ts` creates/lists/updates applications; `reportService.ts` counts applications. |
| `guard_profiles` | Queried through joins in `applicationService.ts`, `attendanceService.ts`, `hiringService.ts`, and `paymentService.ts`. No direct mutation found. |
| `attendance_records` | `attendanceService.ts` lists/updates attendance; `reportService.ts` counts attendance. |
| `interview_requests` | `hiringService.ts` lists/creates/updates interview requests. |
| `job_offers` | `hiringService.ts` lists/creates/updates job offers. |
| `agreements` | `hiringService.ts` lists/creates/updates agreements. |
| `payments` | `paymentService.ts` lists/creates payment records; `reportService.ts` counts payments. |
| `invoices` | `paymentService.ts` lists invoices. |
| `notifications` | `notificationService.ts` lists notifications and marks them read. |
| `support_tickets` | `supportService.ts` lists tickets and creates ticket headers. |
| `support_ticket_messages` | `supportService.ts` joins messages when listing tickets and inserts initial ticket messages. |
| `employer_wallets` | `walletService.ts` reads current wallet; `adminEmployerService.ts` lists balances. |
| `wallet_transactions` | `walletService.ts` lists wallet transactions. |

## Inserts, Upserts, Updates, Deletes

| File | Operation | Table/API | Purpose |
| --- | --- | --- | --- |
| `src/context/AuthContext.tsx` | `upsert` | `profiles` | Create missing profile for signed-in user. |
| `src/services/authService.ts` | `upsert` | `profiles` | Create missing profile during current-session restoration. |
| `src/services/aadhaarVerificationService.ts` | `upsert` | `employer_profiles` | Ensure employer profile exists before Aadhaar flow. |
| `src/services/aadhaarVerificationService.ts` | `insert` | `employer_aadhaar_verifications` | Store Aadhaar OTP hash and metadata. |
| `src/services/aadhaarVerificationService.ts` | `update` | `employer_profiles` | Set OTP sent or verified status. |
| `src/services/aadhaarVerificationService.ts` | `update` | `employer_aadhaar_verifications` | Mark OTP record verified. |
| `src/services/adminEmployerService.ts` | `upsert` | `profiles` | Create/update employer user profile after admin signup. |
| `src/services/adminEmployerService.ts` | `upsert` | `employer_profiles` | Create/update employer profile after admin signup. |
| `src/services/adminEmployerService.ts` | `insert` | `employer_companies` | Create first employer company when none exists. |
| `src/services/adminEmployerService.ts` | `update` | `employer_companies` | Update first employer company during admin creation/edit. |
| `src/services/adminEmployerService.ts` | `update` | `profiles` | Admin edits employer core fields/status. |
| `src/services/adminEmployerService.ts` | `update` | `employer_profiles` | Admin edits employer profile fields/status. |
| `src/services/adminEmployerService.ts` | `rpc` | `admin_delete_employer` | Delete employer cascade through database function. |
| `src/services/applicationService.ts` | `insert` | `job_applications` | Guard applies for a job. |
| `src/services/applicationService.ts` | `update` | `job_applications` | Employer/admin updates application status. |
| `src/services/attendanceService.ts` | `update` | `attendance_records` | Employer updates attendance status/remarks. |
| `src/services/companyService.ts` | `insert` | `employer_companies` | Employer creates company. |
| `src/services/companyService.ts` | `update` | `employer_companies` | Employer updates company. |
| `src/services/documentService.ts` | `insert` | `company_documents` | Create uploaded company document metadata record. |
| `src/services/hiringService.ts` | `insert` | `interview_requests` | Create interview request. |
| `src/services/hiringService.ts` | `update` | `interview_requests` | Update interview request. |
| `src/services/hiringService.ts` | `insert` | `job_offers` | Create job offer. |
| `src/services/hiringService.ts` | `update` | `job_offers` | Update job offer. |
| `src/services/hiringService.ts` | `insert` | `agreements` | Create agreement. |
| `src/services/hiringService.ts` | `update` | `agreements` | Update agreement. |
| `src/services/jobService.ts` | `insert` | `job_posts` | Employer creates job post. |
| `src/services/jobService.ts` | `update` | `job_posts` | Admin/employer updates job post, including approval/rejection. |
| `src/services/jobService.ts` | `delete` | `job_posts` | Delete job post. |
| `src/services/notificationService.ts` | `update` | `notifications` | Mark notification as read. |
| `src/services/paymentService.ts` | `insert` | `payments` | Create payment record. |
| `src/services/profileService.ts` | `update` | `profiles` | User updates profile. |
| `src/services/profileService.ts` | `update` | `employer_profiles` | Employer updates employer profile. |
| `src/services/siteService.ts` | `insert` | `company_sites` | Employer creates company site. |
| `src/services/siteService.ts` | `update` | `company_sites` | Employer updates company site. |
| `src/services/supportService.ts` | `insert` | `support_tickets` | Create support ticket. |
| `src/services/supportService.ts` | `insert` | `support_ticket_messages` | Create first support ticket message. |
| `scripts/seedDemoUsers.mjs` | `auth.admin.createUser` | Supabase Auth admin API | Create demo users. |
| `scripts/seedDemoUsers.mjs` | `auth.admin.updateUserById` | Supabase Auth admin API | Update demo user metadata. |

## Edge Function Calls

| Caller | Function | Payload | Notes |
| --- | --- | --- | --- |
| `src/services/emailService.ts` | `supabase.functions.invoke('send-email')` | `{ to, subject, html, text? }` | Browser calls Supabase Edge Function. Function requires signed-in user. |

Existing Edge Function implementation:

| File | Function | Supabase usage | External dependency |
| --- | --- | --- | --- |
| `supabase/functions/send-email/index.ts` | `send-email` | `auth.getUser()` validates Authorization header. No table access. | Sends email through Zoho SMTP via `denomailer`. |

Laravel migration target: replace `send-email` Edge Function with a Laravel mail endpoint/job, using Laravel mail config and queueing. Frontend should call Laravel instead of `supabase.functions.invoke`.

## Storage Usage

| File | Supabase Storage call | Buckets |
| --- | --- | --- |
| `src/services/storageService.ts` | `storage.from(bucket).upload(path, file, { upsert: true, contentType })` | `company-logos`, `company-documents`, `guard-documents`, `profile-images`, `invoices`, `agreements` |
| `src/services/storageService.ts` | `storage.from(bucket).createSignedUrl(path, expiresInSeconds)` | Same bucket union. |
| `src/services/storageService.ts` | `storage.from(bucket).getPublicUrl(path)` | Same bucket union. |

Laravel migration target: move uploads/signing/public URLs to Laravel controllers backed by local disk, S3-compatible storage, or continued Supabase Storage behind server-side credentials.

## RPC Usage

| File | RPC | Purpose |
| --- | --- | --- |
| `src/services/adminEmployerService.ts` | `admin_delete_employer` | SECURITY DEFINER cascade deletion of employer data. After RPC, frontend verifies related records are gone. |

Laravel migration target: implement cascade deletion in Laravel service layer/database transaction, or call a database stored procedure from Laravel only. The browser should not call this RPC directly after migration.

## Services That Must Be Migrated To Laravel API

Every service below currently performs direct browser-to-Supabase data access and should be replaced by Laravel API calls:

| Service | Migration scope |
| --- | --- |
| `src/services/authService.ts` | Login, logout, employer registration, email verification resend, current session/profile bootstrap. |
| `src/context/AuthContext.tsx` | Replace Supabase session listener/profile bootstrap with Laravel auth state and `/me` style API. |
| `src/services/profileService.ts` | Current user profile and employer profile reads/updates. |
| `src/services/roleService.ts` | Role lookup by key. Likely internal Laravel concern after migration. |
| `src/services/adminEmployerService.ts` | Admin employer listing, create, update, uniqueness checks, delete cascade, wallet balance aggregation. |
| `src/services/aadhaarVerificationService.ts` | Aadhaar profile initialization, OTP generation/storage/verification, email trigger. |
| `src/services/companyService.ts` | Employer company CRUD. |
| `src/services/siteService.ts` | Company site CRUD and ownership validation. |
| `src/services/documentService.ts` | Company document metadata creation/listing. Should pair with Laravel upload flow. |
| `src/services/storageService.ts` | File uploads, signed URLs, public URLs. |
| `src/services/jobService.ts` | Job listing, employer job CRUD, admin approval/rejection/delete. |
| `src/services/applicationService.ts` | Guard job applications and employer application status changes. |
| `src/services/attendanceService.ts` | Attendance listing and status update. |
| `src/services/hiringService.ts` | Interview request, job offer, and agreement list/create/update flows. |
| `src/services/paymentService.ts` | Payment records and invoice listing. |
| `src/services/walletService.ts` | Employer wallet and transaction reads. |
| `src/services/reportService.ts` | Aggregate counts for jobs/applications/attendance/payments. |
| `src/services/notificationService.ts` | Notification listing and read status updates. |
| `src/services/supportService.ts` | Support ticket/message list and creation. |
| `src/services/emailService.ts` | Replace Edge Function call with Laravel mail endpoint/job. |

Non-browser migration/support items:

| File | Migration scope |
| --- | --- |
| `scripts/seedDemoUsers.mjs` | Replace Supabase Auth admin seeding with Laravel user seeder/factory. |
| `supabase/functions/send-email/index.ts` | Replace with Laravel mailer/controller/job. |
| `supabase/migrations/*` and `supabase/run_all_migrations.sql` | Convert schema/RLS/function assumptions into Laravel migrations, policies, gates, model relationships, and service-layer authorization. |

## Suggested Laravel API Boundaries

| Domain | Candidate endpoints |
| --- | --- |
| Auth/session | `POST /api/login`, `POST /api/logout`, `GET /api/me`, `POST /api/register/employer`, `POST /api/email/verification-notification` |
| Admin employers | `GET /api/admin/employers`, `POST /api/admin/employers`, `PATCH /api/admin/employers/{id}`, `DELETE /api/admin/employers/{id}` |
| Profiles/Aadhaar | `GET /api/profile`, `PATCH /api/profile`, `GET /api/employer/aadhaar`, `POST /api/employer/aadhaar/otp`, `POST /api/employer/aadhaar/verify` |
| Companies/sites/documents | `GET/POST/PATCH /api/employer/companies`, `GET/POST/PATCH /api/employer/sites`, `GET/POST /api/employer/documents` |
| Jobs/applications | `GET /api/jobs`, `GET/POST/PATCH/DELETE /api/employer/jobs`, `GET /api/admin/jobs`, `PATCH /api/admin/jobs/{id}/approve`, `PATCH /api/admin/jobs/{id}/reject`, `POST /api/jobs/{id}/applications`, `GET/PATCH /api/applications` |
| Attendance/hiring | `GET/PATCH /api/attendance`, `GET/POST/PATCH /api/interview-requests`, `GET/POST/PATCH /api/job-offers`, `GET/POST/PATCH /api/agreements` |
| Billing/wallet/reports | `GET/POST /api/payments`, `GET /api/invoices`, `GET /api/wallet`, `GET /api/wallet/transactions`, `GET /api/reports/counts` |
| Notifications/support/email | `GET/PATCH /api/notifications`, `GET/POST /api/support/tickets`, `POST /api/mail/send` or queued internal mail jobs |
| Files | `POST /api/files`, `GET /api/files/{id}/signed-url`, `GET /storage/...` or S3 signed URL endpoints |

## High-Risk Migration Notes

- Current authorization depends heavily on Supabase RLS and the current authenticated user. Laravel must reimplement those checks with policies/gates/middleware before direct Supabase access is removed.
- Several service methods rely on implicit "current user" filtering through RLS, especially `profileService.ts`, `walletService.ts`, `notificationService.ts`, and support ticket listing. Laravel endpoints must apply explicit `user_id`, `employer_user_id`, `guard_user_id`, `company_id`, and role checks.
- `adminEmployerService.ts` currently creates users through Supabase Auth from the browser using an anon-key ephemeral client. This should move fully server-side.
- `aadhaarVerificationService.ts` currently has dev-mode in-memory OTP fallback and returns `devOtp` to the frontend. This should not be carried into production Laravel flows.
- `admin_delete_employer` is a database-side privileged operation. Port it carefully as a transaction with tests for all related records.
- Storage metadata (`company_documents.file_path`) and object storage paths are coupled. Laravel should migrate both uploaded objects and metadata conventions together.
