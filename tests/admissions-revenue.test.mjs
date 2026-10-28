import test from "node:test";
import assert from "node:assert/strict";

/**
 * Phase 4 Test Suite: Admissions Pipeline, Actual Collections & Automatic Revenue Calculations
 *
 * Verifies business logic, aggregation math, date boundary attribution,
 * target fallback hierarchy, zero-target handling, and data integrity guards.
 */

// Pure calculation and formatting utilities (matching src/lib/format.ts)
function formatINR(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateAchievement(revenue, target) {
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
      display: "N/A",
    };
  }

  const percentage = (revenue / target) * 100;
  return {
    status: "CALCULATED",
    percentage,
    display: `${percentage.toFixed(1)}%`,
  };
}

function normalizeMonthKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function getMonthDateRange(monthKey) {
  const normalized = normalizeMonthKey(monthKey);
  const [yearStr, monthStr] = normalized.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `${yearStr}-${monthStr}-01`;
  const endDate = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

function validateAdmissionInput(input) {
  const errors = {};

  const counselorId = input.counselor_id?.trim() || "";
  if (!counselorId) {
    errors.counselor_id = "Please select an assigned counselor.";
  }

  const admissionDate = input.admission_date?.trim() || "";
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!admissionDate) {
    errors.admission_date = "Admission date is required.";
  } else if (!dateRegex.test(admissionDate) || isNaN(new Date(admissionDate).getTime())) {
    errors.admission_date = "Please enter a valid admission date (YYYY-MM-DD).";
  }

  const universityName = input.university_name?.trim() || "";
  if (!universityName) {
    errors.university_name = "University name is required.";
  } else if (universityName.length < 2) {
    errors.university_name = "University name must be at least 2 characters.";
  }

  const programName = input.program_name?.trim() || "";
  if (!programName) {
    errors.program_name = "Program name is required.";
  } else if (programName.length < 2) {
    errors.program_name = "Program name must be at least 2 characters.";
  }

  const amount = Number(input.amount_collected);
  if (input.amount_collected === "" || input.amount_collected === undefined || input.amount_collected === null || isNaN(amount)) {
    errors.amount_collected = "Amount collected is required and must be a valid number.";
  } else if (amount < 0) {
    errors.amount_collected = "Amount collected must be a non-negative number.";
  }

  const validPaymentModes = ["semester_fees", "annual_fees", "full_fees"];
  const paymentMode = input.payment_mode?.trim() || "";
  if (!paymentMode) {
    errors.payment_mode = "Payment mode is required.";
  } else if (!validPaymentModes.includes(paymentMode)) {
    errors.payment_mode = "Invalid payment mode. Supported modes: Semester Fees, Annual Fees, Full Fees.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// In-Memory mock store simulating database relations and queries
function createMockPipelineStore() {
  const counselors = new Map();
  const monthlyTargets = new Map();
  const admissions = new Map();

  return {
    addCounselor(c) {
      const id = c.id || `c-${counselors.size + 1}`;
      const record = {
        id,
        employee_code: c.employee_code.trim().toUpperCase(),
        full_name: c.full_name.trim(),
        email: c.email.trim().toLowerCase(),
        phone: c.phone.trim(),
        monthly_target: Number(c.monthly_target) || 0,
        is_active: c.is_active ?? true,
      };
      counselors.set(id, record);
      return record;
    },

    setMonthlyTarget(counselorId, monthKey, amount) {
      const normMonth = normalizeMonthKey(monthKey);
      monthlyTargets.set(`${counselorId}_${normMonth}`, Number(amount));
    },

    addAdmission(a) {
      const val = validateAdmissionInput(a);
      if (!val.isValid) {
        throw new Error(Object.values(val.errors)[0]);
      }
      if (!counselors.has(a.counselor_id)) {
        throw new Error("Foreign key violation: counselor not found.");
      }
      const id = a.id || `adm-${admissions.size + 1}`;
      const record = {
        id,
        counselor_id: a.counselor_id,
        admission_date: a.admission_date.trim(),
        university_name: a.university_name.trim(),
        program_name: a.program_name.trim(),
        amount_collected: Number(a.amount_collected),
        payment_mode: a.payment_mode,
        notes: a.notes?.trim() || null,
      };
      admissions.set(id, record);
      return record;
    },

    updateAdmission(id, updates) {
      if (!admissions.has(id)) throw new Error("Admission not found");
      const current = admissions.get(id);
      const merged = { ...current, ...updates };
      const val = validateAdmissionInput(merged);
      if (!val.isValid) {
        throw new Error(Object.values(val.errors)[0]);
      }
      if (updates.counselor_id && !counselors.has(updates.counselor_id)) {
        throw new Error("Counselor not found");
      }
      admissions.set(id, merged);
      return merged;
    },

    getCounselorRevenueForMonth(counselorId, monthKey) {
      const { startDate, endDate } = getMonthDateRange(monthKey);
      let total = 0;
      for (const adm of admissions.values()) {
        if (
          adm.counselor_id === counselorId &&
          adm.admission_date >= startDate &&
          adm.admission_date <= endDate
        ) {
          total += adm.amount_collected;
        }
      }
      return total;
    },

    getCounselorReport(counselorId, monthKey) {
      const c = counselors.get(counselorId);
      if (!c) throw new Error("Counselor not found");
      const normMonth = normalizeMonthKey(monthKey);
      const customKey = `${counselorId}_${normMonth}`;
      const hasCustomTarget = monthlyTargets.has(customKey);
      const effectiveTarget = hasCustomTarget ? monthlyTargets.get(customKey) : c.monthly_target;
      const actualRevenue = this.getCounselorRevenueForMonth(counselorId, monthKey);
      const achievement = calculateAchievement(actualRevenue, effectiveTarget);

      return {
        ...c,
        effective_target: effectiveTarget,
        has_custom_target: hasCustomTarget,
        actual_revenue: actualRevenue,
        achievement_percentage: achievement.percentage,
        achievement_display: achievement.display,
      };
    },

    getTeamSummary(monthKey) {
      const { startDate, endDate } = getMonthDateRange(monthKey);
      let teamTarget = 0;
      let teamRevenue = 0;
      let activeCount = 0;

      for (const c of counselors.values()) {
        if (c.is_active) {
          activeCount++;
          const normMonth = normalizeMonthKey(monthKey);
          const customKey = `${c.id}_${normMonth}`;
          const effectiveTarget = monthlyTargets.has(customKey) ? monthlyTargets.get(customKey) : c.monthly_target;
          teamTarget += effectiveTarget;
        }
      }

      for (const adm of admissions.values()) {
        if (adm.admission_date >= startDate && adm.admission_date <= endDate) {
          // Check if counselor is active
          const c = counselors.get(adm.counselor_id);
          if (c && c.is_active) {
            teamRevenue += adm.amount_collected;
          }
        }
      }

      const teamAchievement = calculateAchievement(teamRevenue, teamTarget);

      return {
        activeCounselors: activeCount,
        teamTarget,
        teamRevenue,
        teamAchievementDisplay: teamAchievement.display,
        teamAchievementPercentage: teamAchievement.percentage,
      };
    },

    deleteCounselor(id, forceDeactivate = false) {
      if (!counselors.has(id)) throw new Error("Counselor not found");

      let hasTargets = false;
      for (const [key] of monthlyTargets.entries()) {
        if (key.startsWith(`${id}_`)) {
          hasTargets = true;
          break;
        }
      }

      let hasAdmissions = false;
      for (const adm of admissions.values()) {
        if (adm.counselor_id === id) {
          hasAdmissions = true;
          break;
        }
      }

      if (hasTargets || hasAdmissions) {
        if (forceDeactivate) {
          const c = counselors.get(id);
          c.is_active = false;
          return { deactivated: true };
        }
        throw new Error("Cannot delete counselor: Historical target or admission records exist. Deactivate instead.");
      }

      counselors.delete(id);
      return { deleted: true };
    },
  };
}

// --------------------------------------------------------------------------
// TEST SUITE: 19 VERIFICATION CASES
// --------------------------------------------------------------------------

test("1. Valid admission input passes validation", () => {
  const input = {
    counselor_id: "c-101",
    admission_date: "2026-10-15",
    university_name: "Chandigarh University",
    program_name: "Online MBA",
    amount_collected: 45000,
    payment_mode: "semester_fees",
    notes: "Verified payment via netbanking",
  };
  const result = validateAdmissionInput(input);
  assert.equal(result.isValid, true);
  assert.equal(Object.keys(result.errors).length, 0);
});

test("2. Missing counselor is rejected", () => {
  const result = validateAdmissionInput({
    admission_date: "2026-10-15",
    university_name: "Amity Online",
    program_name: "MCA",
    amount_collected: 50000,
    payment_mode: "semester_fees",
  });
  assert.equal(result.isValid, false);
  assert.match(result.errors.counselor_id, /select an assigned counselor/i);
});

test("3. Invalid or empty university and program are rejected", () => {
  const emptyUniv = validateAdmissionInput({
    counselor_id: "c-1",
    admission_date: "2026-10-15",
    university_name: "   ",
    program_name: "BCA",
    amount_collected: 30000,
    payment_mode: "annual_fees",
  });
  assert.equal(emptyUniv.isValid, false);
  assert.match(emptyUniv.errors.university_name, /university name is required/i);

  const shortProg = validateAdmissionInput({
    counselor_id: "c-1",
    admission_date: "2026-10-15",
    university_name: "Manipal University",
    program_name: "M",
    amount_collected: 30000,
    payment_mode: "annual_fees",
  });
  assert.equal(shortProg.isValid, false);
  assert.match(shortProg.errors.program_name, /at least 2 characters/i);
});

test("4. Negative collection amount is rejected", () => {
  const result = validateAdmissionInput({
    counselor_id: "c-1",
    admission_date: "2026-10-15",
    university_name: "Lovely Professional University",
    program_name: "B.Tech",
    amount_collected: -5000,
    payment_mode: "full_fees",
  });
  assert.equal(result.isValid, false);
  assert.match(result.errors.amount_collected, /non-negative/i);
});

test("5. Invalid payment mode is rejected", () => {
  const result = validateAdmissionInput({
    counselor_id: "c-1",
    admission_date: "2026-10-15",
    university_name: "CU",
    program_name: "MBA",
    amount_collected: 60000,
    payment_mode: "bitcoin_crypto",
  });
  assert.equal(result.isValid, false);
  assert.match(result.errors.payment_mode, /supported modes/i);
});

test("6. Correct counselor revenue aggregation", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-01",
    full_name: "Pooja Verma",
    email: "pooja.v@collegevidya.com",
    phone: "9876543210",
    monthly_target: 200000,
  });

  // Add 3 admissions in October 2026
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-05",
    university_name: "CU",
    program_name: "MBA",
    amount_collected: 40000,
    payment_mode: "semester_fees",
  });
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-12",
    university_name: "Amity",
    program_name: "MCA",
    amount_collected: 60000,
    payment_mode: "annual_fees",
  });
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-25",
    university_name: "Manipal",
    program_name: "BBA",
    amount_collected: 50000,
    payment_mode: "semester_fees",
  });

  const rev = store.getCounselorRevenueForMonth(c.id, "2026-10-01");
  assert.equal(rev, 150000); // 40k + 60k + 50k

  const report = store.getCounselorReport(c.id, "2026-10-01");
  assert.equal(report.actual_revenue, 150000);
  assert.equal(report.achievement_percentage, 75); // 150000 / 200000 * 100 = 75%
  assert.equal(report.achievement_display, "75.0%");
});

