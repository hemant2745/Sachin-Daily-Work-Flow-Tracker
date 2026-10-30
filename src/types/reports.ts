export type ReportDateRangeType =
  | "this_month"
  | "last_month"
  | "quarter_to_date"
  | "year_to_date"
  | "custom";

export interface ReportFilterOptions {
  dateRangeType: ReportDateRangeType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  counselorId?: string; // "ALL" or UUID
  universityName?: string; // "ALL" or specific name
}

export interface OverallPerformanceSummary {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalAdmissions: number;
  averageAdmissionValue: number;
  combinedMonthlyTarget: number;
  combinedAdmissionTarget: number;
  revenueAchievementPercentage: number | null;
  admissionAchievementPercentage: number | null;
  totalProjectedRevenue: number;
  reviewedProjectedRevenue: number;
  metProjectedRevenue: number;
  projectionTotal: number;
  projectionMet: number;
  projectionNotMet: number;
  projectionPending: number;
  projectionCompletionPercentage: number | null;
  projectionRevenueWeightedPercentage: number | null;
}

export interface CounselorReportItem {
  id: string;
  name: string;
  employee_code: string;
  collectionTarget: number;
  actualCollections: number;
  collectionAchievementPercentage: number | null;
  admissionTarget: number;
  actualAdmissions: number;
  admissionAchievementPercentage: number | null;
  projectionsTotal: number;
  projectionsMet: number;
  projectionsNotMet: number;
  projectionsPending: number;
  projectionCompletionPercentage: number | null;
  projectedRevenue: number;
  reviewedProjectedRevenue: number;
  metProjectedRevenue: number;
  revenueWeightedPercentage: number | null;
}

export interface UniversityReportItem {
  universityName: string;
  admissionsCount: number;
  revenueCollected: number;
  averagePerAdmission: number;
  percentageOfTotalRevenue: number;
  percentageOfTotalAdmissions: number;
}

export interface DailyTrendItem {
  date: string;
  admissionsCount: number;
  revenueCollected: number;
  projectedRevenue: number;
}

export interface ComprehensiveReportData {
  filters: ReportFilterOptions;
  summary: OverallPerformanceSummary;
  counselors: CounselorReportItem[];
  universities: UniversityReportItem[];
  dailyTrends: DailyTrendItem[];
  generatedAt: string;
}
