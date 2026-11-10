"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAuthorizedAdminEmail } from "@/lib/auth/admin";
import {
  getDaysInMonth,
  getMonthWeekPeriods,
  buildCounselorWeeklyPerformance,
} from "@/lib/weekly";
import { normalizeMonthKey, formatINR } from "@/lib/format";
import type { CounselorCategory } from "@/types/counselor";
import type { CounselorMonthlyPerformance } from "@/types/analytics";

/**
 * Resolves the authenticated counselor record from Supabase Auth session
 */
export async function getAuthenticatedCounselor() {
  if (!isSupabaseConfigured()) {
    return { isAuthorized: false, error: "Database service not configured." };
  }

  const supabase = createClient();
  const { data: authData, error: authErr } = await supabase.auth.getUser();

  if (authErr || !authData.user) {
    return { isAuthorized: false, error: "Authentication required." };
  }

  const user = authData.user;
  const userEmail = (user.email || "").toLowerCase();

  // If Sachin (Admin) is accessing, allow previewing first active counselor
  const isAdmin = isAuthorizedAdminEmail(userEmail);

  let counselorQuery = supabase
    .from("counselors")
    .select("*")
    .eq("is_active", true);

  if (!isAdmin) {
    counselorQuery = counselorQuery.or(`auth_user_id.eq.${user.id},email.eq.${userEmail}`);
  }

  const { data: counselor, error: cErr } = await counselorQuery.maybeSingle();

  if (cErr || !counselor) {
    return {
      isAuthorized: false,
      error: "No active counselor profile is associated with this account.",
    };
  }

  // Ensure auth_user_id is associated if not already set
  if (!counselor.auth_user_id && user.id && !isAdmin) {
    await supabase
      .from("counselors")
      .update({ auth_user_id: user.id })
      .eq("id", counselor.id);
  }

  return {
    isAuthorized: true,
    isAdmin,
    user,
    counselor,
    supabase,
  };
}

export interface CounselorPortalData {
  counselor: {
    id: string;
    fullName: string;
    employeeCode: string;
    email: string | null;
    phone: string | null;
    category: CounselorCategory;
  };
  period: {
    year: number;
    month: number;
    monthName: string;
    totalDays: number;
    elapsedDays: number;
  };
  performance: CounselorMonthlyPerformance;
  admissions: Array<{
    id: string;
    studentName?: string;
    admissionDate: string;
    universityName: string;
    programName: string;
    amountCollected: number;
    paymentMode: string;
    verificationStatus: string;
    notes?: string;
  }>;
  todayProjection: {
    id?: string;
    projectedRevenue: number;
    expectedAdmissions?: number;
    status: string;
    notes?: string;
    submittedAt?: string;
  } | null;
  recentProjections: Array<{
    id: string;
    projectionDate: string;
    projectedRevenue: number;
    expectedAdmissions?: number;
    status: string;
    notes?: string;
  }>;
}

/**
 * Fetches comprehensive data for the authenticated counselor's personal dashboard
 */
