import type {
  Projection,
  CounselorProjectionStats,
  MonthlyProjectionOverview,
} from "@/types/projections";

/**
 * Returns current date in Asia/Kolkata (IST) in YYYY-MM-DD format.
 */
export function getTodayIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Checks whether a projection is eligible for next-day review (i.e. projection_date is prior to today IST).
 */
export function isEligibleForNextDayReview(projectionDate: string, currentIST: string = getTodayIST()): boolean {
  return projectionDate < currentIST;
}

/**
 * Checks whether a pending projection is overdue (i.e. more than 1 day past projection date).
 * E.g., if today is 2026-10-31 and projection was 2026-10-29 or earlier.
 */
export function isPendingReviewOverdue(projectionDate: string, currentIST: string = getTodayIST()): boolean {
  // If projection was 2 days or more ago
  const proj = new Date(`${projectionDate}T00:00:00Z`).getTime();
  const today = new Date(`${currentIST}T00:00:00Z`).getTime();
  const diffDays = Math.floor((today - proj) / (1000 * 60 * 60 * 24));
  return diffDays > 1;
}

/**
 * Formats a percentage value for display, returning "—" or "N/A" if null.
 */
export function formatPercentage(val: number | null | undefined, fallback: string = "N/A"): string {
  if (val === null || val === undefined || isNaN(val)) {
    return fallback;
  }
  return `${val.toFixed(1)}%`;
}

/**
 * Calculates complete monthly projection metrics for a team and individual counselors.
 * 
 * Primary Metric:
 * Projection Completion Percentage = (Projections Met / Reviewed Projections) * 100
 * 
 * Secondary Metric (Revenue-Weighted):
 * Revenue-Weighted Completion = (Sum of Met Projected Revenue / Sum of Reviewed Projected Revenue) * 100
 * 
 * Note: Pending projections are completely excluded from the denominator of both metrics.
 */
export function calculateMonthlyProjectionMetrics(
  projections: Projection[],
  counselors: Array<{ id: string; full_name: string; employee_code: string }>,
  monthKey: string
): MonthlyProjectionOverview {
  let overallTotal = 0;
  let overallMet = 0;
  let overallNotMet = 0;
  let overallPending = 0;
  let overallTotalRevenue = 0;
  let overallReviewedRevenue = 0;
  let overallMetRevenue = 0;

  // Group projections by counselor
  const counselorProjectionsMap = new Map<string, Projection[]>();
  for (const p of projections) {
    const list = counselorProjectionsMap.get(p.counselor_id) || [];
    list.push(p);
    counselorProjectionsMap.set(p.counselor_id, list);

    const rev = Number(p.projected_revenue) || 0;
    overallTotal++;
    overallTotalRevenue += rev;

    if (p.status === "met") {
      overallMet++;
      overallReviewedRevenue += rev;
      overallMetRevenue += rev;
    } else if (p.status === "not_met") {
      overallNotMet++;
      overallReviewedRevenue += rev;
    } else {
      overallPending++;
    }
  }

  const overallReviewed = overallMet + overallNotMet;
  const overallCompletionPercentage =
    overallReviewed > 0 ? (overallMet / overallReviewed) * 100 : null;
  const overallRevenueWeightedPercentage =
    overallReviewedRevenue > 0 ? (overallMetRevenue / overallReviewedRevenue) * 100 : null;

  // Calculate per-counselor statistics
  const counselorStats: CounselorProjectionStats[] = counselors.map((c) => {
    const counselorList = counselorProjectionsMap.get(c.id) || [];

    let total = 0;
    let met = 0;
    let notMet = 0;
    let pending = 0;
    let totalRevenue = 0;
    let reviewedRevenue = 0;
    let metRevenue = 0;

    for (const p of counselorList) {
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
    const completionPercentage =
      reviewed > 0 ? (met / reviewed) * 100 : null;
    const revenueWeightedPercentage =
      reviewedRevenue > 0 ? (metRevenue / reviewedRevenue) * 100 : null;

    return {
      counselor_id: c.id,
      counselor_name: c.full_name,
      employee_code: c.employee_code,
      totalProjections: total,
      metCount: met,
      notMetCount: notMet,
      pendingCount: pending,
      reviewedCount: reviewed,
      completionPercentage,
      totalProjectedRevenue: totalRevenue,
      reviewedProjectedRevenue: reviewedRevenue,
      metProjectedRevenue: metRevenue,
      revenueWeightedPercentage,
    };
  });

  return {
    monthKey,
    totalProjections: overallTotal,
    metCount: overallMet,
    notMetCount: overallNotMet,
    pendingCount: overallPending,
    reviewedCount: overallReviewed,
    completionPercentage: overallCompletionPercentage,
    revenueWeightedPercentage: overallRevenueWeightedPercentage,
    totalProjectedRevenue: overallTotalRevenue,
    reviewedProjectedRevenue: overallReviewedRevenue,
    metProjectedRevenue: overallMetRevenue,
    counselorStats,
  };
}
