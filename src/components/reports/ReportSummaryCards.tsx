"use client";

import React from "react";
import {
  IndianRupee,
  GraduationCap,
  TrendingUp,
  Target,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import type { OverallPerformanceSummary } from "@/types/reports";

interface ReportSummaryCardsProps {
  summary: OverallPerformanceSummary;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const getAchievementBadge = (pct: number | null) => {
    if (pct === null) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-medium">
          Target Not Set
        </span>
      );
    }
    if (pct >= 100) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> {pct}% Achieved
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 font-medium">
          {pct}% on track
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 font-medium">
        {pct}% achieved
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Total Collections */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-5 shadow-sm hover:border-navy-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Verified Collections
          </span>
          <div className="w-9 h-9 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-emerald-400">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {formatINR(summary.totalRevenue)}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-xs">
          <span className="text-gray-400">
            Target: <span className="text-gray-200 font-medium">{formatINR(summary.combinedMonthlyTarget)}</span>
          </span>
          {getAchievementBadge(summary.revenueAchievementPercentage)}
        </div>
      </div>

      {/* 2. Total Admissions */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-5 shadow-sm hover:border-navy-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Admissions
          </span>
          <div className="w-9 h-9 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-blue-400">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {summary.totalAdmissions}{" "}
          <span className="text-sm font-normal text-gray-400">students</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-xs">
          <span className="text-gray-400">
            Target: <span className="text-gray-200 font-medium">{summary.combinedAdmissionTarget} seats</span>
          </span>
          {getAchievementBadge(summary.admissionAchievementPercentage)}
        </div>
      </div>

      {/* 3. Average Ticket Size */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-5 shadow-sm hover:border-navy-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Average Ticket Size
          </span>
          <div className="w-9 h-9 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {formatINR(summary.averageAdmissionValue)}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-xs text-gray-400">
          <span>Per Verified Enrollment</span>
          <span className="text-gray-300 font-medium">Standard Portfolio</span>
        </div>
      </div>

      {/* 4. Projected Revenue */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-5 shadow-sm hover:border-navy-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Forecasted
          </span>
          <div className="w-9 h-9 rounded-lg bg-navy-800 border border-brand-orange/30 flex items-center justify-center text-brand-orange">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {formatINR(summary.totalProjectedRevenue)}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-xs text-gray-400">
          <span>
            Reviewed: <span className="text-gray-200 font-medium">{formatINR(summary.reviewedProjectedRevenue)}</span>
          </span>
          <span className="text-emerald-400 font-medium">
            Met: {formatINR(summary.metProjectedRevenue)}
          </span>
        </div>
      </div>

      {/* 5. Projection Completion Rate */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-5 shadow-sm hover:border-navy-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Forecast Accuracy (Count)
          </span>
          <div className="w-9 h-9 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-teal-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {summary.projectionCompletionPercentage !== null
            ? `${summary.projectionCompletionPercentage}%`
            : "N/A"}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-xs text-gray-400">
          <span>
            {summary.projectionMet} Met / {summary.projectionNotMet} Not Met
          </span>
          <span className="text-amber-400">
            {summary.projectionPending} Pending Review
          </span>
        </div>
      </div>

      {/* 6. Revenue-Weighted Accuracy */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-5 shadow-sm hover:border-navy-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Revenue-Weighted Accuracy
          </span>
          <div className="w-9 h-9 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-indigo-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {summary.projectionRevenueWeightedPercentage !== null
            ? `${summary.projectionRevenueWeightedPercentage}%`
            : "N/A"}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-xs text-gray-400">
          <span>Met Rev vs Reviewed Rev</span>
          <span className="text-gray-300">
            {summary.reviewedProjectedRevenue > 0
              ? `${Math.round((summary.metProjectedRevenue / summary.reviewedProjectedRevenue) * 100)}% Conversion`
              : "No Reviewed Forecasts"}
          </span>
        </div>
      </div>
    </div>
  );
}
