import { supabase } from '../lib/supabaseClient';

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in is required.');
  return data.user.id;
}

// ── Interview requests ────────────────────────────────────────────────────────

export async function listInterviewRequests(companyId?: string) {
  const userId = await getUserId();
  let query = supabase
    .from('interview_requests')
    .select('*, job_posts(title), guard_profiles(full_name, mobile)')
    .eq('employer_user_id', userId)
    .order('created_at', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createInterviewRequest(input: Record<string, unknown>) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('interview_requests')
    .insert({ ...input, employer_user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInterviewRequest(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('interview_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Job offers ────────────────────────────────────────────────────────────────

export async function listJobOffers(companyId?: string) {
  const userId = await getUserId();
  let query = supabase
    .from('job_offers')
    .select('*, job_posts(title, salary_amount, shift_type, duty_hours), guard_profiles(full_name)')
    .eq('employer_user_id', userId)
    .order('created_at', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createJobOffer(input: Record<string, unknown>) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('job_offers')
    .insert({ ...input, employer_user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateJobOffer(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('job_offers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Agreements ────────────────────────────────────────────────────────────────

export async function listAgreements(companyId?: string) {
  const userId = await getUserId();
  let query = supabase
    .from('agreements')
    .select('*, job_posts(title), guard_profiles(full_name)')
    .eq('employer_user_id', userId)
    .order('created_at', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createAgreement(input: Record<string, unknown>) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('agreements')
    .insert({ ...input, employer_user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAgreement(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('agreements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
