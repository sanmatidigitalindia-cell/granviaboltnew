import { supabase } from '../lib/supabaseClient';

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in is required.');
  return data.user.id;
}

export async function listActiveJobs() {
  const { data, error } = await supabase
    .from('job_posts')
    .select('*, employer_companies(company_name), company_sites!site_id(site_name, address, city, state, pincode, latitude, longitude)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listEmployerJobs(companyId?: string) {
  const userId = await getUserId();
  let query = supabase
    .from('job_posts')
    .select('*, employer_companies(company_name), company_sites(site_name, city, state)')
    .eq('employer_user_id', userId)
    .order('created_at', { ascending: false });

  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createJobPost(input: Record<string, unknown> & { company_id: string; site_id: string; title: string }) {
  const userId = await getUserId();
  // Verify site belongs to this company before inserting
  const { data: site, error: siteError } = await supabase
    .from('company_sites')
    .select('id, company_id')
    .eq('id', input.site_id)
    .maybeSingle();
  if (siteError) throw siteError;
  if (!site) throw new Error('Site not found. Please select a valid site.');
  if (site.company_id !== input.company_id) throw new Error('Site does not belong to the selected company.');

  const { data, error } = await supabase
    .from('job_posts')
    .insert({
      ...input,
      employer_user_id: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Admin: jobs awaiting approval */
export async function listPendingJobs() {
  const { data, error } = await supabase
    .from('job_posts')
    .select('*, employer_companies(company_name), company_sites(site_name, city, state)')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function approveJob(jobId: string) {
  return updateJobPost(jobId, { status: 'active' });
}

export async function rejectJob(jobId: string, reason?: string) {
  return updateJobPost(jobId, { status: 'rejected', rejection_reason: reason ?? '' });
}

/** Admin: all jobs regardless of status, newest first */
export async function listAllJobsForAdmin() {
  const { data, error } = await supabase
    .from('job_posts')
    .select('*, employer_companies(company_name), company_sites(site_name, city, state)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteJobPost(jobId: string) {
  const { error } = await supabase
    .from('job_posts')
    .delete()
    .eq('id', jobId);
  if (error) throw error;
}

export async function updateJobPost(jobId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('job_posts')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
