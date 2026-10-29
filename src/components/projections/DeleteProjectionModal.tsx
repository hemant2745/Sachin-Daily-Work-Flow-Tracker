"use client";

import React, { useTransition } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Projection } from "@/types/projections";
import { formatINR } from "@/lib/format";

interface DeleteProjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projection: Projection | null;
  onConfirmDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function DeleteProjectionModal({
  isOpen,
  onClose,
  projection,
  onConfirmDelete,
}: DeleteProjectionModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !projection) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const res = await onConfirmDelete(projection.id);
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

        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Projection?</h3>
        <p className="text-sm text-gray-500 mb-4">
          Are you sure you want to delete this revenue projection of{" "}
          <strong className="text-gray-900 font-semibold">{formatINR(projection.projected_revenue)}</strong> for{" "}
          <strong className="text-gray-900 font-semibold">{projection.counselor?.full_name || "counsellor"}</strong> on{" "}
          <span className="font-medium text-gray-800">{projection.projection_date}</span>?
        </p>

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
            onClick={handleDelete}
            disabled={isPending}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-red-500/20 flex items-center space-x-1.5"
          >
            {isPending ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
