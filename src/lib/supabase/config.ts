/**
 * Supabase Environment Configuration Utilities
 * 
 * Safely inspects runtime environment variables without exposing sensitive values.
 */

export function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  
  const isPlaceholderUrl = 
    !supabaseUrl || 
    supabaseUrl.includes("your-project.supabase.co") ||
    supabaseUrl.includes("placeholder-project.supabase.co") ||
    supabaseUrl === "https://placeholder.supabase.co";

  const isPlaceholderKey = 
    !supabaseAnonKey || 
    supabaseAnonKey.includes("placeholder") ||
    supabaseAnonKey.includes("your-anon-key");

  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && !isPlaceholderUrl && !isPlaceholderKey);

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}
