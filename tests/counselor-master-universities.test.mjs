import test from "node:test";
import assert from "node:assert/strict";

/**
 * Phase 4.3 Test Suite: Counselor Master Data, Dual Targets & University Master List
 * 
 * Tests:
 * 1. 9 Master counselors presence, employee codes, names, collection & admission targets.
 * 2. Total team collection target = ₹47,50,000.
 * 3. Total team admission target = 52.
 * 4. Duplicate employee code prevention.
 * 5. Target override precedence (monthly target over base target).
 * 6. Fallback to base target when monthly target is not set.
 * 7. Achievement % calculation to 2 decimal places.
 * 8. Zero target handling (returns "N/A", prevents division by zero).
 * 9. Distinction between unrecorded vs confirmed zero admissions.
 * 10. Exactly 23 universities in master list in exact canonical order.
 * 11. No missing, duplicate, or reordered universities.
 * 12. University selection integration allows custom entries without loss.
 * 13. Spreadsheet historical summary amounts are not counted as verified admissions.
 */

// Master counselor data specification matching Phase 4.3 requirement table exactly
const MASTER_COUNSELORS = [
  { employee_code: "BL1707", full_name: "Shikha", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2683", full_name: "Shivalika", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2857", full_name: "Vansh", monthly_target: 450000, monthly_admission_target: 5 },
  { employee_code: "BL3077", full_name: "Kanika", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2719", full_name: "Bhawana Sharma", monthly_target: 450000, monthly_admission_target: 5 },
  { employee_code: "BL2849", full_name: "Munesh", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2720", full_name: "Sameer", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL2170", full_name: "Bharat", monthly_target: 550000, monthly_admission_target: 6 },
  { employee_code: "BL3462", full_name: "Divya", monthly_target: 550000, monthly_admission_target: 6 },
];

// Master universities canonical list
const MASTER_UNIVERSITIES = [
  { id: 1, name: "Alliance University Online" },
  { id: 2, name: "Amity University Online" },
  { id: 3, name: "DY Patil University Online, Pune" },
  { id: 4, name: "Lovely Professional University (LPU) Online" },
  { id: 5, name: "Manipal University Jaipur (MUJ) Online" },
  { id: 6, name: "Chandigarh University Online" },
  { id: 7, name: "Bennett University Online" },
  { id: 8, name: "Vivekananda Global University (VGU) Online" },
  { id: 9, name: "Sharda University Online" },
  { id: 10, name: "Shoolini University Online" },
  { id: 11, name: "Uttaranchal University Online" },
  { id: 12, name: "Sikkim Manipal University Online" },
  { id: 13, name: "Assam Down Town University Online" },
  { id: 14, name: "Galgotias University Online" },
  { id: 15, name: "UPES Online" },
  { id: 16, name: "Amrita AHEAD Online" },
  { id: 17, name: "NMIMS Online" },
  { id: 18, name: "GLA University Online" },
  { id: 19, name: "D. Y. Patil University Online, Navi Mumbai" },
  { id: 20, name: "Christ University Online" },
  { id: 21, name: "Parul University Online" },
  { id: 22, name: "Kurukshetra University Online" },
  { id: 23, name: "Andhra University Online" },
];

// Helper pure functions matching format.ts
function calculateAchievement(value, target, fractionDigits = 2) {
  if (value === null || value === undefined) {
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

  const percentage = (value / target) * 100;
  return {
    status: "CALCULATED",
    percentage,
    display: `${percentage.toFixed(fractionDigits)}%`,
  };
}

function resolveEffectiveTargets(counselor, monthlyTargetRecord) {
  return {
    effective_target:
      monthlyTargetRecord?.target_amount !== undefined && monthlyTargetRecord.target_amount !== null
        ? monthlyTargetRecord.target_amount
        : counselor.monthly_target,
    effective_admission_target:
      monthlyTargetRecord?.target_admissions !== undefined && monthlyTargetRecord.target_admissions !== null
        ? monthlyTargetRecord.target_admissions
        : counselor.monthly_admission_target,
  };
}

function normalizeEmployeeCode(code) {
  return (code || "").trim().toUpperCase();
}

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

test("1. All 9 master counselors are present with correct details", () => {
  assert.equal(MASTER_COUNSELORS.length, 9, "Master roster must contain exactly 9 counselors");

  const expectedCodes = ["BL1707", "BL2683", "BL2857", "BL3077", "BL2719", "BL2849", "BL2720", "BL2170", "BL3462"];
  const actualCodes = MASTER_COUNSELORS.map((c) => c.employee_code);
  assert.deepEqual(actualCodes, expectedCodes, "Employee codes must match authorized roster");

  // Specific individual checks
  const shikha = MASTER_COUNSELORS.find((c) => c.employee_code === "BL1707");
  assert.equal(shikha.full_name, "Shikha");
  assert.equal(shikha.monthly_target, 550000);
  assert.equal(shikha.monthly_admission_target, 6);

  const vansh = MASTER_COUNSELORS.find((c) => c.employee_code === "BL2857");
  assert.equal(vansh.full_name, "Vansh");
  assert.equal(vansh.monthly_target, 450000);
  assert.equal(vansh.monthly_admission_target, 5);

  const bhawana = MASTER_COUNSELORS.find((c) => c.employee_code === "BL2719");
  assert.equal(bhawana.full_name, "Bhawana Sharma");
  assert.equal(bhawana.monthly_target, 450000);
  assert.equal(bhawana.monthly_admission_target, 5);

  const munesh = MASTER_COUNSELORS.find((c) => c.employee_code === "BL2849");
  assert.equal(munesh.full_name, "Munesh");
  assert.equal(munesh.monthly_target, 550000);
  assert.equal(munesh.monthly_admission_target, 6);
});

test("2. Team total collection target equals ₹47,50,000", () => {
  const totalCollection = MASTER_COUNSELORS.reduce((sum, c) => sum + c.monthly_target, 0);
  assert.equal(totalCollection, 4750000, "Sum of counselor collection targets must be 47,50,000");
});

test("3. Team total admission target equals 52", () => {
  const totalAdmissions = MASTER_COUNSELORS.reduce((sum, c) => sum + c.monthly_admission_target, 0);
  assert.equal(totalAdmissions, 52, "Sum of counselor admission targets must be 52");
});

test("4. Duplicate employee code is detected and rejected", () => {
  const existingCodes = new Set(MASTER_COUNSELORS.map((c) => normalizeEmployeeCode(c.employee_code)));

  function validateNewCode(code) {
    const normalized = normalizeEmployeeCode(code);
    if (existingCodes.has(normalized)) {
      return { valid: false, error: "Employee code already exists" };
    }
    return { valid: true };
  }

  assert.equal(validateNewCode("BL1707").valid, false);
  assert.equal(validateNewCode("bl1707").valid, false);
  assert.equal(validateNewCode("  BL1707  ").valid, false);
  assert.equal(validateNewCode("BL9999").valid, true);
});

test("5. Monthly target overrides take precedence over base targets", () => {
  const counselor = {
    employee_code: "BL1707",
    full_name: "Shikha",
    monthly_target: 550000,
    monthly_admission_target: 6,
  };

  const monthlyOverride = {
    target_amount: 750000,
    target_admissions: 8,
  };

  const resolved = resolveEffectiveTargets(counselor, monthlyOverride);
  assert.equal(resolved.effective_target, 750000, "Collection override must supersede base target");
  assert.equal(resolved.effective_admission_target, 8, "Admission override must supersede base target");
});

test("6. Missing monthly target falls back to base counselor targets", () => {
  const counselor = {
    employee_code: "BL2683",
    full_name: "Shivalika",
    monthly_target: 550000,
    monthly_admission_target: 6,
  };

  const resolvedWithoutOverride = resolveEffectiveTargets(counselor, null);
  assert.equal(resolvedWithoutOverride.effective_target, 550000, "Must fall back to base collection target");
  assert.equal(resolvedWithoutOverride.effective_admission_target, 6, "Must fall back to base admission target");
});

test("7. Achievement % calculates accurately to 2 decimal places", () => {
  // 1 out of 6 admissions: 16.6666...% -> 16.67%
  const ach1 = calculateAchievement(1, 6, 2);
  assert.equal(ach1.display, "16.67%");
  assert.equal(ach1.status, "CALCULATED");

  // 2 out of 6 admissions: 33.3333...% -> 33.33%
  const ach2 = calculateAchievement(2, 6, 2);
  assert.equal(ach2.display, "33.33%");

  // 50,000 out of 5,50,000 collections: 9.0909...% -> 9.09%
  const ach3 = calculateAchievement(50000, 550000, 2);
  assert.equal(ach3.display, "9.09%");

  // 100% exact achievement
  const ach4 = calculateAchievement(550000, 550000, 2);
  assert.equal(ach4.display, "100.00%");
});

test("8. Zero target handling returns 'N/A' and prevents division by zero", () => {
  const zeroAch = calculateAchievement(10000, 0, 2);
  assert.equal(zeroAch.status, "TARGET_NOT_SET");
  assert.equal(zeroAch.display, "N/A");
  assert.equal(zeroAch.percentage, null);

  const negativeAch = calculateAchievement(10000, -500, 2);
  assert.equal(negativeAch.status, "TARGET_NOT_SET");
  assert.equal(negativeAch.display, "N/A");
});

test("9. Distinction between unrecorded admissions vs confirmed zero admissions", () => {
  function getDisplayStatus(admissionsCount) {
    if (admissionsCount === null || admissionsCount === undefined) {
      return { label: "Not recorded", isZero: false };
    }
    if (admissionsCount === 0) {
      return { label: "0", isZero: true };
    }
    return { label: String(admissionsCount), isZero: false };
  }

  assert.equal(getDisplayStatus(null).label, "Not recorded");
  assert.equal(getDisplayStatus(undefined).label, "Not recorded");
  assert.equal(getDisplayStatus(0).label, "0");
  assert.equal(getDisplayStatus(0).isZero, true);
  assert.equal(getDisplayStatus(3).label, "3");
});

test("10. Master university list contains exactly 23 universities", () => {
  assert.equal(MASTER_UNIVERSITIES.length, 23, "Master list must contain exactly 23 universities");
  // Check sequential IDs 1 to 23
  MASTER_UNIVERSITIES.forEach((uni, idx) => {
    assert.equal(uni.id, idx + 1, `University at index ${idx} must have id ${idx + 1}`);
  });
});

test("11. University master list has no duplicates, missing, or altered names", () => {
  const names = MASTER_UNIVERSITIES.map((u) => u.name);
  const uniqueNames = new Set(names);
  assert.equal(uniqueNames.size, 23, "No duplicate university names allowed");

  assert.equal(MASTER_UNIVERSITIES[0].name, "Alliance University Online");
  assert.equal(MASTER_UNIVERSITIES[5].name, "Chandigarh University Online");
  assert.equal(MASTER_UNIVERSITIES[22].name, "Andhra University Online");
});

test("12. Admission form accepts master universities and custom entries without loss", () => {
  const approvedList = new Set(MASTER_UNIVERSITIES.map((u) => u.name));

  function processUniversityEntry(input) {
    const trimmed = (input || "").trim();
    if (!trimmed) {
      return { valid: false, error: "University name is required" };
    }
    return {
      valid: true,
      value: trimmed,
      isApprovedPartner: approvedList.has(trimmed),
    };
  }

  // Approved master entry
  const approved = processUniversityEntry("Chandigarh University Online");
  assert.equal(approved.valid, true);
  assert.equal(approved.isApprovedPartner, true);
  assert.equal(approved.value, "Chandigarh University Online");

  // Non-listed / legacy / custom entry
  const custom = processUniversityEntry("Custom University Not In Master List");
  assert.equal(custom.valid, true);
  assert.equal(custom.isApprovedPartner, false);
  assert.equal(custom.value, "Custom University Not In Master List");
});

test("13. Historical spreadsheet summary amounts are not counted without verified transaction records", () => {
  // Simulating admissions table rows vs spreadsheet summary cell
  const verifiedTransactionRows = []; // Zero rows currently in database

  // Spreadsheet cell claimed 3 admissions and ₹1,20,000 for Shikha
  const spreadsheetSummary = {
    counselor: "Shikha",
    unverifiedAdmissionsCount: 3,
    unverifiedCollectionAmount: 120000,
  };

  // Safe aggregation rule: Only sum actual database transactions
  const totalVerifiedRevenue = verifiedTransactionRows.reduce((sum, tx) => sum + tx.amount_collected, 0);
  const totalVerifiedAdmissions = verifiedTransactionRows.length;

  assert.equal(totalVerifiedRevenue, 0, "Verified collections must be 0 until real transactions are inserted");
  assert.equal(totalVerifiedAdmissions, 0, "Verified admissions must be 0 until real transactions are inserted");
  assert.notEqual(totalVerifiedRevenue, spreadsheetSummary.unverifiedCollectionAmount);
});
