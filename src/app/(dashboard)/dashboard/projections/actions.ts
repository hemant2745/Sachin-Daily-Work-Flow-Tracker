"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import { getMonthDateRange, normalizeMonthKey } from "@/lib/format";
import { calculateMonthlyProjectionMetrics } from "@/lib/projections";
import type {
  Projection,
  ProjectionFormData,
  ProjectionFilterOptions,
  MonthlyProjectionOverview,
} from "@/types/projections";

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
 * Fetch all projections matching the filter options, alongside monthly team overview
 */
export async function getProjectionsAction(options: ProjectionFilterOptions = {}) {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      error: auth.error || "Unauthorized",
      projections: [] as Projection[],
      overview: null,
    };
  }

  const supabase = auth.supabase;
  const monthKey = options.monthKey || normalizeMonthKey(new Date());
  const { startDate, endDate } = getMonthDateRange(monthKey);

  try {
    // 1. Fetch active counselors to build comprehensive stats
    const { data: counselors, error: counselorErr } = await supabase
      .from("counselors")
      .select("id, full_name, employee_code")
      .order("full_name", { ascending: true });

    if (counselorErr) {
      return {
        success: false,
        error: "Failed to load counselors: " + counselorErr.message,
        projections: [],
        overview: null,
      };
    }

    // 2. Fetch all projections for the selected month (to accurately compute monthly metrics)
    const { data: monthProjections, error: monthProjErr } = await supabase
      .from("projections")
      .select(`
        id,
        projection_date,
        counselor_id,
        university_id,
        projected_revenue,
        status,
        notes,
        reviewed_at,
        reviewed_by,
        created_at,
        updated_at,
        counselor:counselors (
          id,
          full_name,
          employee_code
        ),
        university:universities (
          id,
          name
        )
      `)
      .gte("projection_date", startDate)
      .lte("projection_date", endDate)
      .order("projection_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (monthProjErr) {
      return {
        success: false,
        error: "Failed to fetch projections: " + monthProjErr.message,
        projections: [],
        overview: null,
      };
    }

    const rawProjections = (monthProjections || []) as any[];
    const parsedProjections: Projection[] = rawProjections.map((p) => ({
      ...p,
      counselor: Array.isArray(p.counselor) ? p.counselor[0] : p.counselor,
      university: Array.isArray(p.university) ? p.university[0] : p.university,
      projected_revenue: Number(p.projected_revenue),
    }));

    // Calculate complete monthly summary overview
    const overview: MonthlyProjectionOverview = calculateMonthlyProjectionMetrics(
      parsedProjections,
      counselors || [],
      monthKey
    );

    // Apply additional filters (counselor, university, status, search) for table display
    let filteredProjections = parsedProjections;

    if (options.counselor_id && options.counselor_id !== "ALL") {
      filteredProjections = filteredProjections.filter((p) => p.counselor_id === options.counselor_id);
    }

    if (options.university_id && options.university_id !== "ALL") {
      filteredProjections = filteredProjections.filter((p) => p.university_id === options.university_id);
    }

    if (options.status && options.status !== "ALL") {
      filteredProjections = filteredProjections.filter((p) => p.status === options.status);
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      filteredProjections = filteredProjections.filter((p) => {
        const matchesCounselor = p.counselor?.full_name?.toLowerCase().includes(q) || false;
        const matchesEmpCode = p.counselor?.employee_code?.toLowerCase().includes(q) || false;
        const matchesUni = p.university?.name?.toLowerCase().includes(q) || false;
        const matchesNotes = p.notes?.toLowerCase().includes(q) || false;
        return matchesCounselor || matchesEmpCode || matchesUni || matchesNotes;
      });
    }

    return {
      success: true,
      projections: filteredProjections,
      allMonthProjections: parsedProjections,
      overview,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Error fetching projections: " + (err?.message || "Unknown error"),
      projections: [],
      overview: null,
    };
  }
}

/**
 * Create a new projection record
 */
