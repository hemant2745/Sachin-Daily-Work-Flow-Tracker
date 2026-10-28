export type PaymentMode = "semester_fees" | "annual_fees" | "full_fees";

export interface Admission {
  id: string;
  counselor_id: string;
  admission_date: string; // ISO date string "YYYY-MM-DD"
  university_name: string;
  program_name: string;
  amount_collected: number;
  payment_mode: PaymentMode;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdmissionWithCounselor extends Admission {
  counselor?: {
    id: string;
    full_name: string;
    employee_code: string;
    email: string;
  };
}

export interface AdmissionFormData {
  counselor_id: string;
  admission_date: string;
  university_name: string;
  program_name: string;
  amount_collected: number;
  payment_mode: PaymentMode;
  notes?: string;
}

export interface AdmissionsSummary {
  totalAdmissions: number;
  totalCollections: number;
  currentMonthCollections: number;
  currentMonthAdmissionsCount: number;
  averageCollection: number;
}

export interface AdmissionActionResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  semester_fees: "Semester Fees",
  annual_fees: "Annual Fees",
  full_fees: "Full Fees",
};
