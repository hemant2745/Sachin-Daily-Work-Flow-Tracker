/**
 * Formatting and Financial Calculation Utilities
 * Formats Indian Rupees (INR) and percentages deterministically without demo figures.
 */

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates achievement percentage safely.
 * Returns null if actual revenue source is not yet configured (pre-Phase 4).
 * Returns -1 if target is 0 or unconfigured (to distinguish from 0% achievement).
 */
export function calculateAchievement(
  revenue: number | null,
  target: number
): { status: "NOT_CONFIGURED" | "TARGET_NOT_SET" | "CALCULATED"; percentage: number | null; display: string } {
  if (revenue === null || revenue === undefined) {
    return {
      status: "NOT_CONFIGURED",
      percentage: null,
      display: "Not configured",
    };
  }

  if (target <= 0) {
    return {
      status: "TARGET_NOT_SET",
      percentage: null,
      display: "Target not set",
    };
  }

  const percentage = (revenue / target) * 100;
  return {
    status: "CALCULATED",
    percentage,
    display: `${percentage.toFixed(1)}%`,
  };
}

/**
 * Normalizes any date to the first day of that month: YYYY-MM-01
 */
export function normalizeMonthKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Formats YYYY-MM-01 to human-readable month string, e.g. "October 2026"
 */
export function formatMonthDisplay(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Generates selectable month options for the selector (e.g. past 6 months to next 6 months)
 */
export function getMonthOptions(baseDate: Date = new Date()): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth();

  // 3 months prior to 3 months ahead
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(currentYear, currentMonth + offset, 1);
    const value = normalizeMonthKey(d);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ value, label });
  }

  return options;
}

/**
 * Client-side and server-side validation for counselor input
 */
export function validateCounselorInput(input: {
  employee_code?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  monthly_target?: number | string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const employeeCode = input.employee_code?.trim() || "";
  if (!employeeCode) {
    errors.employee_code = "Employee code is required.";
  } else if (employeeCode.length < 2 || employeeCode.length > 20) {
    errors.employee_code = "Employee code must be between 2 and 20 characters.";
  }

  const fullName = input.full_name?.trim() || "";
  if (!fullName) {
    errors.full_name = "Full name is required.";
  } else if (fullName.length < 2) {
    errors.full_name = "Full name must be at least 2 characters.";
  }

  const email = input.email?.trim().toLowerCase() || "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = "Work email is required.";
  } else if (!emailRegex.test(email)) {
    errors.email = "Please enter a valid work email address.";
  }

  const phone = input.phone?.trim() || "";
  const phoneRegex = /^[+]?[\d\s-]{8,15}$/;
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!phoneRegex.test(phone)) {
    errors.phone = "Please enter a valid phone number (8-15 digits).";
  }

  const target = Number(input.monthly_target);
  if (isNaN(target) || target < 0) {
    errors.monthly_target = "Monthly target must be a non-negative number.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
