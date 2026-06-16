import { Employer, EmployerCompany, EmployerDocument, CompanySite } from '../lib/storage';
import { createEphemeralSupabaseClient, supabase } from '../lib/supabaseClient';
import { getRoleIdByName } from './roleService';

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
  accountStatus?: Employer['accountStatus'];
  remarks?: string;
};

export type EmployerManagementJobSummary = {
  id: string;
  employerId: string;
  companyId: string;
};

export type EmployerManagementData = {
  employers: Employer[];
  companies: EmployerCompany[];
  documents: EmployerDocument[];
  sites: CompanySite[];
  jobs: EmployerManagementJobSummary[];
  walletBalances: Record<string, number>;
};

export type EmployerCreationResult = {
  employer: Employer;
  temporaryPassword: string | null;
};

type ProfileRow = Record<string, any>;
type EmployerProfileRow = Record<string, any>;
type EmployerCompanyRow = Record<string, any>;
type DocumentRow = Record<string, any>;
type SiteRow = Record<string, any>;
type JobRow = Record<string, any>;
type WalletRow = Record<string, any>;

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

function generateTemporaryPassword() {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `Granvia@${suffix}`;
}

function toTitleStatus<T extends string>(value: unknown, fallback: T): T {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'active') return 'Active' as T;
  if (normalized === 'inactive') return 'Inactive' as T;
  if (normalized === 'blocked') return 'Blocked' as T;
  if (normalized === 'verified') return 'Verified' as T;
  if (normalized === 'rejected') return 'Rejected' as T;
  if (normalized === 'complete') return 'Complete' as T;
  if (normalized === 'incomplete') return 'Incomplete' as T;
  if (normalized === 'pending') return 'Pending' as T;
  return fallback;
}

function toDbStatus(value: unknown, fallback: string) {
  return String(value || fallback).trim().toLowerCase().replace(/\s+/g, '_');
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
}

function mapCompany(row: EmployerCompanyRow): EmployerCompany {
  return {
    id: row.id,
    employerId: row.employer_user_id,
    companyName: row.company_name || '',
    businessType: row.business_type || '',
    registrationType: row.registration_type || '',
    gstNumber: row.gst_number || '',
    panNumber: row.pan_number || '',
    companyEmail: row.company_email || '',
    companyPhone: row.company_phone || '',
    website: row.website || '',
    logo: row.logo_url || null,
    description: row.description || '',
    registeredAddress: row.registered_address || '',
    billingAddress: row.billing_address || '',
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    verificationStatus: toTitleStatus(row.verification_status, 'Pending'),
    accountStatus: toTitleStatus(row.account_status, 'Pending'),
    adminRemarks: row.admin_remarks || '',
    rejectionReason: row.rejection_reason || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || '',
  };
}

function mapEmployer(profile: ProfileRow, employerProfile?: EmployerProfileRow, firstCompany?: EmployerCompany): Employer {
  const fullName = profile.full_name || employerProfile?.contact_person_name || '';
  const city = employerProfile?.city || firstCompany?.city || '';
  const state = employerProfile?.state || firstCompany?.state || '';
  const pincode = employerProfile?.pincode || firstCompany?.pincode || '';
  const hasProfile = Boolean(fullName && city && state && pincode);
  return {
    id: profile.id,
    companyName: firstCompany?.companyName || '',
    contactPersonName: employerProfile?.contact_person_name || fullName,
    designation: employerProfile?.designation || 'Authorized Representative',
    mobile: profile.mobile || firstCompany?.companyPhone || '',
    email: profile.email || firstCompany?.companyEmail || '',
    password: '',
    companyAddress: firstCompany?.registeredAddress || '',
    billingAddress: firstCompany?.billingAddress || '',
    city,
    state,
    pincode,
    businessType: firstCompany?.businessType || '',
    gstNumber: firstCompany?.gstNumber || '',
    panNumber: firstCompany?.panNumber || '',
    website: firstCompany?.website || '',
    logo: firstCompany?.logo || null,
    description: firstCompany?.description || '',
    verificationStatus: toTitleStatus(employerProfile?.verification_status, 'Pending'),
    accountStatus: toTitleStatus(profile.account_status, 'Pending'),
    role: 'employer',
    createdFrom: employerProfile?.created_from === 'super_admin' ? 'super_admin' : 'app',
    createdBy: employerProfile?.created_by || null,
    profileStatus: toTitleStatus(employerProfile?.profile_status, hasProfile ? 'Complete' : 'Incomplete'),
    isAadhaarVerified: Boolean(employerProfile?.is_aadhaar_verified),
    aadhaarVerificationStatus: (employerProfile?.aadhaar_verification_status || 'pending') as Employer['aadhaarVerificationStatus'],
    aadhaarVerifiedAt: employerProfile?.aadhaar_verified_at || null,
    aadhaarLastFour: employerProfile?.aadhaar_last_four || '',
    adminRemarks: employerProfile?.admin_remarks || '',
    rejectionReason: employerProfile?.rejection_reason || '',
    createdAt: employerProfile?.created_at || profile.created_at || '',
  };
}

