"use client";

import React, { useState, useEffect } from "react";
import { X, Award, Target, Save, AlertCircle, Info } from "lucide-react";
import { formatINR, formatMonthDisplay } from "@/lib/format";
import type { CounselorCategory } from "@/types/counselor";

interface CategoryTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CounselorCategory | null;
  selectedMonth: string;
  initialBaseTarget?: number;
  initialAdmissionTarget?: number;
  onSaveCategoryTarget: (
    category: CounselorCategory,
    monthKey: string,
    baseTarget: number,
    baseAdmissionTarget?: number,
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function CategoryTargetModal({
  isOpen,
  onClose,
  category,
  selectedMonth,
  initialBaseTarget = 800000,
  initialAdmissionTarget = 8,
  onSaveCategoryTarget,
}: CategoryTargetModalProps) {
  const [baseTarget, setBaseTarget] = useState<number | string>(initialBaseTarget);
  const [admissionTarget, setAdmissionTarget] = useState<number | string>(initialAdmissionTarget);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setBaseTarget(initialBaseTarget);
      setAdmissionTarget(initialAdmissionTarget);
      setReason("");
    }
    setError(null);
  }, [category, initialBaseTarget, initialAdmissionTarget, isOpen]);

  if (!isOpen || !category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetVal = Number(baseTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      setError("Please enter a valid base target amount greater than zero.");
      return;
    }

    const admVal = Number(admissionTarget);
    if (isNaN(admVal) || admVal < 0 || !Number.isInteger(admVal)) {
      setError("Please enter a valid non-negative whole number for admission target.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSaveCategoryTarget(
        category,
        selectedMonth,
        targetVal,
        admVal,
        reason.trim() || undefined
      );

      if (!res.success) {
        setError(res.error || "Failed to update category base target.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-white/80">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#061B3D]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Update {category} Base Target
              </h3>
              <p className="text-[11px] text-gray-400">
                Sets default monthly quota for all {category} counselors for{" "}
                <span className="text-brand-orange font-semibold">
                  {formatMonthDisplay(selectedMonth)}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Historical Data Protection Notice */}
          <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Month-Wise Target Snapshot:</span> This change
              applies specifically to {formatMonthDisplay(selectedMonth)}. Historical targets from
              prior months remain intact and protected.
            </div>
          </div>

          {/* Base Revenue Target */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5">
              Category Base Revenue Target (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="10000"
                required
                value={baseTarget}
                onChange={(e) => setBaseTarget(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all font-mono"
                placeholder="e.g. 800000"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Formatted Preview: <span className="font-bold text-navy-800">{formatINR(Number(baseTarget) || 0)}</span>
            </p>
          </div>

          {/* Base Admissions Target */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5">
              Base Enrolled Admissions Quota
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={admissionTarget}
              onChange={(e) => setAdmissionTarget(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all font-mono"
              placeholder="e.g. 8"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Default admission headcount quota for {category} counselors
            </p>
          </div>

          {/* Reason for Target Adjustment */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5">
              Adjustment Reason / Note (for Audit Log)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Standard monthly revision, special admissions drive quota"
              className="w-full px-3 py-2 text-xs text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-orange hover:bg-brand-hover rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save Base Target"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
