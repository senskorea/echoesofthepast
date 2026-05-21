import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/lib/supabase-config';

/**
 * Returns a Supabase client using user-configured keys (from localStorage)
 * falling back to .env values. Call this at runtime, not at module level,
 * so it always picks up the latest localStorage state.
 */
export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
