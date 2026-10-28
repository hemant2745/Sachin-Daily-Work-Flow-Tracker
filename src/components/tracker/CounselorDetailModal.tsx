"use client";

import React from "react";
import { X, Calendar, User, Target, DollarSign, GraduationCap, ShieldCheck, Flame, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { CounselorDailyRow } from "@/types/tracker";

interface CounselorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselorRow: CounselorDailyRow | null;
  monthDisplay: string;
}

export function CounselorDetailModal({
  isOpen,
  onClose,
  counselorRow,
  monthDisplay,
}: CounselorDetailModalProps) {
  if (!isOpen || !counselorRow) return null;

  const daysList = Object.values(counselorRow.days).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-surface-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-950 border-b border-navy-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-navy-900 border border-brand-orange/40 flex items-center justify-center text-brand-orange font-bold text-sm">
              {counselorRow.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {counselorRow.fullName} ({counselorRow.employeeCode})
              </h3>
              <p className="text-xs text-gray-400">
                Performance Profile &bull; {monthDisplay}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-navy-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="p-6 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 bg-surface-light border-b border-gray-100">
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="text-[10px] font-semibold text-gray-500 uppercase">Collection Target</div>
            <div className="text-sm font-bold text-navy-900 mt-0.5">
              {counselorRow.isTargetAssigned && counselorRow.monthlyTargetCollection !== null
                ? formatINR(counselorRow.monthlyTargetCollection)
                : "Target not assigned"}
            </div>
            <div className="text-[10px] text-brand-orange font-medium mt-0.5">
              Ach: {counselorRow.collectionAchievement}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="text-[10px] font-semibold text-gray-500 uppercase">Admission Target</div>
            <div className="text-sm font-bold text-navy-900 mt-0.5">
              {counselorRow.isTargetAssigned && counselorRow.monthlyTargetAdmissions !== null
                ? `${counselorRow.monthlyTargetAdmissions} adm`
                : "Target not assigned"}
            </div>
            <div className="text-[10px] text-blue-600 font-medium mt-0.5">
              Ach: {counselorRow.admissionAchievement}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="text-[10px] font-semibold text-gray-500 uppercase">Actual Collections</div>
            <div className="text-sm font-bold text-emerald-700 mt-0.5">
              {formatINR(counselorRow.totalCollections)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {counselorRow.totalAdmissions} admissions recorded
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="text-[10px] font-semibold text-gray-500 uppercase">Zero Streaks</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-navy-900">
                Current: <strong className="text-brand-orange">{counselorRow.currentZeroStreak}d</strong>
              </span>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs font-bold text-navy-900">
                Max: <strong className="text-navy-900">{counselorRow.longestZeroStreak}d</strong>
              </span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {counselorRow.confirmedZeroDays} confirmed zero days
            </div>
          </div>
        </div>

        {/* 31-Day Timeline Table */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="text-xs font-bold text-navy-900 mb-2.5">
            Daily Timeline for {monthDisplay} ({daysList.length} Calendar Days)
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-light text-[11px] font-bold text-navy-800 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4 w-28">Date</th>
                  <th className="py-2.5 px-4 w-20">Day</th>
                  <th className="py-2.5 px-4">Daily Status</th>
                  <th className="py-2.5 px-4 text-center w-24">Admissions</th>
                  <th className="py-2.5 px-4 text-right w-36">Collections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {daysList.map((day) => (
                  <tr
                    key={day.date}
                    className={`hover:bg-slate-50 transition-colors ${
                      day.isWeekend ? "bg-slate-50/50" : ""
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono font-medium text-navy-900">
                      {day.date}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">
                      {day.dayName} {day.isWeekend && <span className="text-[10px] text-gray-400 font-semibold">(W)</span>}
                    </td>
                    <td className="py-2.5 px-4">
                      {day.status === "collection_recorded" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Collection Recorded
                        </span>
                      )}
                      {day.status === "admission_recorded" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          Admission Recorded
                        </span>
                      )}
                      {day.status === "zero_confirmed" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                          Zero Confirmed
                        </span>
                      )}
                      {day.status === "no_data" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal text-gray-400 bg-gray-50 border border-gray-200">
                          No Data Recorded
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-navy-900">
                      {day.admissionCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                          {day.admissionCount}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-navy-900">
                      {day.collectionAmount > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          {formatINR(day.collectionAmount)}
                        </span>
                      ) : day.status === "zero_confirmed" ? (
                        <span className="text-gray-400">₹0</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-surface-light border-t border-gray-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-navy-900 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
