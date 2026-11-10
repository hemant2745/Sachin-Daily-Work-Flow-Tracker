import test from "node:test";
import assert from "node:assert/strict";

/**
 * Pure calculation utilities matching src/lib/weekly.ts
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMonthWeekPeriods(year, month, referenceDate = new Date()) {
  const totalDays = getDaysInMonth(year, month);
  const monthStr = String(month).padStart(2, "0");

  const isCurrentMonth =
    referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 === month;
  const isPastMonth =
    referenceDate.getFullYear() > year ||
    (referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 > month);
  const currentDay = isCurrentMonth ? referenceDate.getDate() : isPastMonth ? totalDays : 0;

  const rawPeriods = [
    { week: "W1", name: "Week 1", startDay: 1, endDay: 7 },
    { week: "W2", name: "Week 2", startDay: 8, endDay: 14 },
    { week: "W3", name: "Week 3", startDay: 15, endDay: 21 },
    { week: "W4", name: "Week 4", startDay: 22, endDay: totalDays },
  ];

  return rawPeriods.map((p) => {
    const periodDays = p.endDay - p.startDay + 1;
    let elapsed = 0;

    if (currentDay >= p.endDay) {
      elapsed = periodDays;
    } else if (currentDay >= p.startDay) {
      elapsed = currentDay - p.startDay + 1;
    } else {
      elapsed = 0;
    }

    const isComplete = isPastMonth || (isCurrentMonth && currentDay >= p.endDay);
    const isCurrent = isCurrentMonth && currentDay >= p.startDay && currentDay <= p.endDay;
    const isUpcoming = !isPastMonth && !isCurrent && currentDay < p.startDay;

    const startDate = `${year}-${monthStr}-${String(p.startDay).padStart(2, "0")}`;
    const endDate = `${year}-${monthStr}-${String(p.endDay).padStart(2, "0")}`;

    return {
      week: p.week,
      name: p.name,
      startDay: p.startDay,
      endDay: p.endDay,
      startDate,
      endDate,
      totalDays: periodDays,
      elapsedDays: elapsed,
      isComplete,
      isCurrent,
      isUpcoming,
    };
  });
}

function getWeekForDay(day) {
  if (day <= 7) return "W1";
  if (day <= 14) return "W2";
  if (day <= 21) return "W3";
  return "W4";
}

function calculateExpectedRevenue(monthlyTarget, elapsedDays, totalDaysInMonth) {
  if (totalDaysInMonth <= 0 || monthlyTarget <= 0 || elapsedDays <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, elapsedDays / totalDaysInMonth));
  return Math.round(monthlyTarget * ratio);
}

function calculateWeeklyTarget(monthlyTarget, daysInPeriod, totalDaysInMonth) {
  if (totalDaysInMonth <= 0 || monthlyTarget <= 0 || daysInPeriod <= 0) return 0;
  return Math.round(monthlyTarget * (daysInPeriod / totalDaysInMonth));
}

function calculatePerformanceGap(actualRevenue, expectedRevenue) {
  return actualRevenue - expectedRevenue;
}

function calculateRemainingTarget(monthlyTarget, actualRevenue) {
  return Math.max(0, monthlyTarget - actualRevenue);
}

function buildCounselorWeeklyPerformance(params) {
  const {
    counselorId,
    counselorName,
    employeeCode,
    category,
    email,
    baseTarget,
    additionalTarget,
    monthlyTarget,
    year,
    month,
    admissions,
    referenceDate = new Date(),
  } = params;

  const periods = getMonthWeekPeriods(year, month, referenceDate);
  const totalDays = getDaysInMonth(year, month);

  const isCurrentMonth =
    referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 === month;
  const isPastMonth =
    referenceDate.getFullYear() > year ||
    (referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 > month);
  const elapsedMonthDays = isCurrentMonth ? Math.min(totalDays, referenceDate.getDate()) : isPastMonth ? totalDays : 0;

  // Filter only verified admissions for actual collection and admission count
  const verifiedAdmissions = admissions.filter((a) => a.isVerified);

  const weekAdmissionsMap = {
    W1: { revenue: 0, count: 0 },
    W2: { revenue: 0, count: 0 },
    W3: { revenue: 0, count: 0 },
    W4: { revenue: 0, count: 0 },
  };

  let totalActualRevenue = 0;
  let totalActualAdmissions = 0;

  verifiedAdmissions.forEach((adm) => {
    const w = getWeekForDay(adm.day);
    weekAdmissionsMap[w].revenue += adm.amount;
    weekAdmissionsMap[w].count += 1;
    totalActualRevenue += adm.amount;
    totalActualAdmissions += 1;
  });

  const weeksRecord = {};

  periods.forEach((p) => {
    const weeklyTarget = calculateWeeklyTarget(monthlyTarget, p.totalDays, totalDays);
    const expectedRevenue = p.isComplete
      ? weeklyTarget
      : p.isCurrent
      ? Math.round(weeklyTarget * (p.elapsedDays / p.totalDays))
      : 0;

    const actualRev = weekAdmissionsMap[p.week].revenue;
    const actualAdm = weekAdmissionsMap[p.week].count;
    const gap = actualRev - expectedRevenue;
    const achPercentage = weeklyTarget > 0 ? (actualRev / weeklyTarget) * 100 : null;

    weeksRecord[p.week] = {
      week: p.week,
      weekName: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      daysInPeriod: p.totalDays,
      weeklyTarget,
      expectedRevenue,
      actualRevenue: actualRev,
      actualAdmissions: actualAdm,
      achievementPercentage: achPercentage,
      performanceGap: gap,
      isAhead: gap >= 0,
    };
  });

  const cumulativeExpectedRevenue = calculateExpectedRevenue(monthlyTarget, elapsedMonthDays, totalDays);
  const monthlyGap = totalActualRevenue - cumulativeExpectedRevenue;
  const remainingTarget = calculateRemainingTarget(monthlyTarget, totalActualRevenue);
  const monthlyAchPercentage = monthlyTarget > 0 ? (totalActualRevenue / monthlyTarget) * 100 : null;

  return {
    counselorId,
    counselorName,
    employeeCode,
    category,
    email,
    monthlyTarget,
    baseTarget,
    additionalTarget,
    expectedRevenue: cumulativeExpectedRevenue,
    actualRevenue: totalActualRevenue,
    actualAdmissions: totalActualAdmissions,
    remainingTarget,
    performanceGap: monthlyGap,
    achievementPercentage: monthlyAchPercentage,
    isAhead: monthlyGap >= 0,
    weeks: weeksRecord,
  };
}

/**
 * Test Cases
 */
