import { formatINR } from "./format";
import type {
  WeekIdentifier,
  WeekPeriodDefinition,
  CounselorWeeklyMetrics,
  CounselorMonthlyPerformance,
  ExpectedVsActualPoint,
  WeeklyComparisonPoint,
  PerformanceGapPoint,
  CounselorComparisonPoint,
} from "@/types/analytics";
import type { CounselorCategory } from "@/types/counselor";

/**
 * Returns total days in a given year and month (1-indexed, 1 = January)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Generates the four fixed weekly reporting period definitions for a calendar month:
 * Week 1: 1st – 7th (7 days)
 * Week 2: 8th – 14th (7 days)
 * Week 3: 15th – 21st (7 days)
 * Week 4: 22nd – Last day of month (28, 29, 30, or 31 days)
 */
export function getMonthWeekPeriods(year: number, month: number, referenceDate: Date = new Date()): WeekPeriodDefinition[] {
  const totalDays = getDaysInMonth(year, month);
  const monthStr = String(month).padStart(2, "0");

  const isCurrentMonth =
    referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 === month;
  const isPastMonth =
    referenceDate.getFullYear() > year ||
    (referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 > month);
  const currentDay = isCurrentMonth ? referenceDate.getDate() : isPastMonth ? totalDays : 0;

  const rawPeriods: Array<{
    week: WeekIdentifier;
    name: string;
    startDay: number;
    endDay: number;
  }> = [
    { week: "W1", name: "Week 1", startDay: 1, endDay: 7 },
    { week: "W2", name: "Week 2", startDay: 8, endDay: 14 },
    { week: "W3", name: "Week 3", startDay: 15, endDay: 21 },
    { week: "W4", name: "Week 4", startDay: 22, endDay: totalDays },
  ];

  return rawPeriods.map((p) => {
    const periodDays = p.endDay - p.startDay + 1;
    let elapsed = 0;

    if (currentDay >= p.endDay) {
      elapsed = periodDays;
    } else if (currentDay >= p.startDay) {
      elapsed = currentDay - p.startDay + 1;
    } else {
      elapsed = 0;
    }

    const isComplete = isPastMonth || (isCurrentMonth && currentDay >= p.endDay);
    const isCurrent = isCurrentMonth && currentDay >= p.startDay && currentDay <= p.endDay;
    const isUpcoming = !isPastMonth && !isCurrent && currentDay < p.startDay;

    const startDate = `${year}-${monthStr}-${String(p.startDay).padStart(2, "0")}`;
    const endDate = `${year}-${monthStr}-${String(p.endDay).padStart(2, "0")}`;

    return {
      week: p.week,
      name: p.name,
      startDay: p.startDay,
      endDay: p.endDay,
      startDate,
      endDate,
      totalDays: periodDays,
      elapsedDays: elapsed,
      isComplete,
      isCurrent,
      isUpcoming,
    };
  });
}

/**
 * Determines which week period a given day (1..31) belongs to
 */
export function getWeekForDay(day: number): WeekIdentifier {
  if (day <= 7) return "W1";
  if (day <= 14) return "W2";
  if (day <= 21) return "W3";
  return "W4";
}

/**
 * Calculates calendar-day prorated expected revenue for a monthly target
 * Formula: Expected Revenue = Monthly Target * (Elapsed Calendar Days / Total Days in Month)
 */
export function calculateExpectedRevenue(
  monthlyTarget: number,
  elapsedDays: number,
  totalDaysInMonth: number
): number {
  if (totalDaysInMonth <= 0 || monthlyTarget <= 0 || elapsedDays <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, elapsedDays / totalDaysInMonth));
  return Math.round(monthlyTarget * ratio);
}

/**
 * Calculates weekly target based on the number of calendar days in that week period
 * Formula: Weekly Target = Monthly Target * (Period Days / Total Days in Month)
 */
export function calculateWeeklyTarget(
  monthlyTarget: number,
  daysInPeriod: number,
  totalDaysInMonth: number
): number {
  if (totalDaysInMonth <= 0 || monthlyTarget <= 0 || daysInPeriod <= 0) return 0;
  return Math.round(monthlyTarget * (daysInPeriod / totalDaysInMonth));
}

/**
 * Calculates performance gap
 * Formula: Performance Gap = Actual Performance - Expected Performance
 * Positive = Ahead of target, Negative = Behind target
 */
export function calculatePerformanceGap(actualRevenue: number, expectedRevenue: number): number {
  return actualRevenue - expectedRevenue;
}

