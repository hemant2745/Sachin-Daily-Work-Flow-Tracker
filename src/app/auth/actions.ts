"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAuthorizedAdminEmail, evaluateSessionAccess } from "@/lib/auth/admin";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
}

/**
 * Server Action for Administrator Sign In
 */
export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      success: false,
      error: "Please provide both administrator email and password.",
    };
  }

  // Pre-validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Please enter a valid administrator email address.",
    };
  }

  // Check if Supabase project credentials are configured
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Supabase credentials are not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable live authentication.",
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide clean, safe error messages without exposing backend specifics
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return {
        success: false,
        error: "Invalid email or password. Please verify your administrator credentials.",
      };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        success: false,
        error: "Administrator email has not been confirmed yet in Supabase Auth.",
      };
    }
    return {
      success: false,
      error: error.message || "An authentication error occurred. Please try again.",
    };
  }

  // Server-side administrator authorization verification
  const sessionEvaluation = evaluateSessionAccess(data.user);

  if (!sessionEvaluation.isAuthorized) {
    // Crucial security step: Invalidate unauthorized session immediately
    await supabase.auth.signOut();
    return {
      success: false,
      error: sessionEvaluation.message || "Access denied. Your account is not authorized as an administrator.",
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    redirectTo: "/dashboard",
  };
}

/**
 * Server Action for Administrator Sign Out
 */
export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login?message=signed_out");
}

/**
 * Returns current administrator session details for server components
 */
export async function getCurrentAdminSession() {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      isAuthenticated: false,
      isAuthorized: false,
      email: null,
    };
  }

  const supabase = createClient();
  try {
    const { data } = await supabase.auth.getUser();
    const evaluation = evaluateSessionAccess(data.user);
    return {
      isConfigured: true,
      isAuthenticated: Boolean(data.user),
      isAuthorized: evaluation.isAuthorized,
      email: data.user?.email || null,
    };
  } catch {
    return {
      isConfigured: true,
      isAuthenticated: false,
      isAuthorized: false,
      email: null,
    };
  }
}
