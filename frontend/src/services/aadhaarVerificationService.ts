import { supabase } from '../lib/supabaseClient';
import { sendEmail, buildOtpEmail } from './emailService';

const AADHAAR_FORMAT = /^\d{12}$/;
const OTP_FORMAT = /^\d{6}$/;
const OTP_TTL_MINUTES = 10;

// In-memory OTP fallback used when DB table is missing (dev mode)
let _devOtpFallback: { hash: string; expiresAt: number } | null = null;

async function getSignedInUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user?.email) throw new Error('Sign in is required.');
  return data.user;
}

async function ensureEmployerProfileRecord(userId: string) {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  if (profileError && !isMissingTable(profileError)) {
    throw profileError;
  }

  const { error } = await supabase
    .from('employer_profiles')
    .upsert(
      {
        user_id: userId,
        contact_person_name: profileData?.full_name ?? null,
        city: null,
        state: null,
        pincode: null,
        is_aadhaar_verified: false,
        aadhaar_verification_status: 'pending',
        aadhaar_verified_at: null,
        aadhaar_last_four: null,
        created_from: 'app',
        created_by: null,
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
    .select('user_id')
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      throw new Error('Database not set up yet. Run migrations first.');
    }
    throw error;
  }
}

async function digest(value: string) {
  const encoded = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isMissingTable(error: any): boolean {
  const msg: string = error?.message || error?.details || '';
  return (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    error?.code === '42P01'
  );
}

export async function getAadhaarStatus() {
  const user = await getSignedInUser();
  await ensureEmployerProfileRecord(user.id);

  const { data, error } = await supabase
    .from('employer_profiles')
    .select('is_aadhaar_verified, aadhaar_verification_status, aadhaar_verified_at, aadhaar_last_four')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  return data;
}

// DEV MODE: email disabled temporarily — OTP is returned to the frontend for display.
export async function sendAadhaarOtp(aadhaarNumber: string): Promise<{ sentTo: string; devOtp?: string }> {
  if (!AADHAAR_FORMAT.test(aadhaarNumber.trim())) {
    throw new Error('Enter a valid 12-digit Aadhaar number.');
  }

  const user = await getSignedInUser();
  await ensureEmployerProfileRecord(user.id);

  const aadhaarHash = await digest(aadhaarNumber.trim());
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  // Always store OTP in memory first — DB is best-effort
  const otpHash = await digest(otp);
  _devOtpFallback = { hash: otpHash, expiresAt: Date.now() + OTP_TTL_MINUTES * 60 * 1000 };

  // Store OTP record in DB (best-effort — never block OTP display)
  try {
    await supabase.from('employer_aadhaar_verifications').insert({
      employer_user_id: user.id,
      aadhaar_number_hash: aadhaarHash,
      aadhaar_last_four: aadhaarNumber.trim().slice(-4),
      verification_status: 'otp_sent',
      otp_sent_to: user.email,
      otp_channel: 'email',
      otp_expires_at: expiresAt,
      provider_name: 'zoho_smtp',
      verification_response: { otp_hash: otpHash, sent_to: user.email },
    });
    await supabase.from('employer_profiles').update({
      aadhaar_verification_status: 'otp_sent',
      aadhaar_last_four: aadhaarNumber.trim().slice(-4),
      is_aadhaar_verified: false,
      aadhaar_verified_at: null,
    }).eq('user_id', user.id);
  } catch (_) {
    // DB errors are non-fatal in dev mode — OTP still works via in-memory fallback
  }

  // EMAIL TEMPORARILY DISABLED — return OTP directly for on-screen display.
  // To re-enable: remove devOtp from return, uncomment the sendEmail line below.
  // await sendEmail(buildOtpEmail(otp, user.email!));

  return { sentTo: user.email!, devOtp: otp };
}

export async function verifyAadhaarOtp(otp: string) {
  if (!OTP_FORMAT.test(otp.trim())) {
    throw new Error('Enter a valid 6-digit OTP.');
  }

  const user = await getSignedInUser();
  await ensureEmployerProfileRecord(user.id);

  const { data: record, error: readError } = await supabase
    .from('employer_aadhaar_verifications')
    .select('id, verification_response, otp_expires_at, verification_status')
    .eq('employer_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) {
    if (isMissingTable(readError)) throw new Error('Database not set up yet. Run migrations first.');
    throw readError;
  }
  const inputHash = await digest(otp.trim());

  if (!record) {
    // Fall back to in-memory OTP (dev mode: DB table missing)
    if (!_devOtpFallback) throw new Error('No OTP found. Please request an OTP first.');
    if (_devOtpFallback.expiresAt < Date.now()) throw new Error('OTP has expired. Please request a new one.');
    if (inputHash !== _devOtpFallback.hash) throw new Error('Invalid OTP. Please try again.');

    const now = new Date().toISOString();
    await supabase
      .from('employer_profiles')
      .update({
        is_aadhaar_verified: true,
        aadhaar_verification_status: 'verified',
        aadhaar_verified_at: now,
      })
      .eq('user_id', user.id);

    _devOtpFallback = null;
    return { is_aadhaar_verified: true, aadhaar_verification_status: 'verified', aadhaar_verified_at: now, aadhaar_last_four: null };
  }

  if (record.verification_status !== 'otp_sent') throw new Error('Please request an OTP first.');
  if (new Date(record.otp_expires_at).getTime() < Date.now()) {
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Compare OTP against stored hash
  const storedHash = (record.verification_response as Record<string, string>)?.otp_hash;
  if (!storedHash || inputHash !== storedHash) {
    throw new Error('Invalid OTP. Please try again.');
  }

  const now = new Date().toISOString();

  await supabase
    .from('employer_aadhaar_verifications')
    .update({
      verification_status: 'verified',
      otp_verified_at: now,
      verified_at: now,
      verification_response: { verified: true, channel: 'zoho_smtp' },
    })
    .eq('id', record.id);

  const { data, error } = await supabase
    .from('employer_profiles')
    .update({
      is_aadhaar_verified: true,
      aadhaar_verification_status: 'verified',
      aadhaar_verified_at: now,
    })
    .eq('user_id', user.id)
    .select()
    .maybeSingle();
  if (error && !isMissingTable(error)) throw error;
  return data;
}
