export type ProjectionStatus = "pending" | "met" | "not_met";

export interface Projection {
  id: string;
  projection_date: string; // YYYY-MM-DD
  counselor_id: string;
  university_id: string;
  projected_revenue: number;
  status: ProjectionStatus;
  notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  counselor?: {
    id: string;
    full_name: string;
    employee_code: string;
  } | null;
  university?: {
    id: string;
    name: string;
  } | null;
}

export interface ProjectionFormData {
  projection_date: string;
  counselor_id: string;
  university_id: string;
  projected_revenue: number;
  notes?: string | null;
}

export interface ProjectionFilterOptions {
  monthKey?: string; // YYYY-MM-01
  counselor_id?: string;
  university_id?: string;
  status?: string;
  search?: string;
}

export interface CounselorProjectionStats {
  counselor_id: string;
  counselor_name: string;
  employee_code: string;
  totalProjections: number;
  metCount: number;
  notMetCount: number;
  pendingCount: number;
  reviewedCount: number;
  completionPercentage: number | null; // null if reviewedCount === 0 -> "N/A"
  totalProjectedRevenue: number;
  reviewedProjectedRevenue: number;
  metProjectedRevenue: number;
  revenueWeightedPercentage: number | null; // null if reviewedProjectedRevenue === 0 -> "N/A"
}

export interface MonthlyProjectionOverview {
  monthKey: string;
  totalProjections: number;
  metCount: number;
  notMetCount: number;
  pendingCount: number;
  reviewedCount: number;
  completionPercentage: number | null;
  revenueWeightedPercentage: number | null;
  totalProjectedRevenue: number;
  reviewedProjectedRevenue: number;
  metProjectedRevenue: number;
  counselorStats: CounselorProjectionStats[];
}