function mapDocument(row: DocumentRow): EmployerDocument {
  const filePath = String(row.file_path || row.file_url || '');
  return {
    id: row.id,
    employerId: row.employer_user_id,
    companyId: row.company_id,
    type: row.document_type || 'Document',
    fileName: filePath.split('/').filter(Boolean).pop() || filePath || 'Uploaded document',
    fileSize: Number(row.file_size || 0),
    fileType: row.file_type || '',
    uploadedAt: row.created_at || '',
    status: toTitleStatus(row.verification_status, 'Pending'),
    adminRemarks: row.admin_remarks || '',
    rejectionReason: row.rejection_reason || '',
  };
}

function mapSite(row: SiteRow): CompanySite {
  return {
    id: row.id,
    employerId: row.employer_user_id,
    companyId: row.company_id,
    siteName: row.site_name || '',
    siteType: row.site_type || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    contactPerson: row.contact_person || '',
    contactMobile: row.contact_mobile || '',
    mapsLocation: '',
    latitude: row.latitude == null ? '' : String(row.latitude),
    longitude: row.longitude == null ? '' : String(row.longitude),
    shiftDetails: row.shift_details || '',
    notes: row.notes || '',
    status: toTitleStatus(row.status, 'Active'),
    createdAt: row.created_at || '',
  };
}

async function ensureUniqueEmployer(email: string, mobile: string, ignoreId?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, mobile, role')
    .eq('role', 'employer');
  if (error) throw error;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedMobile = mobile.trim();
  const duplicate = (data || []).some(item =>
    item.id !== ignoreId &&
    (String(item.email || '').toLowerCase() === normalizedEmail || String(item.mobile || '') === normalizedMobile)
  );
  if (duplicate) throw new Error('Another employer already uses this email or mobile.');
}

// Returns true when a Supabase/PostgREST error means the table simply does not exist yet.
function isMissingTableError(error: any): boolean {
  const msg: string = error?.message || error?.details || '';
  return (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    error?.code === '42P01'
  );
}

