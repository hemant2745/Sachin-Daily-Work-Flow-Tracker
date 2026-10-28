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
  onSaveTarget: (counselorId: string, month: string, amount: number) => Promise<{ success: boolean; error?: string }>;
}

export function TargetModal({
  isOpen,
  onClose,
  counselor,
  selectedMonth,
  onSaveTarget,
}: TargetModalProps) {
  const [targetAmount, setTargetAmount] = useState<number | string>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (counselor) {
      setTargetAmount(counselor.effective_target);
    }
    setError(null);
  }, [counselor, selectedMonth, isOpen]);

  if (!isOpen || !counselor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(targetAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid non-negative target amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSaveTarget(counselor.id, selectedMonth, amount);
      if (!res.success) {
        setError(res.error || "Failed to update monthly target.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update target.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-surface-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-900 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Set Monthly Target</h3>
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

          {/* Counselor Info Card */}
          <div className="p-3 bg-surface-light border border-gray-200 rounded-xl space-y-1">
            <div className="text-xs font-semibold text-navy-800">{counselor.full_name}</div>
            <div className="text-[11px] text-gray-500">
              Default quota: <span className="font-medium text-navy-800">{formatINR(counselor.monthly_target)}</span>
            </div>
          </div>

          {/* Target Input */}
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
              Target for {formatMonthDisplay(selectedMonth)} (₹ INR) *
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
                placeholder="250000"
                disabled={isSubmitting}
                className="w-full pl-8 pr-3 py-2.5 bg-surface-light border border-gray-300 rounded-lg text-sm font-semibold text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              This target is stored in <code className="text-brand-orange">counselor_monthly_targets</code> and applies strictly to {formatMonthDisplay(selectedMonth)}. Historical targets from past months remain completely unchanged.
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
                <span>Save Target</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
