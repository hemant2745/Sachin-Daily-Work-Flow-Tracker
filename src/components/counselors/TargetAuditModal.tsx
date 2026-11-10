"use client";

import React, { useState, useEffect } from "react";
import { X, History, Clock, User, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { formatINR, formatMonthDisplay } from "@/lib/format";
import type { CounselorWithTarget } from "@/types/counselor";
import { getTargetAuditLogsAction } from "@/app/(dashboard)/dashboard/counselors/actions";

interface TargetAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselor: CounselorWithTarget | null;
  selectedMonth: string;
}

export function TargetAuditModal({
  isOpen,
  onClose,
  counselor,
  selectedMonth,
}: TargetAuditModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && counselor) {
      setIsLoading(true);
      setError(null);
      getTargetAuditLogsAction(counselor.id)
        .then((res) => {
          if (res.success) {
            setLogs(res.logs);
          } else {
            setError(res.error || "Failed to load audit history");
          }
        })
        .catch((err) => {
          setError(err?.message || "Failed to load audit history");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, counselor]);

  if (!isOpen || !counselor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/80">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#061B3D]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Target & Category Audit History
              </h3>
              <p className="text-[11px] text-gray-400">
                {counselor.full_name} ({counselor.employee_code}) &bull; Category:{" "}
                <span className="text-brand-orange font-semibold">
                  {counselor.category || "CDA"}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">
              <div className="animate-spin w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full mx-auto mb-2" />
              Loading audit logs...
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-navy-800">No Target Modifications Recorded Yet</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Any future category reassignments or additional target adjustments will be permanently logged here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => {
                const dateStr = log.created_at
                  ? new Date(log.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A";

                const isAdditional = log.change_type === "ADDITIONAL_TARGET_UPDATE" || log.additional_target !== undefined;
                const isCategory = log.change_type === "CATEGORY_ASSIGNMENT";

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white/80 border border-gray-200/80 shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase tracking-wider text-navy-800 px-2 py-0.5 rounded bg-gray-100">
                        {isCategory
                          ? "Category Change"
                          : isAdditional
                          ? "Additional Target Adjustment"
                          : "Target Revision"}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {/* Change Details */}
                    <div className="flex items-center gap-2 text-xs text-navy-800 py-1">
                      {log.old_target_amount !== null && log.old_target_amount !== undefined ? (
                        <>
                          <span className="font-mono text-gray-500 line-through">
                            {formatINR(log.old_target_amount)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                          <span className="font-mono font-bold text-navy-900">
                            {formatINR(log.new_target_amount)}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono font-bold text-navy-900">
                          {formatINR(log.new_target_amount)}
                        </span>
                      )}

                      {log.category && (
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {log.category}
                        </span>
                      )}
                    </div>

                    {/* Reason */}
                    {log.reason && (
                      <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                        &quot;{log.reason}&quot;
                      </div>
                    )}

                    {/* Admin identity */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                      <span>Month: {log.target_month ? formatMonthDisplay(log.target_month) : "Current"}</span>
                      <div className="flex items-center gap-1 text-navy-700 font-medium">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>{log.changed_by_email || "Sachin Behera (Admin)"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-200/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
