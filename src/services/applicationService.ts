import { supabase } from '../lib/supabaseClient';

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in is required.');
  return data.user.id;
}

export async function applyForJob(jobId: string) {
  const guardUserId = await getUserId();
  const { data: job, error: jobError } = await supabase
    .from('job_posts')
    .select('id, employer_user_id, company_id, site_id, status')
    .eq('id', jobId)
    .single();
  if (jobError) throw jobError;
  if (job.status !== 'active') throw new Error('This job is not open for applications.');
  if (!job.company_id) throw new Error('Job has no company associated. Contact the employer.');
  if (!job.site_id) throw new Error('Job has no site associated. Contact the employer.');

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      job_id: job.id,
      guard_id: guardUserId,
      guard_user_id: guardUserId,
      employer_user_id: job.employer_user_id,
      company_id: job.company_id,
      site_id: job.site_id,
      status: 'applied',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMyApplications() {
  const guardUserId = await getUserId();
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('guard_user_id', guardUserId)
    .order('applied_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Returns only the job_ids the guard has already applied to — lightweight, no joins */
export async function listMyAppliedJobIds(): Promise<Set<string>> {
  const guardUserId = await getUserId();
  const { data, error } = await supabase
    .from('job_applications')
    .select('job_id')
    .eq('guard_user_id', guardUserId);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => r.job_id));
}

export async function listEmployerApplications(companyId?: string, jobId?: string) {
  const employerUserId = await getUserId();
  let query = supabase
    .from('job_applications')
    .select('*, job_posts(title), guard_profiles(full_name, mobile, city, skills, languages, verification_status)')
    .eq('employer_user_id', employerUserId)
    .order('applied_at', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);
  if (jobId) query = query.eq('job_id', jobId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateApplicationStatus(applicationId: string, status: string, remarks?: string) {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status, remarks })
    .eq('id', applicationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
