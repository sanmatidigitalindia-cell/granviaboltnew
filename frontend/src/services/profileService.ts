import { supabase } from '../lib/supabaseClient';

const normalizeProfile = (profile: any) => ({
  ...profile,
  role_id: profile.role_id ?? profile.role,
  role: profile.role || profile.role_id,
});

// Returns true when the error means the table simply hasn't been created yet.
function isMissingTable(error: any): boolean {
  const msg: string = error?.message || error?.details || '';
  return (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    error?.code === '42P01'
  );
}

export async function getMyProfile() {
  let data: any = null;
  let error: any = null;

  ({ data, error } = await supabase.from('profiles').select('*, role_id').maybeSingle());
  if (error?.message?.includes('column "role_id" does not exist')) {
    ({ data, error } = await supabase.from('profiles').select('*').maybeSingle());
  }
  if (error) throw error;
  return normalizeProfile(data);
}

export async function getMyEmployerProfile() {
  const { data, error } = await supabase.from('employer_profiles').select('*').maybeSingle();
  if (error) {
    // Table missing — migrations not yet applied. Degrade gracefully.
    if (isMissingTable(error)) return null;
    throw error;
  }
  return data;
}

export async function updateMyProfile(updates: { full_name?: string; mobile?: string }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Sign in is required.');
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userData.user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMyEmployerProfile(updates: {
  contact_person_name?: string;
  designation?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Sign in is required.');

  const { data, error } = await supabase
    .from('employer_profiles')
    .update(updates)
    .eq('user_id', userData.user.id)
    .select()
    .single();
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  return data;
}
