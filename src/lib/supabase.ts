import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Client Initialization Placeholder
 * 
 * NOTE FOR PHASE 1:
 * Supabase authentication and PostgreSQL database connection will be integrated in a later phase.
 * Live authentication is intentionally not activated in Phase 1.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
