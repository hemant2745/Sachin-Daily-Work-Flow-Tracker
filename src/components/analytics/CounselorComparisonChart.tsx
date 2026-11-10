"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/format";
import { Users, Target, DollarSign, Award, ChevronRight } from "lucide-react";
import type { CounselorComparisonPoint } from "@/types/analytics";

interface CounselorComparisonChartProps {
  counselors: CounselorComparisonPoint[];
  title?: string;
  subtitle?: string;
}

export function CounselorComparisonChart({
  counselors,
  title = "Nine Counselors Comprehensive Comparison",
  subtitle = "Comparative breakdown of monthly target, actual verified collection, achievement % and remaining quota",
}: CounselorComparisonChartProps) {
  const [selectedSort, setSelectedSort] = useState<"ACHIEVEMENT" | "COLLECTION" | "TARGET">("ACHIEVEMENT");

  const sortedCounselors = [...counselors].sort((a, b) => {
    if (selectedSort === "COLLECTION") {
      return b.actualRevenue - a.actualRevenue;
    } else if (selectedSort === "TARGET") {
      return b.monthlyTarget - a.monthlyTarget;
    } else {
      return (b.achievementPercentage || 0) - (a.achievementPercentage || 0);
    }
  });

  const maxTarget = Math.max(...counselors.map((c) => c.monthlyTarget), 800000);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-navy-800 tracking-tight">{title}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-gray-400 font-semibold uppercase">Sort:</span>
          {(
            [
              { key: "ACHIEVEMENT", label: "Ach. %" },
              { key: "COLLECTION", label: "Collection" },
              { key: "TARGET", label: "Target" },
            ] as const
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => setSelectedSort(s.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSort === s.key
                  ? "bg-navy-900 text-white shadow-xs"
                  : "bg-surface-light text-navy-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Counselor Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedCounselors.map((c, index) => {
          const achVal = c.achievementPercentage || 0;
          const progressWidth = Math.min(100, Math.max(2, (c.actualRevenue / Math.max(c.monthlyTarget, 1)) * 100));

          return (
            <div
              key={c.counselorId}
              className="glass-card rounded-xl p-3.5 border border-white/80 hover:border-brand-orange/40 hover:shadow-sm transition-all space-y-2.5"
            >
              {/* Header: Rank, Name, Category */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-xs">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-800 leading-tight">{c.counselorName}</h4>
                    <span className="text-[10px] font-mono text-gray-400">{c.employeeCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      c.category === "CDA"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : c.category === "SCDA"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {c.category}
                  </span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md ${
                      achVal >= 100
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : achVal >= 50
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-gray-100 text-navy-800"
                    }`}
                  >
                    {achVal.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      achVal >= 100
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-brand-orange to-amber-500"
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>

              {/* Four Key Comparison Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                {/* Monthly Target */}
                <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block">Monthly Target</span>
                  <span className="font-mono font-bold text-navy-800">{formatINR(c.monthlyTarget)}</span>
                </div>

                {/* Actual Collection */}
                <div className="p-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 block">Actual Collection</span>
                  <span className="font-mono font-bold text-emerald-800">{formatINR(c.actualRevenue)}</span>
                </div>

                {/* Remaining Target */}
                <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block">Remaining Quota</span>
                  <span className="font-mono font-semibold text-gray-700">{formatINR(c.remainingTarget)}</span>
                </div>

                {/* Admissions Count */}
                <div className="p-1.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <span className="text-[10px] text-blue-700 block">Admissions</span>
                  <span className="font-mono font-bold text-blue-800">{c.admissionCount} enrolled</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
