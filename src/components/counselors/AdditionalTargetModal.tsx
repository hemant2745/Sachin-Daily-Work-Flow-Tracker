"use client";

import React, { useState, useEffect } from "react";
import { X, Target, Plus, Minus, Trash2, Save, AlertCircle, Info, Calculator } from "lucide-react";
import { formatINR, formatMonthDisplay } from "@/lib/format";
import type { CounselorWithTarget } from "@/types/counselor";

interface AdditionalTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselor: CounselorWithTarget | null;
  selectedMonth: string;
  onSaveAdditionalTarget: (
    counselorId: string,
    monthKey: string,
    additionalTarget: number,
    reason: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function AdditionalTargetModal({
  isOpen,
  onClose,
  counselor,
  selectedMonth,
  onSaveAdditionalTarget,
}: AdditionalTargetModalProps) {
  const [additionalAmount, setAdditionalAmount] = useState<number | string>(0);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (counselor) {
      setAdditionalAmount(counselor.additional_target || 0);
      setReason(counselor.additional_target_reason || "");
    } else {
      setAdditionalAmount(0);
      setReason("");
    }
    setError(null);
  }, [counselor, selectedMonth, isOpen]);

  if (!isOpen || !counselor) return null;

  const baseTarget = counselor.base_target || counselor.monthly_target || 800000;
  const numericAdditional = Number(additionalAmount) || 0;
  const finalCalculatedTarget = baseTarget + numericAdditional;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(numericAdditional) || numericAdditional < 0) {
      setError("Please enter a valid non-negative additional target amount (or 0 to remove).");
      return;
    }

    if (!reason.trim()) {
      setError("A reason for this target adjustment is required for the audit trail.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSaveAdditionalTarget(
        counselor.id,
        selectedMonth,
        numericAdditional,
        reason.trim()
      );

      if (!res.success) {
        setError(res.error || "Failed to update additional target.");
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

  const handleQuickRemove = () => {
    setAdditionalAmount(0);
    setReason("Target adjustment removed by administrator");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/80">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#061B3D]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Adjust Additional Target
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

          {/* Target Calculation Preview Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 text-white shadow-inner space-y-2 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Target Formula Breakdown ({formatMonthDisplay(selectedMonth)})
            </div>

            <div className="grid grid-cols-3 gap-2 items-center text-center py-1">
              {/* Category Base */}
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] text-gray-400">Category Base</div>
                <div className="text-xs sm:text-sm font-black font-mono text-emerald-400 mt-0.5">
                  {formatINR(baseTarget)}
                </div>
              </div>

              {/* Plus Additional */}
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] text-gray-400">Additional Target</div>
                <div className="text-xs sm:text-sm font-black font-mono text-brand-orange mt-0.5">
                  +{formatINR(numericAdditional)}
                </div>
              </div>

              {/* Final Monthly Target */}
              <div className="p-2 rounded-lg bg-brand-orange/20 border border-brand-orange/40">
                <div className="text-[10px] text-orange-200">Final Target</div>
                <div className="text-xs sm:text-sm font-black font-mono text-white mt-0.5">
                  {formatINR(finalCalculatedTarget)}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-gray-400 text-center italic">
              Individual Monthly Target = Category Base Target + Individual Additional Target
            </div>
          </div>

          {/* Additional Target Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Additional Target Amount (₹) <span className="text-red-500">*</span>
              </label>
              {(counselor.additional_target || 0) > 0 && (
                <button
                  type="button"
                  onClick={handleQuickRemove}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Additional Target</span>
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="5000"
                required
                value={additionalAmount}
                onChange={(e) => setAdditionalAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all font-mono"
                placeholder="e.g. 50000"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Set to ₹0 if this counselor only works against the standard category base target.
            </p>
          </div>

          {/* Mandatory Reason Input */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5">
              Reason for Adjustment <span className="text-red-500">*</span> (Audit Trail)
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Higher quota for upcoming intake, senior lead volume bonus, special campaign quota"
              className="w-full px-3 py-2 text-xs text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">
              Reason will be logged in the permanent audit trail with timestamp and admin identity.
            </p>
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
              <span>{isSubmitting ? "Saving..." : "Apply Additional Target"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