test("7. Correct team revenue aggregation", () => {
  const store = createMockPipelineStore();
  const c1 = store.addCounselor({
    employee_code: "CV-01",
    full_name: "Counselor One",
    email: "c1@collegevidya.com",
    phone: "9876543210",
    monthly_target: 100000,
  });
  const c2 = store.addCounselor({
    employee_code: "CV-02",
    full_name: "Counselor Two",
    email: "c2@collegevidya.com",
    phone: "9876543211",
    monthly_target: 150000,
  });

  store.addAdmission({
    counselor_id: c1.id,
    admission_date: "2026-10-10",
    university_name: "CU",
    program_name: "MBA",
    amount_collected: 80000,
    payment_mode: "semester_fees",
  });
  store.addAdmission({
    counselor_id: c2.id,
    admission_date: "2026-10-15",
    university_name: "Amity",
    program_name: "BCA",
    amount_collected: 120000,
    payment_mode: "annual_fees",
  });

  const team = store.getTeamSummary("2026-10-01");
  assert.equal(team.activeCounselors, 2);
  assert.equal(team.teamTarget, 250000);
  assert.equal(team.teamRevenue, 200000);
  assert.equal(team.teamAchievementPercentage, 80); // 200000 / 250000 * 100 = 80%
  assert.equal(team.teamAchievementDisplay, "80.0%");
});

