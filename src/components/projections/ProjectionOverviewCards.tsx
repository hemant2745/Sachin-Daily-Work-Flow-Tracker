"use client";

import React from "react";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Percent,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { MonthlyProjectionOverview } from "@/types/projections";
import { formatINR, formatMonthDisplay, getMonthOptions } from "@/lib/format";
import { formatPercentage } from "@/lib/projections";

interface ProjectionOverviewCardsProps {
  overview: MonthlyProjectionOverview | null;
  selectedMonth: string;
  onMonthChange: (newMonth: string) => void;
}

export function ProjectionOverviewCards({
  overview,
  selectedMonth,
  onMonthChange,
}: ProjectionOverviewCardsProps) {
  const monthOptions = getMonthOptions();

  const totalProjections = overview?.totalProjections ?? 0;
  const metCount = overview?.metCount ?? 0;
  const notMetCount = overview?.notMetCount ?? 0;
  const pendingCount = overview?.pendingCount ?? 0;
  const reviewedCount = overview?.reviewedCount ?? 0;

  const completionPctDisplay = formatPercentage(overview?.completionPercentage);
  const revenueWeightedPctDisplay = formatPercentage(overview?.revenueWeightedPercentage);

  const totalProjectedRevenue = overview?.totalProjectedRevenue ?? 0;
  const reviewedProjectedRevenue = overview?.reviewedProjectedRevenue ?? 0;

  return (
    <div className="space-y-4">
      {/* Top Banner with Month Selector */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 border border-blue-400/20 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Daily Revenue Forecasting & Review</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center space-x-2">
            <span>Projection Performance Overview</span>
          </h2>
          <p className="text-xs sm:text-sm text-blue-200/80 mt-1">
            Tracking counselor revenue targets, next-day confirmations, and monthly completion ratios.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
          <Calendar className="w-4 h-4 text-blue-300" />
          <span className="text-xs text-blue-200 font-medium">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer border-none"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-gray-900 bg-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Key Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Primary Metric: Completion Percentage */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
            <span>Completion Rate</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-950">
            {completionPctDisplay}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {reviewedCount > 0
              ? `${metCount} Met of ${reviewedCount} reviewed projections`
              : "No reviewed projections yet"}
          </p>
          <div className="mt-2.5 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overview?.completionPercentage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Secondary Metric: Revenue-Weighted Percentage */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
            <span>Revenue-Weighted</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-950">
            {revenueWeightedPctDisplay}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Met revenue vs total reviewed projected revenue
          </p>
          <div className="mt-2.5 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overview?.revenueWeightedPercentage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Total Projected Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            <span>Total Projected</span>
            <span className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {formatINR(totalProjectedRevenue)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Reviewed: {formatINR(reviewedProjectedRevenue)}
          </p>
        </div>

        {/* Pending Reviews Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
            <span>Pending Reviews</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">
            {pendingCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {totalProjections} total projections logged in {formatMonthDisplay(selectedMonth)}
          </p>
        </div>
      </div>

      {/* Mini status break-down row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2 flex items-center justify-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-emerald-800">{metCount} Met</span>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2 flex items-center justify-center space-x-2">
          <XCircle className="w-4 h-4 text-rose-600" />
          <span className="font-semibold text-rose-800">{notMetCount} Not Met</span>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2 flex items-center justify-center space-x-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-amber-800">{pendingCount} Awaiting Review</span>
        </div>
      </div>
    </div>
  );
}
