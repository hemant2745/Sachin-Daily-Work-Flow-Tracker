export interface Counselor {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  monthly_target: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CounselorMonthlyTarget {
  id: string;
  counselor_id: string;
  target_month: string; // ISO date string "YYYY-MM-01"
  target_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CounselorWithTarget extends Counselor {
  effective_target: number;
  has_custom_target: boolean;
  actual_revenue: number | null; // Null indicates admissions data source not yet connected (Phase 4)
  achievement_percentage: number | null;
}

export interface CounselorFormData {
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  monthly_target: number;
  is_active: boolean;
}

export interface CounselorActionResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
}
