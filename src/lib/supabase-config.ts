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

export function isCreationEnabled(type: string): boolean {
  if (import.meta.env.VITE_CENTRAL_SERVICES_ENABLED !== 'true') return false;
  if (type === 'image') return import.meta.env.VITE_IMAGE_ENABLED === 'true';
  if (type === 'video') return import.meta.env.VITE_VIDEO_ENABLED === 'true';
  if (type === 'audio') return import.meta.env.VITE_NARRATION_ENABLED === 'true';
  return true;
}