test("1. Weekly division: 4 fixed periods with dynamic Week 4 length for different month lengths", () => {
  // February non-leap (2025-02, 28 days)
  const feb28 = getMonthWeekPeriods(2025, 2, new Date(2025, 1, 15));
  assert.equal(feb28.length, 4);
  assert.equal(feb28[0].startDay, 1);
  assert.equal(feb28[0].endDay, 7);
  assert.equal(feb28[0].totalDays, 7);

  assert.equal(feb28[1].startDay, 8);
  assert.equal(feb28[1].endDay, 14);
  assert.equal(feb28[1].totalDays, 7);

  assert.equal(feb28[2].startDay, 15);
  assert.equal(feb28[2].endDay, 21);
  assert.equal(feb28[2].totalDays, 7);

  assert.equal(feb28[3].startDay, 22);
  assert.equal(feb28[3].endDay, 28);
  assert.equal(feb28[3].totalDays, 7); // 28 - 22 + 1 = 7 days

  // February leap year (2024-02, 29 days)
  const feb29 = getMonthWeekPeriods(2024, 2, new Date(2024, 1, 15));
  assert.equal(feb29[3].endDay, 29);
  assert.equal(feb29[3].totalDays, 8); // 29 - 22 + 1 = 8 days

  // April (30 days)
  const apr = getMonthWeekPeriods(2026, 4, new Date(2026, 3, 15));
  assert.equal(apr[3].endDay, 30);
  assert.equal(apr[3].totalDays, 9); // 30 - 22 + 1 = 9 days

  // October (31 days)
  const oct = getMonthWeekPeriods(2026, 10, new Date(2026, 9, 15));
  assert.equal(oct[3].endDay, 31);
  assert.equal(oct[3].totalDays, 10); // 31 - 22 + 1 = 10 days
});

test("2. Sum of days in all 4 periods equals total calendar days in the month", () => {
  const monthsToTest = [
    { year: 2025, month: 2, expectedDays: 28 },
    { year: 2024, month: 2, expectedDays: 29 },
    { year: 2026, month: 4, expectedDays: 30 },
    { year: 2026, month: 5, expectedDays: 31 },
  ];

  monthsToTest.forEach(({ year, month, expectedDays }) => {
    const periods = getMonthWeekPeriods(year, month);
    const sumDays = periods.reduce((sum, p) => sum + p.totalDays, 0);
    assert.equal(sumDays, expectedDays);
  });
});

test("3. Day bucket resolution accurately assigns calendar day to W1, W2, W3, or W4", () => {
  assert.equal(getWeekForDay(1), "W1");
  assert.equal(getWeekForDay(7), "W1");
  assert.equal(getWeekForDay(8), "W2");
  assert.equal(getWeekForDay(14), "W2");
  assert.equal(getWeekForDay(15), "W3");
  assert.equal(getWeekForDay(21), "W3");
  assert.equal(getWeekForDay(22), "W4");
  assert.equal(getWeekForDay(28), "W4");
  assert.equal(getWeekForDay(30), "W4");
  assert.equal(getWeekForDay(31), "W4");
});

test("4. Prorated expected revenue calculation matches formula: Monthly Target * (Elapsed Days / Total Days)", () => {
  const target = 800000;
  const daysInMonth = 30;

  // Day 0: 0
  assert.equal(calculateExpectedRevenue(target, 0, daysInMonth), 0);

  // Day 15 (Mid-month in 30 day month: exactly 50%)
  const expected15 = calculateExpectedRevenue(target, 15, daysInMonth);
  assert.equal(expected15, 400000);

  // Day 30 (Full month: 100%)
  const expected30 = calculateExpectedRevenue(target, 30, daysInMonth);
  assert.equal(expected30, 800000);

  // Cap at 100% even if elapsed > daysInMonth
  const expectedOver = calculateExpectedRevenue(target, 35, daysInMonth);
  assert.equal(expectedOver, 800000);
});