export async function createProjectionAction(formData: ProjectionFormData) {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  // Input Validation
  if (!formData.projection_date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.projection_date)) {
    return { success: false, error: "Valid projection date (YYYY-MM-DD) is required." };
  }

  if (!formData.counselor_id || typeof formData.counselor_id !== "string") {
    return { success: false, error: "Counselor selection is required." };
  }

  if (!formData.university_id || typeof formData.university_id !== "string") {
    return { success: false, error: "University selection is required." };
  }

  const revenueNum = Number(formData.projected_revenue);
  if (isNaN(revenueNum) || revenueNum <= 0) {
    return { success: false, error: "Projected revenue amount must be a positive number greater than 0." };
  }

  const supabase = auth.supabase;

  try {
    const { data: newProj, error: insertErr } = await supabase
      .from("projections")
      .insert({
        projection_date: formData.projection_date,
        counselor_id: formData.counselor_id,
        university_id: formData.university_id,
        projected_revenue: revenueNum,
        notes: formData.notes?.trim() || null,
        status: "pending",
      })
      .select(`
        id,
        projection_date,
        counselor_id,
        university_id,
        projected_revenue,
        status,
        notes,
        created_at,
        counselor:counselors(id, full_name, employee_code),
        university:universities(id, name)
      `)
      .single();

    if (insertErr) {
      return { success: false, error: "Failed to create projection: " + insertErr.message };
    }

    revalidatePath("/dashboard/projections");
    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return { success: true, projection: newProj };
  } catch (err: any) {
    return { success: false, error: "Error creating projection: " + (err?.message || "Unknown error") };
  }
}

/**
 * Update an existing projection record
 */
export async function updateProjectionAction(
  id: string,
  formData: {
    projection_date?: string;
    counselor_id?: string;
    university_id?: string;
    projected_revenue?: number;
    notes?: string | null;
  }
) {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  if (!id) {
    return { success: false, error: "Projection ID is required." };
  }

  const updates: Record<string, any> = {};

  if (formData.projection_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.projection_date)) {
      return { success: false, error: "Invalid projection date format." };
    }
    updates.projection_date = formData.projection_date;
  }

  if (formData.counselor_id !== undefined) {
    if (!formData.counselor_id) return { success: false, error: "Counselor cannot be empty." };
    updates.counselor_id = formData.counselor_id;
  }

  if (formData.university_id !== undefined) {
    if (!formData.university_id) return { success: false, error: "University cannot be empty." };
    updates.university_id = formData.university_id;
  }

  if (formData.projected_revenue !== undefined) {
    const revNum = Number(formData.projected_revenue);
    if (isNaN(revNum) || revNum <= 0) {
      return { success: false, error: "Projected revenue amount must be positive." };
    }
    updates.projected_revenue = revNum;
  }

  if (formData.notes !== undefined) {
    updates.notes = formData.notes?.trim() || null;
  }

  const supabase = auth.supabase;

  try {
    const { data: updated, error: updateErr } = await supabase
      .from("projections")
      .update(updates)
      .eq("id", id)
      .select(`
        id,
        projection_date,
        counselor_id,
        university_id,
        projected_revenue,
        status,
        notes,
        reviewed_at,
        reviewed_by,
        counselor:counselors(id, full_name, employee_code),
        university:universities(id, name)
      `)
      .single();

    if (updateErr) {
      return { success: false, error: "Failed to update projection: " + updateErr.message };
    }

    revalidatePath("/dashboard/projections");
    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return { success: true, projection: updated };
  } catch (err: any) {
    return { success: false, error: "Error updating projection: " + (err?.message || "Unknown error") };
  }
}

/**
 * Review a projection: Mark as 'met' or 'not_met'
 */
export async function reviewProjectionAction(id: string, status: "met" | "not_met") {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  if (!id) {
    return { success: false, error: "Projection ID is required." };
  }

  if (status !== "met" && status !== "not_met") {
    return { success: false, error: "Invalid review status. Must be 'met' or 'not_met'." };
  }

  const supabase = auth.supabase;
  const reviewerEmail = auth.user?.email || "sachin.behera@collegevidya.com";

  try {
    const { data: updated, error: updateErr } = await supabase
      .from("projections")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerEmail,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: "Failed to review projection: " + updateErr.message };
    }

    revalidatePath("/dashboard/projections");
    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return { success: true, projection: updated };
  } catch (err: any) {
    return { success: false, error: "Error reviewing projection: " + (err?.message || "Unknown error") };
  }
}

