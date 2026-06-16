# TODO Later

---

## 1. Email Verification on Registration (Employer Portal)

**Status:** Disabled — users land directly in the app after registration, no email gate on login.  
**Files touched:** `src/employer/EmployerAuth.tsx`

### What was disabled
- `handleRegister`: after `registerEmployer()` succeeds, auto signs-in and calls `onLogin()` instead of showing the email-pending screen.
- `handleLogin`: removed the `email_verified` gate that blocked unverified accounts.

### What to restore when email is working

**`src/employer/EmployerAuth.tsx` — `handleRegister`**  
Replace:
```ts
// Email verification disabled — sign in immediately after registration
await signInWithRole(register.email, register.password, 'employer');
onLogin();
```
With:
```ts
setPendingEmail(register.email);
setSuccess('Your registration has been submitted. Please verify your email address using the link sent to your inbox.');
```

**`src/employer/EmployerAuth.tsx` — `handleLogin`**  
Replace:
```ts
await signInWithRole(identifier, loginPassword, 'employer');
onLogin();
```
With:
```ts
const session = await signInWithRole(identifier, loginPassword, 'employer');
if (!session.profile.email_verified) {
  setPendingEmail(session.profile.email || identifier);
  setSubmitting(false);
  return;
}
onLogin();
```

---

## 2. Supabase Auth SMTP (Registration Confirmation Emails)

**Status:** Not working — Supabase default email service hits rate limits (3/hour on free tier).  
**Fix when ready:**
- Go to **Supabase Dashboard → Authentication → Settings → SMTP**
- Enter Zoho credentials:
  - Host: `smtp.zoho.in`
  - Port: `465` (SSL) or `587` (STARTTLS)
  - Username: your Zoho email
  - Password: Zoho **App Password** (Zoho Account → Security → App Passwords — not your login password)
  - Sender email + name: `Granvia`
- Also set `VITE_EMAIL_CONFIRMATION_REDIRECT_URL` in `.env` to the correct post-verification URL.

---

## 3. send-email Edge Function (Custom / Transactional Emails)

**Status:** Fixed port bug (`connectTLS` → `connect` for port 587). Not yet deployed.  
**Deploy when ready:**
```bash
npx supabase functions deploy send-email --project-ref uiyllxfhmubtasczqmuj
```
**Set secrets in Supabase Dashboard → Edge Functions → send-email → Secrets:**
```
SMTP_HOST       = smtp.zoho.in
SMTP_PORT       = 465
SMTP_USER       = you@yourdomain.com
SMTP_PASSWORD   = your-zoho-app-password
SMTP_FROM_EMAIL = you@yourdomain.com
SMTP_FROM_NAME  = Granvia
```

---
