export type CounselorCategory = "CDA" | "SCDA" | "PCA";

export const COUNSELOR_CATEGORIES: readonly CounselorCategory[] = ["CDA", "SCDA", "PCA"] as const;

export const CATEGORY_DESCRIPTIONS: Record<CounselorCategory, string> = {
  CDA: "Career Development Advisor (Senior Quota)",
  SCDA: "Senior Career Development Advisor (Core Quota)",
  PCA: "Professional Career Advisor (Baseline Quota)",
};

export interface Counselor {
  id: string;
  auth_user_id?: string | null;
  employee_code: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  category: CounselorCategory;
  monthly_target: number; // Monthly collection target in INR
  monthly_admission_target: number; // Monthly admission count target
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryMonthlyTarget {
  id: string;
  category: CounselorCategory;
  target_month: string; // ISO date string "YYYY-MM-01"
  base_target: number; // Base collection target in INR
  base_admission_target: number; // Base admission count target
  updated_by_email?: string;
  created_at: string;
  updated_at: string;
}

export interface CounselorMonthlyTarget {
  id: string;
  counselor_id: string;
  target_month: string; // ISO date string "YYYY-MM-01"
  category?: CounselorCategory | null;
  base_target?: number;
  additional_target?: number;
  additional_target_reason?: string | null;
  target_amount: number; // Final target amount (base_target + additional_target)
  target_admissions?: number; // Month-specific admission count target
  notes?: string | null;
  updated_by_email?: string | null;
  is_explicitly_assigned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CounselorWithTarget extends Counselor {
  base_target: number;
  additional_target: number;
  additional_target_reason?: string | null;
  final_target: number; // base_target + additional_target
  effective_target: number; // Synonymous with final_target for backward-compatibility
  effective_admission_target: number;
  has_custom_target: boolean;
  has_custom_admission_target?: boolean;
  is_target_assigned: boolean;
  assigned_notes?: string | null;
  target_updated_at?: string | null;
  target_updated_by?: string | null;
  actual_revenue: number | null;
  actual_admissions: number | null;
  achievement_percentage: number | null;
  admission_achievement_percentage: number | null;
  performance_gap?: number | null; // actual_revenue - expected_revenue
  projection_total?: number;
  projection_met?: number;
  projection_not_met?: number;
  projection_pending?: number;
  projection_completion_percentage?: number | null;
  projection_revenue_weighted_percentage?: number | null;
}

export interface CategoryCardSummary {
  category: CounselorCategory;
  counselorCount: number;
  baseTarget: number;
  baseAdmissionTarget: number;
  totalTarget: number;
  totalRevenue: number;
  achievementPercentage: number | null;
}

export interface CounselorSummary {
  totalCounselors: number;
  activeCounselors: number;
  combinedMonthlyTarget: number;
  combinedAdmissionTarget: number;
  unconfiguredTargetsCount: number;
  teamActualRevenue: number;
  teamActualAdmissions: number;
  teamAchievementPercentage: number | null;
  teamAdmissionAchievementPercentage: number | null;
  targetsAssignmentState?: "all_assigned" | "partially_assigned" | "unassigned";
  assignedCount?: number;
  categorySummaries?: Record<CounselorCategory, CategoryCardSummary>;
}

export interface CounselorFormData {
  employee_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  category?: CounselorCategory;
  monthly_target: number;
  monthly_admission_target?: number;
  is_active: boolean;
}

export interface AdditionalTargetFormData {
  counselor_id: string;
  target_month: string;
  additional_target: number;
  reason?: string;
}

export interface TargetAuditLogEntry {
  id: string;
  counselor_id?: string;
  counselor_name?: string;
  category?: CounselorCategory;
  target_month: string;
  old_target_amount?: number;
  new_target_amount: number;
  base_target?: number;
  additional_target?: number;
  reason?: string | null;
  change_type?: string;
  changed_by_email: string;
  created_at: string;
}

export interface CounselorActionResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
}
