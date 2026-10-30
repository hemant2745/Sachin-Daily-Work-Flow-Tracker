"use client";

import React from "react";
import { Calendar, TrendingUp, DollarSign } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { DailyTrendItem } from "@/types/reports";

interface PerformanceTrendsChartProps {
  trends: DailyTrendItem[];
}

export function PerformanceTrendsChart({ trends }: PerformanceTrendsChartProps) {
  // Find maximum revenue for visual scale
  const maxRevenue = Math.max(
    ...trends.map((t) => Math.max(t.revenueCollected, t.projectedRevenue)),
    1
  );

  return (
    <div className="bg-navy-900/90 border border-navy-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-navy-800 bg-navy-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-brand-orange" />
          <div>
            <h3 className="text-sm font-semibold text-white">Daily Performance & Forecast Timeline</h3>
            <p className="text-xs text-gray-400">
              Chronological day-by-day revenue, admissions, and projected volume.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-gray-300">Verified Collections</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
            <span className="text-gray-300">Projected Revenue</span>
          </div>
        </div>
      </div>

      {trends.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-xs">
          No activity recorded in the selected period.
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {/* Visual Mini Bars */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {trends.map((t) => {
              const revPercent = Math.min(100, Math.round((t.revenueCollected / maxRevenue) * 100));
              const projPercent = Math.min(100, Math.round((t.projectedRevenue / maxRevenue) * 100));

              return (
                <div
                  key={t.date}
                  className="p-2.5 rounded-lg bg-navy-950/60 border border-navy-800/80 hover:border-navy-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-white">{t.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">
                        Admissions: <span className="text-white font-medium">{t.admissionsCount}</span>
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {formatINR(t.revenueCollected)}
                      </span>
                      {t.projectedRevenue > 0 && (
                        <span className="text-brand-orange text-[11px]">
                          (Proj: {formatINR(t.projectedRevenue)})
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Stacked comparison bars */}
                  <div className="space-y-1">
                    <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${revPercent}%` }}
                        title={`Collections: ${formatINR(t.revenueCollected)}`}
                      />
                    </div>
                    {t.projectedRevenue > 0 && (
                      <div className="w-full bg-navy-900 rounded-full h-1 overflow-hidden opacity-75">
                        <div
                          className="bg-brand-orange h-full rounded-full transition-all duration-300"
                          style={{ width: `${projPercent}%` }}
                          title={`Projected: ${formatINR(t.projectedRevenue)}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
