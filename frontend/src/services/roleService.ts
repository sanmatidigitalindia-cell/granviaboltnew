import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../lib/supabaseTypes';

export async function getRoleIdByName(role: UserRole): Promise<string | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('key', role)
    .maybeSingle();

  if (error) {
    if (error.message?.includes('relation "roles" does not exist')) {
      return null;
    }
    throw error;
  }

  return data?.id ?? null;
}
