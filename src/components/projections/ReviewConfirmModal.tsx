"use client";

import React, { useTransition } from "react";
import { CheckCircle2, XCircle, AlertCircle, X, RotateCcw } from "lucide-react";
import type { Projection, ProjectionStatus } from "@/types/projections";
import { formatINR } from "@/lib/format";

interface ReviewConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  projection: Projection | null;
  targetStatus: ProjectionStatus;
  onConfirmReview: (id: string, status: ProjectionStatus) => Promise<{ success: boolean; error?: string }>;
}

export function ReviewConfirmModal({
  isOpen,
  onClose,
  projection,
  targetStatus,
  onConfirmReview,
}: ReviewConfirmModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !projection) return null;

  const isChangingPreviousReview = projection.status !== "pending";
  const isTargetMet = targetStatus === "met";
  const isTargetNotMet = targetStatus === "not_met";

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await onConfirmReview(projection.id, targetStatus);
      if (res.success) {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 text-center transform transition-all">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${
            isTargetMet
              ? "bg-emerald-100 text-emerald-600"
              : isTargetNotMet
              ? "bg-rose-100 text-rose-600"
              : "bg-amber-100 text-amber-600"
          }`}
        >
          {isTargetMet ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : isTargetNotMet ? (
            <XCircle className="w-6 h-6" />
          ) : (
            <RotateCcw className="w-6 h-6" />
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isChangingPreviousReview
            ? `Change Review Status to "${targetStatus.toUpperCase()}"?`
            : `Mark Projection as "${targetStatus.toUpperCase()}"?`}
        </h3>

        {isChangingPreviousReview && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2 text-left">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Previously Reviewed:</strong> This projection was previously reviewed as{" "}
              <span className="font-bold uppercase text-amber-900">{projection.status}</span>. Confirming will
              update the status and timestamp of the review.
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 mb-5 bg-gray-50 p-3 rounded-xl border border-gray-200 text-left space-y-1">
          <div>
            <span className="text-gray-500 text-xs">Counsellor:</span>{" "}
            <strong>{projection.counselor?.full_name}</strong> ({projection.counselor?.employee_code})
          </div>
          <div>
            <span className="text-gray-500 text-xs">University:</span>{" "}
            <strong>{projection.university?.name}</strong>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Projection Date:</span>{" "}
            <strong>{projection.projection_date}</strong>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Projected Revenue:</span>{" "}
            <strong className="text-blue-700">{formatINR(projection.projected_revenue)}</strong>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={`px-5 py-2 text-white rounded-xl text-sm font-semibold shadow-md flex items-center space-x-1.5 ${
              isTargetMet
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                : isTargetNotMet
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
            }`}
          >
            {isPending ? (
              <span>Updating...</span>
            ) : (
              <span>Confirm & Mark {targetStatus === "met" ? "Met" : targetStatus === "not_met" ? "Not Met" : "Pending"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
