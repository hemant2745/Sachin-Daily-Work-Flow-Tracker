"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/format";
import { TrendingUp, TrendingDown, Target, CheckCircle2, AlertCircle } from "lucide-react";
import type { ExpectedVsActualPoint } from "@/types/analytics";

interface ExpectedVsActualChartProps {
  data: ExpectedVsActualPoint[];
  title?: string;
  subtitle?: string;
}

export function ExpectedVsActualChart({
  data,
  title = "Expected vs Actual Revenue",
  subtitle = "Calendar-day prorated expectation compared to actual verified collections",
}: ExpectedVsActualChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-gray-500 text-xs">
        No performance records available for this period.
      </div>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.expectedRevenue, d.actualRevenue]),
    100000
  );

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
            <h3 className="text-sm font-bold text-navy-800 tracking-tight">{title}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-navy-200 border border-navy-300" />
            <span className="text-gray-600 font-medium">Expected (Prorated)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-gray-600 font-medium">Actual Verified</span>
          </div>
        </div>
      </div>

      {/* Chart Bars Grid */}
      <div className="space-y-3 pt-2">
        {data.map((item, idx) => {
          const expectedWidth = (item.expectedRevenue / maxValue) * 100;
          const actualWidth = (item.actualRevenue / maxValue) * 100;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={item.employeeCode}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-2.5 rounded-xl transition-all duration-150 ${
                isHovered ? "bg-white/90 shadow-sm ring-1 ring-black/5" : "hover:bg-white/50"
              }`}
            >
              {/* Counselor Name & Gap */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-navy-800">{item.counselorName}</span>
                  <span className="text-[10px] font-mono text-gray-500">{item.employeeCode}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      item.category === "CDA"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : item.category === "SCDA"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Gap Badge */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                      item.isAhead
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {item.isAhead ? (
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-rose-600" />
                    )}
                    <span>
                      {item.gap >= 0 ? "+" : ""}
                      {formatINR(item.gap)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Comparative Dual Bars */}
              <div className="space-y-1">
                {/* Expected Bar */}
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] text-gray-400 font-medium">Expected</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-navy-300 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, Math.min(100, expectedWidth))}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-[11px] font-mono text-gray-600">
                    {formatINR(item.expectedRevenue)}
                  </span>
                </div>

                {/* Actual Bar */}
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] text-gray-700 font-bold">Actual</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isAhead
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-gradient-to-r from-amber-500 to-rose-500"
                      }`}
                      style={{ width: `${Math.max(2, Math.min(100, actualWidth))}%` }}
                    />
                  </div>
                  <span
                    className={`w-20 text-right text-[11px] font-mono font-bold ${
                      item.isAhead ? "text-emerald-700" : "text-navy-900"
                    }`}
                  >
                    {formatINR(item.actualRevenue)}
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
