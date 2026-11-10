"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { CounselorWithTarget, CounselorCategory, CategoryCardSummary } from "@/types/counselor";

interface AdminPerformanceMatrixProps {
  counselors: CounselorWithTarget[];
  categorySummaries?: Record<CounselorCategory, CategoryCardSummary>;
  monthDisplay: string;
  totalDaysInMonth: number;
  elapsedDays: number;
}

export function AdminPerformanceMatrix({
  counselors,
  categorySummaries,
  monthDisplay,
  totalDaysInMonth,
  elapsedDays,
}: AdminPerformanceMatrixProps) {
  const [categoryFilter, setCategoryFilter] = useState<CounselorCategory | "ALL">("ALL");

  const categories: CounselorCategory[] = ["CDA", "SCDA", "PCA"];

  const filteredCounselors = categoryFilter === "ALL"
    ? counselors
    : counselors.filter((c) => c.category === categoryFilter);

  // Team totals
  const totalMonthlyTarget = counselors.reduce((sum, c) => sum + (c.final_target || c.effective_target || 0), 0);
  const totalVerifiedRevenue = counselors.reduce((sum, c) => sum + (c.actual_revenue || 0), 0);
  const totalExpectedRevenue = Math.round((totalMonthlyTarget / Math.max(totalDaysInMonth, 1)) * elapsedDays);
  const totalPerformanceGap = totalVerifiedRevenue - totalExpectedRevenue;
  const isTeamAhead = totalPerformanceGap >= 0;

  return (
    <div className="space-y-4">
      {/* 1. Category Performance Overview (CDA, SCDA, PCA Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-orange" />
            <h3 className="text-xs sm:text-sm font-bold text-navy-800 uppercase tracking-wider">
              Counselor Category Performance Overview
            </h3>
          </div>
          <Link
            href="/dashboard/counselors"
            className="text-[11px] font-semibold text-brand-orange hover:underline flex items-center gap-1"
          >
            <span>Manage Targets</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {categories.map((catKey) => {
            const sum = categorySummaries?.[catKey] || {
              category: catKey,
              counselorCount: counselors.filter((c) => c.category === catKey).length,
              baseTarget: catKey === "CDA" ? 800000 : catKey === "SCDA" ? 600000 : 400000,
              baseAdmissionTarget: catKey === "CDA" ? 8 : catKey === "SCDA" ? 6 : 4,
              totalTarget: counselors
                .filter((c) => c.category === catKey)
                .reduce((s, c) => s + (c.final_target || c.effective_target || 0), 0),
              totalRevenue: counselors
                .filter((c) => c.category === catKey)
                .reduce((s, c) => s + (c.actual_revenue || 0), 0),
              achievementPercentage: null,
            };

            const ach = sum.totalTarget > 0 ? (sum.totalRevenue / sum.totalTarget) * 100 : 0;
            const isSelected = categoryFilter === catKey;

            return (
              <div
                key={catKey}
                onClick={() => setCategoryFilter(isSelected ? "ALL" : catKey)}
                className={`glass-card rounded-2xl p-3.5 cursor-pointer transition-all border ${
                  isSelected
                    ? "border-brand-orange/60 bg-white/95 ring-2 ring-brand-orange/20 shadow-md"
                    : "border-white/80 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        catKey === "CDA"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : catKey === "SCDA"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {catKey}
                    </span>
                    <span className="text-xs font-bold text-navy-800">
                      {catKey === "CDA" ? "Admissions" : catKey === "SCDA" ? "Senior" : "Principal"}
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-500 font-semibold">
                    {sum.counselorCount} Counselors
                  </span>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 text-[11px]">Collections / Quota:</span>
                    <span className="font-mono font-bold text-navy-900">
                      {formatINR(sum.totalRevenue)} / {formatINR(sum.totalTarget)}
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ach >= 100 ? "bg-emerald-500" : "bg-brand-orange"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, ach))}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-gray-100">
                  <span className="text-gray-400">Base Quota: {formatINR(sum.baseTarget)}</span>
                  <span className="font-bold text-emerald-700">{ach.toFixed(1)}% Achieved</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Expected vs Actual Performance Widget & Weekly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Widget: Expected vs Actual Revenue */}
        <div className="glass-card rounded-2xl p-4 shadow-xs space-y-3 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Expected vs Actual Pace
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                Day {elapsedDays} of {totalDaysInMonth}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Calendar-day prorated expectation across active team quotas
            </p>
          </div>

          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Expected:</span>
              <span className="font-mono font-bold text-gray-700">{formatINR(totalExpectedRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-navy-800 font-bold">Actual Verified:</span>
              <span className="font-mono font-black text-emerald-700 text-sm">
                {formatINR(totalVerifiedRevenue)}
              </span>
            </div>

            {/* Performance Gap Badge */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                isTeamAhead
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                  : "bg-rose-50/80 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isTeamAhead ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                )}
                <span>Team Pace Gap:</span>
              </div>
              <span className="font-mono text-sm">
                {isTeamAhead ? `+${formatINR(totalPerformanceGap)}` : `-${formatINR(Math.abs(totalPerformanceGap))}`}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 text-center">
            {isTeamAhead
              ? "Team is pacing ahead of monthly prorated milestone."
              : "Team is pacing behind monthly prorated milestone."}
          </div>
        </div>

        {/* 4 Fixed Period Weekly Progress Summary */}
        <div className="glass-card rounded-2xl p-4 shadow-xs space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Weekly Performance Cycles
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Fixed 4-period distribution (W1: 1–7, W2: 8–14, W3: 15–21, W4: 22–End)
              </p>
            </div>
            <Link
              href="/dashboard/reports"
              className="text-[11px] font-semibold text-brand-orange hover:underline flex items-center gap-1"
            >
              <span>Weekly Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {[
              { week: "W1", label: "Week 1", period: "1st – 7th", days: 7 },
              { week: "W2", label: "Week 2", period: "8th – 14th", days: 7 },
              { week: "W3", label: "Week 3", period: "15th – 21st", days: 7 },
              { week: "W4", label: "Week 4", period: "22nd – End", days: totalDaysInMonth - 21 },
            ].map((wp) => {
              const weekTarget = Math.round((totalMonthlyTarget / totalDaysInMonth) * wp.days);
              return (
                <div
                  key={wp.week}
                  className="p-2.5 rounded-xl bg-surface-light border border-gray-100 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-800">{wp.label}</span>
                    <span className="text-[9px] font-mono text-gray-400">{wp.days}d</span>
                  </div>
                  <div className="text-[10px] text-gray-400">{wp.period}</div>
                  <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Target:</span>
                    <span className="font-mono font-bold text-navy-900">{formatINR(weekTarget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Enhanced Counselor Performance Matrix Table */}
      <div className="glass-card rounded-2xl shadow-xs overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-navy-800 tracking-tight">
              Nine Counselors Performance Matrix ({filteredCounselors.length})
            </h3>
            <p className="text-[11px] text-gray-500">
              Role-based quotas, individual additional target layering & verified achievement
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Filter:</span>
            {(["ALL", "CDA", "SCDA", "PCA"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === cat
                    ? "bg-navy-900 text-white shadow-xs"
                    : "bg-surface-light text-navy-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#061B3D]/95 text-white text-[10px] uppercase tracking-wider font-bold border-b border-white/10">
                <th className="py-2.5 px-3">Counselor</th>
                <th className="py-2.5 px-2 text-center">Category</th>
                <th className="py-2.5 px-3 text-right">Base Target</th>
                <th className="py-2.5 px-3 text-right">Additional</th>
                <th className="py-2.5 px-3 text-right">Final Target</th>
                <th className="py-2.5 px-3 text-right">Collections</th>
                <th className="py-2.5 px-2 text-center">Gap</th>
                <th className="py-2.5 px-2 text-center">Ach. %</th>
                <th className="py-2.5 px-2 text-center">Admissions</th>
                <th className="py-2.5 px-2.5 text-center">Morning Projection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs bg-white/40">
              {filteredCounselors.map((c) => {
                const baseTarget = c.base_target || c.monthly_target || 800000;
                const additional = c.additional_target || 0;
                const finalTarget = c.final_target || c.effective_target || (baseTarget + additional);
                const actual = c.actual_revenue || 0;
                const expected = Math.round((finalTarget / Math.max(totalDaysInMonth, 1)) * elapsedDays);
                const gap = actual - expected;
                const isAhead = gap >= 0;
                const ach = finalTarget > 0 ? (actual / finalTarget) * 100 : 0;
                const cat = (c.category as CounselorCategory) || "CDA";

                return (
                  <tr key={c.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-navy-800 leading-tight">{c.full_name}</div>
                      <div className="text-[10px] font-mono text-brand-orange">{c.employee_code}</div>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 rounded uppercase ${
                          cat === "CDA"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : cat === "SCDA"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {cat}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                      {formatINR(baseTarget)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono">
                      {additional > 0 ? (
                        <span className="text-brand-orange font-bold">+{formatINR(additional)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-navy-900">
                      {formatINR(finalTarget)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatINR(actual)}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isAhead
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isAhead ? `+${formatINR(gap)}` : `-${formatINR(Math.abs(gap))}`}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          ach >= 100
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ach >= 50
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ach.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center font-semibold text-navy-800">
                      {c.actual_admissions ?? 0}
                    </td>

                    <td className="py-2.5 px-2.5 text-center">
                      {c.projection_completion_percentage !== null && c.projection_completion_percentage !== undefined ? (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            c.projection_completion_percentage >= 70
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.projection_completion_percentage.toFixed(0)}% met
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
