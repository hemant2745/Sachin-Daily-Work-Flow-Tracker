import React from "react";
import type { Metadata } from "next";
import { getComprehensiveReportsAction } from "./actions";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { computeReportDateRange } from "@/lib/reports";
import type { ComprehensiveReportData } from "@/types/reports";

export const metadata: Metadata = {
  title: "Reports & Analytics | Sachin Behera Daily Workflow",
  description:
    "Comprehensive executive reporting, monthly targets, counsellor breakdowns, university shares, and projection conversion analytics.",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { startDate, endDate } = computeReportDateRange("this_month");
  const response = await getComprehensiveReportsAction({
    dateRangeType: "this_month",
    startDate,
    endDate,
    counselorId: "ALL",
    universityName: "ALL",
  });

  const fallbackData: ComprehensiveReportData = {
    filters: {
      dateRangeType: "this_month",
      startDate,
      endDate,
      counselorId: "ALL",
      universityName: "ALL",
    },
    summary: {
      startDate,
      endDate,
      totalRevenue: 0,
      totalAdmissions: 0,
      averageAdmissionValue: 0,
      combinedMonthlyTarget: 0,
      combinedAdmissionTarget: 0,
      revenueAchievementPercentage: null,
      admissionAchievementPercentage: null,
      totalProjectedRevenue: 0,
      reviewedProjectedRevenue: 0,
      metProjectedRevenue: 0,
      projectionTotal: 0,
      projectionMet: 0,
      projectionNotMet: 0,
      projectionPending: 0,
      projectionCompletionPercentage: null,
      projectionRevenueWeightedPercentage: null,
    },
    counselors: [],
    universities: [],
    dailyTrends: [],
    generatedAt: new Date().toISOString(),
  };

  const initialData = response.success && response.data ? response.data : fallbackData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <ReportsDashboard initialData={initialData} />
    </div>
  );
}
