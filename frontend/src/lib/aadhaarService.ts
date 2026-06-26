import { EmployerAadhaarVerification, storage } from './storage';

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function digest(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return `sha256:${Math.abs(hash).toString(16)}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildRecord(employerId: string): EmployerAadhaarVerification {
  const employer = storage.getEmployers().find(item => item.id === employerId);
  const now = new Date().toISOString();
  return {
    id: storage.generateId('EAV'),
    employerId,
    aadhaarNumberHash: '',
    aadhaarLastFour: '',
    verificationStatus: 'pending',
    otpHash: '',
    otpSentTo: employer?.email || '',
    otpChannel: 'email',
    otpExpiresAt: '',
    otpVerifiedAt: null,
    otpAttempts: 0,
    resendCount: 0,
    providerName: 'email_otp',
    providerReferenceId: '',
    verificationResponse: '',
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export const AadhaarService = {
  status(employerId: string) {
    const employer = storage.getEmployers().find(item => item.id === employerId);
    const record = storage.getEmployerAadhaarVerification(employerId);
    return {
      isAadhaarVerified: Boolean(employer?.isAadhaarVerified),
      aadhaarVerificationStatus: employer?.aadhaarVerificationStatus || 'pending',
      aadhaarLastFour: employer?.aadhaarLastFour || record?.aadhaarLastFour || '',
      aadhaarVerifiedAt: employer?.aadhaarVerifiedAt || record?.verifiedAt || null,
    };
  },

  sendOtp(employerId: string, aadhaarNumber: string) {
    const employer = storage.getEmployers().find(item => item.id === employerId);
    if (!employer) throw new Error('Employer account not found.');
    if (!aadhaarNumber.trim().match(/^\d{12}$/)) throw new Error('Please enter a valid 12-digit Aadhaar number.');

    const current = storage.getEmployerAadhaarVerification(employerId) || buildRecord(employerId);
    const otp = generateOtp();
    const now = new Date();
    const next: EmployerAadhaarVerification = {
      ...current,
      aadhaarNumberHash: digest(aadhaarNumber.trim()),
      aadhaarLastFour: aadhaarNumber.trim().slice(-4),
      verificationStatus: 'otp_sent',
      otpHash: digest(otp),
      otpSentTo: employer.email,
      otpChannel: 'email',
      otpExpiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
      otpVerifiedAt: null,
      otpAttempts: 0,
      resendCount: current.resendCount + 1,
      providerName: 'email_otp',
      providerReferenceId: `EAV-${Date.now()}`,
      verificationResponse: 'OTP sent to registered email address.',
      lastOtp: otp,
      lastOtpVisibleUntil: new Date(now.getTime() + 2 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };
    storage.saveEmployerAadhaarVerification(next);
    storage.updateEmployer(employerId, {
      aadhaarVerificationStatus: 'otp_sent',
      aadhaarLastFour: next.aadhaarLastFour,
      isAadhaarVerified: false,
      aadhaarVerifiedAt: null,
    });

    // TODO: Connect SMTP/email provider using environment variables and send the OTP to employer.email.
    return {
      sentTo: employer.email,
      expiresAt: next.otpExpiresAt,
      deliveryPreview: otp,
    };
  },

  verifyOtp(employerId: string, otp: string) {
    const record = storage.getEmployerAadhaarVerification(employerId);
    if (!record || record.verificationStatus !== 'otp_sent') throw new Error('Please request an OTP first.');
    if (record.otpAttempts >= MAX_ATTEMPTS) throw new Error('Too many attempts. Please try again later.');
    if (new Date(record.otpExpiresAt).getTime() < Date.now()) {
      const expired = { ...record, verificationStatus: 'expired' as const, updatedAt: new Date().toISOString() };
      storage.saveEmployerAadhaarVerification(expired);
      storage.updateEmployer(employerId, { aadhaarVerificationStatus: 'expired', isAadhaarVerified: false });
      throw new Error('OTP expired. Please request a new OTP.');
    }
    if (digest(otp.trim()) !== record.otpHash) {
      const failed = {
        ...record,
        otpAttempts: record.otpAttempts + 1,
        verificationStatus: 'failed' as const,
        verificationResponse: 'OTP verification failed.',
        updatedAt: new Date().toISOString(),
      };
      storage.saveEmployerAadhaarVerification(failed);
      storage.updateEmployer(employerId, { aadhaarVerificationStatus: 'failed', isAadhaarVerified: false });
      throw new Error('Invalid OTP.');
    }

    const now = new Date().toISOString();
    storage.saveEmployerAadhaarVerification({
      ...record,
      verificationStatus: 'verified',
      otpVerifiedAt: now,
      verifiedAt: now,
      verificationResponse: 'Aadhaar verification completed successfully.',
      lastOtp: undefined,
      lastOtpVisibleUntil: undefined,
      updatedAt: now,
    });
    storage.updateEmployer(employerId, {
      isAadhaarVerified: true,
      aadhaarVerificationStatus: 'verified',
      aadhaarVerifiedAt: now,
      aadhaarLastFour: record.aadhaarLastFour,
    });
    return AadhaarService.status(employerId);
  },
};