/**
 * Reset a projection's status back to pending
 */
export async function resetProjectionStatusAction(id: string) {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  const supabase = auth.supabase;

  try {
    const { data: updated, error: updateErr } = await supabase
      .from("projections")
      .update({
        status: "pending",
        reviewed_at: null,
        reviewed_by: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: "Failed to reset projection status: " + updateErr.message };
    }

    revalidatePath("/dashboard/projections");
    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return { success: true, projection: updated };
  } catch (err: any) {
    return { success: false, error: "Error resetting projection status: " + (err?.message || "Unknown error") };
  }
}

/**
 * Delete a projection record
 */
export async function deleteProjectionAction(id: string) {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  if (!id) {
    return { success: false, error: "Projection ID is required." };
  }

  const supabase = auth.supabase;

  try {
    const { error: delErr } = await supabase
      .from("projections")
      .delete()
      .eq("id", id);

    if (delErr) {
      return { success: false, error: "Failed to delete projection: " + delErr.message };
    }

    revalidatePath("/dashboard/projections");
    revalidatePath("/dashboard/counselors");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Error deleting projection: " + (err?.message || "Unknown error") };
  }
}

/**
 * Fetch counselors and universities for dropdown selections
 */
export async function getProjectionOptionsAction() {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      counselors: [] as Array<{ id: string; full_name: string; employee_code: string }>,
      universities: [] as Array<{ id: string; name: string }>,
    };
  }

  const supabase = auth.supabase;

  try {
    const [counselorsRes, universitiesRes] = await Promise.all([
      supabase
        .from("counselors")
        .select("id, full_name, employee_code")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      supabase
        .from("universities")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    return {
      success: true,
      counselors: counselorsRes.data || [],
      universities: universitiesRes.data || [],
    };
  } catch (err: any) {
    return {
      success: false,
      counselors: [],
      universities: [],
      error: err?.message,
    };
  }
}

/**
 * Fetch monthly projection stats for a specific counselor (for Counselor Dashboard integration)
 */
export async function getCounselorMonthlyProjectionsAction(counselorId: string, monthKey: string) {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, stats: null, error: auth.error };
  }

  const supabase = auth.supabase;
  const { startDate, endDate } = getMonthDateRange(monthKey);

  try {
    const { data: projections, error } = await supabase
      .from("projections")
      .select("id, projection_date, projected_revenue, status")
      .eq("counselor_id", counselorId)
      .gte("projection_date", startDate)
      .lte("projection_date", endDate);

    if (error) {
      return { success: false, stats: null, error: error.message };
    }

    let total = 0;
    let met = 0;
    let notMet = 0;
    let pending = 0;
    let totalRevenue = 0;
    let reviewedRevenue = 0;
    let metRevenue = 0;

    for (const p of (projections || [])) {
      const rev = Number(p.projected_revenue) || 0;
      total++;
      totalRevenue += rev;

      if (p.status === "met") {
        met++;
        reviewedRevenue += rev;
        metRevenue += rev;
      } else if (p.status === "not_met") {
        notMet++;
        reviewedRevenue += rev;
      } else {
        pending++;
      }
    }

    const reviewed = met + notMet;
    const completionPercentage = reviewed > 0 ? (met / reviewed) * 100 : null;
    const revenueWeightedPercentage = reviewedRevenue > 0 ? (metRevenue / reviewedRevenue) * 100 : null;

    return {
      success: true,
      stats: {
        totalProjections: total,
        metCount: met,
        notMetCount: notMet,
        pendingCount: pending,
        reviewedCount: reviewed,
        completionPercentage,
        totalProjectedRevenue: totalRevenue,
        reviewedProjectedRevenue: reviewedRevenue,
        metProjectedRevenue: metRevenue,
        revenueWeightedPercentage,
      },
    };
  } catch (err: any) {
    return { success: false, stats: null, error: err?.message };
  }
}
