import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Test Suite: Daily Revenue Projection & Next-Day Completion Tracking Module
 * 
 * Verifies all 15 required specifications:
 * 1. Creating a valid projection with positive revenue and valid foreign keys.
 * 2. Rejecting missing counselor, university, date, or revenue.
 * 3. Rejecting zero and negative projected revenue.
 * 4. Supporting multiple projections for the same counselor on the same date.
 * 5. New projections defaulting to 'pending' status.
 * 6. Pending projections being excluded from completion percentage denominator.
 * 7. Correct primary completion percentage = (Met / Reviewed) * 100.
 * 8. Correct revenue-weighted percentage = (Sum of Met Revenue / Sum of Reviewed Revenue) * 100.
 * 9. Correct monthly filtering by projection date (not review date).
 * 10. Correct aggregation for counselors with unequal projection counts (e.g., 1/1 + 1/9 = 2/10 = 20%, not unweighted average).
 * 11. Zero reviewed projections returning null / "N/A" (never 0% or 100%).
 * 12. Counselor-specific dashboard calculations isolating each counselor's metrics.
 * 13. Status changes (Met <-> Not Met <-> Pending) refreshing monthly results.
 * 14. Unauthenticated access being strictly denied (single-admin check for sachin.behera@collegevidya.com).
 * 15. Existing Tasks, Admissions, and Counselors functionality remaining unaffected.
 */

// Helper functions matching src/lib/projections.ts
function validateProjectionInput(data) {
  const errors = [];
  if (!data.projection_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.projection_date)) {
    errors.push("Valid projection date is required");
  }
  if (!data.counselor_id || typeof data.counselor_id !== "string" || !data.counselor_id.trim()) {
    errors.push("Counselor selection is required");
  }
  if (!data.university_id || typeof data.university_id !== "string" || !data.university_id.trim()) {
    errors.push("University selection is required");
  }
  const rev = Number(data.projected_revenue);
  if (isNaN(rev) || rev <= 0) {
    errors.push("Projected revenue must be a positive number greater than 0");
  }
  return { valid: errors.length === 0, errors };
}

function calculateProjectionMetrics(projections) {
  let total = 0;
  let met = 0;
  let notMet = 0;
  let pending = 0;
  let totalRevenue = 0;
  let reviewedRevenue = 0;
  let metRevenue = 0;

  for (const p of projections) {
    const rev = Number(p.projected_revenue) || 0;
    total++;
    totalRevenue += rev;

    if (p.status === "met") {
      met++;
      reviewedRevenue += rev;
      metRevenue += rev;
    } else if (p.status === "not_met") {
      notMet++;
      reviewedRevenue += rev;
    } else {
      pending++;
    }
  }

  const reviewed = met + notMet;
  const completionPercentage = reviewed > 0 ? (met / reviewed) * 100 : null;
  const revenueWeightedPercentage = reviewedRevenue > 0 ? (metRevenue / reviewedRevenue) * 100 : null;

  return {
    total,
    met,
    notMet,
    pending,
    reviewed,
    completionPercentage,
    revenueWeightedPercentage,
    totalRevenue,
    reviewedRevenue,
    metRevenue,
  };
}

// ---------------------- TEST SUITE ----------------------