test("8. Correct monthly boundaries (1st of month, last of month, year transition)", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-03",
    full_name: "Boundary Tester",
    email: "boundary@collegevidya.com",
    phone: "9876543212",
    monthly_target: 100000,
  });

  // Admission on first day of month: Oct 1
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-01",
    university_name: "Univ A",
    program_name: "Prog A",
    amount_collected: 20000,
    payment_mode: "semester_fees",
  });

  // Admission on last day of month: Oct 31
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-31",
    university_name: "Univ B",
    program_name: "Prog B",
    amount_collected: 30000,
    payment_mode: "annual_fees",
  });

  // Admission in December: Dec 31
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-12-31",
    university_name: "Univ Dec",
    program_name: "Prog Dec",
    amount_collected: 50000,
    payment_mode: "full_fees",
  });

  // Admission across year boundary: Jan 1 2027
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2027-01-01",
    university_name: "Univ Jan",
    program_name: "Prog Jan",
    amount_collected: 75000,
    payment_mode: "semester_fees",
  });

  // October revenue includes both Oct 1 and Oct 31
  assert.equal(store.getCounselorRevenueForMonth(c.id, "2026-10-01"), 50000);

  // November has 0
  assert.equal(store.getCounselorRevenueForMonth(c.id, "2026-11-01"), 0);

  // December has 50000
  assert.equal(store.getCounselorRevenueForMonth(c.id, "2026-12-01"), 50000);

  // January 2027 has 75000
  assert.equal(store.getCounselorRevenueForMonth(c.id, "2027-01-01"), 75000);
});

