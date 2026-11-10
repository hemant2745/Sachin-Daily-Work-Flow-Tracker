"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/format";
import { Users, TrendingUp, TrendingDown, Target, Award } from "lucide-react";
import type { CounselorMonthlyPerformance, WeekIdentifier } from "@/types/analytics";

interface WeeklyPerformanceTableProps {
  performances: CounselorMonthlyPerformance[];
  selectedWeekFilter?: WeekIdentifier | "ALL";
}

export function WeeklyPerformanceTable({
  performances,
  selectedWeekFilter = "ALL",
}: WeeklyPerformanceTableProps) {
  const [search, setSearch] = useState("");

  const filtered = performances.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.counselorName.toLowerCase().includes(q) ||
      p.employeeCode.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="glass-card rounded-2xl shadow-xs overflow-hidden space-y-3 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm font-bold text-navy-800 tracking-tight">
            Weekly Breakdown Table
          </h3>
          <p className="text-[11px] text-gray-500">
            Fixed 4-period distribution (Week 1: 1–7, Week 2: 8–14, Week 3: 15–21, Week 4: 22–End)
          </p>
        </div>

        <div className="max-w-xs w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search counselor in table..."
            className="w-full px-3 py-1.5 text-xs bg-surface-light border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#061B3D]/95 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-bold border-b border-white/10">
              <th className="py-2 px-3">Counselor</th>
              <th className="py-2 px-2 text-center">Cat.</th>
              <th className="py-2 px-2 text-right">Target</th>
              {(["W1", "W2", "W3", "W4"] as WeekIdentifier[]).map((w, idx) => {
                const isSelected = selectedWeekFilter === "ALL" || selectedWeekFilter === w;
                if (!isSelected) return null;
                const labels = ["W1 (1-7)", "W2 (8-14)", "W3 (15-21)", "W4 (22-End)"];
                return (
                  <th key={w} className="py-2 px-2.5 text-right">
                    {labels[idx]}
                  </th>
                );
              })}
              <th className="py-2 px-3 text-right">Actual Rev.</th>
              <th className="py-2 px-2.5 text-right">Expected</th>
              <th className="py-2 px-2.5 text-center">Gap</th>
              <th className="py-2 px-2.5 text-right">Remaining</th>
              <th className="py-2 px-2 text-center">Ach. %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/70 text-xs bg-white/40">
            {filtered.map((p) => {
              const ach = p.achievementPercentage;
              return (
                <tr key={p.counselorId} className="hover:bg-white/80 transition-colors">
                  {/* Counselor */}
                  <td className="py-2 px-3">
                    <div className="font-bold text-navy-800 leading-tight">{p.counselorName}</div>
                    <div className="text-[10px] font-mono text-gray-400">{p.employeeCode}</div>
                  </td>

                  {/* Category */}
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        p.category === "CDA"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : p.category === "SCDA"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {p.category}
                    </span>
                  </td>

                  {/* Monthly Target */}
                  <td className="py-2 px-2 text-right font-mono text-navy-800">
                    {formatINR(p.monthlyTarget)}
                  </td>

                  {/* Weeks columns */}
                  {(["W1", "W2", "W3", "W4"] as WeekIdentifier[]).map((w) => {
                    const isSelected = selectedWeekFilter === "ALL" || selectedWeekFilter === w;
                    if (!isSelected) return null;
                    const metrics = p.weeks[w];
                    const weekAch = metrics?.achievementPercentage;

                    return (
                      <td key={w} className="py-2 px-2.5 text-right font-mono">
                        <div className="text-xs font-bold text-navy-900">
                          {formatINR(metrics?.actualRevenue || 0)}
                        </div>
                        <div className="text-[9px] text-gray-400">
                          {weekAch !== null ? `${weekAch.toFixed(0)}%` : "0%"} &bull; {metrics?.actualAdmissions || 0} adm
                        </div>
                      </td>
                    );
                  })}

                  {/* Actual Revenue */}
                  <td className="py-2 px-3 text-right font-mono font-bold text-navy-900">
                    {formatINR(p.actualRevenue)}
                  </td>

                  {/* Expected Revenue */}
                  <td className="py-2 px-2.5 text-right font-mono text-gray-600">
                    {formatINR(p.expectedRevenue)}
                  </td>

                  {/* Performance Gap */}
                  <td className="py-2 px-2.5 text-center">
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        p.isAhead
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {p.isAhead ? "+" : ""}
                      {formatINR(p.performanceGap)}
                    </span>
                  </td>

                  {/* Remaining Target */}
                  <td className="py-2 px-2.5 text-right font-mono text-gray-500">
                    {formatINR(p.remainingTarget)}
                  </td>

                  {/* Ach % */}
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        (ach || 0) >= 100
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : (ach || 0) >= 50
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ach !== null ? `${ach.toFixed(1)}%` : "0%"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
