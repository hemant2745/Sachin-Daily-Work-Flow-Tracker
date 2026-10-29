"use client";

import React, { useTransition } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  IndianRupee,
  Sparkles,
} from "lucide-react";
import type { Projection } from "@/types/projections";
import { formatINR } from "@/lib/format";
import { getTodayIST, isPendingReviewOverdue, isEligibleForNextDayReview } from "@/lib/projections";

interface PendingReviewsListProps {
  pendingProjections: Projection[];
  onReview: (projection: Projection, status: "met" | "not_met") => void;
  onRefresh?: () => void;
}

export function PendingReviewsList({
  pendingProjections,
  onReview,
}: PendingReviewsListProps) {
  const todayIST = getTodayIST();

  if (pendingProjections.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">All Reviews Completed!</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          There are no pending projections awaiting review for this period. As new daily projections are added,
          they will appear here for next-day review.
        </p>
      </div>
    );
  }

  // Sort: overdue first, then by date descending
  const sorted = [...pendingProjections].sort((a, b) => {
    const isOverdueA = isPendingReviewOverdue(a.projection_date, todayIST);
    const isOverdueB = isPendingReviewOverdue(b.projection_date, todayIST);
    if (isOverdueA && !isOverdueB) return -1;
    if (!isOverdueA && isOverdueB) return 1;
    return b.projection_date.localeCompare(a.projection_date);
  });

  return (
    <div className="space-y-4">
      {/* Alert Header Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-900">
        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <p className="font-semibold">
            Next-Day Review Queue ({pendingProjections.length} Pending)
          </p>
          <p className="text-amber-800/80 mt-0.5">
            Review yesterday&apos;s revenue projections against actual outcomes. Mark each entry as <strong>Met</strong> or <strong>Not Met</strong> to update the team completion percentage.
          </p>
        </div>
      </div>

      {/* Cards / List of Pending Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((p) => {
          const isOverdue = isPendingReviewOverdue(p.projection_date, todayIST);
          const isToday = p.projection_date === todayIST;
          const isEligible = isEligibleForNextDayReview(p.projection_date, todayIST);

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                isOverdue
                  ? "border-rose-200 bg-rose-50/20 ring-1 ring-rose-200"
                  : isToday
                  ? "border-blue-200 bg-blue-50/10"
                  : "border-gray-200"
              }`}
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{p.projection_date}</span>
                  </div>

                  {isOverdue ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Overdue Review</span>
                    </span>
                  ) : isToday ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      <span>Entered Today</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3" />
                      <span>Ready for Review</span>
                    </span>
                  )}
                </div>

                {/* Counsellor & University Info */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-900 font-bold">
                    <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{p.counselor?.full_name || "Unknown Counsellor"}</span>
                    {p.counselor?.employee_code && (
                      <span className="text-xs font-normal text-gray-500">
                        ({p.counselor.employee_code})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium text-gray-800">
                      {p.university?.name || "University"}
                    </span>
                  </div>
                </div>

                {/* Projected Amount */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3 flex items-baseline justify-between">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    Projected Revenue
                  </span>
                  <span className="text-lg font-black text-blue-900">
                    {formatINR(p.projected_revenue)}
                  </span>
                </div>

                {/* Optional Notes */}
                {p.notes && (
                  <p className="text-xs text-gray-500 italic bg-white p-2 rounded-lg border border-gray-100 mb-3">
                    &ldquo;{p.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400">
                  {isToday ? "Scheduled review starts tomorrow" : "Confirm outcome:"}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onReview(p, "not_met")}
                    className="inline-flex items-center px-3 py-1.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all shadow-sm space-x-1"
                    title="Mark projection as Not Met"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Not Met</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onReview(p, "met")}
                    className="inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 space-x-1"
                    title="Mark projection as Met"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Met</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
