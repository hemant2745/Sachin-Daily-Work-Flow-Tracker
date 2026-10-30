/**
 * Daily Collection & Admission Tracker Type Definitions
 */

export type DailyStatusType =
  | "admission_recorded"
  | "collection_recorded"
  | "zero_confirmed"
  | "no_data";

export interface DailyAdmissionDetail {
  id: string;
  university_name: string;
  program_name: string;
  amount_collected: number;
  payment_mode: string;
}

export interface DailyCellData {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  dayName: string;
  isWeekend: boolean;
  status: DailyStatusType;
  admissionCount: number;
  collectionAmount: number;
  isZeroConfirmed: boolean;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  notes?: string | null;
  hasConflict?: boolean; // When genuine admission exists on a day previously marked zero
  admissions: DailyAdmissionDetail[];
  // Calling checkpoint performance on this date
  callingPerformance?: {
    calls_made: number;
    calls_connected: number;
    talk_time_minutes: number;
    follow_ups: number;
    admissions_converted: number;
    apr_percent: number;
    apr_reason?: string | null;
  } | null;
}

export interface CounselorDailyRow {
  counselorId: string;
  employeeCode: string;
  fullName: string;
  isActive: boolean;
  isTargetAssigned: boolean;
  monthlyTargetCollection: number | null;
  monthlyTargetAdmissions: number | null;
  totalCollections: number;
  totalAdmissions: number;
  admissionDays: number;
  positiveCollectionDays: number;
  confirmedZeroDays: number;
  noDataDays: number;
  longestZeroStreak: number;
  currentZeroStreak: number;
  collectionAchievement: string;
  admissionAchievement: string;
  days: Record<string, DailyCellData>; // Keyed by YYYY-MM-DD
}

export type TargetAssignmentState = "all_assigned" | "partially_assigned" | "unassigned";

export interface DailyTrackerSummary {
  totalCounselors: number;
  monthKey: string;
  monthDisplay: string;
  daysInMonth: number;
  teamTargetCollection: number | null;
  teamTargetAdmissions: number | null;
  teamActualCollection: number;
  teamActualAdmissions: number;
  teamAdmissionDays: number;
  teamPositiveCollectionDays: number;
  teamConfirmedZeroDays: number;
  teamNoDataDays: number;
  targetsAssignmentState: TargetAssignmentState;
  assignedCount: number;
  teamCollectionAchievement: string;
  teamAdmissionAchievement: string;
}

export interface TargetAuditLog {
  id: string;
  counselor_id: string;
  target_month: string;
  old_target_amount: number | null;
  new_target_amount: number;
  old_target_admissions: number | null;
  new_target_admissions: number;
  notes?: string | null;
  changed_by_email: string;
  created_at: string;
}

export interface CounselorMonthlyTargetDetail {
  counselor_id: string;
  target_month: string;
  target_amount: number;
  target_admissions: number;
  notes?: string | null;
  updated_by_email?: string | null;
  is_explicitly_assigned: boolean;
  updated_at: string;
  audit_logs?: TargetAuditLog[];
}
