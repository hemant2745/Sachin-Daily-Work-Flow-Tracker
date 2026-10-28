"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import { validateAdmissionInput, normalizeMonthKey, getMonthDateRange } from "@/lib/format";
import type {
  Admission,
  AdmissionWithCounselor,
  AdmissionFormData,
  AdmissionsSummary,
  AdmissionActionResponse,
  PaymentMode,
} from "@/types/admissions";
import type { Counselor } from "@/types/counselor";

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
 * Fetches all admissions with attached counselor details, and computes summaries
 */
export async function getAdmissionsAction(options?: {
  monthKey?: string;
  counselorId?: string;
  paymentMode?: string;
  search?: string;
}): Promise<{
  success: boolean;
  isConfigured: boolean;
  admissions: AdmissionWithCounselor[];
  summary: AdmissionsSummary;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      isConfigured: auth.isConfigured,
      admissions: [],
      summary: {
        totalAdmissions: 0,
        totalCollections: 0,
        currentMonthCollections: 0,
        currentMonthAdmissionsCount: 0,
        averageCollection: 0,
      },
      error: auth.error,
    };
  }

  const supabase = auth.supabase;
  const currentMonthKey = options?.monthKey || normalizeMonthKey(new Date());
  const { startDate: monthStart, endDate: monthEnd } = getMonthDateRange(currentMonthKey);

  try {
    // 1. Fetch all admissions for overall summary metrics (lifetime & current month)
    const { data: allData, error: allError } = await supabase
      .from("admissions")
      .select("id, counselor_id, admission_date, amount_collected, payment_mode, university_name, program_name, notes, created_at, updated_at, counselor:counselors(id, full_name, employee_code, email)")
      .order("admission_date", { ascending: false });

    if (allError) {
      return {
        success: false,
        isConfigured: true,
        admissions: [],
        summary: {
          totalAdmissions: 0,
          totalCollections: 0,
          currentMonthCollections: 0,
          currentMonthAdmissionsCount: 0,
          averageCollection: 0,
        },
        error: "Failed to fetch admissions: " + allError.message,
      };
    }

    const rawList: any[] = allData || [];

    // Calculate system-wide summary metrics
    let totalAdmissions = rawList.length;
    let totalCollections = 0;
    let currentMonthCollections = 0;
    let currentMonthAdmissionsCount = 0;

    const formattedList: AdmissionWithCounselor[] = rawList.map((item) => {
      const amount = Number(item.amount_collected) || 0;
      totalCollections += amount;

      // Check if admission belongs to the selected month (YYYY-MM-DD between monthStart and monthEnd)
      if (item.admission_date >= monthStart && item.admission_date <= monthEnd) {
        currentMonthCollections += amount;
        currentMonthAdmissionsCount += 1;
      }

      const counselorData = Array.isArray(item.counselor) ? item.counselor[0] : item.counselor;

      return {
        id: item.id,
        counselor_id: item.counselor_id,
        admission_date: item.admission_date,
        university_name: item.university_name,
        program_name: item.program_name,
        amount_collected: amount,
        payment_mode: item.payment_mode as PaymentMode,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        counselor: counselorData
          ? {
              id: counselorData.id,
              full_name: counselorData.full_name,
              employee_code: counselorData.employee_code,
              email: counselorData.email,
            }
          : undefined,
      };
    });

    const averageCollection = totalAdmissions > 0 ? Math.round(totalCollections / totalAdmissions) : 0;

    // Apply filtering for the returned table view
    let filtered = formattedList;

    // Month filter if not "ALL"
    if (options?.monthKey && options.monthKey !== "ALL") {
      filtered = filtered.filter(
        (a) => a.admission_date >= monthStart && a.admission_date <= monthEnd
      );
    }

    // Counselor filter
    if (options?.counselorId && options.counselorId !== "ALL") {
      filtered = filtered.filter((a) => a.counselor_id === options.counselorId);
    }

    // Payment mode filter
    if (options?.paymentMode && options.paymentMode !== "ALL") {
      filtered = filtered.filter((a) => a.payment_mode === options.paymentMode);
    }

    // Search query filter
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter((a) => {
        const u = a.university_name.toLowerCase();
        const p = a.program_name.toLowerCase();
        const cName = a.counselor?.full_name.toLowerCase() || "";
        const cCode = a.counselor?.employee_code.toLowerCase() || "";
        return u.includes(q) || p.includes(q) || cName.includes(q) || cCode.includes(q);
      });
    }

    return {
      success: true,
      isConfigured: true,
      admissions: filtered,
      summary: {
        totalAdmissions,
        totalCollections,
        currentMonthCollections,
        currentMonthAdmissionsCount,
        averageCollection,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      admissions: [],
      summary: {
        totalAdmissions: 0,
        totalCollections: 0,
        currentMonthCollections: 0,
        currentMonthAdmissionsCount: 0,
        averageCollection: 0,
      },
      error: "Unexpected error retrieving admissions: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Creates a new admission record
 */
export async function createAdmissionAction(
  formData: AdmissionFormData
): Promise<AdmissionActionResponse> {
  const validation = validateAdmissionInput(formData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return { success: false, error: firstError };
  }

  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    // Verify counselor exists
    const { data: counselor, error: cError } = await supabase
      .from("counselors")
      .select("id, full_name, is_active")
      .eq("id", formData.counselor_id)
      .single();

    if (cError || !counselor) {
      return { success: false, error: "Selected counselor was not found in the database." };
    }

    const { data, error } = await supabase
      .from("admissions")
      .insert({
        counselor_id: formData.counselor_id,
        admission_date: formData.admission_date.trim(),
        university_name: formData.university_name.trim(),
        program_name: formData.program_name.trim(),
        amount_collected: Number(formData.amount_collected),
        payment_mode: formData.payment_mode,
        notes: formData.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: "Database error recording admission: " + error.message };
    }

    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Admission recorded successfully.",
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Failed to create admission: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Updates an existing admission record
 */
export async function updateAdmissionAction(
  id: string,
  formData: Partial<AdmissionFormData>
): Promise<AdmissionActionResponse> {
  const validation = validateAdmissionInput(formData as any);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return { success: false, error: firstError };
  }

  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    const updates: any = {};
    if (formData.counselor_id) updates.counselor_id = formData.counselor_id;
    if (formData.admission_date) updates.admission_date = formData.admission_date.trim();
    if (formData.university_name) updates.university_name = formData.university_name.trim();
    if (formData.program_name) updates.program_name = formData.program_name.trim();
    if (formData.amount_collected !== undefined) updates.amount_collected = Number(formData.amount_collected);
    if (formData.payment_mode) updates.payment_mode = formData.payment_mode;
    if (formData.notes !== undefined) updates.notes = formData.notes?.trim() || null;

    const { data, error } = await supabase
      .from("admissions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: "Database error updating admission: " + error.message };
    }

    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Admission details updated successfully.",
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Failed to update admission: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Fetches counselors list for admission form dropdown
 */
export async function getCounselorsForAdmissionAction(): Promise<{
  success: boolean;
  counselors: Array<{ id: string; full_name: string; employee_code: string; is_active: boolean }>;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, counselors: [], error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    const { data, error } = await supabase
      .from("counselors")
      .select("id, full_name, employee_code, is_active")
      .order("full_name", { ascending: true });

    if (error) {
      return { success: false, counselors: [], error: error.message };
    }

    return {
      success: true,
      counselors: data || [],
    };
  } catch (err: any) {
    return {
      success: false,
      counselors: [],
      error: err?.message || "Failed to load counselors",
    };
  }
}
