"use client";

import React, { useState } from "react";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Calendar, User, DollarSign, GraduationCap, ShieldCheck, Undo2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { DailyCellData } from "@/types/tracker";

interface DailyCellModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselorName: string;
  employeeCode: string;
  counselorId: string;
  cellData: DailyCellData | null;
  onConfirmZero: (counselorId: string, date: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onRevokeZero: (counselorId: string, date: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
}

export function DailyCellModal({
  isOpen,
  onClose,
  counselorName,
  employeeCode,
  counselorId,
  cellData,
  onConfirmZero,
  onRevokeZero,
}: DailyCellModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !cellData) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await onConfirmZero(counselorId, cellData.date, notes.trim() || undefined);
      if (!res.success) {
        setError(res.error || "Failed to confirm zero collection.");
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await onRevokeZero(counselorId, cellData.date, notes.trim() || undefined);
      if (!res.success) {
        setError(res.error || "Failed to revoke zero confirmation.");
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAdmissions = cellData.admissions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-950 border-b border-navy-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-900 border border-brand-orange/40 flex items-center justify-center text-brand-orange font-bold text-xs">
              {cellData.dayNumber}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Daily Record: {cellData.date} ({cellData.dayName})
              </h3>
              <p className="text-[11px] text-gray-400">
                {counselorName} ({employeeCode})
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

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Conflict Banner */}
          {cellData.hasConflict && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Prior Zero Confirmation Overridden:</span> Genuine admission transactions were recorded on this date. In accordance with system safety rules, actual transaction records take precedence.
              </div>
            </div>
          )}

          {/* Current Daily Status Card */}
          <div className="p-3.5 bg-surface-light border border-gray-200 rounded-xl space-y-2">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Effective Daily Status
            </div>
            <div className="flex items-center justify-between">
              <div>
                {cellData.status === "collection_recorded" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                    Collection Recorded: {formatINR(cellData.collectionAmount)}
                  </span>
                )}
                {cellData.status === "admission_recorded" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                    Admission Recorded ({cellData.admissionCount} student)
                  </span>
                )}
                {cellData.status === "zero_confirmed" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600 mr-1.5" />
                    Confirmed Zero Collection
                  </span>
                )}
                {cellData.status === "no_data" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                    No Data Recorded (Unreviewed)
                  </span>
                )}
              </div>
              <div className="text-right text-xs font-semibold text-navy-900">
                {cellData.admissionCount} Admission{cellData.admissionCount !== 1 ? "s" : ""}
              </div>
            </div>

            {cellData.isZeroConfirmed && cellData.confirmedBy && (
              <div className="pt-2 text-[10px] text-gray-500 border-t border-gray-200/60 flex items-center justify-between">
                <span>Confirmed by: {cellData.confirmedBy}</span>
                {cellData.confirmedAt && (
                  <span>{new Date(cellData.confirmedAt).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>

          {/* Genuine Admissions Details */}
          {hasAdmissions ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-navy-900">
                Verified Transactions on this Date ({cellData.admissions.length})
              </div>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {cellData.admissions.map((adm) => (
                  <div key={adm.id} className="p-3 bg-white text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-navy-900">{adm.university_name}</div>
                      <div className="text-[11px] text-gray-500">{adm.program_name} &bull; {adm.payment_mode}</div>
                    </div>
                    <div className="text-right font-bold text-emerald-700">
                      {formatINR(adm.amount_collected)}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">
                Zero collection cannot be confirmed while positive admissions exist on this date.
              </p>
            </div>
          ) : (
            /* Administrator Action for Zero Confirmation */
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-navy-900">
                Administrator Confirmation
              </label>

              {cellData.isZeroConfirmed ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This day is currently explicitly confirmed as <strong>Zero Collection</strong>. If this was marked in error, you can revoke the confirmation below to return the status to <em>No Data Recorded</em>.
                  </p>
                  <button
                    onClick={handleRevoke}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-navy-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-300"
                  >
                    <Undo2 className="w-4 h-4 text-gray-600" />
                    <span>{isSubmitting ? "Updating..." : "Revoke Zero Confirmation"}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Confirm that counselor <strong>{counselorName}</strong> had genuine zero collection for <strong>{cellData.date}</strong>. This distinguishes a reviewed zero day from missing/blank data.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Confirmation Note / Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Verified with counselor EOD report"
                      className="w-full px-3 py-2 text-xs bg-surface-light border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-brand-orange" />
                    <span>{isSubmitting ? "Confirming..." : "Confirm Zero Collection"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-navy-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
