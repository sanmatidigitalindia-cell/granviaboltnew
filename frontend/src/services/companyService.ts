import { supabase } from '../lib/supabaseClient';

export type CompanyInput = {
  company_name: string;
  business_type?: string;
  registration_type?: string;
  gst_number?: string;
  pan_number?: string;
  company_email?: string;
  company_phone?: string;
  website?: string;
  description?: string;
  registered_address?: string;
  billing_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in is required.');
  return data.user.id;
}

export async function listMyCompanies() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('employer_companies')
    .select('*')
    .eq('employer_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCompany(input: CompanyInput) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('employer_companies')
    .insert({
      ...input,
      employer_user_id: userId,
      gst_number: input.gst_number?.trim().toUpperCase(),
      pan_number: input.pan_number?.trim().toUpperCase(),
      account_status: 'active',
      verification_status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(companyId: string, input: Partial<CompanyInput> & { account_status?: string }) {
  const { data, error } = await supabase
    .from('employer_companies')
    .update(input)
    .eq('id', companyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
