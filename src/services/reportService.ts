import { supabase } from '../lib/supabaseClient';

export async function getEmployerReportCounts(companyId?: string) {
  const companyFilter = companyId ? { company_id: companyId } : {};
  const [jobs, applications, attendance, payments] = await Promise.all([
    supabase.from('job_posts').select('id', { count: 'exact', head: true }).match(companyFilter),
    supabase.from('job_applications').select('id', { count: 'exact', head: true }).match(companyFilter),
    supabase.from('attendance_records').select('id', { count: 'exact', head: true }).match(companyFilter),
    supabase.from('payments').select('id', { count: 'exact', head: true }).match(companyFilter),
  ]);

  for (const result of [jobs, applications, attendance, payments]) {
    if (result.error) throw result.error;
  }

  return {
    jobs: jobs.count || 0,
    applications: applications.count || 0,
    attendance: attendance.count || 0,
    payments: payments.count || 0,
  };
}
