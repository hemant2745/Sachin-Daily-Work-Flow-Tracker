import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

/**
 * Creates a server-side Supabase client for Server Components,
 * Server Actions, and Route Handlers.
 */
export function createClient() {
  const cookieStore = cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createServerClient(
    supabaseUrl || "https://placeholder-project.supabase.co",
    supabaseAnonKey || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware is refreshing sessions.
          }
        },
      },
    }
  );
}
