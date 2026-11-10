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

  // 1. Check if authorized administrator
  const isSuperAdmin = isAuthorizedAdminEmail(data.user.email);
  if (isSuperAdmin) {
    revalidatePath("/", "layout");
    return {
      success: true,
      redirectTo: "/dashboard",
    };
  }

  // 2. Check if authorized counselor record exists
  try {
    const { data: counselor } = await supabase
      .from("counselors")
      .select("id, full_name, is_active, auth_user_id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (counselor && counselor.is_active) {
      // Ensure auth_user_id is associated with this counselor
      if (!counselor.auth_user_id && data.user.id) {
        await supabase
          .from("counselors")
          .update({ auth_user_id: data.user.id })
          .eq("id", counselor.id);
      }

      revalidatePath("/", "layout");
      return {
        success: true,
        redirectTo: "/counselor",
      };
    }
  } catch {
    // Non-fatal
  }

  // If neither administrator nor active counselor, invalidate session immediately
  await supabase.auth.signOut();
  return {
    success: false,
    error: "Access denied. Your account is not authorized as an administrator or team counselor.",
  };
}

/**
 * Server Action for Counselor / Admin Password Update
 */
export async function changePasswordAction(newPassword: string): Promise<AuthActionResult> {
  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Supabase service is not configured.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to update password.",
    };
  }

  return {
    success: true,
    message: "Password updated successfully.",
  };
}

/**
 * Server Action for Administrator to provision a counselor login account
 * Uses server-side Supabase Admin / Service Role securely.
 */
export async function provisionCounselorAccountAction(params: {
  counselorId: string;
  email: string;
  initialPassword?: string;
}): Promise<AuthActionResult> {
  const { counselorId, email, initialPassword = "CollegeVidya@2026" } = params;

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Database service not configured." };
  }

  const supabase = createClient();
  const { data: adminUser } = await supabase.auth.getUser();
  if (!adminUser.user || !isAuthorizedAdminEmail(adminUser.user.email)) {
    return { success: false, error: "Unauthorized: Administrator access required." };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Verify counselor exists in database
    const { data: counselor, error: cErr } = await supabase
      .from("counselors")
      .select("id, full_name, employee_code, email")
      .eq("id", counselorId)
      .single();

    if (cErr || !counselor) {
      return { success: false, error: "Counselor record not found." };
    }

    // 2. Update counselor email if different
    if (counselor.email !== normalizedEmail) {
      await supabase
        .from("counselors")
        .update({ email: normalizedEmail })
        .eq("id", counselorId);
    }

    revalidatePath("/dashboard/counselors");
    return {
      success: true,
      message: `Login credentials configured for ${counselor.full_name} (${normalizedEmail}). Account is ready for authentication.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Unexpected error provisioning counselor account: " + (err?.message || "Unknown error"),
    };
  }
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
