import { supabase } from '../lib/supabaseClient';

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in is required.');
  return data.user.id;
}

export async function listCompanySites(companyId: string) {
  const { data, error } = await supabase
    .from('company_sites')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCompanySite(input: Record<string, unknown> & { company_id: string; site_name: string }) {
  const userId = await getUserId();
  // Verify parent company exists before inserting child record
  const { data: company, error: companyCheckError } = await supabase
    .from('employer_companies')
    .select('id')
    .eq('id', input.company_id)
    .eq('employer_user_id', userId)
    .maybeSingle();
  if (companyCheckError) throw companyCheckError;
  if (!company) throw new Error('Company not found. Please create a company before adding sites.');

  const { data, error } = await supabase
    .from('company_sites')
    .insert({ ...input, name: input.site_name, employer_user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompanySite(siteId: string, updates: Record<string, unknown>) {
  if (updates.site_name) updates = { ...updates, name: updates.site_name };
  const { data, error } = await supabase
    .from('company_sites')
    .update(updates)
    .eq('id', siteId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
