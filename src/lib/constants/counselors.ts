/**
 * Authorized Team Counselors Master Configuration
 * Single source of truth for the 9 approved team counselors and their baseline targets.
 */

export interface MasterCounselorEntry {
  employee_code: string;
  full_name: string;
  monthly_target: number;
  monthly_admission_target: number;
}

export const AUTHORIZED_MASTER_COUNSELORS: readonly MasterCounselorEntry[] = [
  { employee_code: "BL1707", full_name: "Shikha", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2683", full_name: "Shivalika", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2857", full_name: "Vansh", monthly_target: 450000, monthly_admission_target: 5 },
  { employee_code: "BL3077", full_name: "Kanika", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2719", full_name: "Bhawana Sharma", monthly_target: 450000, monthly_admission_target: 5 },
  { employee_code: "BL2849", full_name: "Munesh", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2720", full_name: "Sameer", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2170", full_name: "Bharat", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL3462", full_name: "Divya", monthly_target: 550000, monthly_admission_target: 6 },
] as const;