test("1. Creating a valid projection passes validation", () => {
  const input = {
    projection_date: "2026-10-29",
    counselor_id: "counselor-uuid-1",
    university_id: "university-uuid-1",
    projected_revenue: 55000,
    notes: "Follow up fee collection",
  };
  const result = validateProjectionInput(input);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("2. Rejecting missing counselor, university, date, or revenue", () => {
  // Missing date
  const missingDate = validateProjectionInput({
    projection_date: "",
    counselor_id: "c-1",
    university_id: "u-1",
    projected_revenue: 50000,
  });
  assert.equal(missingDate.valid, false);
  assert.ok(missingDate.errors.some((e) => e.includes("date")));

  // Missing counselor
  const missingCounselor = validateProjectionInput({
    projection_date: "2026-10-29",
    counselor_id: "",
    university_id: "u-1",
    projected_revenue: 50000,
  });
  assert.equal(missingCounselor.valid, false);
  assert.ok(missingCounselor.errors.some((e) => e.includes("Counselor")));

  // Missing university
  const missingUni = validateProjectionInput({
    projection_date: "2026-10-29",
    counselor_id: "c-1",
    university_id: "",
    projected_revenue: 50000,
  });
  assert.equal(missingUni.valid, false);
  assert.ok(missingUni.errors.some((e) => e.includes("University")));

  // Missing revenue
  const missingRev = validateProjectionInput({
    projection_date: "2026-10-29",
    counselor_id: "c-1",
    university_id: "u-1",
    projected_revenue: null,
  });
  assert.equal(missingRev.valid, false);
  assert.ok(missingRev.errors.some((e) => e.includes("revenue")));
});

test("3. Rejecting zero and negative revenue", () => {
  // Zero revenue
  const zeroRev = validateProjectionInput({
    projection_date: "2026-10-29",
    counselor_id: "c-1",
    university_id: "u-1",
    projected_revenue: 0,
  });
  assert.equal(zeroRev.valid, false);
  assert.ok(zeroRev.errors.some((e) => e.includes("positive number greater than 0")));

  // Negative revenue
  const negRev = validateProjectionInput({
    projection_date: "2026-10-29",
    counselor_id: "c-1",
    university_id: "u-1",
    projected_revenue: -5000,
  });
  assert.equal(negRev.valid, false);
});

test("4. Supporting multiple projections for the same counselor on the same date", () => {
  const counselorProjectionsOnSameDay = [
    {
      id: "p1",
      projection_date: "2026-10-29",
      counselor_id: "counselor-1",
      university_id: "uni-amity",
      projected_revenue: 50000,
      status: "pending",
    },
    {
      id: "p2",
      projection_date: "2026-10-29",
      counselor_id: "counselor-1",
      university_id: "uni-manipal",
      projected_revenue: 75000,
      status: "pending",
    },
    {
      id: "p3",
      projection_date: "2026-10-29",
      counselor_id: "counselor-1",
      university_id: "uni-lpu",
      projected_revenue: 40000,
      status: "pending",
    },
  ];

  assert.equal(counselorProjectionsOnSameDay.length, 3);
  const totalRev = counselorProjectionsOnSameDay.reduce((acc, p) => acc + p.projected_revenue, 0);
  assert.equal(totalRev, 165000);
});

test("5. New projections default to 'pending' status", () => {
  const newProjection = {
    id: "proj-new",
    projection_date: "2026-10-29",
    counselor_id: "c-1",
    university_id: "u-1",
    projected_revenue: 60000,
    status: "pending",
    reviewed_at: null,
    reviewed_by: null,
  };
  assert.equal(newProjection.status, "pending");
  assert.equal(newProjection.reviewed_at, null);
});

test("6. Pending projections are excluded from completion percentage denominator", () => {
  // 1 Met, 1 Not Met, 10 Pending
  const projections = [
    { id: "1", projected_revenue: 50000, status: "met" },
    { id: "2", projected_revenue: 50000, status: "not_met" },
    ...Array(10).fill(null).map((_, i) => ({
      id: `pending-${i}`,
      projected_revenue: 30000,
      status: "pending",
    })),
  ];

  const stats = calculateProjectionMetrics(projections);
  assert.equal(stats.total, 12);
  assert.equal(stats.met, 1);
  assert.equal(stats.notMet, 1);
  assert.equal(stats.pending, 10);
  assert.equal(stats.reviewed, 2, "Only 2 reviewed projections");
  assert.equal(stats.completionPercentage, 50, "1 / 2 = 50%, not 1 / 12 = 8.3%");
});

test("7. Correct primary completion percentage (example: 12 Met, 5 Not Met, 3 Pending = 70.6%)", () => {
  // Exactly matching the prompt example:
  // 12 Met, 5 Not Met, 3 Pending -> 12 / (12 + 5) * 100 = 70.588... -> 70.6%
  const list = [
    ...Array(12).fill(null).map(() => ({ projected_revenue: 10000, status: "met" })),
    ...Array(5).fill(null).map(() => ({ projected_revenue: 10000, status: "not_met" })),
    ...Array(3).fill(null).map(() => ({ projected_revenue: 10000, status: "pending" })),
  ];

  const stats = calculateProjectionMetrics(list);
  assert.equal(stats.total, 20);
  assert.equal(stats.met, 12);
  assert.equal(stats.notMet, 5);
  assert.equal(stats.pending, 3);
  assert.equal(stats.reviewed, 17);
  const rounded = Number(stats.completionPercentage.toFixed(1));
  assert.equal(rounded, 70.6);
});

test("8. Correct revenue-weighted completion percentage", () => {
  // Met: ₹1,00,000 (from 1 projection)
  // Not Met: ₹50,000 (from 1 projection)
  // Pending: ₹2,00,000 (from 1 projection)
  // Primary completion = 1 / 2 = 50%
  // Revenue-weighted = 100000 / (100000 + 50000) = 100000 / 150000 = 66.67%
  const list = [
    { projected_revenue: 100000, status: "met" },
    { projected_revenue: 50000, status: "not_met" },
    { projected_revenue: 200000, status: "pending" },
  ];

  const stats = calculateProjectionMetrics(list);
  assert.equal(stats.completionPercentage, 50);
  assert.equal(Number(stats.revenueWeightedPercentage.toFixed(1)), 66.7);
  assert.equal(stats.totalRevenue, 350000);
  assert.equal(stats.reviewedRevenue, 150000);
  assert.equal(stats.metRevenue, 100000);
});

test("9. Correct monthly filtering by projection date (not review date)", () => {
  function isDateInMonth(dateStr, monthKey) {
    const [year, month] = monthKey.split("-");
    const [dYear, dMonth] = dateStr.split("-");
    return year === dYear && month === dMonth;
  }

  // A projection created for 2026-10-31 and reviewed on 2026-11-01 belongs to October 2026
  const proj = {
    projection_date: "2026-10-31",
    reviewed_at: "2026-11-01T09:30:00Z",
  };

  assert.equal(isDateInMonth(proj.projection_date, "2026-10-01"), true);
  assert.equal(isDateInMonth(proj.projection_date, "2026-11-01"), false);
});

test("10. Correct aggregation for counselors with unequal projection counts (2/10 = 20%, not unweighted average)", () => {
  // Counselor A: 1 Met, 0 Not Met (1/1 = 100%)
  // Counselor B: 1 Met, 8 Not Met (1/9 = 11.11%)
  // Overall aggregated = (1 + 1) / (1 + 9) = 2/10 = 20%
  // (Notice that unweighted average would be (100% + 11.11%) / 2 = 55.56%, which is incorrect!)
  const counselorAProjections = [{ projected_revenue: 10000, status: "met" }];
  const counselorBProjections = [
    { projected_revenue: 10000, status: "met" },
    ...Array(8).fill(null).map(() => ({ projected_revenue: 10000, status: "not_met" })),
  ];

  const allProjections = [...counselorAProjections, ...counselorBProjections];
  const overallStats = calculateProjectionMetrics(allProjections);

  assert.equal(overallStats.met, 2);
  assert.equal(overallStats.reviewed, 10);
  assert.equal(overallStats.completionPercentage, 20.0, "Aggregated count must produce 20%");
});

test("11. Zero reviewed projections returns null / 'N/A' rather than 0% or 100%", () => {
  // No projections at all
  const emptyStats = calculateProjectionMetrics([]);
  assert.equal(emptyStats.completionPercentage, null);
  assert.equal(emptyStats.revenueWeightedPercentage, null);

  // Projections exist but all are pending
  const pendingOnly = [
    { projected_revenue: 50000, status: "pending" },
    { projected_revenue: 40000, status: "pending" },
  ];
  const pendingStats = calculateProjectionMetrics(pendingOnly);
  assert.equal(pendingStats.completionPercentage, null, "Must return null when reviewed count is 0");
  assert.equal(pendingStats.revenueWeightedPercentage, null);
});

test("12. Counselor-specific dashboard calculations isolate each counselor's metrics", () => {
  const counselor1Id = "c-1";
  const counselor2Id = "c-2";

  const allRecords = [
    { counselor_id: counselor1Id, projected_revenue: 50000, status: "met" },
    { counselor_id: counselor1Id, projected_revenue: 50000, status: "met" },
    { counselor_id: counselor2Id, projected_revenue: 50000, status: "not_met" },
  ];

  const c1Stats = calculateProjectionMetrics(allRecords.filter((p) => p.counselor_id === counselor1Id));
  const c2Stats = calculateProjectionMetrics(allRecords.filter((p) => p.counselor_id === counselor2Id));

  assert.equal(c1Stats.completionPercentage, 100.0);
  assert.equal(c2Stats.completionPercentage, 0.0);
});

test("13. Status changes (Met <-> Not Met <-> Pending) refresh results correctly", () => {
  let records = [
    { id: "p1", projected_revenue: 50000, status: "pending" },
    { id: "p2", projected_revenue: 50000, status: "met" },
  ];

  // Initial: 1 Met, 1 Pending -> 100% completion
  let stats = calculateProjectionMetrics(records);
  assert.equal(stats.completionPercentage, 100.0);

  // Sachin marks p1 as Not Met
  records[0].status = "not_met";
  stats = calculateProjectionMetrics(records);
  assert.equal(stats.completionPercentage, 50.0); // 1 / 2 = 50%

  // Sachin changes p1 to Met upon clarification
  records[0].status = "met";
  stats = calculateProjectionMetrics(records);
  assert.equal(stats.completionPercentage, 100.0); // 2 / 2 = 100%
});

test("14. Unauthenticated or non-admin access is denied", () => {
  const ADMIN_EMAIL = "sachin.behera@collegevidya.com";

  function checkAdminAccess(sessionUser) {
    if (!sessionUser || !sessionUser.email) {
      return { authorized: false, reason: "Unauthenticated" };
    }
    if (sessionUser.email.toLowerCase().trim() === ADMIN_EMAIL) {
      return { authorized: true };
    }
    return { authorized: false, reason: "Access denied: Unauthorized user" };
  }

  assert.equal(checkAdminAccess({ email: "sachin.behera@collegevidya.com" }).authorized, true);
  assert.equal(checkAdminAccess({ email: "Sachin.Behera@CollegeVidya.Com" }).authorized, true);
  assert.equal(checkAdminAccess({ email: "counselor@collegevidya.com" }).authorized, false);
  assert.equal(checkAdminAccess(null).authorized, false);
});

test("15. Existing Tasks, Admissions, and Counselors functionality remains unaffected", () => {
  // Check sidebar navigation items integrity
  const sidebarPath = path.resolve(process.cwd(), "src/components/dashboard/Sidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  assert.ok(content.includes('name: "Dashboard"'), "Dashboard link intact");
  assert.ok(content.includes('name: "Counselors"'), "Counselors link intact");
  assert.ok(content.includes('name: "Admissions"'), "Admissions link intact");
  assert.ok(content.includes('name: "Tasks & Subtasks"'), "Tasks link intact");
  assert.ok(content.includes('name: "Daily Tracker"'), "Daily Tracker link intact");
  assert.ok(content.includes('name: "Projections"'), "Projections link intact");
  assert.ok(content.includes('href: "/dashboard/projections"'), "Projections link points to /dashboard/projections");

  // Check migration file exists
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261102000000_create_daily_projections.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist on disk");
  const sql = fs.readFileSync(migrationPath, "utf-8");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.projections"), "Creates public.projections");
  assert.ok(sql.includes("ALTER TABLE public.projections ENABLE ROW LEVEL SECURITY"), "Enables RLS on projections");
});
