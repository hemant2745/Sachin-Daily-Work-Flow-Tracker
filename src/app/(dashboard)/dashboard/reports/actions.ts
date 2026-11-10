"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import { computeReportDateRange } from "@/lib/reports";
import {
  getDaysInMonth,
  getMonthWeekPeriods,
  buildCounselorWeeklyPerformance,
} from "@/lib/weekly";
import { normalizeMonthKey, formatINR } from "@/lib/format";
import type {
  ReportFilterOptions,
  OverallPerformanceSummary,
  CounselorReportItem,
  UniversityReportItem,
  DailyTrendItem,
  ComprehensiveReportData,
} from "@/types/reports";
import type {
  WeeklyAnalyticsFilterOptions,
  WeeklyAnalyticsData,
  WeekIdentifier,
  ExpectedVsActualPoint,
  WeeklyComparisonPoint,
  PerformanceGapPoint,
  CounselorComparisonPoint,
  CounselorMonthlyPerformance,
} from "@/types/analytics";
import type { CounselorCategory } from "@/types/counselor";

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
 * Helper to get all YYYY-MM strings spanned by a start and end date range.
 */
function getMonthsInRange(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cur <= last) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
    cur.setMonth(cur.getMonth() + 1);
  }

  return months.length > 0 ? months : [startDate.substring(0, 7)];
}

/**
 * Fetch and aggregate comprehensive reporting data for the selected date range and filters.
 */
