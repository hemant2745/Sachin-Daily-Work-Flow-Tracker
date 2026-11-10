"use client";

import React from "react";
import { formatINR } from "@/lib/format";
import { Calendar, TrendingUp, TrendingDown, Target, Award } from "lucide-react";
import type { CounselorWeeklyMetrics, WeekIdentifier } from "@/types/analytics";

interface CounselorWeeklyCardsProps {
  weeks: Record<WeekIdentifier, CounselorWeeklyMetrics>;
}

export function CounselorWeeklyCards({ weeks }: CounselorWeeklyCardsProps) {
  const weekKeys: WeekIdentifier[] = ["W1", "W2", "W3", "W4"];
  const periodRanges = [
    "1st – 7th",
    "8th – 14th",
    "15th – 21st",
    "22nd – End of Month",
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-navy-800 uppercase tracking-wider">
          Four Weekly Reporting Cycles
        </h3>
        <span className="text-[11px] text-gray-500">
          Fixed 4-period monthly target proration
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {weekKeys.map((wKey, idx) => {
          const w = weeks[wKey] || {
            week: wKey,
            weekName: `Week ${idx + 1}`,
            startDate: "",
            endDate: "",
            daysInPeriod: 7,
            weeklyTarget: 0,
            expectedRevenue: 0,
            actualRevenue: 0,
            actualAdmissions: 0,
            achievementPercentage: null,
            performanceGap: 0,
            isAhead: false,
          };

          const isAhead = w.isAhead;
          const achVal = w.achievementPercentage;

          return (
            <div
              key={wKey}
              className="glass-card rounded-2xl p-4 border border-white/80 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              {/* Card Header: Week Name, Period & Gap Badge */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-navy-800 uppercase tracking-wider">
                      {w.weekName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ({w.daysInPeriod}d)
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isAhead
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {isAhead ? "+" : ""}
                    {formatINR(w.performanceGap)}
                  </span>
                </div>

                <div className="text-[10px] text-gray-500 mt-0.5">
                  {periodRanges[idx]}
                </div>
              </div>

              {/* Verified Collection & Achievement */}
              <div className="p-2.5 rounded-xl bg-white/70 border border-gray-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Actual Collections</span>
                  <span className="font-mono font-black text-navy-900 text-sm">
                    {formatINR(w.actualRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>Enrolled Admissions</span>
                  <span className="font-semibold text-gray-800">{w.actualAdmissions}</span>
                </div>
              </div>

              {/* Target & Expected Metrics */}
              <div className="space-y-1 pt-1 border-t border-gray-100 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Weekly Target:</span>
                  <span className="font-mono font-semibold text-gray-700">
                    {formatINR(w.weeklyTarget)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Expected:</span>
                  <span className="font-mono text-gray-600">
                    {formatINR(w.expectedRevenue)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-700 font-medium">Ach. %:</span>
                  <span
                    className={`font-bold ${
                      (achVal || 0) >= 100
                        ? "text-emerald-700"
                        : (achVal || 0) >= 50
                        ? "text-blue-700"
                        : "text-navy-800"
                    }`}
                  >
                    {achVal !== null ? `${achVal.toFixed(1)}%` : "0%"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
