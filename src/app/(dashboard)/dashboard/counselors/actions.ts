"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import { validateCounselorInput, normalizeMonthKey, getMonthDateRange } from "@/lib/format";
import type {
  Counselor,
  CounselorMonthlyTarget,
  CounselorWithTarget,
  CounselorFormData,
  CounselorActionResponse,
} from "@/types/counselor";

/**
 * Ensures caller is an authorized administrator before executing server action
 */
async function verifyAdminAuth() {
  if (!isSupabaseConfigured()) {
    return {
      isAuthorized: false,
      isConfigured: false,
      error: "Supabase database credentials are not configured in .env.local yet.",
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        isAuthorized: false,
        isConfigured: true,
        error: "Unauthorized: Active administrator session required.",
      };
    }

    const evaluation = evaluateSessionAccess(data.user);
    if (!evaluation.isAuthorized) {
      return {
        isAuthorized: false,
        isConfigured: true,
        error: "Access denied: Account is not authorized as an administrator.",
      };
    }

    return {
      isAuthorized: true,
      isConfigured: true,
      supabase,
      user: data.user,
    };
  } catch (err: any) {
    return {
      isAuthorized: false,
      isConfigured: true,
      error: "Authentication service error: " + (err?.message || "Failed to verify session."),
    };
  }
}

/**
 * Fetches all counselors merged with their month-specific targets for a selected month
 */
