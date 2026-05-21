/**
 * Returns the active Supabase config.
 * Priority: localStorage (user-configured) → .env fallback
 */
export function getSupabaseConfig() {
  // Automatically clear deprecated project ref from localStorage to fall back to the new .env configuration
  const storedUrl = localStorage.getItem("supabase_url");
  if (storedUrl && (storedUrl.includes("ypsqpqudayjelmoqvcoq") || storedUrl.includes("ypsqpqudayjelmoqvcoq.supabase.co"))) {
    localStorage.removeItem("supabase_url");
    localStorage.removeItem("supabase_anon_key");
  }

  return {
    url:
      localStorage.getItem("supabase_url") ||
      import.meta.env.VITE_SUPABASE_URL ||
      "",
    anonKey:
      localStorage.getItem("supabase_anon_key") ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "",
  };
}

export type AIProvider = "openai" | "gemini";

/**
 * Returns the active AI provider and its API key.
 * The provider preference and keys are stored in localStorage.
 */
export function getAIConfig(): { provider: AIProvider; apiKey: string } {
  const provider = (localStorage.getItem("ai_provider") as AIProvider) || "openai";
  const apiKey =
    provider === "gemini"
      ? localStorage.getItem("gemini_api_key") || ""
      : localStorage.getItem("openai_api_key") || "";
  return { provider, apiKey };
}