// Safely fetch a table — returns empty array when the table has not been created yet.
async function safeFrom<T>(query: PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function listEmployerManagementData(): Promise<EmployerManagementData> {
  const [
    profilesData,
    employerProfilesData,
    companiesData,
    documentsData,
    sitesData,
    jobsData,
    walletsData,
  ] = await Promise.all([
    safeFrom(supabase.from('profiles').select('*').eq('role', 'employer').order('created_at', { ascending: false })),
    safeFrom(supabase.from('employer_profiles').select('*')),
    safeFrom(supabase.from('employer_companies').select('*').order('created_at', { ascending: false })),
    safeFrom(supabase.from('company_documents').select('*').order('created_at', { ascending: false })),
    safeFrom(supabase.from('company_sites').select('*')),
    safeFrom(supabase.from('job_posts').select('id, employer_user_id, company_id')),
    safeFrom(supabase.from('employer_wallets').select('*')),
  ]);

  const companies = (companiesData as EmployerCompanyRow[]).map(mapCompany);
  const employerProfileByUserId = new Map<string, EmployerProfileRow>();
  (employerProfilesData as EmployerProfileRow[]).forEach(row => employerProfileByUserId.set(row.user_id, row));

  const companiesByEmployerId = new Map<string, EmployerCompany[]>();
  companies.forEach(company => {
    const list = companiesByEmployerId.get(company.employerId) || [];
    list.push(company);
    companiesByEmployerId.set(company.employerId, list);
  });

  const employers = (profilesData as ProfileRow[]).map(profile =>
    mapEmployer(profile, employerProfileByUserId.get(profile.id), companiesByEmployerId.get(profile.id)?.[0]),
  );

  const walletBalances: Record<string, number> = {};
  (walletsData as WalletRow[]).forEach(row => {
    walletBalances[row.employer_user_id] = Number(row.balance || 0);
  });

  return {
    employers,
    companies,
    documents: (documentsData as DocumentRow[]).map(mapDocument),
    sites: (sitesData as SiteRow[]).map(mapSite),
    jobs: (jobsData as JobRow[]).map(row => ({
      id: row.id,
      employerId: row.employer_user_id,
      companyId: row.company_id,
    })),
    walletBalances,
  };
}

export async function createEmployerFromAdmin(input: EmployerCreationInput): Promise<EmployerCreationResult> {
  validateEmployerInput(input);
  const email = input.email.trim().toLowerCase();
  const mobile = input.mobile.trim();
  await ensureUniqueEmployer(email, mobile);

  const temporaryPassword = input.password?.trim() ? null : generateTemporaryPassword();
  const password = input.password?.trim() || temporaryPassword!;
  const { data: adminData } = await supabase.auth.getUser();
  const adminId = adminData.user?.id || null;
  const authClient = createEphemeralSupabaseClient();

  const { data: authData, error: authError } = await authClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'employer',
        full_name: input.contactPersonName.trim(),
        contact_person_name: input.contactPersonName.trim(),
        mobile,
        city: input.city.trim(),
        state: input.state.trim(),
        pincode: input.pincode.trim(),
        created_from: 'super_admin',
        created_by: adminId || '',
        company_name: input.companyName?.trim() || '',
        business_type: input.businessType?.trim() || '',
        company_address: input.companyAddress?.trim() || '',
        gst_number: input.gstNumber?.trim().toUpperCase() || '',
        pan_number: input.panNumber?.trim().toUpperCase() || '',
        website: input.website?.trim() || '',
      },
    },
  });
  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) throw new Error('Supabase did not return the new employer user.');

  // Look up role UUID — live DB requires role_id NOT NULL, profile_type NOT NULL, full_name NOT NULL.
  const employerRoleId = await getRoleIdByName('employer');

  const profileResult = await supabase.from('profiles').upsert({
    id: userId,
    role: 'employer',
    role_id: employerRoleId,   // NOT NULL in live DB
    profile_type: 'employer',  // NOT NULL in live DB
    full_name: input.contactPersonName.trim(),
    mobile,
    email,
    account_status: toDbStatus(input.accountStatus, 'active'),
  });
  if (profileResult.error) throw profileResult.error;

  const employerProfileResult = await supabase.from('employer_profiles').upsert({
    user_id: userId,
    contact_person_name: input.contactPersonName.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    pincode: input.pincode.trim(),
    created_from: 'super_admin',
    created_by: adminId && uuidPattern.test(adminId) ? adminId : null,
    verification_status: 'pending',
    profile_status: input.companyName && input.companyAddress ? 'complete' : 'incomplete',
    admin_remarks: input.remarks || 'Employer profile created. Aadhaar verification is pending.',
    rejection_reason: '',
  }, { onConflict: 'user_id' });
  if (employerProfileResult.error) throw employerProfileResult.error;

  if (input.companyName?.trim()) {
    const { data: company } = await supabase
      .from('employer_companies')
      .select('id')
      .eq('employer_user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const companyPayload = {
      employer_user_id: userId,
      company_name: input.companyName.trim(),
      business_type: input.businessType?.trim() || '',
      registered_address: input.companyAddress?.trim() || '',
      billing_address: input.companyAddress?.trim() || '',
      gst_number: input.gstNumber?.trim().toUpperCase() || '',
      pan_number: input.panNumber?.trim().toUpperCase() || '',
      website: input.website?.trim() || '',
      company_email: email,
      company_phone: mobile,
      city: input.city.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
      verification_status: 'pending',
      account_status: 'pending',
      admin_remarks: 'Company profile created. Document verification is pending.',
      rejection_reason: '',
    };

    const companyResult = company?.id
      ? await supabase.from('employer_companies').update(companyPayload).eq('id', company.id)
      : await supabase.from('employer_companies').insert(companyPayload);
    if (companyResult.error) throw companyResult.error;
  }

  const data = await listEmployerManagementData();
  const employer = data.employers.find(item => item.id === userId);
  if (!employer) throw new Error('Employer was created but could not be loaded.');
  return { employer, temporaryPassword };
}

