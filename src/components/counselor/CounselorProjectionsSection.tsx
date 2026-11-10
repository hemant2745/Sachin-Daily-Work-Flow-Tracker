"use client";

import React from "react";
import { formatINR } from "@/lib/format";
import { TrendingUp, Plus, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

interface TodayProjection {
  id?: string;
  projectedRevenue: number;
  expectedAdmissions?: number;
  status: string;
  notes?: string;
  submittedAt?: string;
}

interface ProjectionItem {
  id: string;
  projectionDate: string;
  projectedRevenue: number;
  expectedAdmissions?: number;
  status: string;
  notes?: string;
}

interface CounselorProjectionsSectionProps {
  todayProjection: TodayProjection | null;
  recentProjections: ProjectionItem[];
  onOpenProjectionModal: () => void;
}

export function CounselorProjectionsSection({
  todayProjection,
  recentProjections,
  onOpenProjectionModal,
}: CounselorProjectionsSectionProps) {
  return (
    <div id="projections" className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-orange" />
            <h3 className="text-sm font-bold text-navy-800 tracking-tight">
              Daily Morning Projections
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Submit daily commitments each morning and track realization
          </p>
        </div>

        <button
          onClick={onOpenProjectionModal}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-brand-orange" />
          <span>{todayProjection ? "Update Today's Projection" : "Submit Morning Projection"}</span>
        </button>
      </div>

      {/* Today's Commitment Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-950 text-white shadow-inner border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Today&apos;s Forecast Status
          </span>
          {todayProjection ? (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                todayProjection.status === "met"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : todayProjection.status === "not_met"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {todayProjection.status === "met" ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : todayProjection.status === "not_met" ? (
                <XCircle className="w-3 h-3 text-rose-400" />
              ) : (
                <Clock className="w-3 h-3 text-amber-400" />
              )}
              <span>{todayProjection.status}</span>
            </span>
          ) : (
            <span className="text-[10px] text-amber-300 font-semibold italic">
              Pending morning submission
            </span>
          )}
        </div>

        {todayProjection ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-gray-400 block">Projected Revenue</span>
              <span className="text-base sm:text-lg font-black font-mono text-brand-orange">
                {formatINR(todayProjection.projectedRevenue)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">Expected Admissions</span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                {todayProjection.expectedAdmissions || 1} student(s)
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-gray-400 block">Notes</span>
              <span className="text-xs text-gray-300 truncate block">
                {todayProjection.notes || "No remarks entered"}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-2 text-xs text-gray-300 flex items-center justify-between">
            <span>You haven&apos;t submitted your projection for today yet.</span>
            <button
              onClick={onOpenProjectionModal}
              className="text-xs text-brand-orange font-bold hover:underline"
            >
              Submit Now &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Recent Projections Table */}
      {recentProjections.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-navy-800 uppercase tracking-wider">
            Recent Projection History
          </h4>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-100">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Projected (₹)</th>
                  <th className="py-2 px-2.5 text-center">Expected Adm.</th>
                  <th className="py-2 px-2.5 text-center">Audit Status</th>
                  <th className="py-2 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/40">
                {recentProjections.map((p) => (
                  <tr key={p.id} className="hover:bg-white/80">
                    <td className="py-2 px-3 font-mono font-medium text-gray-600">
                      {p.projectionDate}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-navy-900">
                      {formatINR(p.projectedRevenue)}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono">
                      {p.expectedAdmissions || 1}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === "met"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : p.status === "not_met"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-[11px] truncate max-w-[200px]">
                      {p.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
