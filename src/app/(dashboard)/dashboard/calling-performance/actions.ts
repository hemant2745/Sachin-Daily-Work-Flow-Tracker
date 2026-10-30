"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import { normalizeMonthKey, getMonthDateRange } from "@/lib/format";
import { validateCallingInput, calculateAPR } from "@/lib/calling";
import type {
  CallingPerformanceRecord,
  CallingPerformanceFormData,
  CallingPerformanceFilterOptions,
  TeamCallingSummary,
} from "@/types/calling";

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
 * Fetches all daily calling records matching filter options, plus team APR summary metrics
 */
export async function getCallingPerformanceAction(
  options: CallingPerformanceFilterOptions = {}
): Promise<{
  success: boolean;
  isConfigured: boolean;
  records: CallingPerformanceRecord[];
  summary: TeamCallingSummary | null;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      isConfigured: auth.isConfigured,
      records: [],
      summary: null,
      error: auth.error,
    };
  }

  const supabase = auth.supabase;

  try {
    // 1. Determine active counselors to calculate missing submissions
    const { data: counselors, error: cErr } = await supabase
      .from("counselors")
      .select("id, full_name, employee_code, is_active")
      .eq("is_active", true)
      .order("employee_code", { ascending: true });

    if (cErr) {
      return {
        success: false,
        isConfigured: true,
        records: [],
        summary: null,
        error: "Failed to query counselors: " + cErr.message,
      };
    }

    const totalActiveCounselors = counselors?.length || 0;

    // 2. Build Query
    let query = supabase
      .from("counselor_calling_checkpoints")
      .select(`
        id,
        counselor_id,
        checkpoint_date,
        calls_made,
        calls_connected,
        talk_time_minutes,
        follow_ups,
        admissions_converted,
        call_achievement_percent,
        talk_time_achievement_percent,
        apr_percent,
        apr_reason,
        daily_notes,
        created_by,
        updated_by,
        created_at,
        updated_at,
        counselor:counselors(id, full_name, employee_code)
      `)
      .order("checkpoint_date", { ascending: false });

    if (options.date) {
      query = query.eq("checkpoint_date", options.date);
    } else if (options.monthKey) {
      const { startDate, endDate } = getMonthDateRange(normalizeMonthKey(options.monthKey));
      query = query.gte("checkpoint_date", startDate).lte("checkpoint_date", endDate);
    }

    if (options.counselor_id && options.counselor_id !== "ALL") {
      query = query.eq("counselor_id", options.counselor_id);
    }

    const { data: rawRecords, error: recordsError } = await query;

    if (recordsError) {
      // If table has not been created yet in Supabase, return safe empty list without crashing
      return {
        success: true,
        isConfigured: true,
        records: [],
        summary: {
          dateOrMonth: options.date || options.monthKey || "Today",
          totalSubmissions: 0,
          expectedSubmissions: totalActiveCounselors,
          missingSubmissions: totalActiveCounselors,
          totalCallsMade: 0,
          totalCallsConnected: 0,
          totalTalkTimeMinutes: 0,
          totalFollowUps: 0,
          totalAdmissionsConverted: 0,
          averageAPR: null,
          acceptableCount: 0,
          underperformingCount: 0,
          highestAPR: null,
          lowestAPR: null,
        },
      };
    }

    let records: CallingPerformanceRecord[] = (rawRecords || []).map((r: any) => ({
      ...r,
      calls_made: Number(r.calls_made) || 0,
      calls_connected: Number(r.calls_connected) || 0,
      talk_time_minutes: Number(r.talk_time_minutes) || 0,
      follow_ups: Number(r.follow_ups) || 0,
      admissions_converted: Number(r.admissions_converted) || 0,
      call_achievement_percent: Number(r.call_achievement_percent) || 0,
      talk_time_achievement_percent: Number(r.talk_time_achievement_percent) || 0,
      apr_percent: Number(r.apr_percent) || 0,
    }));

    // Optional APR status filter
    if (options.apr_status === "acceptable") {
      records = records.filter((r) => r.apr_percent >= 100);
    } else if (options.apr_status === "underperforming") {
      records = records.filter((r) => r.apr_percent < 100);
    }

    // Optional text search
    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.counselor?.full_name?.toLowerCase().includes(q) ||
          r.counselor?.employee_code?.toLowerCase().includes(q) ||
          r.apr_reason?.toLowerCase().includes(q)
      );
    }

    // 3. Compute Team Metrics
    const totalSubmissions = records.length;
    let totalCallsMade = 0;
    let totalCallsConnected = 0;
    let totalTalkTimeMinutes = 0;
    let totalFollowUps = 0;
    let totalAdmissionsConverted = 0;
    let totalAPRSum = 0;
    let acceptableCount = 0;
    let underperformingCount = 0;
    let highestAPR: number | null = null;
    let lowestAPR: number | null = null;

    records.forEach((r) => {
      totalCallsMade += r.calls_made;
      totalCallsConnected += r.calls_connected;
      totalTalkTimeMinutes += r.talk_time_minutes;
      totalFollowUps += r.follow_ups;
      totalAdmissionsConverted += r.admissions_converted;
      totalAPRSum += r.apr_percent;

      if (r.apr_percent >= 100) {
        acceptableCount += 1;
      } else {
        underperformingCount += 1;
      }

      if (highestAPR === null || r.apr_percent > highestAPR) highestAPR = r.apr_percent;
      if (lowestAPR === null || r.apr_percent < lowestAPR) lowestAPR = r.apr_percent;
    });

    const averageAPR =
      totalSubmissions > 0 ? Number((totalAPRSum / totalSubmissions).toFixed(2)) : null;

    // For single-day query, calculate exact missing submissions
    const expectedSubmissions = options.date ? totalActiveCounselors : totalSubmissions;
    const missingSubmissions = Math.max(0, expectedSubmissions - totalSubmissions);

    const summary: TeamCallingSummary = {
      dateOrMonth: options.date || options.monthKey || "Today",
      totalSubmissions,
      expectedSubmissions,
      missingSubmissions,
      totalCallsMade,
      totalCallsConnected,
      totalTalkTimeMinutes: Number(totalTalkTimeMinutes.toFixed(2)),
      totalFollowUps,
      totalAdmissionsConverted,
      averageAPR,
      acceptableCount,
      underperformingCount,
      highestAPR,
      lowestAPR,
    };

    return {
      success: true,
      isConfigured: true,
      records,
      summary,
    };
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      records: [],
      summary: null,
      error: "Error querying calling performance: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Creates or updates a daily calling checkpoint for a counselor
 */
