"use client";

import React from "react";
import { formatINR } from "@/lib/format";
import { Target, TrendingUp, TrendingDown, DollarSign, Award, Clock } from "lucide-react";
import type { CounselorMonthlyPerformance } from "@/types/analytics";
import type { CounselorCategory } from "@/types/counselor";

interface CounselorPerformanceOverviewProps {
  performance: CounselorMonthlyPerformance;
  counselorName: string;
  category: CounselorCategory;
  monthName: string;
}

export function CounselorPerformanceOverview({
  performance,
  counselorName,
  category,
  monthName,
}: CounselorPerformanceOverviewProps) {
  const isAhead = performance.isAhead;
  const achVal = performance.achievementPercentage ?? 0;
  const progressWidth = Math.min(
    100,
    Math.max(2, (performance.actualRevenue / Math.max(performance.monthlyTarget, 1)) * 100)
  );

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-navy-800 tracking-tight">
              {counselorName} &bull; Monthly Performance
            </h2>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full uppercase ${
                category === "CDA"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : category === "SCDA"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-purple-50 text-purple-700 border border-purple-200"
              }`}
            >
              {category}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Active reporting cycle for <span className="font-semibold text-navy-800">{monthName}</span>
          </p>
        </div>

        {/* Ahead / Behind Badge */}
        <div className="self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono ${
              isAhead
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {isAhead ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>
              Performance Gap: {isAhead ? "+" : ""}
              {formatINR(performance.performanceGap)} ({isAhead ? "Ahead" : "Behind"})
            </span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Monthly Achievement Progress</span>
          <span className="font-bold text-navy-900">{achVal.toFixed(1)}% Completed</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              achVal >= 100
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-brand-orange to-amber-500"
            }`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* 6 Essential Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Category Base Target */}
        <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Base Target
          </span>
          <div className="text-sm font-black font-mono text-navy-800 mt-0.5">
            {formatINR(performance.baseTarget)}
          </div>
          <span className="text-[9px] text-gray-400">Category quota</span>
        </div>

        {/* Additional Target */}
        <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Additional Target
          </span>
          <div
            className={`text-sm font-black font-mono mt-0.5 ${
              performance.additionalTarget > 0 ? "text-brand-orange" : "text-gray-400"
            }`}
          >
            {performance.additionalTarget > 0 ? `+${formatINR(performance.additionalTarget)}` : "₹0"}
          </div>
          <span className="text-[9px] text-gray-400">Individual adjustment</span>
        </div>

        {/* Final Monthly Target */}
        <div className="p-2.5 rounded-xl bg-navy-50/60 border border-navy-100">
          <span className="text-[10px] text-navy-800 font-bold uppercase tracking-wider block">
            Final Target
          </span>
          <div className="text-sm font-black font-mono text-navy-900 mt-0.5">
            {formatINR(performance.monthlyTarget)}
          </div>
          <span className="text-[9px] text-navy-600 font-medium">Base + Additional</span>
        </div>

        {/* Current Verified Achievement */}
        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
            Verified Collections
          </span>
          <div className="text-sm font-black font-mono text-emerald-700 mt-0.5">
            {formatINR(performance.actualRevenue)}
          </div>
          <span className="text-[9px] text-emerald-600 font-medium">
            {performance.actualAdmissions} admissions
          </span>
        </div>

        {/* Remaining Target */}
        <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Remaining Quota
          </span>
          <div className="text-sm font-black font-mono text-navy-800 mt-0.5">
            {formatINR(performance.remainingTarget)}
          </div>
          <span className="text-[9px] text-gray-400">To 100% target</span>
        </div>

        {/* Calendar-Day Expected */}
        <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Expected Today
          </span>
          <div className="text-sm font-black font-mono text-gray-700 mt-0.5">
            {formatINR(performance.expectedRevenue)}
          </div>
          <span className="text-[9px] text-gray-400">Prorated expectation</span>
        </div>
      </div>
    </div>
  );
}