test("5. Weekly target allocation divides monthly target proportional to days in period", () => {
  const monthlyTarget = 620000; // In a 31-day month, exactly ₹20,000 per day
  const daysInMonth = 31;

  // Week 1 (7 days): 7 * 20,000 = ₹1,40,000
  const w1Target = calculateWeeklyTarget(monthlyTarget, 7, daysInMonth);
  assert.equal(w1Target, 140000);

  // Week 2 (7 days): 7 * 20,000 = ₹1,40,000
  const w2Target = calculateWeeklyTarget(monthlyTarget, 7, daysInMonth);
  assert.equal(w2Target, 140000);

  // Week 3 (7 days): 7 * 20,000 = ₹1,40,000
  const w3Target = calculateWeeklyTarget(monthlyTarget, 7, daysInMonth);
  assert.equal(w3Target, 140000);

  // Week 4 (10 days in 31-day month): 10 * 20,000 = ₹2,00,000
  const w4Target = calculateWeeklyTarget(monthlyTarget, 10, daysInMonth);
  assert.equal(w4Target, 200000);

  // Sum of weekly targets equals total monthly target
  assert.equal(w1Target + w2Target + w3Target + w4Target, monthlyTarget);
});

test("6. Performance Gap formula: Performance Gap = Actual Performance - Expected Performance", () => {
  // Ahead of target
  assert.equal(calculatePerformanceGap(450000, 400000), 50000);

  // Behind target
  assert.equal(calculatePerformanceGap(350000, 400000), -50000);

  // On target
  assert.equal(calculatePerformanceGap(400000, 400000), 0);
});

test("7. Remaining Target formula: max(0, Monthly Target - Actual Revenue)", () => {
  assert.equal(calculateRemainingTarget(800000, 500000), 300000);
  assert.equal(calculateRemainingTarget(800000, 800000), 0);
  assert.equal(calculateRemainingTarget(800000, 950000), 0); // Exceeded quota
});

test("8. Verified admission rule: only verified admissions count towards actual revenue", () => {
  const result = buildCounselorWeeklyPerformance({
    counselorId: "c1",
    counselorName: "Shikha",
    employeeCode: "BL1707",
    category: "CDA",
    email: "shikha@collegevidya.com",
    baseTarget: 800000,
    additionalTarget: 50000,
    monthlyTarget: 850000,
    year: 2026,
    month: 10,
    admissions: [
      { amount: 100000, day: 3, isVerified: true }, // Week 1 (Verified)
      { amount: 50000, day: 5, isVerified: false }, // Week 1 (Unverified - MUST BE EXCLUDED)
      { amount: 150000, day: 10, isVerified: true }, // Week 2 (Verified)
      { amount: 75000, day: 18, isVerified: true }, // Week 3 (Verified)
    ],
    referenceDate: new Date(2026, 9, 20), // Day 20 of October 2026
  });

  // Total verified revenue = 100000 + 150000 + 75000 = 325000 (unverified 50000 excluded)
  assert.equal(result.actualRevenue, 325000);
  assert.equal(result.actualAdmissions, 3);

  // Week 1 verified revenue = 100000
  assert.equal(result.weeks.W1.actualRevenue, 100000);
  assert.equal(result.weeks.W1.actualAdmissions, 1);

  // Week 2 verified revenue = 150000
  assert.equal(result.weeks.W2.actualRevenue, 150000);
  assert.equal(result.weeks.W2.actualAdmissions, 1);

  // Week 3 verified revenue = 75000
  assert.equal(result.weeks.W3.actualRevenue, 75000);
  assert.equal(result.weeks.W3.actualAdmissions, 1);

  // Week 4 has no admissions
  assert.equal(result.weeks.W4.actualRevenue, 0);
  assert.equal(result.weeks.W4.actualAdmissions, 0);
});

test("9. Performance gap is positive when counselor exceeds prorated expectation", () => {
  const result = buildCounselorWeeklyPerformance({
    counselorId: "c2",
    counselorName: "Shivalika",
    employeeCode: "BL2683",
    category: "CDA",
    email: "shivalika@collegevidya.com",
    baseTarget: 800000,
    additionalTarget: 0,
    monthlyTarget: 800000,
    year: 2026,
    month: 10,
    admissions: [
      { amount: 500000, day: 5, isVerified: true },
    ],
    referenceDate: new Date(2026, 9, 10), // Day 10 in 31-day month
  });

  // Expected at Day 10 of 31: round(800000 * 10 / 31) = 258065
  // Actual: 500000
  // Performance Gap: 500000 - 258065 = +241935
  assert.equal(result.isAhead, true);
  assert.ok(result.performanceGap > 0);
  assert.equal(result.actualRevenue, 500000);
});
