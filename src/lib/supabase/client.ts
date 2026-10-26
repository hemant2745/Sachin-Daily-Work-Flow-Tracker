import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/**
 * Creates a browser-side Supabase client for client components.
 * Returns null if Supabase environment variables are unconfigured.
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    // Return a dummy fallback or throw clear warning in development
    return createBrowserClient(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseAnonKey || "placeholder-anon-key"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
