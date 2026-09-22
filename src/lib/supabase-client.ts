import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './supabase-config';
import { ServiceError } from './service-errors';

let client: SupabaseClient | undefined;
let clientConfig = '';
let signingIn: Promise<Session> | undefined;
export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) throw new ServiceError('unavailable');
  const config = `${url}|${anonKey}`;
  if (!client || clientConfig !== config) {
    client = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    clientConfig = config;
  }
  return client;
}
export async function getVisitorSession(): Promise<Session> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new ServiceError('unavailable');
  if (data.session) return data.session;
  if (!signingIn) {
    signingIn = (async () => {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.session) throw new ServiceError('unavailable');
      return data.session;
    })().finally(() => { signingIn = undefined; });
  }
  return signingIn;
}
