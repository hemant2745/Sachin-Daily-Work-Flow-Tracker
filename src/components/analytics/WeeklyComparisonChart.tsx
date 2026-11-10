"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/format";
import { Calendar, TrendingUp, CheckCircle2, Award } from "lucide-react";
import type { WeeklyComparisonPoint } from "@/types/analytics";

interface WeeklyComparisonChartProps {
  weeks: WeeklyComparisonPoint[];
  title?: string;
  subtitle?: string;
}

export function WeeklyComparisonChart({
  weeks,
  title = "Weekly Performance Comparison",
  subtitle = "Week 1 (1st–7th), Week 2 (8th–14th), Week 3 (15th–21st) & Week 4 (22nd–End of Month)",
}: WeeklyComparisonChartProps) {
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);

  const maxVal = Math.max(
    ...weeks.flatMap((w) => [w.expectedRevenue, w.actualRevenue]),
    50000
  );

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h3 className="text-sm font-bold text-navy-800 tracking-tight">{title}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-navy-200" />
            <span className="text-gray-600 font-medium">Expected Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-orange" />
            <span className="text-gray-600 font-medium">Actual Verified</span>
          </div>
        </div>
      </div>

      {/* 4 Fixed Period Cards / Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {weeks.map((w) => {
          const expectedHeight = (w.expectedRevenue / maxVal) * 100;
          const actualHeight = (w.actualRevenue / maxVal) * 100;
          const isHovered = hoveredWeek === w.week;
          const achievement = w.achievementPercentage;

          return (
            <div
              key={w.week}
              onMouseEnter={() => setHoveredWeek(w.week)}
              onMouseLeave={() => setHoveredWeek(null)}
              className={`glass-card rounded-xl p-3.5 flex flex-col justify-between transition-all duration-150 border ${
                isHovered
                  ? "border-brand-orange/40 bg-white/95 shadow-md -translate-y-0.5"
                  : "border-white/80 hover:shadow-sm"
              }`}
            >
              {/* Card Header: Week Title & Period */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-navy-800 uppercase tracking-wider">
                    {w.weekName}
                  </span>
                  {achievement !== null && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        achievement >= 100
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : achievement >= 50
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {achievement.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{w.periodLabel}</div>
              </div>

              {/* Bar Visual Presentation */}
              <div className="my-4 h-28 flex items-end justify-center gap-3 bg-gray-50/60 rounded-xl p-2 border border-gray-100">
                {/* Expected Bar */}
                <div className="w-8 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-navy-200 hover:bg-navy-300 rounded-t-md transition-all duration-300"
                    style={{ height: `${Math.max(6, expectedHeight)}%` }}
                    title={`Expected: ${formatINR(w.expectedRevenue)}`}
                  />
                  <span className="text-[9px] text-gray-400 font-medium mt-1">Exp</span>
                </div>

                {/* Actual Bar */}
                <div className="w-8 flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      (achievement || 0) >= 100
                        ? "bg-emerald-500"
                        : "bg-gradient-to-t from-brand-orange to-amber-500"
                    }`}
                    style={{ height: `${Math.max(6, actualHeight)}%` }}
                    title={`Actual: ${formatINR(w.actualRevenue)} (${w.actualAdmissions} admissions)`}
                  />
                  <span className="text-[9px] text-gray-700 font-bold mt-1">Act</span>
                </div>
              </div>

              {/* Financial Metrics Summary */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Expected:</span>
                  <span className="font-mono font-semibold text-gray-700">
                    {formatINR(w.expectedRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Actual:</span>
                  <span className="font-mono font-bold text-navy-900">
                    {formatINR(w.actualRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                  <span>Admissions:</span>
                  <span className="font-semibold text-gray-700">{w.actualAdmissions}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
