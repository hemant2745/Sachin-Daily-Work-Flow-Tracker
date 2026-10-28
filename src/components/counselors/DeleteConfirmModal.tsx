"use client";

import React, { useState } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import type { CounselorWithTarget } from "@/types/counselor";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselor: CounselorWithTarget | null;
  onConfirmDelete: (id: string, forceDeactivate: boolean) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  counselor,
  onConfirmDelete,
}: DeleteConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !counselor) return null;

  const handleDeactivate = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await onConfirmDelete(counselor.id, true);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to update counselor status.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An error occurred.");
      setIsSubmitting(false);
    }
  };

  const handlePermanentDelete = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await onConfirmDelete(counselor.id, false);
      if (!res.success) {
        setErrorMessage(res.error || "Permanent deletion blocked.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-surface-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-900 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-brand-orange">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Manage Counselor Removal</h3>
              <p className="text-[11px] text-gray-400">Data protection & historical audit</p>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <div className="p-3.5 bg-surface-light border border-gray-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-800">{counselor.full_name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-navy-100 text-navy-800">
                {counselor.employee_code}
              </span>
            </div>
            <div className="text-[11px] text-gray-500">{counselor.email}</div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5 leading-relaxed">
            <div className="font-semibold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Recommended Action: Deactivate</span>
            </div>
            <p className="text-[11px]">
              Deactivating keeps the counselor off active target rosters while fully preserving their historical target records and past reporting.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-navy-800 hover:bg-navy-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Deactivate Counselor (Recommended)"}
            </button>

            <button
              type="button"
              onClick={handlePermanentDelete}
              disabled={isSubmitting}
              className="w-full py-2 px-4 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
            >
              Permanently Delete (Only if no historical targets exist)
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-2 px-4 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
