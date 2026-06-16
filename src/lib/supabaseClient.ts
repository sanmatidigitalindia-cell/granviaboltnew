import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

const missingEnvVars = [] as string[];
if (!supabaseUrl) missingEnvVars.push('VITE_SUPABASE_URL');
if (!supabaseKey) missingEnvVars.push('VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY');

if (missingEnvVars.length > 0) {
  throw new Error(
    `Supabase environment variables are missing: ${missingEnvVars.join(', ')}. ` +
    'Set these VITE_ variables in your build/deploy environment.'
  );
}

const resolvedSupabaseUrl = supabaseUrl;
const resolvedSupabaseKey = supabaseKey;

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function createEphemeralSupabaseClient() {
  return createClient(resolvedSupabaseUrl, resolvedSupabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
