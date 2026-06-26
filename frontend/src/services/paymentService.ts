import { supabase } from '../lib/supabaseClient';

export async function listEmployerPayments(companyId?: string) {
  let query = supabase
    .from('payments')
    .select('*, job_posts(title), guard_profiles(full_name)')
    .order('created_at', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createPaymentRecord(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('payments').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listEmployerInvoices(companyId?: string) {
  let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
