import { supabase } from '../lib/supabaseClient';

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in is required.');
  return data.user.id;
}

export async function listCompanyDocuments(companyId: string) {
  const { data, error } = await supabase
    .from('company_documents')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDocumentRecord(companyId: string, documentType: string, fileName: string, fileSize: number, fileType: string) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('company_documents')
    .insert({
      company_id: companyId,
      employer_user_id: userId,
      document_type: documentType,
      file_path: `${userId}/${companyId}/${documentType.replace(/\s+/g, '_')}/${fileName}`,
      verification_status: 'pending',
      file_size: fileSize,
      file_type: fileType,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