export async function getComprehensiveReportsAction(
  options: ReportFilterOptions
): Promise<{
  success: boolean;
  isConfigured: boolean;
  data: ComprehensiveReportData | null;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      isConfigured: auth.isConfigured,
      data: null,
      error: auth.error,
    };
  }

  const supabase = auth.supabase;

  try {
    const { startDate, endDate } = computeReportDateRange(
      options.dateRangeType,
      options.startDate,
      options.endDate
    );

    const activeFilters: ReportFilterOptions = {
      ...options,
      startDate,
      endDate,
    };

    const monthsSpanned = getMonthsInRange(startDate, endDate);
    const monthsCount = Math.max(1, monthsSpanned.length);

    // 1. Fetch Counselors
    let counselorQuery = supabase
      .from("counselors")
      .select("id, full_name, employee_code, is_active, monthly_target, monthly_admission_target")
      .order("employee_code", { ascending: true });

    if (activeFilters.counselorId && activeFilters.counselorId !== "ALL") {
      counselorQuery = counselorQuery.eq("id", activeFilters.counselorId);
    }

    const { data: rawCounselors, error: counselorsError } = await counselorQuery;
    if (counselorsError) {
      return {
        success: false,
        isConfigured: true,
        data: null,
        error: "Failed to query counselors: " + counselorsError.message,
      };
    }

    const counselors = rawCounselors || [];
    const counselorIds = counselors.map((c) => c.id);

    // 2. Fetch Targets for these counselors across the spanned months
    let targetsMap = new Map<string, { targetAmount: number; targetAdmissions: number }>();
    if (counselorIds.length > 0 && monthsSpanned.length > 0) {
      const { data: rawTargets, error: targetsError } = await supabase
        .from("counselor_monthly_targets")
        .select("counselor_id, target_month, target_amount, target_admissions")
        .in("counselor_id", counselorIds)
        .in("target_month", monthsSpanned);

      if (!targetsError && rawTargets) {
        rawTargets.forEach((t) => {
          const prev = targetsMap.get(t.counselor_id) || { targetAmount: 0, targetAdmissions: 0 };
          targetsMap.set(t.counselor_id, {
            targetAmount: prev.targetAmount + (Number(t.target_amount) || 0),
            targetAdmissions: prev.targetAdmissions + (Number(t.target_admissions) || 0),
          });
        });
      }
    }

    // 3. Fetch Admissions
    let admissionsQuery = supabase
      .from("admissions")
      .select("id, counselor_id, admission_date, amount_collected, payment_mode, university_name")
      .gte("admission_date", startDate)
      .lte("admission_date", endDate);

    if (activeFilters.counselorId && activeFilters.counselorId !== "ALL") {
      admissionsQuery = admissionsQuery.eq("counselor_id", activeFilters.counselorId);
    }
    if (activeFilters.universityName && activeFilters.universityName !== "ALL") {
      admissionsQuery = admissionsQuery.eq("university_name", activeFilters.universityName);
    }

    const { data: rawAdmissions, error: admissionsError } = await admissionsQuery;
    if (admissionsError) {
      return {
        success: false,
        isConfigured: true,
        data: null,
        error: "Failed to query admissions: " + admissionsError.message,
      };
    }
    const admissions = rawAdmissions || [];

    // 4. Fetch Projections
    let projectionsQuery = supabase
      .from("projections")
      .select("id, counselor_id, projection_date, projected_revenue, status")
      .gte("projection_date", startDate)
      .lte("projection_date", endDate);

    if (activeFilters.counselorId && activeFilters.counselorId !== "ALL") {
      projectionsQuery = projectionsQuery.eq("counselor_id", activeFilters.counselorId);
    }

    const { data: rawProjections, error: projectionsError } = await projectionsQuery;
    if (projectionsError) {
      return {
        success: false,
        isConfigured: true,
        data: null,
        error: "Failed to query projections: " + projectionsError.message,
      };
    }
    const projections = rawProjections || [];

    // 4b. Fetch Calling Performance Checkpoints
    let callingQuery = supabase
      .from("counselor_calling_checkpoints")
      .select("counselor_id, checkpoint_date, calls_made, calls_connected, talk_time_minutes, follow_ups, admissions_converted, apr_percent, apr_reason")
      .gte("checkpoint_date", startDate)
      .lte("checkpoint_date", endDate);

    if (activeFilters.counselorId && activeFilters.counselorId !== "ALL") {
      callingQuery = callingQuery.eq("counselor_id", activeFilters.counselorId);
    }

    const { data: rawCalling } = await callingQuery;
    const callingRecords = rawCalling || [];

    const callingByCounselor = new Map<
      string,
      {
        callsMade: number;
        talkTime: number;
        followUps: number;
        aprSum: number;
        submissions: number;
        acceptableDays: number;
        underperformingDays: number;
      }
    >();

    let totalTeamCallsMade = 0;
    let totalTeamCallsConnected = 0;
    let totalTeamTalkTime = 0;
    let totalTeamFollowUps = 0;
    let totalTeamAPRSum = 0;
    let acceptableAPRCount = 0;
    let underperformingAPRCount = 0;

    callingRecords.forEach((cRecord) => {
      const calls = Number(cRecord.calls_made) || 0;
      const conn = Number(cRecord.calls_connected) || 0;
      const tt = Number(cRecord.talk_time_minutes) || 0;
      const fu = Number(cRecord.follow_ups) || 0;
      const apr = Number(cRecord.apr_percent) || 0;

      totalTeamCallsMade += calls;
      totalTeamCallsConnected += conn;
      totalTeamTalkTime += tt;
      totalTeamFollowUps += fu;
      totalTeamAPRSum += apr;

      if (apr >= 100) {
        acceptableAPRCount += 1;
      } else {
        underperformingAPRCount += 1;
      }

      const cId = cRecord.counselor_id;
      if (cId) {
        const prev = callingByCounselor.get(cId) || {
          callsMade: 0,
          talkTime: 0,
          followUps: 0,
          aprSum: 0,
          submissions: 0,
          acceptableDays: 0,
          underperformingDays: 0,
        };
        prev.callsMade += calls;
        prev.talkTime += tt;
        prev.followUps += fu;
        prev.aprSum += apr;
        prev.submissions += 1;
        if (apr >= 100) prev.acceptableDays += 1;
        else prev.underperformingDays += 1;
        callingByCounselor.set(cId, prev);
      }
    });

    const averageTeamAPR =
      callingRecords.length > 0
        ? Number((totalTeamAPRSum / callingRecords.length).toFixed(2))
        : null;

    // 5. Aggregate Admissions per Counselor & University & Date
    const admissionsByCounselor = new Map<string, { count: number; revenue: number }>();
    const admissionsByUniversity = new Map<string, { count: number; revenue: number }>();
    const activityByDate = new Map<string, { admissionsCount: number; revenue: number; projectedRevenue: number }>();

    let totalRevenue = 0;
    let totalAdmissions = admissions.length;

    admissions.forEach((a) => {
      const rev = Number(a.amount_collected) || 0;
      totalRevenue += rev;

      // By Counselor
      if (a.counselor_id) {
        const cStats = admissionsByCounselor.get(a.counselor_id) || { count: 0, revenue: 0 };
        cStats.count += 1;
        cStats.revenue += rev;
        admissionsByCounselor.set(a.counselor_id, cStats);
      }

      // By University
      const uniName = a.university_name || "Unspecified University";
      const uStats = admissionsByUniversity.get(uniName) || { count: 0, revenue: 0 };
      uStats.count += 1;
      uStats.revenue += rev;
      admissionsByUniversity.set(uniName, uStats);

      // By Date
      const d = a.admission_date;
      if (d) {
        const dStats = activityByDate.get(d) || { admissionsCount: 0, revenue: 0, projectedRevenue: 0 };
        dStats.admissionsCount += 1;
        dStats.revenue += rev;
        activityByDate.set(d, dStats);
      }
    });

    // 6. Aggregate Projections per Counselor & Date
    const projectionsByCounselor = new Map<
      string,
      {
        total: number;
        met: number;
        notMet: number;
        pending: number;
        totalRev: number;
        reviewedRev: number;
        metRev: number;
      }
    >();

    let totalProjRev = 0;
    let reviewedProjRev = 0;
    let metProjRev = 0;
    let projTotal = 0;
    let projMet = 0;
    let projNotMet = 0;
    let projPending = 0;

    projections.forEach((p) => {
      const rev = Number(p.projected_revenue) || 0;
      projTotal += 1;
      totalProjRev += rev;

      if (p.status === "met") {
        projMet += 1;
        reviewedProjRev += rev;
        metProjRev += rev;
      } else if (p.status === "not_met") {
        projNotMet += 1;
        reviewedProjRev += rev;
      } else {
        projPending += 1;
      }

      // Counselor stats
      if (p.counselor_id) {
        const cProj = projectionsByCounselor.get(p.counselor_id) || {
          total: 0,
          met: 0,
          notMet: 0,
          pending: 0,
          totalRev: 0,
          reviewedRev: 0,
          metRev: 0,
        };
        cProj.total += 1;
        cProj.totalRev += rev;
        if (p.status === "met") {
          cProj.met += 1;
          cProj.reviewedRev += rev;
          cProj.metRev += rev;
        } else if (p.status === "not_met") {
          cProj.notMet += 1;
          cProj.reviewedRev += rev;
        } else {
          cProj.pending += 1;
        }
        projectionsByCounselor.set(p.counselor_id, cProj);
      }

      // By Date
      const d = p.projection_date;
      if (d) {
        const dStats = activityByDate.get(d) || { admissionsCount: 0, revenue: 0, projectedRevenue: 0 };
        dStats.projectedRevenue += rev;
        activityByDate.set(d, dStats);
      }
    });

    // 7. Build Counselor Report Items
    let combinedMonthlyTarget = 0;
    let combinedAdmissionTarget = 0;

    const counselorReportItems: CounselorReportItem[] = counselors.map((c) => {
      const explicitTarget = targetsMap.get(c.id);
      // If explicit target row exists in counselor_monthly_targets, use it;
      // otherwise, fallback to counselor baseline * monthsCount
      const collectionTarget = explicitTarget
        ? explicitTarget.targetAmount
        : (Number(c.monthly_target) || 0) * monthsCount;
      const admissionTarget = explicitTarget
        ? explicitTarget.targetAdmissions
        : (Number(c.monthly_admission_target) || 0) * monthsCount;

      combinedMonthlyTarget += collectionTarget;
      combinedAdmissionTarget += admissionTarget;

      const adm = admissionsByCounselor.get(c.id) || { count: 0, revenue: 0 };
      const proj = projectionsByCounselor.get(c.id) || {
        total: 0,
        met: 0,
        notMet: 0,
        pending: 0,
        totalRev: 0,
        reviewedRev: 0,
        metRev: 0,
      };

      const reviewedCount = proj.met + proj.notMet;
      const projCompletionPct =
        reviewedCount > 0 ? Number(((proj.met / reviewedCount) * 100).toFixed(1)) : null;

      const revWeightedPct =
        proj.reviewedRev > 0 ? Number(((proj.metRev / proj.reviewedRev) * 100).toFixed(1)) : null;

      const colPct =
        collectionTarget > 0 ? Number(((adm.revenue / collectionTarget) * 100).toFixed(1)) : null;
      const admPct =
        admissionTarget > 0 ? Number(((adm.count / admissionTarget) * 100).toFixed(1)) : null;

      const callStats = callingByCounselor.get(c.id);
      const counselorAvgAPR =
        callStats && callStats.submissions > 0
          ? Number((callStats.aprSum / callStats.submissions).toFixed(2))
          : null;

      return {
        id: c.id,
        name: c.full_name,
        employee_code: c.employee_code,
        collectionTarget,
        actualCollections: adm.revenue,
        collectionAchievementPercentage: colPct,
        admissionTarget,
        actualAdmissions: adm.count,
        admissionAchievementPercentage: admPct,
        projectionsTotal: proj.total,
        projectionsMet: proj.met,
        projectionsNotMet: proj.notMet,
        projectionsPending: proj.pending,
        projectionCompletionPercentage: projCompletionPct,
        projectedRevenue: proj.totalRev,
        reviewedProjectedRevenue: proj.reviewedRev,
        metProjectedRevenue: proj.metRev,
        revenueWeightedPercentage: revWeightedPct,
        totalCallsMade: callStats?.callsMade || 0,
        totalTalkTimeMinutes: callStats?.talkTime || 0,
        totalFollowUps: callStats?.followUps || 0,
        averageAPR: counselorAvgAPR,
        acceptableAPRDays: callStats?.acceptableDays || 0,
        underperformingAPRDays: callStats?.underperformingDays || 0,
      };
    });

    // 8. Build University Report Items
    const universityReportItems: UniversityReportItem[] = Array.from(
      admissionsByUniversity.entries()
    ).map(([name, stats]) => {
      const avg = stats.count > 0 ? Math.round(stats.revenue / stats.count) : 0;
      const revPct = totalRevenue > 0 ? Number(((stats.revenue / totalRevenue) * 100).toFixed(1)) : 0;
      const admPct =
        totalAdmissions > 0 ? Number(((stats.count / totalAdmissions) * 100).toFixed(1)) : 0;

      return {
        universityName: name,
        admissionsCount: stats.count,
        revenueCollected: stats.revenue,
        averagePerAdmission: avg,
        percentageOfTotalRevenue: revPct,
        percentageOfTotalAdmissions: admPct,
      };
    });

    // Sort universities by revenue desc
    universityReportItems.sort((a, b) => b.revenueCollected - a.revenueCollected);

    // 9. Build Daily Trend Items
    const dailyTrends: DailyTrendItem[] = Array.from(activityByDate.entries())
      .map(([date, stats]) => ({
        date,
        admissionsCount: stats.admissionsCount,
        revenueCollected: stats.revenue,
        projectedRevenue: stats.projectedRevenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 10. Build Overall Performance Summary
    const reviewedTotal = projMet + projNotMet;
    const summary: OverallPerformanceSummary = {
      startDate,
      endDate,
      totalRevenue,
      totalAdmissions,
      averageAdmissionValue: totalAdmissions > 0 ? Math.round(totalRevenue / totalAdmissions) : 0,
      combinedMonthlyTarget,
      combinedAdmissionTarget,
      revenueAchievementPercentage:
        combinedMonthlyTarget > 0
          ? Number(((totalRevenue / combinedMonthlyTarget) * 100).toFixed(1))
          : null,
      admissionAchievementPercentage:
        combinedAdmissionTarget > 0
          ? Number(((totalAdmissions / combinedAdmissionTarget) * 100).toFixed(1))
          : null,
      totalProjectedRevenue: totalProjRev,
      reviewedProjectedRevenue: reviewedProjRev,
      metProjectedRevenue: metProjRev,
      projectionTotal: projTotal,
      projectionMet: projMet,
      projectionNotMet: projNotMet,
      projectionPending: projPending,
      projectionCompletionPercentage:
        reviewedTotal > 0 ? Number(((projMet / reviewedTotal) * 100).toFixed(1)) : null,
      projectionRevenueWeightedPercentage:
        reviewedProjRev > 0 ? Number(((metProjRev / reviewedProjRev) * 100).toFixed(1)) : null,
      totalCallsMade: totalTeamCallsMade,
      totalCallsConnected: totalTeamCallsConnected,
      totalTalkTimeMinutes: Number(totalTeamTalkTime.toFixed(2)),
      totalFollowUps: totalTeamFollowUps,
      averageAPR: averageTeamAPR,
      acceptableAPRCount,
      underperformingAPRCount,
    };

    const finalReportData: ComprehensiveReportData = {
      filters: activeFilters,
      summary,
      counselors: counselorReportItems,
      universities: universityReportItems,
      dailyTrends,
      generatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      isConfigured: true,
      data: finalReportData,
    };
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      data: null,
      error: "Error generating comprehensive reports: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * PHASE 3: Fetches weekly performance tracking and analytics data
 */
export async function getWeeklyAnalyticsAction(
  options: WeeklyAnalyticsFilterOptions
): Promise<{
  success: boolean;
  isConfigured: boolean;
  data: WeeklyAnalyticsData | null;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      isConfigured: auth.isConfigured,
      data: null,
      error: auth.error,
    };
  }

  const supabase = auth.supabase;
  const { year, month, counselorId, category, week } = options;
  const totalDays = getDaysInMonth(year, month);
  const monthStr = String(month).padStart(2, "0");
  const monthKey = `${year}-${monthStr}-01`;
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(totalDays).padStart(2, "0")}`;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const isPastMonth =
    today.getFullYear() > year ||
    (today.getFullYear() === year && today.getMonth() + 1 > month);
  const elapsedMonthDays = isCurrentMonth ? Math.min(totalDays, today.getDate()) : isPastMonth ? totalDays : 0;
  const monthProgress = totalDays > 0 ? (elapsedMonthDays / totalDays) * 100 : 0;

  try {
    // 1. Fetch active counselors
    let counselorQuery = supabase
      .from("counselors")
      .select("*")
      .eq("is_active", true)
      .order("employee_code", { ascending: true });

    if (counselorId && counselorId !== "ALL") {
      counselorQuery = counselorQuery.eq("id", counselorId);
    }
    if (category && category !== "ALL") {
      counselorQuery = counselorQuery.eq("category", category);
    }

    const { data: counselorsData, error: cErr } = await counselorQuery;
    if (cErr) {
      return { success: false, isConfigured: true, data: null, error: cErr.message };
    }

    const counselors = counselorsData || [];

    // 2. Fetch category base targets for month
    const defaultCatTargets: Record<CounselorCategory, number> = {
      CDA: 800000,
      SCDA: 600000,
      PCA: 400000,
    };
    const categoryTargetsMap: Record<CounselorCategory, number> = { ...defaultCatTargets };

    try {
      const { data: catTargets } = await supabase
        .from("category_monthly_targets")
        .select("category, base_target")
        .eq("target_month", monthKey);

      if (catTargets) {
        catTargets.forEach((ct: any) => {
          if (ct.category && ct.base_target !== null) {
            categoryTargetsMap[ct.category as CounselorCategory] = Number(ct.base_target);
          }
        });
      }
    } catch {
      // Non-fatal if table not initialized
    }

    // 3. Fetch counselor monthly targets
    const targetsMap = new Map<string, { base: number; additional: number; target: number }>();
    try {
      const { data: cTargets } = await supabase
        .from("counselor_monthly_targets")
        .select("counselor_id, base_target, additional_target, target_amount")
        .eq("target_month", monthKey);

      if (cTargets) {
        cTargets.forEach((t: any) => {
          targetsMap.set(t.counselor_id, {
            base: Number(t.base_target) || 0,
            additional: Number(t.additional_target) || 0,
            target: Number(t.target_amount) || 0,
          });
        });
      }
    } catch {
      // Non-fatal
    }

    // 4. Fetch verified admissions for month (only verified admissions count!)
    const { data: admissionsData, error: admErr } = await supabase
      .from("admissions")
      .select("id, counselor_id, amount_collected, admission_date, verification_status")
      .eq("verification_status", "verified")
      .gte("admission_date", startDate)
      .lte("admission_date", endDate);

    if (admErr) {
      return { success: false, isConfigured: true, data: null, error: admErr.message };
    }

    const admissions = admissionsData || [];

    // Group admissions by counselor
    const counselorAdmissionsMap = new Map<string, Array<{ amount: number; day: number; isVerified: boolean }>>();
    admissions.forEach((a: any) => {
      const list = counselorAdmissionsMap.get(a.counselor_id) || [];
      const day = parseInt(a.admission_date.split("-")[2], 10);
      list.push({
        amount: Number(a.amount_collected) || 0,
        day,
        isVerified: true,
      });
      counselorAdmissionsMap.set(a.counselor_id, list);
    });

    // 5. Build weekly performance records for each counselor
    const periods = getMonthWeekPeriods(year, month, today);

    const counselorPerformances: CounselorMonthlyPerformance[] = counselors.map((c: any) => {
      const cat = (c.category as CounselorCategory) || "CDA";
      const targetRecord = targetsMap.get(c.id);

      const baseTarget =
        targetRecord && targetRecord.base > 0
          ? targetRecord.base
          : categoryTargetsMap[cat] || c.monthly_target || 800000;

      const additionalTarget = targetRecord?.additional || 0;
      const finalMonthlyTarget = targetRecord?.target && targetRecord.target > 0
        ? targetRecord.target
        : baseTarget + additionalTarget;

      const counselorAdms = counselorAdmissionsMap.get(c.id) || [];

      return buildCounselorWeeklyPerformance({
        counselorId: c.id,
        counselorName: c.full_name,
        employeeCode: c.employee_code,
        category: cat,
        email: c.email || null,
        baseTarget,
        additionalTarget,
        monthlyTarget: finalMonthlyTarget,
        year,
        month,
        admissions: counselorAdms,
        referenceDate: today,
      });
    });

    // 6. Aggregate team summary
    let totalMonthlyTarget = 0;
    let totalExpectedRevenue = 0;
    let totalActualRevenue = 0;
    let totalActualAdmissions = 0;
    let totalRemainingTarget = 0;

    counselorPerformances.forEach((cp) => {
      totalMonthlyTarget += cp.monthlyTarget;
      totalExpectedRevenue += cp.expectedRevenue;
      totalActualRevenue += cp.actualRevenue;
      totalActualAdmissions += cp.actualAdmissions;
      totalRemainingTarget += cp.remainingTarget;
    });

    const totalPerformanceGap = totalActualRevenue - totalExpectedRevenue;
    const overallAchievementPercentage =
      totalMonthlyTarget > 0 ? (totalActualRevenue / totalMonthlyTarget) * 100 : null;

    // 7. Generate 4 Analytics Charts Data
    // Chart 1: Expected vs Actual Revenue
    const expectedVsActualPoints: ExpectedVsActualPoint[] = counselorPerformances.map((cp) => ({
      counselorName: cp.counselorName,
      employeeCode: cp.employeeCode,
      category: cp.category,
      expectedRevenue: cp.expectedRevenue,
      actualRevenue: cp.actualRevenue,
      gap: cp.performanceGap,
      isAhead: cp.isAhead,
    }));

    // Chart 2: Weekly Performance Comparison (Weeks 1 to 4)
    const weeklyComparisonPoints: WeeklyComparisonPoint[] = periods.map((p) => {
      let weekExpected = 0;
      let weekActual = 0;
      let weekAdmissions = 0;

      counselorPerformances.forEach((cp) => {
        const wData = cp.weeks[p.week];
        if (wData) {
          weekExpected += wData.expectedRevenue;
          weekActual += wData.actualRevenue;
          weekAdmissions += wData.actualAdmissions;
        }
      });

      const weekAch = weekExpected > 0 ? (weekActual / weekExpected) * 100 : null;

      return {
        week: p.week,
        weekName: p.name,
        periodLabel: `${p.startDay}th – ${p.endDay}th (${p.totalDays} days)`,
        expectedRevenue: weekExpected,
        actualRevenue: weekActual,
        actualAdmissions: weekAdmissions,
        achievementPercentage: weekAch,
      };
    });

    // Chart 3: Performance Gap Chart
    const performanceGapPoints: PerformanceGapPoint[] = counselorPerformances
      .map((cp) => ({
        counselorId: cp.counselorId,
        counselorName: cp.counselorName,
        employeeCode: cp.employeeCode,
        category: cp.category,
        gap: cp.performanceGap,
        gapFormatted: `${cp.performanceGap >= 0 ? "+" : ""}${formatINR(cp.performanceGap)}`,
        isAhead: cp.isAhead,
        actualRevenue: cp.actualRevenue,
        expectedRevenue: cp.expectedRevenue,
      }))
      .sort((a, b) => b.gap - a.gap);

    // Chart 4: Counselor Comparison Chart (All 9 counselors)
    const counselorComparisonPoints: CounselorComparisonPoint[] = counselorPerformances.map((cp) => ({
      counselorId: cp.counselorId,
      counselorName: cp.counselorName,
      employeeCode: cp.employeeCode,
      category: cp.category,
      monthlyTarget: cp.monthlyTarget,
      actualRevenue: cp.actualRevenue,
      remainingTarget: cp.remainingTarget,
      achievementPercentage: cp.achievementPercentage,
      admissionCount: cp.actualAdmissions,
    }));

    const resultData: WeeklyAnalyticsData = {
      filters: options,
      periods,
      monthDays: totalDays,
      elapsedMonthDays,
      monthProgressPercentage: monthProgress,
      counselorPerformances,
      teamSummary: {
        totalMonthlyTarget,
        totalExpectedRevenue,
        totalActualRevenue,
        totalActualAdmissions,
        totalRemainingTarget,
        totalPerformanceGap,
        overallAchievementPercentage,
        isTeamAhead: totalPerformanceGap >= 0,
      },
      charts: {
        expectedVsActual: expectedVsActualPoints,
        weeklyComparison: weeklyComparisonPoints,
        performanceGap: performanceGapPoints,
        counselorComparison: counselorComparisonPoints,
      },
    };

    return {
      success: true,
      isConfigured: true,
      data: resultData,
    };
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      data: null,
      error: "Unexpected error calculating weekly analytics: " + (err?.message || "Unknown error"),
    };
  }
}