export async function updateEmployerFromAdmin(id: string, updates: Partial<Employer>) {
  const profileUpdates: Record<string, unknown> = {};
  const employerUpdates: Record<string, unknown> = {};
  const companyUpdates: Record<string, unknown> = {};

  if (updates.contactPersonName !== undefined) {
    profileUpdates.full_name = updates.contactPersonName;
    employerUpdates.contact_person_name = updates.contactPersonName;
  }
  if (updates.mobile !== undefined) profileUpdates.mobile = updates.mobile;
  if (updates.email !== undefined) profileUpdates.email = updates.email;
  if (updates.accountStatus !== undefined) profileUpdates.account_status = toDbStatus(updates.accountStatus, 'pending');
  if (updates.city !== undefined) employerUpdates.city = updates.city;
  if (updates.state !== undefined) employerUpdates.state = updates.state;
  if (updates.pincode !== undefined) employerUpdates.pincode = updates.pincode;
  if (updates.designation !== undefined) employerUpdates.designation = updates.designation;
  if (updates.verificationStatus !== undefined) employerUpdates.verification_status = toDbStatus(updates.verificationStatus, 'pending');
  if (updates.profileStatus !== undefined) employerUpdates.profile_status = toDbStatus(updates.profileStatus, 'incomplete');
  if (updates.adminRemarks !== undefined) employerUpdates.admin_remarks = updates.adminRemarks;
  if (updates.rejectionReason !== undefined) employerUpdates.rejection_reason = updates.rejectionReason;

  if (updates.companyName !== undefined) companyUpdates.company_name = updates.companyName;
  if (updates.businessType !== undefined) companyUpdates.business_type = updates.businessType;
  if (updates.gstNumber !== undefined) companyUpdates.gst_number = updates.gstNumber;
  if (updates.panNumber !== undefined) companyUpdates.pan_number = updates.panNumber;
  if (updates.website !== undefined) companyUpdates.website = updates.website;
  if (updates.description !== undefined) companyUpdates.description = updates.description;
  if (updates.companyAddress !== undefined) companyUpdates.registered_address = updates.companyAddress;
  if (updates.billingAddress !== undefined) companyUpdates.billing_address = updates.billingAddress;
  if (updates.city !== undefined) companyUpdates.city = updates.city;
  if (updates.state !== undefined) companyUpdates.state = updates.state;
  if (updates.pincode !== undefined) companyUpdates.pincode = updates.pincode;
  if (updates.email !== undefined) companyUpdates.company_email = updates.email;
  if (updates.mobile !== undefined) companyUpdates.company_phone = updates.mobile;

  if (Object.keys(profileUpdates).length) {
    const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', id);
    if (error) throw error;
  }

  if (Object.keys(employerUpdates).length) {
    const { error } = await supabase.from('employer_profiles').update(employerUpdates).eq('user_id', id);
    if (error) throw error;
  }

  if (Object.keys(companyUpdates).length) {
    const { data: company, error: companyError } = await supabase
      .from('employer_companies')
      .select('id')
      .eq('employer_user_id', id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (companyError) throw companyError;
    if (company?.id) {
      const { error } = await supabase.from('employer_companies').update(companyUpdates).eq('id', company.id);
      if (error) throw error;
    }
  }
}

export async function assertUniqueEmployerForEdit(id: string, email: string, mobile: string) {
  await ensureUniqueEmployer(email, mobile, id);
}

export async function deleteEmployerFromAdmin(id: string) {
  // Single RPC handles the cascade in SECURITY DEFINER context.
  // We still verify the delete result because the live DB may have an older
  // function definition that reports success without removing the employer data.
  const { error } = await supabase.rpc('admin_delete_employer' as any, { target_user_id: id } as any);
  if (error) throw error;

  const [profileCheck, employerProfileCheck, companyCheck, siteCheck, jobCheck] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', id).maybeSingle(),
    supabase.from('employer_profiles').select('user_id').eq('user_id', id).maybeSingle(),
    supabase.from('employer_companies').select('id').eq('employer_user_id', id).maybeSingle(),
    supabase.from('company_sites').select('id').eq('employer_user_id', id).maybeSingle(),
    supabase.from('job_posts').select('id').eq('employer_user_id', id).maybeSingle(),
  ]);

  if (profileCheck.error) throw profileCheck.error;
  if (employerProfileCheck.error) throw employerProfileCheck.error;
  if (companyCheck.error) throw companyCheck.error;
  if (siteCheck.error) throw siteCheck.error;
  if (jobCheck.error) throw jobCheck.error;

  const stillExists = Boolean(
    profileCheck.data ||
    employerProfileCheck.data ||
    companyCheck.data ||
    siteCheck.data ||
    jobCheck.data,
  );

  if (stillExists) {
    throw new Error('Delete RPC returned success, but employer records are still present. Redeploy the Supabase admin_delete_employer migration in the live project.');
  }
}
