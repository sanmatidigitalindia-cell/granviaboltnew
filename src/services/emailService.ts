// Thin wrapper around the send-email Supabase Edge Function.
// Requires the user to be signed in (the Edge Function enforces auth).

import { supabase } from '../lib/supabaseClient';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { error } = await supabase.functions.invoke('send-email', {
    body: options,
  });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

// ── Pre-built email templates ─────────────────────────────────────────────────

export function buildOtpEmail(otp: string, recipientEmail: string): SendEmailOptions {
  return {
    to: recipientEmail,
    subject: 'Your Aadhaar Verification OTP — Granvia',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f1e3c;margin:0;">Granvia Security Platform</h2>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Aadhaar Verification</p>
        </div>
        <div style="background:white;border-radius:10px;padding:28px;border:1px solid #e2e8f0;">
          <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hi,</p>
          <p style="color:#374151;font-size:15px;margin:0 0 24px;">
            Use the OTP below to verify your Aadhaar on the Granvia employer portal.
            This code is valid for <strong>10 minutes</strong>.
          </p>
          <div style="text-align:center;background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#0f1e3c;">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            If you did not request this, please ignore this email.<br>
            Do not share this OTP with anyone.
          </p>
        </div>
        <p style="color:#cbd5e1;font-size:11px;text-align:center;margin-top:20px;">
          © Granvia Security Platform · Sanmati Digital
        </p>
      </div>
    `,
  };
}

export function buildWelcomeEmail(name: string, email: string, tempPassword?: string): SendEmailOptions {
  return {
    to: email,
    subject: 'Welcome to Granvia Employer Portal',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#0f1e3c;margin:0;">Welcome to Granvia</h2>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Security Guard Management Platform</p>
        </div>
        <div style="background:white;border-radius:10px;padding:28px;border:1px solid #e2e8f0;">
          <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="color:#374151;font-size:15px;margin:0 0 20px;">
            Your employer account has been created on the Granvia platform.
            You can now log in and start posting jobs.
          </p>
          <p style="color:#374151;font-size:14px;margin:0 0 6px;"><strong>Email:</strong> ${email}</p>
          ${tempPassword ? `<p style="color:#374151;font-size:14px;margin:0 0 20px;"><strong>Temporary Password:</strong> <code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;">${tempPassword}</code></p>` : ''}
          <p style="color:#374151;font-size:14px;margin:0 0 20px;">
            Please complete your Aadhaar verification after login to unlock all features.
          </p>
          <div style="text-align:center;">
            <a href="${import.meta.env.VITE_SITE_URL ?? 'https://granvia.in'}/employer"
               style="display:inline-block;background:#0f1e3c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
              Login to Granvia
            </a>
          </div>
        </div>
        <p style="color:#cbd5e1;font-size:11px;text-align:center;margin-top:20px;">
          © Granvia Security Platform · Sanmati Digital
        </p>
      </div>
    `,
  };
}
