export interface Counselor {
  id: string;
  employee_code: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  monthly_target: number; // Monthly collection target in INR
  monthly_admission_target: number; // Monthly admission count target
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CounselorMonthlyTarget {
  id: string;
  counselor_id: string;
  target_month: string; // ISO date string "YYYY-MM-01"
  target_amount: number; // Monthly collection target in INR
  target_admissions?: number; // Month-specific admission count target
  notes?: string | null;
  updated_by_email?: string | null;
  is_explicitly_assigned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CounselorWithTarget extends Counselor {
  effective_target: number;
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
  projection_total?: number;
  projection_met?: number;
  projection_not_met?: number;
  projection_pending?: number;
  projection_completion_percentage?: number | null;
  projection_revenue_weighted_percentage?: number | null;
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
}

export interface CounselorFormData {
  employee_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  monthly_target: number;
  monthly_admission_target?: number;
  is_active: boolean;
}

export interface CounselorActionResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
}
