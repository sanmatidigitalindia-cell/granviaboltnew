import { Employer, EmployerAadhaarVerification, EmployerCompany, storage } from './storage';

export type EmployerCreationContext = {
  createdFrom: 'app' | 'super_admin';
  createdBy: string | null;
};

export type EmployerCreationInput = {
  companyName?: string;
  contactPersonName: string;
  mobile: string;
  email: string;
  password?: string;
  companyAddress?: string;
  city: string;
  state: string;
  pincode: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
  website?: string;
  companyLogo?: string | null;
  accountStatus?: Employer['accountStatus'];
  remarks?: string;
};

export type EmployerCreationResult = {
  employer: Employer;
  temporaryPassword: string | null;
};

function generateTemporaryPassword() {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `Granvia@${suffix}`;
}

function validateEmployerInput(data: EmployerCreationInput) {
  if (!data.contactPersonName.trim()) throw new Error('Contact person name is required.');
  if (!data.mobile.trim().match(/^[6-9]\d{9}$/)) throw new Error('Enter a valid 10 digit Indian mobile number.');
  if (!data.email.trim().match(/^\S+@\S+\.\S+$/)) throw new Error('Enter a valid email address.');
  if (!data.city.trim() || !data.state.trim() || !data.pincode.trim().match(/^\d{6}$/)) throw new Error('City, state and 6 digit pincode are required.');
  const hasCompany = Boolean(data.companyName?.trim() || data.companyAddress?.trim() || data.businessType?.trim() || data.gstNumber?.trim() || data.panNumber?.trim());
  if (hasCompany && !data.companyName?.trim()) throw new Error('Company name is required when adding the first company.');
  if (hasCompany && !data.companyAddress?.trim()) throw new Error('Company address is required when adding the first company.');
  if (hasCompany && !data.businessType?.trim()) throw new Error('Business type is required when adding the first company.');
  if (data.gstNumber && !data.gstNumber.trim().toUpperCase().match(/^[0-9A-Z]{15}$/)) throw new Error('Enter a valid GST number.');
  if (data.panNumber && !data.panNumber.trim().toUpperCase().match(/^[A-Z]{5}[0-9]{4}[A-Z]$/)) throw new Error('Enter a valid PAN number.');
  if (storage.employerExists(data.email, data.mobile)) throw new Error('An employer with this email or mobile already exists.');
}

export const EmployerService = {
  createEmployer(data: EmployerCreationInput, context: EmployerCreationContext): EmployerCreationResult {
    validateEmployerInput(data);
    const temporaryPassword = data.password?.trim() ? null : generateTemporaryPassword();
    const password = data.password?.trim() || temporaryPassword!;

    const employer: Employer = {
      id: storage.generateId('EMP'),
      companyName: data.companyName?.trim() || '',
      contactPersonName: data.contactPersonName.trim(),
      designation: 'Authorized Representative',
      mobile: data.mobile.trim(),
      email: data.email.trim().toLowerCase(),
      password,
      companyAddress: data.companyAddress?.trim() || '',
      billingAddress: data.companyAddress?.trim() || '',
      city: data.city.trim(),
      state: data.state.trim(),
      pincode: data.pincode.trim(),
      businessType: data.businessType?.trim() || '',
      gstNumber: data.gstNumber?.trim().toUpperCase() || '',
      panNumber: data.panNumber?.trim().toUpperCase() || '',
      website: data.website?.trim() || '',
      logo: data.companyLogo || null,
      description: '',
      verificationStatus: 'Pending',
      accountStatus: data.accountStatus || (context.createdFrom === 'super_admin' ? 'Active' : 'Pending'),
      role: 'employer',
      createdFrom: context.createdFrom,
      createdBy: context.createdBy,
      profileStatus: 'Incomplete',
      isAadhaarVerified: false,
      aadhaarVerificationStatus: 'pending',
      aadhaarVerifiedAt: null,
      aadhaarLastFour: '',
      adminRemarks: data.remarks || 'Employer profile created. Aadhaar verification is pending.',
      rejectionReason: '',
      createdAt: new Date().toISOString(),
    };

    storage.addEmployer(employer);

    if (data.companyName?.trim()) {
      const now = new Date().toISOString();
      const company: EmployerCompany = {
        id: storage.generateId('COM'),
        employerId: employer.id,
        companyName: data.companyName.trim(),
        businessType: data.businessType?.trim() || '',
        registrationType: 'Private Limited',
        gstNumber: data.gstNumber?.trim().toUpperCase() || '',
        panNumber: data.panNumber?.trim().toUpperCase() || '',
        companyEmail: employer.email,
        companyPhone: employer.mobile,
        website: data.website?.trim() || '',
        logo: data.companyLogo || null,
        description: '',
        registeredAddress: data.companyAddress?.trim() || '',
        billingAddress: data.companyAddress?.trim() || '',
        city: employer.city,
        state: employer.state,
        pincode: employer.pincode,
        verificationStatus: 'Pending',
        accountStatus: 'Pending',
        adminRemarks: 'Company profile created. Document verification is pending.',
        rejectionReason: '',
        createdAt: now,
        updatedAt: now,
      };
      storage.addEmployerCompany(company);
      storage.setActiveCompanyId(employer.id, company.id);
    }

    const aadhaarRecord: EmployerAadhaarVerification = {
      id: storage.generateId('EAV'),
      employerId: employer.id,
      aadhaarNumberHash: '',
      aadhaarLastFour: '',
      verificationStatus: 'pending',
      otpHash: '',
      otpSentTo: employer.email,
      otpChannel: 'email',
      otpExpiresAt: '',
      otpVerifiedAt: null,
      otpAttempts: 0,
      resendCount: 0,
      providerName: 'email_otp',
      providerReferenceId: '',
      verificationResponse: '',
      verifiedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveEmployerAadhaarVerification(aadhaarRecord);

    return { employer, temporaryPassword };
  },
};
