import test from "node:test";
import assert from "node:assert/strict";

/**
 * Phase 3 Test Suite: Counselor Management & Monthly Target Tracking
 * 
 * Tests application business logic, calculations, normalization,
 * data validation, and historical target preservation.
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

function normalizeMonthKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function formatMonthDisplay(monthKey) {
  const [year, month] = monthKey.split("-");
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function validateCounselorInput(input) {
  const errors = {};

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

// In-memory store to test composite monthly target behavior and historical preservation
function createMockCounselorStore() {
  const counselors = new Map();
  const monthlyTargets = new Map(); // key: `${counselor_id}_${target_month}`

  return {
    addCounselor(data) {
      const validation = validateCounselorInput(data);
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0]);
      }
      const code = data.employee_code.trim().toUpperCase();
      const email = data.email.trim().toLowerCase();

      // Check unique constraints
      for (const c of counselors.values()) {
        if (c.employee_code === code) {
          throw new Error(`Duplicate employee code: ${code}`);
        }
        if (c.email === email) {
          throw new Error(`Duplicate email: ${email}`);
        }
      }

      const id = "counselor-" + (counselors.size + 1);
      const counselor = {
        id,
        employee_code: code,
        full_name: data.full_name.trim(),
        email,
        phone: data.phone.trim(),
        monthly_target: Number(data.monthly_target) || 0,
        is_active: data.is_active ?? true,
      };
      counselors.set(id, counselor);
      return counselor;
    },

    setMonthlyTarget(counselorId, targetMonth, targetAmount) {
      if (!counselors.has(counselorId)) {
        throw new Error("Counselor not found");
      }
      if (targetAmount < 0) {
        throw new Error("Target amount must be non-negative");
      }
      const normalizedMonth = normalizeMonthKey(targetMonth);
      const key = `${counselorId}_${normalizedMonth}`;
      monthlyTargets.set(key, {
        counselor_id: counselorId,
        target_month: normalizedMonth,
        target_amount: targetAmount,
      });
    },

    getTarget(counselorId, targetMonth) {
      const normalizedMonth = normalizeMonthKey(targetMonth);
      const key = `${counselorId}_${normalizedMonth}`;
      if (monthlyTargets.has(key)) {
        return monthlyTargets.get(key).target_amount;
      }
      // Fallback to baseline quota
      return counselors.get(counselorId)?.monthly_target ?? 0;
    },

    deleteCounselor(counselorId, forceDeactivate = false) {
      if (!counselors.has(counselorId)) {
        throw new Error("Counselor not found");
      }
      // Inspect dependencies
      let hasTargets = false;
      for (const [key] of monthlyTargets.entries()) {
        if (key.startsWith(`${counselorId}_`)) {
          hasTargets = true;
          break;
        }
      }

      if (hasTargets) {
        if (forceDeactivate) {
          const c = counselors.get(counselorId);
          c.is_active = false;
          return { deactivated: true };
        }
        throw new Error("Cannot delete: Historical target records exist. Deactivate instead.");
      }

      counselors.delete(counselorId);
      return { deleted: true };
    },
  };
}

// --------------------------------------------------------------------------
// TEST SUITE
// --------------------------------------------------------------------------

test("1. Valid counselor creation passes validation", () => {
  const input = {
    employee_code: "CV-101",
    full_name: "Rahul Sharma",
    email: "rahul.sharma@collegevidya.com",
    phone: "+91 9876543210",
    monthly_target: 200000,
  };
  const result = validateCounselorInput(input);
  assert.equal(result.isValid, true);
  assert.equal(Object.keys(result.errors).length, 0);
});

test("2. Required-field validation detects missing values", () => {
  const missingCode = validateCounselorInput({ full_name: "A", email: "a@b.com", phone: "12345678" });
  assert.equal(missingCode.isValid, false);
  assert.equal(missingCode.errors.employee_code, "Employee code is required.");

  const missingEmail = validateCounselorInput({ employee_code: "CV-1", full_name: "A", phone: "12345678" });
  assert.equal(missingEmail.isValid, false);
  assert.equal(missingEmail.errors.email, "Work email is required.");
});

test("3. Email normalization and formatting validation", () => {
  const store = createMockCounselorStore();
  const c = store.addCounselor({
    employee_code: "cv-200",
    full_name: "Pooja Verma",
    email: "  POOJA.V@COLLEGEVIDYA.COM  ",
    phone: "9876543210",
    monthly_target: 150000,
  });
  // Must normalize email to lowercase and uppercase employee code
  assert.equal(c.email, "pooja.v@collegevidya.com");
  assert.equal(c.employee_code, "CV-200");

  // Invalid email format must be rejected
  const malformed = validateCounselorInput({
    employee_code: "CV-201",
    full_name: "Test",
    email: "not-an-email",
    phone: "9876543210",
  });
  assert.equal(malformed.isValid, false);
  assert.match(malformed.errors.email, /valid work email/i);
});

test("4. Duplicate employee code and email rejection", () => {
  const store = createMockCounselorStore();
  store.addCounselor({
    employee_code: "CV-301",
    full_name: "Amit Patel",
    email: "amit.p@collegevidya.com",
    phone: "9876543211",
    monthly_target: 100000,
  });

  // Duplicate employee code (case-insensitive)
  assert.throws(
    () => {
      store.addCounselor({
        employee_code: "cv-301",
        full_name: "Another Amit",
        email: "other@collegevidya.com",
        phone: "9876543212",
        monthly_target: 100000,
      });
    },
    /duplicate employee code/i
  );

  // Duplicate email
  assert.throws(
    () => {
      store.addCounselor({
        employee_code: "CV-302",
        full_name: "Duplicate Email",
        email: "amit.p@collegevidya.com",
        phone: "9876543213",
        monthly_target: 100000,
      });
    },
    /duplicate email/i
  );
});

test("5. Negative-target rejection", () => {
  const validation = validateCounselorInput({
    employee_code: "CV-401",
    full_name: "Negative Target",
    email: "neg@collegevidya.com",
    phone: "9876543210",
    monthly_target: -50000,
  });
  assert.equal(validation.isValid, false);
  assert.match(validation.errors.monthly_target, /non-negative/i);
});

test("6. Month switching and historical target preservation", () => {
  const store = createMockCounselorStore();
  const c = store.addCounselor({
    employee_code: "CV-501",
    full_name: "Anjali Singh",
    email: "anjali.s@collegevidya.com",
    phone: "9876543210",
    monthly_target: 100000, // baseline
  });

  // Set target for October 2026: ₹1,50,000
  store.setMonthlyTarget(c.id, "2026-10-01", 150000);

  // Set target for November 2026: ₹2,00,000
  store.setMonthlyTarget(c.id, "2026-11-01", 200000);

  // Verify October target remains ₹1,50,000 (historical value preserved)
  assert.equal(store.getTarget(c.id, "2026-10-01"), 150000);
  assert.equal(store.getTarget(c.id, "2026-11-01"), 200000);

  // Unconfigured month returns baseline
  assert.equal(store.getTarget(c.id, "2026-12-01"), 100000);
});

test("7. Target-zero percentage handling prevents division by zero", () => {
  const result = calculateAchievement(50000, 0);
  assert.equal(result.status, "TARGET_NOT_SET");
  assert.equal(result.percentage, null);
  assert.equal(result.display, "Target not set");
});

test("8. Revenue-not-configured display behavior (Phase 3 contract)", () => {
  // Before Phase 4, actual revenue is null
  const result = calculateAchievement(null, 250000);
  assert.equal(result.status, "NOT_CONFIGURED");
  assert.equal(result.percentage, null);
  assert.equal(result.display, "Not configured");
});

test("9. Currency formatting formats Indian Rupees accurately", () => {
  const formatted = formatINR(250000);
  assert.match(formatted, /₹\s?2,50,000/);
  assert.match(formatINR(0), /₹\s?0/);
});

test("10. Deactivation and deletion protection for historical records", () => {
  const store = createMockCounselorStore();
  const c1 = store.addCounselor({
    employee_code: "CV-601",
    full_name: "Clean Counselor",
    email: "clean@collegevidya.com",
    phone: "9876543210",
    monthly_target: 0,
  });

  // c1 has no targets: safe deletion succeeds
  const deleteResult = store.deleteCounselor(c1.id, false);
  assert.equal(deleteResult.deleted, true);

  const c2 = store.addCounselor({
    employee_code: "CV-602",
    full_name: "Historical Counselor",
    email: "historical@collegevidya.com",
    phone: "9876543211",
    monthly_target: 100000,
  });
  store.setMonthlyTarget(c2.id, "2026-10-01", 100000);

  // Permanent deletion blocked due to historical target records
  assert.throws(
    () => {
      store.deleteCounselor(c2.id, false);
    },
    /historical target records exist/i
  );

  // Safe deactivation succeeds and protects historical integrity
  const deactivateResult = store.deleteCounselor(c2.id, true);
  assert.equal(deactivateResult.deactivated, true);
});

test("11. Month key normalization to first day of month (YYYY-MM-01)", () => {
  assert.equal(normalizeMonthKey("2026-10-28"), "2026-10-01");
  assert.equal(normalizeMonthKey(new Date(2026, 9, 28)), "2026-10-01");
  assert.equal(formatMonthDisplay("2026-10-01"), "October 2026");
});
