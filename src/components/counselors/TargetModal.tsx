"use client";

import React, { useState, useEffect } from "react";
import { X, Target, AlertCircle } from "lucide-react";
import { formatMonthDisplay, formatINR } from "@/lib/format";
import type { CounselorWithTarget } from "@/types/counselor";

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselor: CounselorWithTarget | null;
  selectedMonth: string;
  onSaveTarget: (
    counselorId: string,
    month: string,
    amount: number,
    admissions: number,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function TargetModal({
  isOpen,
  onClose,
  counselor,
  selectedMonth,
  onSaveTarget,
}: TargetModalProps) {
  const [targetAmount, setTargetAmount] = useState<number | string>(0);
  const [targetAdmissions, setTargetAdmissions] = useState<number | string>(0);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (counselor) {
      if (counselor.is_target_assigned) {
        setTargetAmount(counselor.effective_target);
        setTargetAdmissions(counselor.effective_admission_target || 0);
        setNotes(counselor.assigned_notes || "");
      } else {
        // Leave at suggested values but allow quick pre-fill
        setTargetAmount(counselor.monthly_target || 550000);
        setTargetAdmissions(counselor.monthly_admission_target || 6);
        setNotes("");
      }
    }
    setError(null);
  }, [counselor, selectedMonth, isOpen]);

  if (!isOpen || !counselor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(targetAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid non-negative target collection amount.");
      return;
    }

    const admissions = Number(targetAdmissions);
    if (isNaN(admissions) || admissions < 0 || !Number.isInteger(admissions)) {
      setError("Please enter a valid non-negative whole number for target admissions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSaveTarget(
        counselor.id,
        selectedMonth,
        amount,
        admissions,
        notes.trim() || undefined
      );
      if (!res.success) {
        setError(res.error || "Failed to update monthly targets.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update targets.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-900 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Assign Monthly Targets</h3>
              <p className="text-[11px] text-gray-400">
                {formatMonthDisplay(selectedMonth)} &bull; {counselor.employee_code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Counselor Info & Current Assignment Status */}
          <div className="p-3 bg-surface-light border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-950">{counselor.full_name}</span>
              {counselor.is_target_assigned ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Target Assigned for {formatMonthDisplay(selectedMonth)}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Target Not Assigned for {formatMonthDisplay(selectedMonth)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1 border-t border-gray-200/60">
              <span>Suggested baseline: <strong>{formatINR(counselor.monthly_target)}</strong> / <strong>{counselor.monthly_admission_target || 6} adm</strong></span>
              {counselor.target_updated_at && (
                <span className="text-[10px] text-gray-400">
                  Last updated: {new Date(counselor.target_updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Collection Target Input */}
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
              Monthly Collection Target (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-semibold text-gray-500">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="5000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="550000"
                disabled={isSubmitting}
                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>
          </div>

          {/* Admission Count Target Input */}
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
              Monthly Admission Target (Count) *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={targetAdmissions}
              onChange={(e) => setTargetAdmissions(e.target.value)}
              placeholder="6"
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>

          {/* Revision Notes / Reason */}
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              Revision Notes / Allocation Reason (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. October 2026 quota confirmed from executive roster"
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Stored in audit logs for administrator traceability. Previous months remain intact.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-navy-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-orange hover:bg-brand-hover rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Confirm & Save Target</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
