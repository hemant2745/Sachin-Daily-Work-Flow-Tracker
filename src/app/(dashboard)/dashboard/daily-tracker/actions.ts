"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import {
  normalizeMonthKey,
  getMonthDateRange,
  formatMonthDisplay,
  formatINR,
  getCalendarDaysForMonth,
  calculateZeroStreaks,
  calculateAchievement,
} from "@/lib/format";
import type {
  DailyTrackerSummary,
  CounselorDailyRow,
  DailyCellData,
  DailyStatusType,
  TargetAssignmentState,
} from "@/types/tracker";

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
 * Fetches the daily grid matrix for all counselors and days in the specified month
 */
export async function getDailyTrackerAction(
  monthKeyInput?: string,
  counselorFilter?: string
): Promise<{
  success: boolean;
  isConfigured: boolean;
  monthKey: string;
  monthDisplay: string;
  calendarDays: Array<{ date: string; dayNumber: number; dayName: string; isWeekend: boolean }>;
  counselors: CounselorDailyRow[];
  summary: DailyTrackerSummary;
  error?: string;
}> {
  const targetMonth = normalizeMonthKey(monthKeyInput || new Date());
  const monthDisplay = formatMonthDisplay(targetMonth);
  const calendarDays = getCalendarDaysForMonth(targetMonth);
  const { startDate, endDate } = getMonthDateRange(targetMonth);

  const fallbackSummary: DailyTrackerSummary = {
    totalCounselors: 0,
    monthKey: targetMonth,
    monthDisplay,
    daysInMonth: calendarDays.length,
    teamTargetCollection: null,
    teamTargetAdmissions: null,
    teamActualCollection: 0,
    teamActualAdmissions: 0,
    teamAdmissionDays: 0,
    teamPositiveCollectionDays: 0,
    teamConfirmedZeroDays: 0,
    teamNoDataDays: 0,
    targetsAssignmentState: "unassigned",
    assignedCount: 0,
    teamCollectionAchievement: "Target not assigned",
    teamAdmissionAchievement: "Target not assigned",
  };

  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      isConfigured: auth.isConfigured,
      monthKey: targetMonth,
      monthDisplay,
      calendarDays,
      counselors: [],
      summary: fallbackSummary,
      error: auth.error,
    };
  }

  const supabase = auth.supabase;

  try {
    // 1. Fetch counselors
    const { data: counselorsData, error: cError } = await supabase
      .from("counselors")
      .select("id, employee_code, full_name, is_active, monthly_target, monthly_admission_target")
      .order("created_at", { ascending: true });

    if (cError) {
      return {
        success: false,
        isConfigured: true,
        monthKey: targetMonth,
        monthDisplay,
        calendarDays,
        counselors: [],
        summary: fallbackSummary,
        error: "Failed to load counselors: " + cError.message,
      };
    }

    // 2. Fetch month-specific targets for this month
    const { data: targetsData } = await supabase
      .from("counselor_monthly_targets")
      .select("counselor_id, target_amount, target_admissions, is_explicitly_assigned")
      .eq("target_month", targetMonth);

    const targetsMap = new Map<string, { amount: number; admissions: number; isAssigned: boolean }>();
    if (targetsData) {
      targetsData.forEach((t: any) => {
        targetsMap.set(t.counselor_id, {
          amount: Number(t.target_amount) || 0,
          admissions: Number(t.target_admissions) || 0,
          isAssigned: Boolean(t.is_explicitly_assigned ?? true),
        });
      });
    }

    // 3. Fetch genuine admissions for this month
    const { data: admissionsData } = await supabase
      .from("admissions")
      .select("id, counselor_id, admission_date, amount_collected, university_name, program_name, payment_mode")
      .gte("admission_date", startDate)
      .lte("admission_date", endDate);

    // Group admissions by counselor_id + admission_date
    const admissionsByCounselorDate = new Map<string, any[]>();
    if (admissionsData) {
      admissionsData.forEach((adm: any) => {
        const key = `${adm.counselor_id}__${adm.admission_date}`;
        const list = admissionsByCounselorDate.get(key) || [];
        list.push(adm);
        admissionsByCounselorDate.set(key, list);
      });
    }

    // 4. Fetch daily confirmations for this month
    const { data: confirmationsData } = await supabase
      .from("counselor_daily_confirmations")
      .select("counselor_id, date, status, confirmed_by_email, notes, updated_at")
      .gte("date", startDate)
      .lte("date", endDate);

    const confirmationsMap = new Map<string, any>();
    if (confirmationsData) {
      confirmationsData.forEach((conf: any) => {
        const key = `${conf.counselor_id}__${conf.date}`;
        confirmationsMap.set(key, conf);
      });
    }

    // 4b. Fetch calling performance checkpoints for this month
    const { data: callingData } = await supabase
      .from("counselor_calling_checkpoints")
      .select("counselor_id, checkpoint_date, calls_made, calls_connected, talk_time_minutes, follow_ups, admissions_converted, apr_percent, apr_reason")
      .gte("checkpoint_date", startDate)
      .lte("checkpoint_date", endDate);

    const callingMap = new Map<string, any>();
    if (callingData) {
      callingData.forEach((call: any) => {
        const key = `${call.counselor_id}__${call.checkpoint_date}`;
        callingMap.set(key, call);
      });
    }

    // Determine current date for streak calculation
    const todayISO = new Date().toISOString().split("T")[0];

    // 5. Construct counselor rows
    let teamTargetCollectionSum = 0;
    let teamTargetAdmissionsSum = 0;
    let teamActualCollectionTotal = 0;
    let teamActualAdmissionsTotal = 0;
    let teamAdmissionDaysCount = 0;
    let teamPositiveDaysCount = 0;
    let teamConfirmedZeroDaysCount = 0;
    let teamNoDataDaysCount = 0;
    let assignedTargetsCount = 0;

    const counselorRows: CounselorDailyRow[] = (counselorsData || []).map((c: any) => {
      const targetRecord = targetsMap.get(c.id);
      const isTargetAssigned = Boolean(targetRecord && targetRecord.isAssigned);
      const monthlyTargetCollection = isTargetAssigned ? targetRecord!.amount : null;
      const monthlyTargetAdmissions = isTargetAssigned ? targetRecord!.admissions : null;

      if (c.is_active && isTargetAssigned) {
        assignedTargetsCount++;
        teamTargetCollectionSum += monthlyTargetCollection || 0;
        teamTargetAdmissionsSum += monthlyTargetAdmissions || 0;
      }

      const days: Record<string, DailyCellData> = {};
      let counselorTotalCollections = 0;
      let counselorTotalAdmissions = 0;
      let counselorAdmissionDays = 0;
      let counselorPositiveDays = 0;
      let counselorConfirmedZeroDays = 0;
      let counselorNoDataDays = 0;

      const dailyStatusList: Array<{ date: string; status: string }> = [];

      calendarDays.forEach((calDay) => {
        const key = `${c.id}__${calDay.date}`;
        const admissions = admissionsByCounselorDate.get(key) || [];
        const conf = confirmationsMap.get(key);
        const isZeroConfirmed = conf?.status === "zero_confirmed";

        const admCount = admissions.length;
        const colAmount = admissions.reduce(
          (sum: number, a: any) => sum + (Number(a.amount_collected) || 0),
          0
        );

        let status: DailyStatusType = "no_data";
        let hasConflict = false;

        if (admCount > 0) {
          // Genuine admission recorded takes absolute precedence
          if (colAmount > 0) {
            status = "collection_recorded";
          } else {
            status = "admission_recorded";
          }

          if (isZeroConfirmed) {
            hasConflict = true;
          }

          counselorAdmissionDays++;
          if (colAmount > 0) {
            counselorPositiveDays++;
          }
        } else if (isZeroConfirmed) {
          status = "zero_confirmed";
          counselorConfirmedZeroDays++;
        } else {
          status = "no_data";
          counselorNoDataDays++;
        }

        counselorTotalCollections += colAmount;
        counselorTotalAdmissions += admCount;

        const callCheckpoint = callingMap.get(key);

        const cellData: DailyCellData = {
          date: calDay.date,
          dayNumber: calDay.dayNumber,
          dayName: calDay.dayName,
          isWeekend: calDay.isWeekend,
          status,
          admissionCount: admCount,
          collectionAmount: colAmount,
          isZeroConfirmed,
          confirmedBy: conf?.confirmed_by_email || null,
          confirmedAt: conf?.updated_at || null,
          notes: conf?.notes || null,
          hasConflict,
          admissions: admissions.map((a: any) => ({
            id: a.id,
            university_name: a.university_name,
            program_name: a.program_name,
            amount_collected: Number(a.amount_collected) || 0,
            payment_mode: a.payment_mode,
          })),
          callingPerformance: callCheckpoint
            ? {
                calls_made: Number(callCheckpoint.calls_made) || 0,
                calls_connected: Number(callCheckpoint.calls_connected) || 0,
                talk_time_minutes: Number(callCheckpoint.talk_time_minutes) || 0,
                follow_ups: Number(callCheckpoint.follow_ups) || 0,
                admissions_converted: Number(callCheckpoint.admissions_converted) || 0,
                apr_percent: Number(callCheckpoint.apr_percent) || 0,
                apr_reason: callCheckpoint.apr_reason || null,
              }
            : null,
        };

        days[calDay.date] = cellData;
        dailyStatusList.push({ date: calDay.date, status });
      });

      // Calculate streaks
      const { longestStreak, currentStreak } = calculateZeroStreaks(
        dailyStatusList,
        todayISO
      );

      // Achievements
      const colAch = isTargetAssigned
        ? calculateAchievement(counselorTotalCollections, monthlyTargetCollection || 0, 2).display
        : "Target not assigned";
      const admAch = isTargetAssigned
        ? calculateAchievement(counselorTotalAdmissions, monthlyTargetAdmissions || 0, 2).display
        : "Target not assigned";

      if (c.is_active) {
        teamActualCollectionTotal += counselorTotalCollections;
        teamActualAdmissionsTotal += counselorTotalAdmissions;
        teamAdmissionDaysCount += counselorAdmissionDays;
        teamPositiveDaysCount += counselorPositiveDays;
        teamConfirmedZeroDaysCount += counselorConfirmedZeroDays;
        teamNoDataDaysCount += counselorNoDataDays;
      }

      return {
        counselorId: c.id,
        employeeCode: c.employee_code,
        fullName: c.full_name,
        isActive: c.is_active,
        isTargetAssigned,
        monthlyTargetCollection,
        monthlyTargetAdmissions,
        totalCollections: counselorTotalCollections,
        totalAdmissions: counselorTotalAdmissions,
        admissionDays: counselorAdmissionDays,
        positiveCollectionDays: counselorPositiveDays,
        confirmedZeroDays: counselorConfirmedZeroDays,
        noDataDays: counselorNoDataDays,
        longestZeroStreak: longestStreak,
        currentZeroStreak: currentStreak,
        collectionAchievement: colAch,
        admissionAchievement: admAch,
        days,
      };
    });

    // Summary calculation
    const activeCounselorsCount = counselorRows.filter((c) => c.isActive).length;
    let targetsAssignmentState: TargetAssignmentState = "unassigned";
    if (assignedTargetsCount === activeCounselorsCount && activeCounselorsCount > 0) {
      targetsAssignmentState = "all_assigned";
    } else if (assignedTargetsCount > 0) {
      targetsAssignmentState = "partially_assigned";
    } else {
      targetsAssignmentState = "unassigned";
    }

    const teamColAch =
      assignedTargetsCount > 0 && teamTargetCollectionSum > 0
        ? `${((teamActualCollectionTotal / teamTargetCollectionSum) * 100).toFixed(2)}%`
        : targetsAssignmentState === "unassigned"
        ? "Target not assigned"
        : "N/A";

    const teamAdmAch =
      assignedTargetsCount > 0 && teamTargetAdmissionsSum > 0
        ? `${((teamActualAdmissionsTotal / teamTargetAdmissionsSum) * 100).toFixed(2)}%`
        : targetsAssignmentState === "unassigned"
        ? "Target not assigned"
        : "N/A";

    const summary: DailyTrackerSummary = {
      totalCounselors: counselorRows.length,
      monthKey: targetMonth,
      monthDisplay,
      daysInMonth: calendarDays.length,
      teamTargetCollection: assignedTargetsCount > 0 ? teamTargetCollectionSum : null,
      teamTargetAdmissions: assignedTargetsCount > 0 ? teamTargetAdmissionsSum : null,
      teamActualCollection: teamActualCollectionTotal,
      teamActualAdmissions: teamActualAdmissionsTotal,
      teamAdmissionDays: teamAdmissionDaysCount,
      teamPositiveCollectionDays: teamPositiveDaysCount,
      teamConfirmedZeroDays: teamConfirmedZeroDaysCount,
      teamNoDataDays: teamNoDataDaysCount,
      targetsAssignmentState,
      assignedCount: assignedTargetsCount,
      teamCollectionAchievement: teamColAch,
      teamAdmissionAchievement: teamAdmAch,
    };

    // Filter by counselor if search or filter is provided
    let filteredRows = counselorRows;
    if (counselorFilter && counselorFilter.trim()) {
      const q = counselorFilter.trim().toLowerCase();
      filteredRows = filteredRows.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.employeeCode.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      isConfigured: true,
      monthKey: targetMonth,
      monthDisplay,
      calendarDays,
      counselors: filteredRows,
      summary,
    };
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      monthKey: targetMonth,
      monthDisplay,
      calendarDays,
      counselors: [],
      summary: fallbackSummary,
      error: "Unexpected error generating daily tracker: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Confirms zero collection for a specific counselor and date.
 * Rejects if genuine admissions or positive collections already exist.
 */
export async function confirmDailyZeroAction(
  counselorId: string,
  date: string,
  notes?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const adminEmail = auth.user?.email || "sachin.behera@collegevidya.com";
  const trimmedDate = (date || "").trim();

  if (!trimmedDate || !/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return { success: false, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  try {
    // 1. Conflict check: Check if genuine admissions exist on that date
    const { data: existingAdmissions, error: aError } = await supabase
      .from("admissions")
      .select("id, amount_collected")
      .eq("counselor_id", counselorId)
      .eq("admission_date", trimmedDate);

    if (aError) {
      return { success: false, error: "Database error verifying admissions: " + aError.message };
    }

    if (existingAdmissions && existingAdmissions.length > 0) {
      const totalCol = existingAdmissions.reduce((sum, a) => sum + (Number(a.amount_collected) || 0), 0);
      if (totalCol > 0) {
        return {
          success: false,
          error: `Cannot confirm zero collection: A genuine collection of ${formatINR(totalCol)} (${existingAdmissions.length} admission${existingAdmissions.length > 1 ? "s" : ""}) exists on ${trimmedDate}.`,
        };
      }
      return {
        success: false,
        error: `Cannot confirm zero collection: ${existingAdmissions.length} admission transaction exists on ${trimmedDate}.`,
      };
    }

    // 2. Upsert confirmation
    const { error: confError } = await supabase
      .from("counselor_daily_confirmations")
      .upsert(
        {
          counselor_id: counselorId,
          date: trimmedDate,
          status: "zero_confirmed",
          confirmed_by_email: adminEmail,
          notes: notes?.trim() || null,
        },
        { onConflict: "counselor_id,date" }
      );

    if (confError) {
      return { success: false, error: "Failed to record zero confirmation: " + confError.message };
    }

    // 3. Write audit log
    await supabase.from("counselor_daily_audit_logs").insert({
      counselor_id: counselorId,
      date: trimmedDate,
      action: "CONFIRMED_ZERO",
      previous_status: "no_data",
      new_status: "zero_confirmed",
      details: notes?.trim() || "Zero collection confirmed by administrator",
      actor_email: adminEmail,
    });

    revalidatePath("/dashboard/daily-tracker");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Zero collection confirmed for ${trimmedDate}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Error confirming zero: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Revokes or clears an accidental zero collection confirmation
 */
export async function revokeDailyZeroAction(
  counselorId: string,
  date: string,
  reason?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const adminEmail = auth.user?.email || "sachin.behera@collegevidya.com";
  const trimmedDate = (date || "").trim();

  try {
    // Delete the confirmation record so date reverts to no_data
    const { error: delError } = await supabase
      .from("counselor_daily_confirmations")
      .delete()
      .eq("counselor_id", counselorId)
      .eq("date", trimmedDate);

    if (delError) {
      return { success: false, error: "Failed to revoke zero confirmation: " + delError.message };
    }

    // Write audit log
    await supabase.from("counselor_daily_audit_logs").insert({
      counselor_id: counselorId,
      date: trimmedDate,
      action: "REVOKED_ZERO",
      previous_status: "zero_confirmed",
      new_status: "no_data",
      details: reason?.trim() || "Zero confirmation revoked by administrator",
      actor_email: adminEmail,
    });

    revalidatePath("/dashboard/daily-tracker");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Zero confirmation cleared for ${trimmedDate}. Reverted to No Data Recorded.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Error revoking zero confirmation: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Fetches audit logs for a specific counselor and date or month
 */
export async function getDailyAuditLogsAction(
  counselorId: string,
  date?: string
): Promise<{ success: boolean; logs: any[]; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, logs: [], error: auth.error };
  }

  const supabase = auth.supabase;
  try {
    let query = supabase
      .from("counselor_daily_audit_logs")
      .select("*")
      .eq("counselor_id", counselorId)
      .order("created_at", { ascending: false });

    if (date) {
      query = query.eq("date", date);
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
