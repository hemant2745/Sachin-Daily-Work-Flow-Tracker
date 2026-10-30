"use client";

import React, { useState, useMemo } from "react";
import { formatINR } from "@/lib/format";
import { TrendingUp, Calendar, AlertCircle } from "lucide-react";

interface AdmissionItem {
  admission_date: string;
  amount_collected: number;
}

interface TeamPerformanceChartProps {
  admissions: AdmissionItem[];
  monthlyTarget: number;
  monthKey: string;
}

export function TeamPerformanceChart({
  admissions,
  monthlyTarget,
  monthKey,
}: TeamPerformanceChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group admissions by date in the month
  const chartData = useMemo(() => {
    const [yearStr, monthStr] = monthKey.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === year && today.getMonth() + 1 === month;
    const currentDay = isCurrentMonth ? Math.min(daysInMonth, today.getDate()) : daysInMonth;

    // Daily buckets
    const dailyRevenueMap: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyRevenueMap[d] = 0;
    }

    admissions.forEach((a) => {
      if (a.admission_date) {
        const d = parseInt(a.admission_date.split("-")[2], 10);
        if (d >= 1 && d <= daysInMonth) {
          dailyRevenueMap[d] = (dailyRevenueMap[d] || 0) + (Number(a.amount_collected) || 0);
        }
      }
    });

    let cumulative = 0;
    const points: Array<{
      day: number;
      dateStr: string;
      daily: number;
      cumulative: number;
      targetProrated: number;
    }> = [];

    for (let d = 1; d <= currentDay; d++) {
      cumulative += dailyRevenueMap[d];
      const targetProrated = Math.round((monthlyTarget / daysInMonth) * d);
      points.push({
        day: d,
        dateStr: `${monthStr}/${String(d).padStart(2, "0")}`,
        daily: dailyRevenueMap[d],
        cumulative,
        targetProrated,
      });
    }

    if (points.length === 0) {
      points.push({
        day: 1,
        dateStr: `${monthStr}/01`,
        daily: 0,
        cumulative: 0,
        targetProrated: Math.round(monthlyTarget / daysInMonth),
      });
    }

    return points;
  }, [admissions, monthlyTarget, monthKey]);

  // Compute scale boundaries
  const maxVal = useMemo(() => {
    let m = monthlyTarget;
    chartData.forEach((p) => {
      if (p.cumulative > m) m = p.cumulative;
      if (p.targetProrated > m) m = p.targetProrated;
    });
    return Math.max(m * 1.15, 100000);
  }, [chartData, monthlyTarget]);

  // Chart coordinates
  const svgWidth = 650;
  const svgHeight = 260;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = svgWidth - paddingLeft - paddingRight;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  const pointsCoordinates = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((d, i) => {
      const x =
        paddingLeft +
        (chartData.length > 1
          ? (i / (chartData.length - 1)) * innerWidth
          : innerWidth / 2);
      const yRevenue =
        paddingTop + innerHeight - (d.cumulative / maxVal) * innerHeight;
      const yTarget =
        paddingTop + innerHeight - (d.targetProrated / maxVal) * innerHeight;
      return { ...d, x, yRevenue, yTarget };
    });
  }, [chartData, maxVal, innerWidth, innerHeight]);

  const revenuePathD = useMemo(() => {
    if (pointsCoordinates.length === 0) return "";
    return pointsCoordinates.reduce(
      (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yRevenue.toFixed(1)}`,
      ""
    );
  }, [pointsCoordinates]);

  const revenueAreaD = useMemo(() => {
    if (pointsCoordinates.length === 0) return "";
    const firstX = pointsCoordinates[0].x.toFixed(1);
    const lastX = pointsCoordinates[pointsCoordinates.length - 1].x.toFixed(1);
    const baseY = (paddingTop + innerHeight).toFixed(1);
    return `${revenuePathD} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [revenuePathD, pointsCoordinates, innerHeight]);

  const targetPathD = useMemo(() => {
    if (pointsCoordinates.length === 0) return "";
    return pointsCoordinates.reduce(
      (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yTarget.toFixed(1)}`,
      ""
    );
  }, [pointsCoordinates]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: maxVal * pct,
    y: paddingTop + innerHeight - pct * innerHeight,
  }));

  const activePoint = hoveredIndex !== null ? pointsCoordinates[hoveredIndex] : null;

  return (
    <div className="bg-white border border-[#DFEAFE] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[380px]">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-3 border-b border-[#DFEAFE]">
          <div>
            <h4 className="text-base font-extrabold text-[#0A2454]">Team Performance Trend</h4>
            <p className="text-xs text-[#61789E] mt-0.5">
              Month-to-date collections pace versus prorated team quota.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-[#0866F5]">
              <span className="w-3 h-3 rounded-full bg-[#0866F5] shadow-xs" />
              Revenue Achieved
            </span>
            <span className="flex items-center gap-1.5 text-[#FF8A00]">
              <span className="w-3 h-1.5 rounded-full bg-[#FF8A00] shadow-xs" />
              Monthly Target
            </span>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative w-full overflow-hidden mt-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
          >
            <defs>
              <linearGradient id="revenue-area-gradient-v2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0866F5" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#0866F5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Horizontal Lines & Y-Axis Labels */}
            {yTicks.map((tick, idx) => (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={tick.y}
                  x2={svgWidth - paddingRight}
                  y2={tick.y}
                  stroke="#DFEAFE"
                  strokeDasharray={idx === 0 ? "none" : "3 3"}
                  strokeWidth="1.2"
                />
                <text
                  x={paddingLeft - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="600"
                  fill="#61789E"
                  fontFamily="sans-serif"
                >
                  ₹{(tick.val / 100000).toFixed(1)}L
                </text>
              </g>
            ))}

            {/* Target Line (Orange Dashed) */}
            <path
              d={targetPathD}
              fill="none"
              stroke="#FF8A00"
              strokeWidth="2.5"
              strokeDasharray="5 5"
            />

            {/* Revenue Area Fill */}
            <path d={revenueAreaD} fill="url(#revenue-area-gradient-v2)" />

            {/* Revenue Line (Blue Solid) */}
            <path
              d={revenuePathD}
              fill="none"
              stroke="#0866F5"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points & Hover Targets */}
            {pointsCoordinates.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.yRevenue}
                  r={hoveredIndex === i ? 6 : 3.5}
                  fill={hoveredIndex === i ? "#FF8A00" : "#0866F5"}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />
                {/* Invisible hover hotspot */}
                <rect
                  x={p.x - 12}
                  y={paddingTop}
                  width="24"
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            ))}

            {/* X-Axis Date Labels */}
            {pointsCoordinates
              .filter((_, idx, arr) => {
                if (arr.length <= 10) return true;
                const step = Math.ceil(arr.length / 6);
                return idx % step === 0 || idx === arr.length - 1;
              })
              .map((p, idx) => (
                <text
                  key={idx}
                  x={p.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#61789E"
                  fontFamily="sans-serif"
                >
                  {p.dateStr}
                </text>
              ))}
          </svg>

          {/* Active Tooltip */}
          {activePoint && (
            <div
              className="absolute pointer-events-none bg-[#001A3D] text-white p-3 rounded-2xl shadow-2xl text-xs z-20 border border-white/20 animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: `${(activePoint.x / svgWidth) * 100}%`,
                top: "10%",
                transform: "translateX(-50%)",
              }}
            >
              <div className="font-bold text-cyan-200 border-b border-white/15 pb-1 mb-1.5 flex items-center justify-between gap-4">
                <span>Day {activePoint.day}</span>
                <span>{activePoint.dateStr}</span>
              </div>
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-blue-200">Revenue Achieved:</span>
                <span className="font-extrabold text-white">{formatINR(activePoint.cumulative)}</span>
              </div>
              <div className="flex justify-between gap-4 text-xs mt-0.5">
                <span className="text-blue-200">Daily Added:</span>
                <span className="font-bold text-emerald-400">+{formatINR(activePoint.daily)}</span>
              </div>
              <div className="flex justify-between gap-4 text-xs mt-0.5">
                <span className="text-blue-200">Prorated Target:</span>
                <span className="font-bold text-[#FFA41C]">{formatINR(activePoint.targetProrated)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-[#DFEAFE] flex items-center justify-between text-xs text-[#61789E]">
        <span className="font-medium">Active Enrolled Admissions: <strong className="text-[#0A2454]">{admissions.length}</strong></span>
        <span className="font-bold text-[#0866F5] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          Monthly Quota: {formatINR(monthlyTarget)}
        </span>
      </div>
    </div>
  );
}
