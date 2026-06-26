import { supabase } from '../lib/supabaseClient';

export type UploadTarget =
  | 'company-logos'
  | 'company-documents'
  | 'guard-documents'
  | 'profile-images'
  | 'invoices'
  | 'agreements';

export async function uploadPrivateFile(bucket: UploadTarget, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return data;
}

export async function createSignedFileUrl(bucket: UploadTarget, path: string, expiresInSeconds = 300) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export function getPublicFileUrl(bucket: UploadTarget, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
