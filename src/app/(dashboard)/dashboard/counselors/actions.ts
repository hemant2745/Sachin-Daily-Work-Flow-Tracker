"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import { validateCounselorInput, normalizeMonthKey, getMonthDateRange, formatMonthDisplay } from "@/lib/format";
import type {
  Counselor,
  CounselorMonthlyTarget,
  CounselorWithTarget,
  CounselorSummary,
  CounselorFormData,
  CounselorActionResponse,
} from "@/types/counselor";
import { AUTHORIZED_MASTER_COUNSELORS } from "@/lib/constants/counselors";

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
 * Fetches all counselors merged with their month-specific collection and admission targets
 */
export async function getCounselorsWithTargetsAction(monthKey: string): Promise<{
  success: boolean;
  isConfigured: boolean;
  counselors: CounselorWithTarget[];
  summary: CounselorSummary;
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
        combinedAdmissionTarget: 0,
        unconfiguredTargetsCount: 0,
        teamActualRevenue: 0,
        teamActualAdmissions: 0,
        teamAchievementPercentage: null,
        teamAdmissionAchievementPercentage: null,
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
      .order("employee_code", { ascending: true });

    if (counselorsError) {
      return {
        success: false,
        isConfigured: true,
        counselors: [],
        summary: {
          totalCounselors: 0,
          activeCounselors: 0,
          combinedMonthlyTarget: 0,
          combinedAdmissionTarget: 0,
          unconfiguredTargetsCount: 0,
          teamActualRevenue: 0,
          teamActualAdmissions: 0,
          teamAchievementPercentage: null,
          teamAdmissionAchievementPercentage: null,
        },
        error: "Failed to fetch counselors: " + counselorsError.message,
      };
    }

    const counselors: Counselor[] = (counselorsData || []).map((c: any) => ({
      ...c,
      monthly_target: Number(c.monthly_target) || 0,
      monthly_admission_target: Number(c.monthly_admission_target) || 0,
    }));

    // 2. Fetch targets for selected month
    const { data: targetsData, error: targetsError } = await supabase
      .from("counselor_monthly_targets")
      .select("counselor_id, target_amount, target_admissions, notes, updated_at, updated_by_email, is_explicitly_assigned")
      .eq("target_month", normalizedMonth);

    const targetsMap = new Map<
      string,
      {
        amount: number;
        admissions: number;
        isAssigned: boolean;
        notes?: string | null;
        updated_at?: string | null;
        updated_by_email?: string | null;
      }
    >();

    if (!targetsError && targetsData) {
      targetsData.forEach((t: any) => {
        targetsMap.set(t.counselor_id, {
          amount: Number(t.target_amount) || 0,
          admissions: Number(t.target_admissions) || 0,
          isAssigned: Boolean(t.is_explicitly_assigned ?? true),
          notes: t.notes || null,
          updated_at: t.updated_at || null,
          updated_by_email: t.updated_by_email || null,
        });
      });
    }

    // 3. Fetch admissions for selected month to calculate actual revenue and admission counts
    const { startDate: monthStart, endDate: monthEnd } = getMonthDateRange(normalizedMonth);
    const { data: admissionsData, error: admissionsError } = await supabase
      .from("admissions")
      .select("counselor_id, amount_collected")
      .gte("admission_date", monthStart)
      .lte("admission_date", monthEnd);

    const revenueMap = new Map<string, number>();
    const admissionsCountMap = new Map<string, number>();
    if (!admissionsError && admissionsData) {
      admissionsData.forEach((a: any) => {
        const currentRev = revenueMap.get(a.counselor_id) || 0;
        revenueMap.set(a.counselor_id, currentRev + (Number(a.amount_collected) || 0));

        const currentCount = admissionsCountMap.get(a.counselor_id) || 0;
        admissionsCountMap.set(a.counselor_id, currentCount + 1);
      });
    }

    // 4. Query monthly projections for all counselors
    const projectionsMap = new Map<string, {
      total: number;
      met: number;
      notMet: number;
      pending: number;
      totalRev: number;
      reviewedRev: number;
      metRev: number;
    }>();

    try {
      const { data: projData, error: projErr } = await supabase
        .from("projections")
        .select("id, counselor_id, projected_revenue, status")
        .gte("projection_date", monthStart)
        .lte("projection_date", monthEnd);

      if (!projErr && projData) {
        projData.forEach((p: any) => {
          const stats = projectionsMap.get(p.counselor_id) || {
            total: 0,
            met: 0,
            notMet: 0,
            pending: 0,
            totalRev: 0,
            reviewedRev: 0,
            metRev: 0,
          };

          const rev = Number(p.projected_revenue) || 0;
          stats.total += 1;
          stats.totalRev += rev;

          if (p.status === "met") {
            stats.met += 1;
            stats.reviewedRev += rev;
            stats.metRev += rev;
          } else if (p.status === "not_met") {
            stats.notMet += 1;
            stats.reviewedRev += rev;
          } else {
            stats.pending += 1;
          }

          projectionsMap.set(p.counselor_id, stats);
        });
      }
    } catch {
      // Projections table might not exist yet in local development
    }

    // 5. Merge counselors with month-specific target & actual metrics
    let activeCounselorsCount = 0;
    let assignedCount = 0;
    let combinedMonthlyTarget = 0;
    let combinedAdmissionTarget = 0;
    let unconfiguredTargetsCount = 0;
    let teamActualRevenue = 0;
    let teamActualAdmissions = 0;

    const mergedCounselors: CounselorWithTarget[] = counselors.map((c) => {
      const targetRecord = targetsMap.get(c.id);
      const isTargetAssigned = Boolean(targetRecord && targetRecord.isAssigned);

      // Explicit target takes precedence; if not assigned, effective target is 0 and marked unassigned
      const effectiveTarget = isTargetAssigned ? targetRecord!.amount : 0;
      const effectiveAdmissionTarget = isTargetAssigned ? targetRecord!.admissions : 0;

      const actualRevenue = revenueMap.get(c.id) || 0;
      const actualAdmissions = admissionsCountMap.get(c.id) || 0;

      const achievement =
        isTargetAssigned && effectiveTarget > 0 ? (actualRevenue / effectiveTarget) * 100 : null;
      const admissionAchievement =
        isTargetAssigned && effectiveAdmissionTarget > 0
          ? (actualAdmissions / effectiveAdmissionTarget) * 100
          : null;

      // Projection completion calculations
      const projStats = projectionsMap.get(c.id);
      const projReviewed = (projStats?.met || 0) + (projStats?.notMet || 0);
      const projCompletion = projStats && projReviewed > 0 ? (projStats.met / projReviewed) * 100 : null;
      const projWeighted = projStats && projStats.reviewedRev > 0 ? (projStats.metRev / projStats.reviewedRev) * 100 : null;

      if (c.is_active) {
        activeCounselorsCount++;
        if (isTargetAssigned) {
          assignedCount++;
          combinedMonthlyTarget += effectiveTarget;
          combinedAdmissionTarget += effectiveAdmissionTarget;
        } else {
          unconfiguredTargetsCount++;
        }
        teamActualRevenue += actualRevenue;
        teamActualAdmissions += actualAdmissions;
      }

      return {
        ...c,
        effective_target: effectiveTarget,
        effective_admission_target: effectiveAdmissionTarget,
        has_custom_target: isTargetAssigned,
        has_custom_admission_target: isTargetAssigned && effectiveAdmissionTarget > 0,
        is_target_assigned: isTargetAssigned,
        assigned_notes: targetRecord?.notes || null,
        target_updated_at: targetRecord?.updated_at || null,
        target_updated_by: targetRecord?.updated_by_email || null,
        actual_revenue: actualRevenue,
        actual_admissions: actualAdmissions,
        achievement_percentage: achievement,
        admission_achievement_percentage: admissionAchievement,
        projection_total: projStats?.total || 0,
        projection_met: projStats?.met || 0,
        projection_not_met: projStats?.notMet || 0,
        projection_pending: projStats?.pending || 0,
        projection_completion_percentage: projCompletion,
        projection_revenue_weighted_percentage: projWeighted,
      };
    });

    let targetsAssignmentState: "all_assigned" | "partially_assigned" | "unassigned" = "unassigned";
    if (activeCounselorsCount > 0 && assignedCount === activeCounselorsCount) {
      targetsAssignmentState = "all_assigned";
    } else if (assignedCount > 0) {
      targetsAssignmentState = "partially_assigned";
    } else {
      targetsAssignmentState = "unassigned";
    }

    const teamAchievementPercentage =
      assignedCount > 0 && combinedMonthlyTarget > 0
        ? (teamActualRevenue / combinedMonthlyTarget) * 100
        : null;
    const teamAdmissionAchievementPercentage =
      assignedCount > 0 && combinedAdmissionTarget > 0
        ? (teamActualAdmissions / combinedAdmissionTarget) * 100
        : null;

    return {
      success: true,
      isConfigured: true,
      counselors: mergedCounselors,
      summary: {
        totalCounselors: counselors.length,
        activeCounselors: activeCounselorsCount,
        combinedMonthlyTarget,
        combinedAdmissionTarget,
        unconfiguredTargetsCount,
        teamActualRevenue,
        teamActualAdmissions,
        teamAchievementPercentage,
        teamAdmissionAchievementPercentage,
        targetsAssignmentState,
        assignedCount,
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
        combinedAdmissionTarget: 0,
        unconfiguredTargetsCount: 0,
        teamActualRevenue: 0,
        teamActualAdmissions: 0,
        teamAchievementPercentage: null,
        teamAdmissionAchievementPercentage: null,
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
  const normalizedEmail = formData.email?.trim().toLowerCase() || null;
  const normalizedPhone = formData.phone?.trim() || null;
  const monthlyTarget = Math.max(0, Number(formData.monthly_target) || 0);
  const monthlyAdmissionTarget = Math.max(0, Number(formData.monthly_admission_target) || 0);

  try {
    const insertPayload: any = {
      employee_code: normalizedEmployeeCode,
      full_name: normalizedFullName,
      monthly_target: monthlyTarget,
      monthly_admission_target: monthlyAdmissionTarget,
      is_active: formData.is_active ?? true,
    };
    if (normalizedEmail) insertPayload.email = normalizedEmail;
    if (normalizedPhone) insertPayload.phone = normalizedPhone;

    const { data: newCounselor, error: insertError } = await supabase
      .from("counselors")
      .insert(insertPayload)
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
    if (currentMonthKey && (monthlyTarget > 0 || monthlyAdmissionTarget > 0)) {
      const monthDate = normalizeMonthKey(currentMonthKey);
      await supabase.from("counselor_monthly_targets").upsert(
        {
          counselor_id: newCounselor.id,
          target_month: monthDate,
          target_amount: monthlyTarget,
          target_admissions: monthlyAdmissionTarget,
        },
        { onConflict: "counselor_id,target_month" }
      );
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Counselor "${normalizedFullName}" (${normalizedEmployeeCode}) created successfully.`,
      data: newCounselor,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Unexpected error creating counselor: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Updates existing counselor details
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
  const updates: any = {};

  if (formData.employee_code) {
    updates.employee_code = formData.employee_code.trim().toUpperCase();
  }
  if (formData.full_name) {
    updates.full_name = formData.full_name.trim();
  }
  if (formData.email !== undefined) {
    updates.email = formData.email?.trim().toLowerCase() || null;
  }
  if (formData.phone !== undefined) {
    updates.phone = formData.phone?.trim() || null;
  }
  if (formData.monthly_target !== undefined) {
    updates.monthly_target = Math.max(0, Number(formData.monthly_target) || 0);
  }
  if (formData.monthly_admission_target !== undefined) {
    updates.monthly_admission_target = Math.max(0, Number(formData.monthly_admission_target) || 0);
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
    revalidatePath("/dashboard/admissions");
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
 * Updates or creates a month-specific target for a counselor with full audit trail
 */
export async function updateMonthlyTargetAction(
  counselor_id: string,
  target_month: string,
  target_amount: number,
  target_admissions: number = 0,
  notes?: string
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const adminEmail = auth.user?.email || "sachin.behera@collegevidya.com";
  const normalizedMonth = normalizeMonthKey(target_month);
  const amount = Number(target_amount);
  const admissions = Number(target_admissions);

  if (isNaN(amount) || amount < 0) {
    return {
      success: false,
      error: "Target collection amount must be a non-negative number.",
    };
  }
  if (isNaN(admissions) || admissions < 0) {
    return {
      success: false,
      error: "Target admissions must be a non-negative whole number.",
    };
  }

  try {
    // 1. Fetch current target if any to record audit diff
    const { data: existingTarget } = await supabase
      .from("counselor_monthly_targets")
      .select("target_amount, target_admissions")
      .eq("counselor_id", counselor_id)
      .eq("target_month", normalizedMonth)
      .maybeSingle();

    // 2. Upsert the target record
    const { data, error } = await supabase
      .from("counselor_monthly_targets")
      .upsert(
        {
          counselor_id,
          target_month: normalizedMonth,
          target_amount: amount,
          target_admissions: admissions,
          notes: notes?.trim() || null,
          updated_by_email: adminEmail,
          is_explicitly_assigned: true,
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

    // 3. Insert audit log
    await supabase.from("counselor_target_audit_logs").insert({
      counselor_id,
      target_month: normalizedMonth,
      old_target_amount: existingTarget?.target_amount ?? null,
      new_target_amount: amount,
      old_target_admissions: existingTarget?.target_admissions ?? null,
      new_target_admissions: admissions,
      notes: notes?.trim() || null,
      changed_by_email: adminEmail,
    });

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard/daily-tracker");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Targets updated successfully for ${formatMonthDisplay(normalizedMonth)}.`,
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
 * Fetches the audit trail of target revisions for a counselor and month
 */
export async function getTargetAuditLogsAction(
  counselor_id: string,
  target_month?: string
): Promise<{ success: boolean; logs: any[]; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, logs: [], error: auth.error };
  }

  const supabase = auth.supabase;
  try {
    let query = supabase
      .from("counselor_target_audit_logs")
      .select("*")
      .eq("counselor_id", counselor_id)
      .order("created_at", { ascending: false });

    if (target_month) {
      query = query.eq("target_month", normalizeMonthKey(target_month));
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, logs: [], error: error.message };
    }

    return { success: true, logs: data || [] };
  } catch (err: any) {
    return { success: false, logs: [], error: err?.message };
  }
}

/**
 * Pre-fills suggested targets from baseline quota for unassigned counselors in a selected month.
 * Explicitly marks each record as assigned with an audit trail note.
 */
export async function assignSuggestedTargetsAction(
  target_month: string
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const adminEmail = auth.user?.email || "sachin.behera@collegevidya.com";
  const normalizedMonth = normalizeMonthKey(target_month);

  try {
    // 1. Fetch active counselors
    const { data: counselors, error: cErr } = await supabase
      .from("counselors")
      .select("id, monthly_target, monthly_admission_target")
      .eq("is_active", true);

    if (cErr || !counselors) {
      return { success: false, error: "Failed to fetch counselors: " + cErr?.message };
    }

    // 2. Fetch existing assigned targets for month
    const { data: existingTargets } = await supabase
      .from("counselor_monthly_targets")
      .select("counselor_id")
      .eq("target_month", normalizedMonth);

    const assignedSet = new Set((existingTargets || []).map((t: any) => t.counselor_id));
    const toAssign = counselors.filter((c: any) => !assignedSet.has(c.id));

    if (toAssign.length === 0) {
      return {
        success: true,
        message: "All counselors already have assigned targets for " + formatMonthDisplay(normalizedMonth) + ".",
      };
    }

    // 3. Upsert suggested targets
    const inserts = toAssign.map((c: any) => ({
      counselor_id: c.id,
      target_month: normalizedMonth,
      target_amount: Number(c.monthly_target) || 550000,
      target_admissions: Number(c.monthly_admission_target) || 6,
      notes: "Pre-filled suggested targets confirmed by administrator",
      updated_by_email: adminEmail,
      is_explicitly_assigned: true,
    }));

    const { error: upsertErr } = await supabase
      .from("counselor_monthly_targets")
      .upsert(inserts, { onConflict: "counselor_id,target_month" });

    if (upsertErr) {
      return { success: false, error: "Failed to assign targets: " + upsertErr.message };
    }

    // 4. Record audit logs
    const auditLogs = toAssign.map((c: any) => ({
      counselor_id: c.id,
      target_month: normalizedMonth,
      old_target_amount: null,
      new_target_amount: Number(c.monthly_target) || 550000,
      old_target_admissions: null,
      new_target_admissions: Number(c.monthly_admission_target) || 6,
      notes: "Pre-filled suggested baseline target confirmed by administrator",
      changed_by_email: adminEmail,
    }));

    await supabase.from("counselor_target_audit_logs").insert(auditLogs);

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard/daily-tracker");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Assigned suggested targets for ${toAssign.length} counselors in ${formatMonthDisplay(normalizedMonth)}.`,
    };
  } catch (err: any) {
    return { success: false, error: "Error assigning suggested targets: " + (err?.message || "Unknown error") };
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
    revalidatePath("/dashboard/admissions");
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
 * Protects historical data: If dependent records exist in targets or admissions,
 * deletion is blocked or converted to safe deactivation.
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
    revalidatePath("/dashboard/admissions");
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

/**
 * Idempotently imports or synchronizes the 9 master counselors using employee_code as key.
 * Preserves any existing email, phone, or historical targets/admissions.
 */
export async function importMasterCounselorsAction(): Promise<{
  success: boolean;
  count: number;
  message?: string;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, count: 0, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    let synced = 0;
    for (const master of AUTHORIZED_MASTER_COUNSELORS) {
      const { error: upsertError } = await supabase.from("counselors").upsert(
        {
          employee_code: master.employee_code,
          full_name: master.full_name,
          monthly_target: master.monthly_target,
          monthly_admission_target: master.monthly_admission_target,
          is_active: true,
        },
        { onConflict: "employee_code", ignoreDuplicates: false }
      );

      if (upsertError) {
        return {
          success: false,
          count: synced,
          error: `Error syncing counselor ${master.full_name} (${master.employee_code}): ${upsertError.message}`,
        };
      }
      synced++;
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard");

    return {
      success: true,
      count: synced,
      message: `Successfully synchronized all ${synced} authorized master counselors.`,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err?.message || "Failed to import master counselors",
    };
  }
}
