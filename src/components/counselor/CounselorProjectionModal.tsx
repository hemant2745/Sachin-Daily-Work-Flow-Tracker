"use client";

import React, { useState } from "react";
import { X, TrendingUp, Save, AlertCircle, Info } from "lucide-react";
import { formatINR } from "@/lib/format";
import { counselorSubmitMorningProjectionAction } from "@/app/(counselor)/counselor/actions";

interface CounselorProjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProjection?: {
    projectedRevenue?: number;
    expectedAdmissions?: number;
    notes?: string;
  } | null;
}

export function CounselorProjectionModal({
  isOpen,
  onClose,
  onSuccess,
  initialProjection,
}: CounselorProjectionModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [projectionDate, setProjectionDate] = useState(todayStr);
  const [expectedAdmissions, setExpectedAdmissions] = useState<number | string>(
    initialProjection?.expectedAdmissions || 1
  );
  const [projectedRevenue, setProjectedRevenue] = useState<number | string>(
    initialProjection?.projectedRevenue || ""
  );
  const [remarks, setRemarks] = useState(initialProjection?.notes || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rev = Number(projectedRevenue);
    if (isNaN(rev) || rev <= 0) {
      setError("Please enter a valid projected collection amount greater than zero.");
      return;
    }

    const adm = Number(expectedAdmissions);
    if (isNaN(adm) || adm < 1) {
      setError("Please enter an expected admission count of at least 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await counselorSubmitMorningProjectionAction({
        projectionDate,
        expectedAdmissions: adm,
        projectedRevenue: rev,
        remarks: remarks.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit morning projection.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onSuccess();
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
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Submit Morning Projection
              </h3>
              <p className="text-[11px] text-gray-400">
                Register daily performance commitment
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
              Projection Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={projectionDate}
              onChange={(e) => setProjectionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Projected Revenue */}
            <div>
              <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
                Projected Revenue (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={projectedRevenue}
                  onChange={(e) => setProjectedRevenue(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full pl-8 pr-3 py-2 text-xs font-bold font-mono text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Expected Admissions */}
            <div>
              <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
                Expected Admissions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={expectedAdmissions}
                onChange={(e) => setExpectedAdmissions(e.target.value)}
                placeholder="e.g. 1"
                className="w-full px-3 py-2 text-xs font-bold font-mono text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
              Remarks / Hot Lead Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 2 candidate interviews scheduled, expecting payment for MBA"
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
              <span>{isSubmitting ? "Submitting..." : "Submit Projection"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
