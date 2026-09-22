/** Deployment-owned public configuration. Visitor overrides are never used. */
export function getSupabaseConfig() {
  return {
    url: (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, ''),
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}
export type AIProvider = 'openai' | 'gemini';
export function getAIConfig(): { provider: AIProvider } {
  return { provider: import.meta.env.VITE_AI_PROVIDER === 'openai' ? 'openai' : 'gemini' };
}
