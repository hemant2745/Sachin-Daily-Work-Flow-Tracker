"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/format";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type { PerformanceGapPoint } from "@/types/analytics";

interface PerformanceGapChartProps {
  data: PerformanceGapPoint[];
  title?: string;
  subtitle?: string;
}

export function PerformanceGapChart({
  data,
  title = "Performance Gap Analysis",
  subtitle = "Actual Performance minus Expected Performance (Ahead vs Behind Target)",
}: PerformanceGapChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-gray-500 text-xs">
        No performance gap records available for this selection.
      </div>
    );
  }

  // Find max absolute gap for centering scale around zero
  const maxAbsGap = Math.max(
    ...data.map((d) => Math.abs(d.gap)),
    50000
  );

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <h3 className="text-sm font-bold text-navy-800 tracking-tight">{title}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-gray-600 font-medium">Ahead of Expected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500" />
            <span className="text-gray-600 font-medium">Behind Expected</span>
          </div>
        </div>
      </div>

      {/* Diverging Bar Chart */}
      <div className="space-y-2.5 pt-1">
        {data.map((item) => {
          const isAhead = item.isAhead;
          const barWidth = (Math.abs(item.gap) / maxAbsGap) * 50; // max 50% width from center
          const isHovered = hoveredId === item.counselorId;

          return (
            <div
              key={item.counselorId}
              onMouseEnter={() => setHoveredId(item.counselorId)}
              onMouseLeave={() => setHoveredId(null)}
              className={`p-2 rounded-xl transition-all duration-150 ${
                isHovered ? "bg-white/90 shadow-sm ring-1 ring-black/5" : "hover:bg-white/50"
              }`}
            >
              {/* Counselor row & numeric gap */}
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy-800">{item.counselorName}</span>
                  <span className="font-mono text-[10px] text-gray-400">{item.employeeCode}</span>
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

                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isAhead ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {isAhead ? `+${formatINR(item.gap)}` : `-${formatINR(Math.abs(item.gap))}`}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ({isAhead ? "ahead" : "behind"})
                  </span>
                </div>
              </div>

              {/* Zero-Centered Diverging Bar Container */}
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden flex">
                {/* Left side: Behind (Negative) */}
                <div className="w-1/2 flex justify-end items-center pr-0.5">
                  {!isAhead && (
                    <div
                      className="h-2.5 rounded-l-full bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-300"
                      style={{ width: `${Math.max(4, barWidth * 2)}%` }}
                    />
                  )}
                </div>

                {/* Center Baseline Indicator */}
                <div className="w-0.5 bg-gray-400 h-full z-10" />

                {/* Right side: Ahead (Positive) */}
                <div className="w-1/2 flex justify-start items-center pl-0.5">
                  {isAhead && (
                    <div
                      className="h-2.5 rounded-r-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${Math.max(4, barWidth * 2)}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Underlying Revenue Reference */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 px-1">
                <span>Actual: {formatINR(item.actualRevenue)}</span>
                <span>Expected: {formatINR(item.expectedRevenue)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
