export interface CallingPerformanceRecord {
  id: string;
  counselor_id: string;
  checkpoint_date: string; // YYYY-MM-DD
  calls_made: number;
  calls_connected: number;
  talk_time_minutes: number;
  follow_ups: number;
  admissions_converted: number;
  call_achievement_percent: number;
  talk_time_achievement_percent: number;
  apr_percent: number;
  apr_reason?: string | null;
  daily_notes?: string | null;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  counselor?: {
    id: string;
    full_name: string;
    employee_code: string;
  } | null;
}

export interface CallingPerformanceFormData {
  counselor_id: string;
  checkpoint_date: string; // YYYY-MM-DD
  calls_made: number;
  calls_connected: number;
  talk_time_minutes: number;
  follow_ups: number;
  admissions_converted: number;
  apr_reason?: string;
  daily_notes?: string;
}

export interface CalculatedAPR {
  callAchievementPercent: number;
  talkTimeAchievementPercent: number;
  aprPercent: number;
  isAcceptable: boolean; // aprPercent >= 100
}

export interface CallingPerformanceFilterOptions {
  monthKey?: string; // YYYY-MM-01
  date?: string; // YYYY-MM-DD
  counselor_id?: string;
  apr_status?: "ALL" | "acceptable" | "underperforming";
  search?: string;
}

export interface TeamCallingSummary {
  dateOrMonth: string;
  totalSubmissions: number;
  expectedSubmissions: number;
  missingSubmissions: number;
  totalCallsMade: number;
  totalCallsConnected: number;
  totalTalkTimeMinutes: number;
  totalFollowUps: number;
  totalAdmissionsConverted: number;
  averageAPR: number | null; // calculated only across submitted records
  acceptableCount: number; // APR >= 100%
  underperformingCount: number; // APR < 100%
  highestAPR: number | null;
  lowestAPR: number | null;
}
