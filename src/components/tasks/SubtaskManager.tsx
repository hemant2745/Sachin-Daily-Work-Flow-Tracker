"use client";

import React, { useState, useTransition } from "react";
import { Check, Plus, Trash2, Edit2, X, CheckSquare, Square } from "lucide-react";
import type { Subtask } from "@/types/tasks";
import {
  createSubtaskAction,
  updateSubtaskAction,
  toggleSubtaskCompleteAction,
  deleteSubtaskAction,
} from "@/app/(dashboard)/dashboard/tasks/actions";

interface SubtaskManagerProps {
  taskId: string;
  subtasks: Subtask[];
  onSubtasksUpdated?: () => void;
}

export function SubtaskManager({
  taskId,
  subtasks = [],
  onSubtasksUpdated,
}: SubtaskManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!newTitle.trim()) return;

    startTransition(async () => {
      const res = await createSubtaskAction(taskId, {
        title: newTitle.trim(),
        sort_order: subtasks.length,
      });

      if (res.success) {
        setNewTitle("");
        setIsAdding(false);
        onSubtasksUpdated?.();
      }
    });
  };

  const handleToggle = (subtask: Subtask) => {
    const isCompleted = subtask.status === "completed";
    startTransition(async () => {
      await toggleSubtaskCompleteAction(subtask.id, !isCompleted);
      onSubtasksUpdated?.();
    });
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditTitle(subtask.title);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;

    startTransition(async () => {
      const res = await updateSubtaskAction(id, {
        title: editTitle.trim(),
      });
      if (res.success) {
        setEditingId(null);
        onSubtasksUpdated?.();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteSubtaskAction(id);
      onSubtasksUpdated?.();
    });
  };

  const completedCount = subtasks.filter((s) => s.status === "completed").length;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Subtask Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">
            Subtasks
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-700">
            {completedCount} of {subtasks.length} completed
          </span>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-orange hover:text-orange-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subtask</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${Math.round((completedCount / subtasks.length) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* Subtask Items */}
      <div className="space-y-1.5">
        {subtasks.map((subtask) => {
          const isDone = subtask.status === "completed";
          const isEditing = editingId === subtask.id;

          if (isEditing) {
            return (
              <div key={subtask.id} className="flex items-center gap-1.5 py-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1 bg-white border border-brand-orange rounded-md focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(subtask.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit(subtask.id)}
                  disabled={isPending}
                  className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                  title="Save"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={subtask.id}
              className={`flex items-center justify-between group px-2 py-1.5 rounded-lg text-xs transition-colors ${
                isDone ? "bg-gray-50/80 text-gray-400" : "hover:bg-slate-50 text-navy-800"
              }`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0 mr-2">
                <button
                  type="button"
                  onClick={() => handleToggle(subtask)}
                  disabled={isPending}
                  className="text-gray-400 hover:text-brand-orange transition-colors shrink-0"
                >
                  {isDone ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <span
                  className={`truncate ${
                    isDone ? "line-through text-gray-400" : "font-medium"
                  }`}
                >
                  {subtask.title}
                </span>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleStartEdit(subtask)}
                  className="p-1 text-gray-400 hover:text-navy-900 rounded"
                  title="Edit title"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(subtask.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="Delete subtask"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add New Subtask Inline Form */}
        {isAdding && (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter subtask title..."
              className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setIsAdding(false);
              }}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !newTitle.trim()}
              className="px-2.5 py-1.5 bg-brand-orange text-white text-xs font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