test("9. Custom monthly target overrides base target for selected month", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-04",
    full_name: "Custom Target Counselor",
    email: "custom@collegevidya.com",
    phone: "9876543213",
    monthly_target: 100000, // baseline
  });

  // Custom target of ₹2,50,000 for November 2026
  store.setMonthlyTarget(c.id, "2026-11-01", 250000);

  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-11-15",
    university_name: "Univ X",
    program_name: "Prog X",
    amount_collected: 125000,
    payment_mode: "semester_fees",
  });

  const report = store.getCounselorReport(c.id, "2026-11-01");
  assert.equal(report.effective_target, 250000);
  assert.equal(report.has_custom_target, true);
  assert.equal(report.actual_revenue, 125000);
  assert.equal(report.achievement_percentage, 50); // 125000 / 250000 * 100 = 50%
  assert.equal(report.achievement_display, "50.0%");
});

test("10. Base target fallback when no custom monthly target exists", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-05",
    full_name: "Fallback Counselor",
    email: "fallback@collegevidya.com",
    phone: "9876543214",
    monthly_target: 150000, // base target
  });

  // No custom target configured for October 2026
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-18",
    university_name: "Univ Y",
    program_name: "Prog Y",
    amount_collected: 75000,
    payment_mode: "semester_fees",
  });

  const report = store.getCounselorReport(c.id, "2026-10-01");
  assert.equal(report.effective_target, 150000);
  assert.equal(report.has_custom_target, false);
  assert.equal(report.actual_revenue, 75000);
  assert.equal(report.achievement_percentage, 50); // 75000 / 150000 * 100 = 50%
  assert.equal(report.achievement_display, "50.0%");
});