export async function saveCallingPerformanceAction(
  formData: CallingPerformanceFormData,
  existingId?: string
): Promise<{
  success: boolean;
  record?: CallingPerformanceRecord;
  errors?: Record<string, string>;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      error: auth.error || "Unauthorized",
    };
  }

  // Validate inputs and calculate authoritative APR on server
  const validation = validateCallingInput(formData);
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      error: "Validation failed. Please review your entries.",
    };
  }

  const { callAchievementPercent, talkTimeAchievementPercent, aprPercent } = validation.calculated;
  const supabase = auth.supabase;
  const adminEmail = auth.user.email || "sachin.behera@collegevidya.com";

  try {
    const payload = {
      counselor_id: formData.counselor_id,
      checkpoint_date: formData.checkpoint_date,
      calls_made: formData.calls_made,
      calls_connected: formData.calls_connected,
      talk_time_minutes: formData.talk_time_minutes,
      follow_ups: formData.follow_ups,
      admissions_converted: formData.admissions_converted,
      call_achievement_percent: callAchievementPercent,
      talk_time_achievement_percent: talkTimeAchievementPercent,
      apr_percent: aprPercent,
      apr_reason: formData.apr_reason?.trim() || null,
      daily_notes: formData.daily_notes?.trim() || null,
      updated_by: adminEmail,
      updated_at: new Date().toISOString(),
    };

    let resultRecord: any = null;

    if (existingId) {
      // Update existing record
      const { data, error } = await supabase
        .from("counselor_calling_checkpoints")
        .update(payload)
        .eq("id", existingId)
        .select(`
          *,
          counselor:counselors(id, full_name, employee_code)
        `)
        .single();

      if (error) {
        return { success: false, error: "Failed to update calling record: " + error.message };
      }
      resultRecord = data;
    } else {
      // Insert with check for existing conflict
      const { data: existingEntry } = await supabase
        .from("counselor_calling_checkpoints")
        .select("id")
        .eq("counselor_id", formData.counselor_id)
        .eq("checkpoint_date", formData.checkpoint_date)
        .maybeSingle();

      if (existingEntry) {
        return {
          success: false,
          errors: {
            counselor_id:
              "A performance record already exists for this counsellor on the selected date. Please edit the existing entry.",
          },
          error: "Duplicate record prevented for this counsellor on this date.",
        };
      }

      const { data, error } = await supabase
        .from("counselor_calling_checkpoints")
        .insert({
          ...payload,
          created_by: adminEmail,
        })
        .select(`
          *,
          counselor:counselors(id, full_name, employee_code)
        `)
        .single();

      if (error) {
        return { success: false, error: "Failed to save calling record: " + error.message };
      }
      resultRecord = data;
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calling-performance");
    revalidatePath("/dashboard/daily-tracker");
    revalidatePath("/dashboard/reports");

    return {
      success: true,
      record: resultRecord,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Unexpected error saving calling performance: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Deletes a calling checkpoint record
 */
export async function deleteCallingPerformanceAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  const supabase = auth.supabase;
  try {
    const { error } = await supabase
      .from("counselor_calling_checkpoints")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calling-performance");
    revalidatePath("/dashboard/daily-tracker");
    revalidatePath("/dashboard/reports");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete calling record" };
  }
}
