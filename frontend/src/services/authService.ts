import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { ProfileRow, UserRole } from '../lib/supabaseTypes';
import { buildProfilePayload } from './profilePayload';

const normalizeProfile = (profile: any): ProfileRow => {
  const roleIdValue = typeof profile.role_id === 'string' ? profile.role_id : undefined;
  const isUuid = !!roleIdValue?.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/);
  return {
    ...profile,
    role_id: roleIdValue ?? profile.role,
    role: (profile.role as UserRole) || (!isUuid ? roleIdValue as UserRole : undefined),
  } as ProfileRow;
};

export type AppSession = {
  user: User;
  session: Session;
  profile: ProfileRow;
};

export type EmployerRegistrationInput = {
  contactPersonName: string;
  mobile: string;
  email: string;
  password: string;
  city: string;
  state: string;
  pincode: string;
  companyName?: string;
  businessType?: string;
  companyAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  website?: string;
};

export async function getCurrentAppSession(): Promise<AppSession | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.user) return null;

  let profile: any = null;
  let profileError: any = null;

  ({ data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, role_id')
    .eq('id', sessionData.session.user.id)
    .maybeSingle());

  if (profileError?.message?.includes('column "role_id" does not exist')) {
    ({ data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .maybeSingle());
  }

  if (profileError) throw profileError;

  if (!profile) {
    const role = (sessionData.session.user.user_metadata?.role as UserRole) || 'guard';
    const payload = await buildProfilePayload({
      userId: sessionData.session.user.id,
      email: sessionData.session.user.email,
      fullName:
        sessionData.session.user.user_metadata?.full_name ||
        sessionData.session.user.email?.split('@')[0] ||
        'User',
      role,
      metadataProfileType: sessionData.session.user.user_metadata?.profile_type,
    });

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .upsert(payload)
      .select('*, role_id')
      .maybeSingle();

    if (createError) throw createError;
    return { user: sessionData.session.user, session: sessionData.session, profile: normalizeProfile(newProfile) };
  }

  return { user: sessionData.session.user, session: sessionData.session, profile: normalizeProfile(profile) };
}

export async function signInWithRole(email: string, password: string, role: UserRole): Promise<AppSession> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;

  const appSession = await getCurrentAppSession();
  if (!appSession) throw new Error('Unable to restore signed-in session.');
  
  // Check role from profile, or fallback to user metadata
  const userRole = appSession.profile.role || appSession.user.user_metadata?.role;
  if (userRole !== role) {
    await supabase.auth.signOut();
    throw new Error('This account is not allowed to access this portal.');
  }
  // Only check account_status if the field exists and is explicitly set to something other than 'active'
  if (appSession.profile.account_status && appSession.profile.account_status !== 'active') {
    await supabase.auth.signOut();
    throw new Error('This account is not active.');
  }
  return appSession;
}

export async function registerEmployer(input: EmployerRegistrationInput) {
  const redirectTo = import.meta.env.VITE_EMAIL_CONFIRMATION_REDIRECT_URL as string | undefined;
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        role: 'employer',
        full_name: input.contactPersonName.trim(),
        contact_person_name: input.contactPersonName.trim(),
        mobile: input.mobile.trim(),
        city: input.city.trim(),
        state: input.state.trim(),
        pincode: input.pincode.trim(),
        created_from: 'app',
        company_name: input.companyName?.trim() || '',
        business_type: input.businessType?.trim() || '',
        company_address: input.companyAddress?.trim() || '',
        gst_number: input.gstNumber?.trim().toUpperCase() || '',
        pan_number: input.panNumber?.trim().toUpperCase() || '',
        website: input.website?.trim() || '',
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function resendEmailVerification(email: string) {
  const redirectTo = import.meta.env.VITE_EMAIL_CONFIRMATION_REDIRECT_URL as string | undefined;
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