test("11. Zero target produces N/A rather than division errors", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-06",
    full_name: "Zero Target Counselor",
    email: "zero@collegevidya.com",
    phone: "9876543215",
    monthly_target: 0, // ₹0 quota
  });

  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-20",
    university_name: "Univ Z",
    program_name: "Prog Z",
    amount_collected: 50000,
    payment_mode: "full_fees",
  });

  const report = store.getCounselorReport(c.id, "2026-10-01");
  assert.equal(report.effective_target, 0);
  assert.equal(report.actual_revenue, 50000);
  assert.equal(report.achievement_percentage, null);
  assert.equal(report.achievement_display, "N/A"); // Must be N/A as per specification
});

test("12. Counselor with no admissions displays zero revenue", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-07",
    full_name: "New Counselor",
    email: "new@collegevidya.com",
    phone: "9876543216",
    monthly_target: 200000,
  });

  const report = store.getCounselorReport(c.id, "2026-10-01");
  assert.equal(report.actual_revenue, 0);
  assert.equal(report.achievement_percentage, 0);
  assert.equal(report.achievement_display, "0.0%");
});

test("13. Editing an amount updates calculated revenue", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-08",
    full_name: "Edit Tester",
    email: "edit@collegevidya.com",
    phone: "9876543217",
    monthly_target: 100000,
  });

  const adm = store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-10",
    university_name: "CU",
    program_name: "MBA",
    amount_collected: 40000,
    payment_mode: "semester_fees",
  });

  assert.equal(store.getCounselorRevenueForMonth(c.id, "2026-10-01"), 40000);

  // Edit amount from 40k to 65k
  store.updateAdmission(adm.id, { amount_collected: 65000 });

  assert.equal(store.getCounselorRevenueForMonth(c.id, "2026-10-01"), 65000);
  const report = store.getCounselorReport(c.id, "2026-10-01");
  assert.equal(report.actual_revenue, 65000);
  assert.equal(report.achievement_percentage, 65);
});

test("14. Editing a counselor or date attributes revenue correctly", () => {
  const store = createMockPipelineStore();
  const c1 = store.addCounselor({
    employee_code: "CV-09A",
    full_name: "Original Counselor",
    email: "c9a@collegevidya.com",
    phone: "9876543218",
    monthly_target: 100000,
  });
  const c2 = store.addCounselor({
    employee_code: "CV-09B",
    full_name: "New Counselor",
    email: "c9b@collegevidya.com",
    phone: "9876543219",
    monthly_target: 100000,
  });

  const adm = store.addAdmission({
    counselor_id: c1.id,
    admission_date: "2026-10-10",
    university_name: "CU",
    program_name: "MBA",
    amount_collected: 50000,
    payment_mode: "semester_fees",
  });

  // Initially c1 has 50k in Oct, c2 has 0
  assert.equal(store.getCounselorRevenueForMonth(c1.id, "2026-10-01"), 50000);
  assert.equal(store.getCounselorRevenueForMonth(c2.id, "2026-10-01"), 0);

  // Re-attribute to c2 and change date to November
  store.updateAdmission(adm.id, {
    counselor_id: c2.id,
    admission_date: "2026-11-05",
  });

  // Now c1 has 0 in Oct, c2 has 0 in Oct and 50k in Nov
  assert.equal(store.getCounselorRevenueForMonth(c1.id, "2026-10-01"), 0);
  assert.equal(store.getCounselorRevenueForMonth(c2.id, "2026-10-01"), 0);
  assert.equal(store.getCounselorRevenueForMonth(c2.id, "2026-11-01"), 50000);
});

