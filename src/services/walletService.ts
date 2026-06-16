import { supabase } from '../lib/supabaseClient';

export async function getEmployerWallet() {
  const { data, error } = await supabase.from('employer_wallets').select('*').single();
  if (error) throw error;
  return data;
}

export async function listWalletTransactions(companyId?: string) {
  let query = supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
