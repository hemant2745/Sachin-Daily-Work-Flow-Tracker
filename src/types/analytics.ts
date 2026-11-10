import type { CounselorCategory } from "./counselor";

export type WeekIdentifier = "W1" | "W2" | "W3" | "W4";

export interface WeekPeriodDefinition {
  week: WeekIdentifier;
  name: string;
  startDay: number;
  endDay: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  elapsedDays: number;
  isComplete: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
}

export interface CounselorWeeklyMetrics {
  week: WeekIdentifier;
  weekName: string;
  startDate: string;
  endDate: string;
  daysInPeriod: number;
  weeklyTarget: number;
  expectedRevenue: number;
  actualRevenue: number;
  actualAdmissions: number;
  achievementPercentage: number | null;
  performanceGap: number; // actualRevenue - expectedRevenue
  isAhead: boolean;
}

export interface CounselorMonthlyPerformance {
  counselorId: string;
  counselorName: string;
  employeeCode: string;
  category: CounselorCategory;
  email: string | null;
  monthlyTarget: number;
  baseTarget: number;
  additionalTarget: number;
  expectedRevenue: number; // Monthly target * (elapsedDays / totalDays)
  actualRevenue: number;
  actualAdmissions: number;
  remainingTarget: number; // max(0, monthlyTarget - actualRevenue)
  performanceGap: number; // actualRevenue - expectedRevenue
  achievementPercentage: number | null;
  isAhead: boolean;
  weeks: Record<WeekIdentifier, CounselorWeeklyMetrics>;
}

export interface WeeklyAnalyticsFilterOptions {
  year: number;
  month: number; // 1 - 12
  counselorId: string; // "ALL" or specific counselor id
  category: CounselorCategory | "ALL";
  week: WeekIdentifier | "ALL";
}

export interface ExpectedVsActualPoint {
  counselorName: string;
  employeeCode: string;
  category: CounselorCategory;
  expectedRevenue: number;
  actualRevenue: number;
  gap: number;
  isAhead: boolean;
}

export interface WeeklyComparisonPoint {
  week: WeekIdentifier;
  weekName: string;
  periodLabel: string;
  expectedRevenue: number;
  actualRevenue: number;
  actualAdmissions: number;
  achievementPercentage: number | null;
}

export interface PerformanceGapPoint {
  counselorId: string;
  counselorName: string;
  employeeCode: string;
  category: CounselorCategory;
  gap: number; // positive = ahead, negative = behind
  gapFormatted: string;
  isAhead: boolean;
  actualRevenue: number;
  expectedRevenue: number;
}

export interface CounselorComparisonPoint {
  counselorId: string;
  counselorName: string;
  employeeCode: string;
  category: CounselorCategory;
  monthlyTarget: number;
  actualRevenue: number;
  remainingTarget: number;
  achievementPercentage: number | null;
  admissionCount: number;
}

export interface WeeklyAnalyticsData {
  filters: WeeklyAnalyticsFilterOptions;
  periods: WeekPeriodDefinition[];
  monthDays: number;
  elapsedMonthDays: number;
  monthProgressPercentage: number;
  counselorPerformances: CounselorMonthlyPerformance[];
  teamSummary: {
    totalMonthlyTarget: number;
    totalExpectedRevenue: number;
    totalActualRevenue: number;
    totalActualAdmissions: number;
    totalRemainingTarget: number;
    totalPerformanceGap: number;
    overallAchievementPercentage: number | null;
    isTeamAhead: boolean;
  };
  charts: {
    expectedVsActual: ExpectedVsActualPoint[];
    weeklyComparison: WeeklyComparisonPoint[];
    performanceGap: PerformanceGapPoint[];
    counselorComparison: CounselorComparisonPoint[];
  };
}