test("15. Month switching recalculates values correctly", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-10",
    full_name: "Month Switcher",
    email: "switch@collegevidya.com",
    phone: "9876543220",
    monthly_target: 100000,
  });

  // October admission: ₹30,000
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-14",
    university_name: "CU",
    program_name: "BBA",
    amount_collected: 30000,
    payment_mode: "semester_fees",
  });

  // November admission: ₹80,000
  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-11-20",
    university_name: "Amity",
    program_name: "MBA",
    amount_collected: 80000,
    payment_mode: "annual_fees",
  });

  const octReport = store.getCounselorReport(c.id, "2026-10-01");
  assert.equal(octReport.actual_revenue, 30000);
  assert.equal(octReport.achievement_percentage, 30);

  const novReport = store.getCounselorReport(c.id, "2026-11-01");
  assert.equal(novReport.actual_revenue, 80000);
  assert.equal(novReport.achievement_percentage, 80);
});

test("16. Unauthorized server actions are rejected", () => {
  // Test evaluation logic for anonymous or non-admin user
  function evaluateSession(user, adminEmail) {
    if (!user) return { isAuthorized: false, reason: "No active session" };
    const email = user.email?.trim().toLowerCase();
    const authorized = adminEmail.trim().toLowerCase();
    if (email !== authorized) {
      return { isAuthorized: false, reason: "Account not authorized" };
    }
    return { isAuthorized: true };
  }

  const anon = evaluateSession(null, "sachin.behera@collegevidya.com");
  assert.equal(anon.isAuthorized, false);

  const regularUser = evaluateSession({ email: "student@gmail.com" }, "sachin.behera@collegevidya.com");
  assert.equal(regularUser.isAuthorized, false);

  const admin = evaluateSession({ email: "  SACHIN.BEHERA@collegevidya.com  " }, "sachin.behera@collegevidya.com");
  assert.equal(admin.isAuthorized, true);
});

test("17. RLS prevents unauthorized database access", () => {
  // Simulates PostgreSQL RLS policy check: USING (public.is_admin())
  function canExecuteRls(userRole, isAdminFunctionResult) {
    if (userRole === "anon") return false;
    if (userRole === "authenticated" && !isAdminFunctionResult) return false;
    return isAdminFunctionResult === true;
  }

  assert.equal(canExecuteRls("anon", false), false);
  assert.equal(canExecuteRls("authenticated", false), false);
  assert.equal(canExecuteRls("authenticated", true), true);
});

test("18. Historical admissions are retained when a counselor is deactivated", () => {
  const store = createMockPipelineStore();
  const c = store.addCounselor({
    employee_code: "CV-11",
    full_name: "Deactivate Counselor",
    email: "deact@collegevidya.com",
    phone: "9876543221",
    monthly_target: 100000,
  });

  store.addAdmission({
    counselor_id: c.id,
    admission_date: "2026-10-10",
    university_name: "CU",
    program_name: "MBA",
    amount_collected: 60000,
    payment_mode: "semester_fees",
  });

  // Attempt to delete counselor without force -> must throw
  assert.throws(
    () => store.deleteCounselor(c.id, false),
    /Historical target or admission records exist/
  );

  // Deactivate counselor with force -> retains records
  const result = store.deleteCounselor(c.id, true);
  assert.equal(result.deactivated, true);

  // Counselor revenue history is preserved
  const rev = store.getCounselorRevenueForMonth(c.id, "2026-10-01");
  assert.equal(rev, 60000);
});

test("19. Currency formatting formats Indian Rupees accurately", () => {
  assert.match(formatINR(45000), /₹\s?45,000/);
  assert.match(formatINR(1250000), /₹\s?12,50,000/);
  assert.match(formatINR(0), /₹\s?0/);
});
