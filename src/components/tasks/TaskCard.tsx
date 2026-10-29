"use client";

import React, { useState, useTransition } from "react";
import {
  Calendar,
  Clock,
  User,
  Building2,
  Tag,
  CheckCircle2,
  Circle,
  MoreVertical,
  Edit,
  Trash2,
  Bell,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "@/types/tasks";
import { SubtaskManager } from "./SubtaskManager";
import { toggleTaskCompleteAction } from "@/app/(dashboard)/dashboard/tasks/actions";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRefresh?: () => void;
}

export function TaskCard({ task, onEdit, onDelete, onRefresh }: TaskCardProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isCompleted = task.status === "completed";
  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter((s) => s.status === "completed").length;

  const handleToggleComplete = () => {
    startTransition(async () => {
      await toggleTaskCompleteAction(task.id, !isCompleted);
      onRefresh?.();
    });
  };

  // Priority Styling
  const priorityConfig: Record<
    TaskPriority,
    { label: string; bg: string; text: string; border: string }
  > = {
    urgent: {
      label: "Urgent",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    high: {
      label: "High",
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    medium: {
      label: "Medium",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    low: {
      label: "Low",
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };

  // Status Styling
  const statusConfig: Record<
    TaskStatus,
    { label: string; bg: string; text: string; border: string }
  > = {
    completed: {
      label: "Completed",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    in_progress: {
      label: "In Progress",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    pending: {
      label: "Pending",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
    },
    cancelled: {
      label: "Cancelled",
      bg: "bg-gray-100",
      text: "text-gray-500",
      border: "border-gray-300",
    },
  };

  const currentPriority = priorityConfig[task.priority] || priorityConfig.medium;
  const currentStatus = statusConfig[task.status] || statusConfig.pending;

  // Reminders metrics
  const reminders = task.reminders || [];
  const sentRemindersCount = reminders.filter((r) => r.status === "sent").length;
  const pendingRemindersCount = reminders.filter((r) => r.status === "pending").length;

  return (
    <div
      className={`bg-white border rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${
        isCompleted
          ? "border-emerald-200/80 bg-emerald-50/10"
          : task.priority === "urgent"
          ? "border-red-200 shadow-red-50/50"
          : "border-surface-border hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div>
        {/* Top Badges & Actions Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Status Badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
            >
              {currentStatus.label}
            </span>

            {/* Priority Badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide ${currentPriority.bg} ${currentPriority.text} ${currentPriority.border}`}
            >
              {currentPriority.label}
            </span>

            {/* Category if any */}
            {task.category && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                <span>{task.category}</span>
              </span>
            )}
          </div>

          {/* Quick Actions (Edit, Delete) */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit Task"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Task Title & Description */}
        <div className="flex items-start space-x-2.5">
          <button
            onClick={handleToggleComplete}
            disabled={isPending}
            className="mt-0.5 text-gray-400 hover:text-emerald-600 transition-colors shrink-0"
            title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 hover:text-brand-orange" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-bold text-navy-950 leading-snug ${
                isCompleted ? "line-through text-gray-400" : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600">
          {/* Scheduled Date & Time */}
          <div className="flex items-center space-x-1.5 text-navy-900 font-medium">
            <Calendar className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>{task.scheduled_date}</span>
            <span className="text-gray-400">&bull;</span>
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>
              {task.scheduled_start_time}
              {task.scheduled_end_time ? ` - ${task.scheduled_end_time}` : ` (${task.duration_minutes}m)`}
            </span>
          </div>

          {/* Assigned Counselor */}
          {task.counselor ? (
            <div className="flex items-center space-x-1.5 text-navy-800">
              <User className="w-3.5 h-3.5 text-navy-600 shrink-0" />
              <span className="truncate">
                {task.counselor.full_name} ({task.counselor.employee_code})
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-gray-400 italic">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>No counselor assigned</span>
            </div>
          )}

          {/* Linked University */}
          {task.university ? (
            <div className="flex items-center space-x-1.5 text-navy-800 sm:col-span-2">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate font-medium">{task.university.name}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Subtasks and Reminders Section */}
      <div className="mt-4 pt-2">
        {/* Subtasks Accordion Button */}
        {subtasks.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="w-full flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-navy-800 font-medium transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span>Subtasks Checklist</span>
              <span className="px-1.5 py-0.2 bg-white text-[10px] font-bold rounded text-navy-700 border border-gray-200">
                {completedSubtasksCount}/{subtasks.length}
              </span>
            </div>
            {showSubtasks ? (
              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="text-[11px] text-gray-400 hover:text-brand-orange font-medium flex items-center gap-1"
          >
            <span>+ Add subtasks</span>
          </button>
        )}

        {/* Expandable Subtasks */}
        {showSubtasks && (
          <SubtaskManager
            taskId={task.id}
            subtasks={subtasks}
            onSubtasksUpdated={onRefresh}
          />
        )}

        {/* Reminder Status Indicator */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center space-x-1.5" title="Automated 6-timing email reminders active">
            <Bell className={`w-3.5 h-3.5 ${sentRemindersCount > 0 ? "text-emerald-600" : "text-brand-orange"}`} />
            <span>
              {sentRemindersCount > 0
                ? `${sentRemindersCount}/6 reminders sent`
                : `${pendingRemindersCount} reminders scheduled`}
            </span>
          </div>

          <span className="text-[10px] text-gray-400">
            {task.completed_at ? `Completed ${new Date(task.completed_at).toLocaleDateString()}` : "Active"}
          </span>
        </div>
      </div>
    </div>
  );
}
