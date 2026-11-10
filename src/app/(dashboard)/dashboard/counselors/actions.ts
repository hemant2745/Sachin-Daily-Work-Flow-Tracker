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
  CounselorCategory,
  CategoryMonthlyTarget,
  CategoryCardSummary,
  TargetAuditLogEntry,
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
      category: (c.category as CounselorCategory) || "CDA",
      monthly_target: Number(c.monthly_target) || 0,
      monthly_admission_target: Number(c.monthly_admission_target) || 0,
    }));

    // 2. Fetch category monthly base targets
    const categoryTargetsMap: Record<CounselorCategory, { base_target: number; base_admission_target: number }> = {
      CDA: { base_target: 800000, base_admission_target: 8 },
      SCDA: { base_target: 600000, base_admission_target: 6 },
      PCA: { base_target: 400000, base_admission_target: 4 },
    };

    try {
      const { data: catTargetsData } = await supabase
        .from("category_monthly_targets")
        .select("category, base_target, base_admission_target")
        .eq("target_month", normalizedMonth);

      if (catTargetsData) {
        catTargetsData.forEach((ct: any) => {
          if (ct.category && categoryTargetsMap[ct.category as CounselorCategory]) {
            categoryTargetsMap[ct.category as CounselorCategory] = {
              base_target: Number(ct.base_target) || 0,
              base_admission_target: Number(ct.base_admission_target) || 0,
            };
          }
        });
      }
    } catch {
      // Use defaults if table not yet migrated
    }

    // 3. Fetch targets for selected month
    const { data: targetsData, error: targetsError } = await supabase
      .from("counselor_monthly_targets")
      .select("counselor_id, category, base_target, additional_target, additional_target_reason, target_amount, target_admissions, notes, updated_at, updated_by_email, is_explicitly_assigned")
      .eq("target_month", normalizedMonth);

    const targetsMap = new Map<
      string,
      {
        category?: CounselorCategory | null;
        base_target?: number;
        additional_target?: number;
        additional_target_reason?: string | null;
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
          category: t.category || null,
          base_target: t.base_target !== undefined ? Number(t.base_target) : undefined,
          additional_target: t.additional_target !== undefined ? Number(t.additional_target) : 0,
          additional_target_reason: t.additional_target_reason || null,
          amount: Number(t.target_amount) || 0,
          admissions: Number(t.target_admissions) || 0,
          isAssigned: Boolean(t.is_explicitly_assigned ?? true),
          notes: t.notes || null,
          updated_at: t.updated_at || null,
          updated_by_email: t.updated_by_email || null,
        });
      });
    }

    // 4. Fetch admissions for selected month to calculate actual revenue and admission counts
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

    // 5. Query monthly projections for all counselors
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

    // 6. Proration metadata for calendar-day expected calculations
    const [yearStr, monthStr] = normalizedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const elapsedDays = isCurrentMonth ? Math.min(daysInMonth, today.getDate()) : daysInMonth;

    // 7. Category summaries tracker
    const categorySummaries: Record<CounselorCategory, CategoryCardSummary> = {
      CDA: {
        category: "CDA",
        counselorCount: 0,
        baseTarget: categoryTargetsMap.CDA.base_target,
        baseAdmissionTarget: categoryTargetsMap.CDA.base_admission_target,
        totalTarget: 0,
        totalRevenue: 0,
        achievementPercentage: null,
      },
      SCDA: {
        category: "SCDA",
        counselorCount: 0,
        baseTarget: categoryTargetsMap.SCDA.base_target,
        baseAdmissionTarget: categoryTargetsMap.SCDA.base_admission_target,
        totalTarget: 0,
        totalRevenue: 0,
        achievementPercentage: null,
      },
      PCA: {
        category: "PCA",
        counselorCount: 0,
        baseTarget: categoryTargetsMap.PCA.base_target,
        baseAdmissionTarget: categoryTargetsMap.PCA.base_admission_target,
        totalTarget: 0,
        totalRevenue: 0,
        achievementPercentage: null,
      },
    };

    // 8. Merge counselors with category base target + additional target logic
    let activeCounselorsCount = 0;
    let assignedCount = 0;
    let combinedMonthlyTarget = 0;
    let combinedAdmissionTarget = 0;
    let unconfiguredTargetsCount = 0;
    let teamActualRevenue = 0;
    let teamActualAdmissions = 0;

    const mergedCounselors: CounselorWithTarget[] = counselors.map((c) => {
      const category = (c.category as CounselorCategory) || "CDA";
      const catTarget = categoryTargetsMap[category] || { base_target: 800000, base_admission_target: 8 };

      const targetRecord = targetsMap.get(c.id);
      const isTargetAssigned = Boolean(targetRecord && targetRecord.isAssigned);

      // Base target resolution: record base_target -> category base target -> counselor monthly target
      const baseTarget =
        targetRecord?.base_target !== undefined && targetRecord.base_target > 0
          ? targetRecord.base_target
          : catTarget.base_target;

      const additionalTarget = targetRecord?.additional_target || 0;
      const additionalReason = targetRecord?.additional_target_reason || null;

      // Dynamic calculation: Individual Monthly Target = Category Base Target + Individual Additional Target
      const calculatedFinalTarget = baseTarget + additionalTarget;
      const finalTarget = calculatedFinalTarget > 0 ? calculatedFinalTarget : (targetRecord?.amount || c.monthly_target || 0);

      const effectiveAdmissionTarget =
        targetRecord?.admissions || catTarget.base_admission_target || c.monthly_admission_target || 0;

      const actualRevenue = revenueMap.get(c.id) || 0;
      const actualAdmissions = admissionsCountMap.get(c.id) || 0;

      const achievement = finalTarget > 0 ? (actualRevenue / finalTarget) * 100 : null;
      const admissionAchievement =
        effectiveAdmissionTarget > 0 ? (actualAdmissions / effectiveAdmissionTarget) * 100 : null;

      // Calendar-day expected revenue & performance gap calculation
      const expectedRevenue = Math.round((finalTarget / daysInMonth) * elapsedDays);
      const performanceGap = actualRevenue - expectedRevenue;

      // Projection completion calculations
      const projStats = projectionsMap.get(c.id);
      const projReviewed = (projStats?.met || 0) + (projStats?.notMet || 0);
      const projCompletion = projStats && projReviewed > 0 ? (projStats.met / projReviewed) * 100 : null;
      const projWeighted = projStats && projStats.reviewedRev > 0 ? (projStats.metRev / projStats.reviewedRev) * 100 : null;

      if (c.is_active) {
        activeCounselorsCount++;
        assignedCount++;
        combinedMonthlyTarget += finalTarget;
        combinedAdmissionTarget += effectiveAdmissionTarget;
        teamActualRevenue += actualRevenue;
        teamActualAdmissions += actualAdmissions;

        // Tally category summaries
        if (categorySummaries[category]) {
          categorySummaries[category].counselorCount += 1;
          categorySummaries[category].totalTarget += finalTarget;
          categorySummaries[category].totalRevenue += actualRevenue;
        }
      }

      return {
        ...c,
        category,
        base_target: baseTarget,
        additional_target: additionalTarget,
        additional_target_reason: additionalReason,
        final_target: finalTarget,
        effective_target: finalTarget,
        effective_admission_target: effectiveAdmissionTarget,
        has_custom_target: Boolean(additionalTarget > 0 || isTargetAssigned),
        has_custom_admission_target: effectiveAdmissionTarget > 0,
        is_target_assigned: true,
        assigned_notes: targetRecord?.notes || null,
        target_updated_at: targetRecord?.updated_at || null,
        target_updated_by: targetRecord?.updated_by_email || null,
        actual_revenue: actualRevenue,
        actual_admissions: actualAdmissions,
        achievement_percentage: achievement,
        admission_achievement_percentage: admissionAchievement,
        performance_gap: performanceGap,
        projection_total: projStats?.total || 0,
        projection_met: projStats?.met || 0,
        projection_not_met: projStats?.notMet || 0,
        projection_pending: projStats?.pending || 0,
        projection_completion_percentage: projCompletion,
        projection_revenue_weighted_percentage: projWeighted,
      };
    });

    // Compute category achievement percentages
    (["CDA", "SCDA", "PCA"] as const).forEach((cat) => {
      const item = categorySummaries[cat];
      item.achievementPercentage = item.totalTarget > 0 ? (item.totalRevenue / item.totalTarget) * 100 : null;
    });

    let targetsAssignmentState: "all_assigned" | "partially_assigned" | "unassigned" = "all_assigned";
    if (activeCounselorsCount === 0) {
      targetsAssignmentState = "unassigned";
    }

    const teamAchievementPercentage =
      combinedMonthlyTarget > 0 ? (teamActualRevenue / combinedMonthlyTarget) * 100 : null;
    const teamAdmissionAchievementPercentage =
      combinedAdmissionTarget > 0 ? (teamActualAdmissions / combinedAdmissionTarget) * 100 : null;

    return {
      success: true,
      isConfigured: true,
      counselors: mergedCounselors,
      summary: {
        totalCounselors: counselors.length,
        activeCounselors: activeCounselorsCount,
        combinedMonthlyTarget,
        combinedAdmissionTarget,
        unconfiguredTargetsCount: 0,
        teamActualRevenue,
        teamActualAdmissions,
        teamAchievementPercentage,
        teamAdmissionAchievementPercentage,
        targetsAssignmentState,
        assignedCount,
        categorySummaries,
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
      category: formData.category || "CDA",
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
  if (formData.category !== undefined) {
    updates.category = formData.category;
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
          category: master.category || "CDA",
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

/**
 * Updates or defines monthly base target for an entire counselor category (CDA, SCDA, PCA)
 */
export async function updateCategoryBaseTargetAction(
  category: CounselorCategory,
  monthKey: string,
  baseTarget: number,
  baseAdmissionTarget: number = 0,
  reason?: string
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const adminEmail = auth.user?.email || "sachin.behera@collegevidya.com";
  const normalizedMonth = normalizeMonthKey(monthKey);
  const target = Math.max(0, Number(baseTarget) || 0);
  const admTarget = Math.max(0, Number(baseAdmissionTarget) || 0);

  try {
    // 1. Fetch current category target for audit diff
    const { data: existing } = await supabase
      .from("category_monthly_targets")
      .select("base_target, base_admission_target")
      .eq("category", category)
      .eq("target_month", normalizedMonth)
      .maybeSingle();

    // 2. Upsert into category_monthly_targets
    const { error: upsertErr } = await supabase
      .from("category_monthly_targets")
      .upsert(
        {
          category,
          target_month: normalizedMonth,
          base_target: target,
          base_admission_target: admTarget,
          updated_by_email: adminEmail,
        },
        { onConflict: "category,target_month" }
      );

    if (upsertErr) {
      return { success: false, error: "Failed to update category target: " + upsertErr.message };
    }

    // 3. Log into category_target_audit_logs
    try {
      await supabase.from("category_target_audit_logs").insert({
        category,
        target_month: normalizedMonth,
        old_base_target: existing?.base_target ?? null,
        new_base_target: target,
        old_base_admission_target: existing?.base_admission_target ?? null,
        new_base_admission_target: admTarget,
        changed_by_email: adminEmail,
        reason: reason?.trim() || "Admin updated monthly category base quota",
      });
    } catch {
      // Non-fatal if audit log table not yet available
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `${category} base target updated to ₹${target.toLocaleString("en-IN")} for ${formatMonthDisplay(normalizedMonth)}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Unexpected error updating category target: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Assigns or updates a counselor's category (CDA, SCDA, PCA)
 */
export async function updateCounselorCategoryAction(
  counselorId: string,
  newCategory: CounselorCategory,
  monthKey?: string
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const adminEmail = auth.user?.email || "sachin.behera@collegevidya.com";

  try {
    const { data: counselor, error: fetchErr } = await supabase
      .from("counselors")
      .select("category, full_name, employee_code")
      .eq("id", counselorId)
      .single();

    if (fetchErr || !counselor) {
      return { success: false, error: "Counselor not found" };
    }

    const oldCategory = counselor.category;

    const { error: updateErr } = await supabase
      .from("counselors")
      .update({ category: newCategory })
      .eq("id", counselorId);

    if (updateErr) {
      return { success: false, error: "Failed to update category: " + updateErr.message };
    }

    // Log to target audit logs
    const normalizedMonth = monthKey ? normalizeMonthKey(monthKey) : normalizeMonthKey(new Date());
    try {
      await supabase.from("counselor_target_audit_logs").insert({
        counselor_id: counselorId,
        target_month: normalizedMonth,
        category: newCategory,
        new_target_amount: 0,
        new_target_admissions: 0,
        reason: `Category changed from ${oldCategory || "None"} to ${newCategory}`,
        change_type: "CATEGORY_ASSIGNMENT",
        changed_by_email: adminEmail,
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `${counselor.full_name} (${counselor.employee_code}) category updated to ${newCategory}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Unexpected error updating category: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Adjusts an individual counselor's additional target with mandatory reason and audit history
 * Formula: Individual Monthly Target = Category Base Target + Individual Additional Target
 */
export async function updateCounselorAdditionalTargetAction(
  counselorId: string,
  monthKey: string,
  additionalTarget: number,
  reason?: string
): Promise<CounselorActionResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const adminEmail = auth.user?.email || "sachin.behera@collegevidya.com";
  const normalizedMonth = normalizeMonthKey(monthKey);
  const addTarget = Math.max(0, Number(additionalTarget) || 0);

  try {
    // 1. Fetch counselor
    const { data: counselor, error: cErr } = await supabase
      .from("counselors")
      .select("category, full_name, employee_code, monthly_target")
      .eq("id", counselorId)
      .single();

    if (cErr || !counselor) {
      return { success: false, error: "Counselor not found" };
    }

    const category: CounselorCategory = (counselor.category as CounselorCategory) || "CDA";

    // 2. Fetch category base target
    let baseTarget = 800000;
    let baseAdm = 8;
    const DEFAULT_BASE: Record<CounselorCategory, number> = { CDA: 800000, SCDA: 600000, PCA: 400000 };
    baseTarget = DEFAULT_BASE[category] || 800000;

    try {
      const { data: catData } = await supabase
        .from("category_monthly_targets")
        .select("base_target, base_admission_target")
        .eq("category", category)
        .eq("target_month", normalizedMonth)
        .maybeSingle();

      if (catData) {
        baseTarget = Number(catData.base_target) || baseTarget;
        baseAdm = Number(catData.base_admission_target) || 8;
      }
    } catch {
      // Fallback to defaults
    }

    // 3. Fetch existing target record
    const { data: existing } = await supabase
      .from("counselor_monthly_targets")
      .select("additional_target, target_amount, target_admissions")
      .eq("counselor_id", counselorId)
      .eq("target_month", normalizedMonth)
      .maybeSingle();

    const oldAdditional = existing?.additional_target ?? 0;
    const finalTarget = baseTarget + addTarget;

    // 4. Upsert counselor_monthly_targets
    const { error: upsertErr } = await supabase
      .from("counselor_monthly_targets")
      .upsert(
        {
          counselor_id: counselorId,
          target_month: normalizedMonth,
          category,
          base_target: baseTarget,
          additional_target: addTarget,
          additional_target_reason: reason?.trim() || null,
          target_amount: finalTarget,
          target_admissions: existing?.target_admissions || baseAdm,
          updated_by_email: adminEmail,
          is_explicitly_assigned: true,
        },
        { onConflict: "counselor_id,target_month" }
      );

    if (upsertErr) {
      return { success: false, error: "Failed to update additional target: " + upsertErr.message };
    }

    // 5. Audit Log Entry
    try {
      await supabase.from("counselor_target_audit_logs").insert({
        counselor_id: counselorId,
        target_month: normalizedMonth,
        category,
        base_target: baseTarget,
        additional_target: addTarget,
        old_target_amount: existing?.target_amount ?? baseTarget,
        new_target_amount: finalTarget,
        old_target_admissions: existing?.target_admissions ?? baseAdm,
        new_target_admissions: existing?.target_admissions ?? baseAdm,
        reason:
          reason?.trim() ||
          `Additional target adjusted from ₹${oldAdditional.toLocaleString("en-IN")} to ₹${addTarget.toLocaleString("en-IN")}`,
        change_type: "ADDITIONAL_TARGET_UPDATE",
        changed_by_email: adminEmail,
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Additional target of ₹${addTarget.toLocaleString("en-IN")} saved for ${counselor.full_name}. Final monthly target: ₹${finalTarget.toLocaleString("en-IN")}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Unexpected error updating additional target: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Retrieves audit logs for target adjustments
 */
export async function getTargetAuditLogsAction(
  counselorId?: string,
  monthKey?: string
): Promise<{
  success: boolean;
  logs: TargetAuditLogEntry[];
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, logs: [], error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    let query = supabase
      .from("counselor_target_audit_logs")
      .select("id, counselor_id, target_month, old_target_amount, new_target_amount, base_target, additional_target, reason, change_type, changed_by_email, created_at, counselors(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (counselorId && counselorId !== "ALL") {
      query = query.eq("counselor_id", counselorId);
    }
    if (monthKey) {
      query = query.eq("target_month", normalizeMonthKey(monthKey));
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, logs: [], error: error.message };
    }

    const logs: TargetAuditLogEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      counselor_id: row.counselor_id,
      counselor_name: row.counselors?.full_name || "Unknown Counselor",
      target_month: row.target_month,
      old_target_amount: Number(row.old_target_amount) || 0,
      new_target_amount: Number(row.new_target_amount) || 0,
      base_target: row.base_target !== null ? Number(row.base_target) : undefined,
      additional_target: row.additional_target !== null ? Number(row.additional_target) : undefined,
      reason: row.reason || null,
      change_type: row.change_type || "TARGET_UPDATE",
      changed_by_email: row.changed_by_email,
      created_at: row.created_at,
    }));

    return { success: true, logs };
  } catch (err: any) {
    return { success: false, logs: [], error: err?.message || "Failed to fetch audit logs" };
  }
}
