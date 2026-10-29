"use client";

import React, { useTransition } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Task } from "@/types/tasks";

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onConfirmDelete: (taskId: string) => Promise<{ success: boolean; error?: string }>;
}

export function DeleteTaskModal({
  isOpen,
  onClose,
  task,
  onConfirmDelete,
}: DeleteTaskModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !task) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const res = await onConfirmDelete(task.id);
      if (res.success) {
        onClose();
      }
    });
  };

  const subtasksCount = task.subtasks?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-surface-border w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-navy-900">Delete Task</h3>
            <p className="text-xs text-gray-500 mt-1">
              Are you sure you want to permanently delete this task?
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Content */}
        <div className="p-6 space-y-3 bg-slate-50/50">
          <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
            <p className="text-xs font-bold text-navy-900">{task.title}</p>
            <p className="text-[11px] text-gray-500">
              Scheduled for: <strong>{task.scheduled_date} at {task.scheduled_start_time}</strong>
            </p>
            {task.counselor && (
              <p className="text-[11px] text-gray-500">
                Assigned Counselor: {task.counselor.full_name} ({task.counselor.employee_code})
              </p>
            )}
            {subtasksCount > 0 && (
              <p className="text-[11px] text-amber-700 font-medium">
                Note: All {subtasksCount} associated subtasks will also be deleted.
              </p>
            )}
          </div>
          <p className="text-xs text-red-600">
            This action cannot be undone. Outstanding automated email reminders will be cancelled.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPending ? "Deleting..." : "Permanently Delete Task"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
