import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Only read VITE_ prefixed variables — these are the only ones exposed to Vite-built
// browser bundles. Do NOT reference server-only env vars here.
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const VITE_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const missing: string[] = [];
if (!VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
if (!VITE_SUPABASE_PUBLISHABLE_KEY) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

if (missing.length > 0) {
  // Fail fast with a clear, actionable message for build/runtime debugging.
  throw new Error(
    `Missing required Supabase VITE_ environment variable(s): ${missing.join(', ')}. ` +
      'Provide these during Vite build or in your hosting platform (they must be VITE_ prefixed).'
  );
}

const resolvedSupabaseUrl = VITE_SUPABASE_URL;
const resolvedSupabaseKey = VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient = createClient(resolvedSupabaseUrl, resolvedSupabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Export a factory for ephemeral clients when a non-persistent client is needed.
// This still uses the same VITE_ values and therefore will only work in environments
// where those values are available to the browser (i.e. builds that exposed them).
export function createEphemeralSupabaseClient(): SupabaseClient {
  return createClient(resolvedSupabaseUrl, resolvedSupabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