export async function getCounselorPortalDataAction(
  targetMonthKey?: string
): Promise<{
  success: boolean;
  data: CounselorPortalData | null;
  error?: string;
}> {
  const auth = await getAuthenticatedCounselor();
  if (!auth.isAuthorized || !auth.counselor || !auth.supabase) {
    return { success: false, data: null, error: auth.error };
  }

  const supabase = auth.supabase;
  const counselor = auth.counselor;

  const today = new Date();
  const normalizedMonth = targetMonthKey
    ? normalizeMonthKey(targetMonthKey)
    : normalizeMonthKey(today);

  const [yearStr, monthStr] = normalizedMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDays = getDaysInMonth(year, month);
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(totalDays).padStart(2, "0")}`;
  const todayStr = today.toISOString().split("T")[0];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  try {
    // 1. Fetch category base target
    const category: CounselorCategory = (counselor.category as CounselorCategory) || "CDA";
    const defaultCatTargets: Record<CounselorCategory, number> = {
      CDA: 800000,
      SCDA: 600000,
      PCA: 400000,
    };
    let baseTarget = defaultCatTargets[category] || 800000;

    try {
      const { data: catData } = await supabase
        .from("category_monthly_targets")
        .select("base_target")
        .eq("category", category)
        .eq("target_month", normalizedMonth)
        .maybeSingle();

      if (catData?.base_target) {
        baseTarget = Number(catData.base_target);
      }
    } catch {
      // Fallback
    }

    // 2. Fetch counselor target record (for additional target)
    let additionalTarget = 0;
    let finalTarget = baseTarget;

    try {
      const { data: targetRecord } = await supabase
        .from("counselor_monthly_targets")
        .select("base_target, additional_target, target_amount")
        .eq("counselor_id", counselor.id)
        .eq("target_month", normalizedMonth)
        .maybeSingle();

      if (targetRecord) {
        if (targetRecord.base_target && Number(targetRecord.base_target) > 0) {
          baseTarget = Number(targetRecord.base_target);
        }
        additionalTarget = Number(targetRecord.additional_target) || 0;
        finalTarget =
          Number(targetRecord.target_amount) > 0
            ? Number(targetRecord.target_amount)
            : baseTarget + additionalTarget;
      }
    } catch {
      // Fallback
    }

    // 3. Fetch counselor's admissions for this month
    const { data: admissionsData, error: admErr } = await supabase
      .from("admissions")
      .select("*")
      .eq("counselor_id", counselor.id)
      .order("admission_date", { ascending: false });

    if (admErr) {
      return { success: false, data: null, error: admErr.message };
    }

    const allAdmissions = admissionsData || [];

    // Filter admissions for current reporting month
    const monthAdmissions = allAdmissions.filter((a: any) => {
      const d = a.admission_date;
      return d >= startDate && d <= endDate;
    });

    // Bucket for buildCounselorWeeklyPerformance
    const weeklyAdmissionsPayload = monthAdmissions.map((a: any) => ({
      amount: Number(a.amount_collected) || 0,
      day: parseInt(a.admission_date.split("-")[2], 10),
      isVerified: a.verification_status === "verified",
    }));

    const performance = buildCounselorWeeklyPerformance({
      counselorId: counselor.id,
      counselorName: counselor.full_name,
      employeeCode: counselor.employee_code,
      category,
      email: counselor.email,
      baseTarget,
      additionalTarget,
      monthlyTarget: finalTarget,
      year,
      month,
      admissions: weeklyAdmissionsPayload,
      referenceDate: today,
    });

    // 4. Fetch projections
    let todayProj = null;
    let recentProjs: any[] = [];

    try {
      const { data: projs } = await supabase
        .from("projections")
        .select("*")
        .eq("counselor_id", counselor.id)
        .order("projection_date", { ascending: false })
        .limit(10);

      if (projs && projs.length > 0) {
        recentProjs = projs.map((p: any) => ({
          id: p.id,
          projectionDate: p.projection_date,
          projectedRevenue: Number(p.projected_revenue) || 0,
          expectedAdmissions: Number(p.expected_admissions) || 1,
          status: p.status || "pending",
          notes: p.notes || "",
        }));

        const matchingToday = projs.find((p: any) => p.projection_date === todayStr);
        if (matchingToday) {
          todayProj = {
            id: matchingToday.id,
            projectedRevenue: Number(matchingToday.projected_revenue) || 0,
            expectedAdmissions: Number(matchingToday.expected_admissions) || 1,
            status: matchingToday.status || "pending",
            notes: matchingToday.notes || "",
            submittedAt: matchingToday.created_at,
          };
        }
      }
    } catch {
      // Non-fatal
    }

    const portalData: CounselorPortalData = {
      counselor: {
        id: counselor.id,
        fullName: counselor.full_name,
        employeeCode: counselor.employee_code,
        email: counselor.email,
        phone: counselor.phone,
        category,
      },
      period: {
        year,
        month,
        monthName: monthNames[month - 1],
        totalDays,
        elapsedDays: performance.weeks ? today.getDate() : totalDays,
      },
      performance,
      admissions: allAdmissions.map((a: any) => ({
        id: a.id,
        studentName: a.student_name || "Student",
        admissionDate: a.admission_date,
        universityName: a.university_name,
        programName: a.program_name,
        amountCollected: Number(a.amount_collected) || 0,
        paymentMode: a.payment_mode || "semester_fees",
        verificationStatus: a.verification_status || "unverified",
        notes: a.notes,
      })),
      todayProjection: todayProj,
      recentProjections: recentProjs,
    };

    return {
      success: true,
      data: portalData,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: "Unexpected error reading counselor dashboard: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * PERMISSION 1: Counselor submits a new admission record
 * Strictly binds admission to the authenticated counselor's ID.
 */
export async function counselorSubmitAdmissionAction(formData: {
  studentName?: string;
  admissionDate: string;
  universityName: string;
  programName: string;
  amountCollected: number;
  paymentMode: string;
  notes?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const auth = await getAuthenticatedCounselor();
  if (!auth.isAuthorized || !auth.counselor || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const counselor = auth.counselor;

  const {
    studentName,
    admissionDate,
    universityName,
    programName,
    amountCollected,
    paymentMode,
    notes,
  } = formData;

  if (!admissionDate) {
    return { success: false, error: "Admission date is required." };
  }
  if (!universityName?.trim()) {
    return { success: false, error: "University name is required." };
  }
  if (!programName?.trim()) {
    return { success: false, error: "Program name is required." };
  }
  const numericAmount = Number(amountCollected);
  if (isNaN(numericAmount) || numericAmount < 0) {
    return { success: false, error: "Please enter a valid non-negative collection amount." };
  }

  try {
    const payload: any = {
      counselor_id: counselor.id, // Strictly bound to authenticated counselor
      admission_date: admissionDate,
      university_name: universityName.trim(),
      program_name: programName.trim(),
      amount_collected: numericAmount,
      payment_mode: paymentMode || "semester_fees",
      verification_status: "unverified", // All counselor submissions start unverified for Admin audit
      notes: notes?.trim() || null,
    };

    if (studentName?.trim()) {
      payload.student_name = studentName.trim();
    }

    const { error: insertErr } = await supabase.from("admissions").insert(payload);

    if (insertErr) {
      return { success: false, error: "Failed to submit admission: " + insertErr.message };
    }

    revalidatePath("/counselor");
    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Admission for ${universityName} (₹${numericAmount.toLocaleString("en-IN")}) submitted successfully and queued for admin verification.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Unexpected error submitting admission: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * PERMISSION 2: Counselor submits daily morning projection
 * Strictly binds projection to the authenticated counselor's ID.
 */
export async function counselorSubmitMorningProjectionAction(formData: {
  projectionDate: string;
  expectedAdmissions: number;
  projectedRevenue: number;
  remarks?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const auth = await getAuthenticatedCounselor();
  if (!auth.isAuthorized || !auth.counselor || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const counselor = auth.counselor;

  const { projectionDate, expectedAdmissions, projectedRevenue, remarks } = formData;

  if (!projectionDate) {
    return { success: false, error: "Projection date is required." };
  }

  const numericRev = Number(projectedRevenue);
  if (isNaN(numericRev) || numericRev <= 0) {
    return { success: false, error: "Please enter a valid projected revenue greater than zero." };
  }

  const numericAdm = Number(expectedAdmissions) || 1;

  try {
    // Look up or default university_id for compatibility with existing schema
    let universityId = null;
    try {
      const { data: uni } = await supabase.from("universities").select("id").limit(1).maybeSingle();
      if (uni) universityId = uni.id;
    } catch {
      // Non-fatal
    }

    const payload: any = {
      counselor_id: counselor.id, // Strictly bound
      projection_date: projectionDate,
      projected_revenue: numericRev,
      expected_admissions: numericAdm,
      notes: remarks?.trim() || null,
      status: "pending",
    };

    if (universityId) {
      payload.university_id = universityId;
    }

    // Check if projection already exists for this counselor and date
    const { data: existing } = await supabase
      .from("projections")
      .select("id, status")
      .eq("counselor_id", counselor.id)
      .eq("projection_date", projectionDate)
      .maybeSingle();

    if (existing) {
      if (existing.status !== "pending") {
        return {
          success: false,
          error: "This daily projection has already been reviewed by Admin and cannot be modified.",
        };
      }
      const { error: updateErr } = await supabase
        .from("projections")
        .update(payload)
        .eq("id", existing.id);

      if (updateErr) {
        return { success: false, error: "Failed to update projection: " + updateErr.message };
      }
    } else {
      const { error: insertErr } = await supabase.from("projections").insert(payload);
      if (insertErr) {
        return { success: false, error: "Failed to submit projection: " + insertErr.message };
      }
    }

    revalidatePath("/counselor");
    revalidatePath("/dashboard/projections");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Morning projection of ₹${numericRev.toLocaleString("en-IN")} for ${projectionDate} submitted successfully.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Unexpected error submitting projection: " + (err?.message || "Unknown error"),
    };
  }
}
