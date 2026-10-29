"use client";

import React from "react";
import { User, Percent, TrendingUp, CheckCircle2, XCircle, Clock, IndianRupee } from "lucide-react";
import type { CounselorProjectionStats } from "@/types/projections";
import { formatPercentage } from "@/lib/projections";
import { formatINR } from "@/lib/format";

interface CounselorProjectionSummaryProps {
  counselorStats: CounselorProjectionStats[];
  onSelectCounselor?: (counselorId: string) => void;
}

export function CounselorProjectionSummary({
  counselorStats,
  onSelectCounselor,
}: CounselorProjectionSummaryProps) {
  if (counselorStats.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        No counsellor data available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Counsellor Monthly Projection Breakdown</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Individual completion percentages and revenue-weighted ratios for each team counsellor.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
            <tr>
              <th scope="col" className="px-5 py-3 text-left">Counsellor</th>
              <th scope="col" className="px-4 py-3 text-center">Completion %</th>
              <th scope="col" className="px-4 py-3 text-center">Revenue-Weighted %</th>
              <th scope="col" className="px-4 py-3 text-center">Met</th>
              <th scope="col" className="px-4 py-3 text-center">Not Met</th>
              <th scope="col" className="px-4 py-3 text-center">Pending</th>
              <th scope="col" className="px-4 py-3 text-center">Total</th>
              <th scope="col" className="px-5 py-3 text-right">Projected Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {counselorStats.map((c) => {
              const hasReviewed = c.reviewedCount > 0;
              const completionDisplay = formatPercentage(c.completionPercentage);
              const weightedDisplay = formatPercentage(c.revenueWeightedPercentage);

              return (
                <tr
                  key={c.counselor_id}
                  onClick={() => onSelectCounselor?.(c.counselor_id)}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    onSelectCounselor ? "cursor-pointer" : ""
                  }`}
                >
                  {/* Counsellor */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-gray-900 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{c.counselor_name}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 ml-4 font-mono">
                      {c.employee_code}
                    </div>
                  </td>

                  {/* Primary Completion Percentage */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                        !hasReviewed
                          ? "bg-gray-100 text-gray-500"
                          : (c.completionPercentage || 0) >= 70
                          ? "bg-emerald-100 text-emerald-800"
                          : (c.completionPercentage || 0) >= 40
                          ? "bg-blue-100 text-blue-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {completionDisplay}
                    </span>
                  </td>

                  {/* Revenue-Weighted Percentage */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-center">
                    <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {weightedDisplay}
                    </span>
                  </td>

                  {/* Met Count */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-center font-bold text-emerald-700">
                    {c.metCount}
                  </td>

                  {/* Not Met Count */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-center font-bold text-rose-700">
                    {c.notMetCount}
                  </td>

                  {/* Pending Count */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-center font-semibold text-amber-700">
                    {c.pendingCount}
                  </td>

                  {/* Total Projections */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-center font-bold text-gray-700">
                    {c.totalProjections}
                  </td>

                  {/* Total Projected Revenue */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-right font-bold text-gray-900">
                    {formatINR(c.totalProjectedRevenue)}
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