/**
 * Calculates remaining target for a monthly target
 * Formula: Remaining Target = Math.max(0, Monthly Target - Actual Revenue)
 */
export function calculateRemainingTarget(monthlyTarget: number, actualRevenue: number): number {
  return Math.max(0, monthlyTarget - actualRevenue);
}

/**
 * Builds weekly performance breakdown for a single counselor
 */
export function buildCounselorWeeklyPerformance(params: {
  counselorId: string;
  counselorName: string;
  employeeCode: string;
  category: CounselorCategory;
  email: string | null;
  baseTarget: number;
  additionalTarget: number;
  monthlyTarget: number;
  year: number;
  month: number;
  admissions: Array<{
    amount: number;
    day: number;
    isVerified: boolean;
  }>;
  referenceDate?: Date;
}): CounselorMonthlyPerformance {
  const {
    counselorId,
    counselorName,
    employeeCode,
    category,
    email,
    baseTarget,
    additionalTarget,
    monthlyTarget,
    year,
    month,
    admissions,
    referenceDate = new Date(),
  } = params;

  const periods = getMonthWeekPeriods(year, month, referenceDate);
  const totalDays = getDaysInMonth(year, month);

  const isCurrentMonth =
    referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 === month;
  const isPastMonth =
    referenceDate.getFullYear() > year ||
    (referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 > month);
  const elapsedMonthDays = isCurrentMonth ? Math.min(totalDays, referenceDate.getDate()) : isPastMonth ? totalDays : 0;

  // Filter only verified admissions for actual collection and admission count
  const verifiedAdmissions = admissions.filter((a) => a.isVerified);

  // Bucket admissions by week
  const weekAdmissionsMap: Record<WeekIdentifier, { revenue: number; count: number }> = {
    W1: { revenue: 0, count: 0 },
    W2: { revenue: 0, count: 0 },
    W3: { revenue: 0, count: 0 },
    W4: { revenue: 0, count: 0 },
  };

  let totalActualRevenue = 0;
  let totalActualAdmissions = 0;

  verifiedAdmissions.forEach((adm) => {
    const w = getWeekForDay(adm.day);
    weekAdmissionsMap[w].revenue += adm.amount;
    weekAdmissionsMap[w].count += 1;
    totalActualRevenue += adm.amount;
    totalActualAdmissions += 1;
  });

  // Build metrics for each week
  const weeksRecord: Partial<Record<WeekIdentifier, CounselorWeeklyMetrics>> = {};

  periods.forEach((p) => {
    const weeklyTarget = calculateWeeklyTarget(monthlyTarget, p.totalDays, totalDays);
    // Expected revenue in this week: if week is complete, it's weeklyTarget. If in progress, prorated by elapsedDays.
    const expectedRevenue = p.isComplete
      ? weeklyTarget
      : p.isCurrent
      ? Math.round(weeklyTarget * (p.elapsedDays / p.totalDays))
      : 0;

    const actualRev = weekAdmissionsMap[p.week].revenue;
    const actualAdm = weekAdmissionsMap[p.week].count;
    const gap = actualRev - expectedRevenue;
    const achPercentage = weeklyTarget > 0 ? (actualRev / weeklyTarget) * 100 : null;

    weeksRecord[p.week] = {
      week: p.week,
      weekName: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      daysInPeriod: p.totalDays,
      weeklyTarget,
      expectedRevenue,
      actualRevenue: actualRev,
      actualAdmissions: actualAdm,
      achievementPercentage: achPercentage,
      performanceGap: gap,
      isAhead: gap >= 0,
    };
  });

  const cumulativeExpectedRevenue = calculateExpectedRevenue(monthlyTarget, elapsedMonthDays, totalDays);
  const monthlyGap = totalActualRevenue - cumulativeExpectedRevenue;
  const remainingTarget = calculateRemainingTarget(monthlyTarget, totalActualRevenue);
  const monthlyAchPercentage = monthlyTarget > 0 ? (totalActualRevenue / monthlyTarget) * 100 : null;

  return {
    counselorId,
    counselorName,
    employeeCode,
    category,
    email,
    monthlyTarget,
    baseTarget,
    additionalTarget,
    expectedRevenue: cumulativeExpectedRevenue,
    actualRevenue: totalActualRevenue,
    actualAdmissions: totalActualAdmissions,
    remainingTarget,
    performanceGap: monthlyGap,
    achievementPercentage: monthlyAchPercentage,
    isAhead: monthlyGap >= 0,
    weeks: weeksRecord as Record<WeekIdentifier, CounselorWeeklyMetrics>,
  };
}
