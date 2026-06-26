import { supabase } from '../lib/supabaseClient';

export async function listEmployerAttendance(companyId?: string) {
  let query = supabase
    .from('attendance_records')
    .select('*, guard_profiles(full_name, mobile), job_posts(title)')
    .order('attendance_date', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateAttendanceStatus(recordId: string, status: string, employerRemarks?: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .update({ status, employer_remarks: employerRemarks })
    .eq('id', recordId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
