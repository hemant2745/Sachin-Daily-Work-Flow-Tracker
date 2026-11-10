/**
 * Authorized Team Counselors Master Configuration
 * Single source of truth for the 9 approved team counselors and their baseline targets.
 */

import type { CounselorCategory } from "@/types/counselor";

export interface MasterCounselorEntry {
  employee_code: string;
  full_name: string;
  category: CounselorCategory;
  monthly_target: number;
  monthly_admission_target: number;
}

export const AUTHORIZED_MASTER_COUNSELORS: readonly MasterCounselorEntry[] = [
  { employee_code: "BL1707", full_name: "Shikha", category: "CDA", monthly_target: 800000, monthly_admission_target: 8 },
  { employee_code: "BL2683", full_name: "Shivalika", category: "CDA", monthly_target: 800000, monthly_admission_target: 8 },
  { employee_code: "BL2857", full_name: "Vansh", category: "PCA", monthly_target: 400000, monthly_admission_target: 4 },
  { employee_code: "BL3077", full_name: "Kanika", category: "CDA", monthly_target: 800000, monthly_admission_target: 8 },
  { employee_code: "BL2719", full_name: "Bhawana Sharma", category: "PCA", monthly_target: 400000, monthly_admission_target: 4 },
  { employee_code: "BL2849", full_name: "Munesh", category: "CDA", monthly_target: 800000, monthly_admission_target: 8 },
  { employee_code: "BL2720", full_name: "Sameer", category: "SCDA", monthly_target: 600000, monthly_admission_target: 6 },
  { employee_code: "BL2170", full_name: "Bharat", category: "SCDA", monthly_target: 600000, monthly_admission_target: 6 },
  { employee_code: "BL3462", full_name: "Divya", category: "SCDA", monthly_target: 600000, monthly_admission_target: 6 },
] as const;