export async function getCounselorsWithTargetsAction(monthKey: string): Promise<{
  success: boolean;
  isConfigured: boolean;
  counselors: CounselorWithTarget[];
  summary: {
    totalCounselors: number;
    activeCounselors: number;
    combinedMonthlyTarget: number;
    unconfiguredTargetsCount: number;
    teamActualRevenue: number;
    teamAchievementPercentage: number | null;
  };
  error?: string;
}> {
  const normalizedMonth = normalizeMonthKey(monthKey);

  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      isConfigured: auth.isConfigured,
      counselors: [],
      summary: {
        totalCounselors: 0,
        activeCounselors: 0,
        combinedMonthlyTarget: 0,
        unconfiguredTargetsCount: 0,
        teamActualRevenue: 0,
        teamAchievementPercentage: null,
      },
      error: auth.error,
    };
  }

  const supabase = auth.supabase;

  try {
    // 1. Fetch all counselors
    const { data: counselorsData, error: counselorsError } = await supabase
      .from("counselors")
      .select("*")
      .order("full_name", { ascending: true });

    if (counselorsError) {
      return {
        success: false,
        isConfigured: true,
        counselors: [],
        summary: {
          totalCounselors: 0,
          activeCounselors: 0,
          combinedMonthlyTarget: 0,
          unconfiguredTargetsCount: 0,
          teamActualRevenue: 0,
          teamAchievementPercentage: null,
        },
        error: "Failed to fetch counselors: " + counselorsError.message,
      };
    }

    const counselors: Counselor[] = (counselorsData || []).map((c: any) => ({
      ...c,
      monthly_target: Number(c.monthly_target) || 0,
    }));

    // 2. Fetch targets for selected month
    const { data: targetsData, error: targetsError } = await supabase
      .from("counselor_monthly_targets")
      .select("*")
      .eq("target_month", normalizedMonth);

    if (targetsError) {
      return {
        success: false,
        isConfigured: true,
        counselors: [],
        summary: {
          totalCounselors: 0,
          activeCounselors: 0,
          combinedMonthlyTarget: 0,
          unconfiguredTargetsCount: 0,
          teamActualRevenue: 0,
          teamAchievementPercentage: null,
        },
        error: "Failed to fetch monthly targets: " + targetsError.message,
      };
    }

    const targetsMap = new Map<string, number>();
    (targetsData || []).forEach((t: any) => {
      targetsMap.set(t.counselor_id, Number(t.target_amount) || 0);
    });

    // 3. Fetch admissions for selected month to calculate actual revenue
    const { startDate: monthStart, endDate: monthEnd } = getMonthDateRange(normalizedMonth);
    const { data: admissionsData, error: admissionsError } = await supabase
      .from("admissions")
      .select("counselor_id, amount_collected")
      .gte("admission_date", monthStart)
      .lte("admission_date", monthEnd);

    // If admissions table doesn't exist yet (e.g. migration pending), default gracefully
    const revenueMap = new Map<string, number>();
    if (!admissionsError && admissionsData) {
      admissionsData.forEach((a: any) => {
        const currentVal = revenueMap.get(a.counselor_id) || 0;
        revenueMap.set(a.counselor_id, currentVal + (Number(a.amount_collected) || 0));
      });
    }

    // 4. Merge counselors with month-specific target & actual revenue
    let activeCounselorsCount = 0;
    let combinedMonthlyTarget = 0;
    let unconfiguredTargetsCount = 0;
    let teamActualRevenue = 0;

    const mergedCounselors: CounselorWithTarget[] = counselors.map((c) => {
      const hasCustomTarget = targetsMap.has(c.id);
      const effectiveTarget = hasCustomTarget ? targetsMap.get(c.id)! : c.monthly_target;
      const actualRevenue = revenueMap.get(c.id) || 0;
      const achievement = effectiveTarget > 0 ? (actualRevenue / effectiveTarget) * 100 : null;

      if (c.is_active) {
        activeCounselorsCount++;
        combinedMonthlyTarget += effectiveTarget;
        teamActualRevenue += actualRevenue;
        if (effectiveTarget <= 0) {
          unconfiguredTargetsCount++;
        }
      }

      return {
        ...c,
        effective_target: effectiveTarget,
        has_custom_target: hasCustomTarget,
        actual_revenue: actualRevenue,
        achievement_percentage: achievement,
      };
    });

    const teamAchievementPercentage =
      combinedMonthlyTarget > 0 ? (teamActualRevenue / combinedMonthlyTarget) * 100 : null;

    return {
      success: true,
      isConfigured: true,
      counselors: mergedCounselors,
      summary: {
        totalCounselors: counselors.length,
        activeCounselors: activeCounselorsCount,
        combinedMonthlyTarget,
        unconfiguredTargetsCount,
        teamActualRevenue,
        teamAchievementPercentage,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      counselors: [],
      summary: {
        totalCounselors: 0,
        activeCounselors: 0,
        combinedMonthlyTarget: 0,
        unconfiguredTargetsCount: 0,
        teamActualRevenue: 0,
        teamAchievementPercentage: null,
      },
      error: "Unexpected error reading counselor records: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Creates a new counselor record
 */
export async function createCounselorAction(
  formData: CounselorFormData,
  currentMonthKey?: string
): Promise<CounselorActionResponse> {
  const validation = validateCounselorInput(formData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return { success: false, error: firstError };
  }

  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const normalizedEmployeeCode = formData.employee_code.trim().toUpperCase();
  const normalizedFullName = formData.full_name.trim();
  const normalizedEmail = formData.email.trim().toLowerCase();
  const normalizedPhone = formData.phone.trim();
  const monthlyTarget = Math.max(0, Number(formData.monthly_target) || 0);

  try {
    const { data: newCounselor, error: insertError } = await supabase
      .from("counselors")
      .insert({
        employee_code: normalizedEmployeeCode,
        full_name: normalizedFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        monthly_target: monthlyTarget,
        is_active: formData.is_active ?? true,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505" || insertError.message.includes("unique")) {
        if (insertError.message.includes("employee_code")) {
          return {
            success: false,
            error: `Employee code "${normalizedEmployeeCode}" is already in use by another counselor.`,
          };
        }
        if (insertError.message.includes("email")) {
          return {
            success: false,
            error: `Email address "${normalizedEmail}" is already registered.`,
          };
        }
        return {
          success: false,
          error: "A counselor with this employee code or email already exists.",
        };
      }
      return { success: false, error: "Database error: " + insertError.message };
    }

    // Optionally set initial monthly target for current month
    if (currentMonthKey && monthlyTarget > 0) {
      const monthDate = normalizeMonthKey(currentMonthKey);
      await supabase.from("counselor_monthly_targets").upsert(
        {
          counselor_id: newCounselor.id,
          target_month: monthDate,
          target_amount: monthlyTarget,
        },
        { onConflict: "counselor_id,target_month" }
      );
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Counselor "${normalizedFullName}" added successfully.`,
      data: newCounselor,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Failed to create counselor: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Updates an existing counselor's details
 * Note: Does not overwrite historical monthly targets
 */
export async function updateCounselorAction(
  id: string,
  formData: Partial<CounselorFormData>
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const updates: Record<string, any> = {};

  if (formData.employee_code !== undefined) {
    const code = formData.employee_code.trim().toUpperCase();
    if (!code) return { success: false, error: "Employee code cannot be empty." };
    updates.employee_code = code;
  }

  if (formData.full_name !== undefined) {
    const name = formData.full_name.trim();
    if (!name) return { success: false, error: "Full name cannot be empty." };
    updates.full_name = name;
  }

  if (formData.email !== undefined) {
    const email = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: "A valid email address is required." };
    }
    updates.email = email;
  }

  if (formData.phone !== undefined) {
    const phone = formData.phone.trim();
    if (!phone) return { success: false, error: "Phone number cannot be empty." };
    updates.phone = phone;
  }

  if (formData.monthly_target !== undefined) {
    const target = Number(formData.monthly_target);
    if (isNaN(target) || target < 0) {
      return { success: false, error: "Monthly target must be a non-negative number." };
    }
    updates.monthly_target = target;
  }

  if (formData.is_active !== undefined) {
    updates.is_active = Boolean(formData.is_active);
  }

  try {
    const { data, error } = await supabase
      .from("counselors")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.message.includes("unique")) {
        return {
          success: false,
          error: "Update failed: Employee code or email is already taken by another counselor.",
        };
      }
      return { success: false, error: "Database error: " + error.message };
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Counselor details updated successfully.",
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Failed to update counselor: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Updates or creates a month-specific target for a counselor
 * Preserves past/future months without silent alteration
 */
export async function updateMonthlyTargetAction(
  counselor_id: string,
  target_month: string,
  target_amount: number
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const normalizedMonth = normalizeMonthKey(target_month);
  const amount = Number(target_amount);

  if (isNaN(amount) || amount < 0) {
    return {
      success: false,
      error: "Target amount must be a non-negative number.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("counselor_monthly_targets")
      .upsert(
        {
          counselor_id,
          target_month: normalizedMonth,
          target_amount: amount,
        },
        { onConflict: "counselor_id,target_month" }
      )
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "Failed to save monthly target: " + error.message,
      };
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Target updated successfully for selected month.",
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Error updating target: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Toggles a counselor's active/inactive status
 */
export async function toggleCounselorStatusAction(
  id: string,
  is_active: boolean
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    const { error } = await supabase
      .from("counselors")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      return { success: false, error: "Failed to update status: " + error.message };
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Counselor ${is_active ? "activated" : "deactivated"} successfully.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Failed to toggle counselor status: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Deletes or deactivates a counselor record
 * Protects historical data: If dependent records exist, deletion is blocked or converted to deactivation
 */
export async function deleteCounselorAction(
  id: string,
  forceDeactivateIfHasHistory: boolean = false
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    // 1. Check if counselor has historical monthly targets or admissions dependencies
    const { count: targetsCount, error: countError } = await supabase
      .from("counselor_monthly_targets")
      .select("id", { count: "exact", head: true })
      .eq("counselor_id", id);

    if (countError) {
      return { success: false, error: "Failed to inspect target dependencies: " + countError.message };
    }

    const { count: admissionsCount, error: admissionsCountError } = await supabase
      .from("admissions")
      .select("id", { count: "exact", head: true })
      .eq("counselor_id", id);

    // If admissions table exists and has records, protect them
    const hasHistoricalAdmissions = !admissionsCountError && (admissionsCount || 0) > 0;
    const hasHistoricalTargets = (targetsCount || 0) > 0;
    const hasDependencies = hasHistoricalTargets || hasHistoricalAdmissions;

    if (hasDependencies) {
      const reason = hasHistoricalAdmissions && hasHistoricalTargets
        ? "historical monthly targets and verified admissions"
        : hasHistoricalAdmissions
        ? "verified admission records"
        : "historical monthly target records";

      if (forceDeactivateIfHasHistory) {
        // Deactivate instead of deleting to protect historical integrity
        const { error: deactivateError } = await supabase
          .from("counselors")
          .update({ is_active: false })
          .eq("id", id);

        if (deactivateError) {
          return { success: false, error: "Failed to deactivate counselor: " + deactivateError.message };
        }

        revalidatePath("/dashboard/counselors");
        revalidatePath("/dashboard/admissions");
        revalidatePath("/dashboard");

        return {
          success: true,
          message: `Counselor has ${reason} and was deactivated instead of permanently deleted to preserve historical revenue and reporting.`,
        };
      }

      return {
        success: false,
        error: `Cannot permanently delete counselor because ${reason} exist. Deactivate the counselor instead to preserve historical reporting.`,
      };
    }

    // 2. Safe deletion when no historical dependencies exist
    const { error: deleteError } = await supabase
      .from("counselors")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return { success: false, error: "Failed to delete counselor: " + deleteError.message };
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Counselor removed successfully.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Error deleting counselor: " + (err?.message || "Unknown error"),
    };
  }
}
