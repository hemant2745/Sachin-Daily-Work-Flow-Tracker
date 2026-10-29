"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Building2,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { Task, TaskFormData, TaskPriority, TaskStatus, University } from "@/types/tasks";
import { createUniversityAction } from "@/app/(dashboard)/dashboard/tasks/actions";

interface CounselorOption {
  id: string;
  full_name: string;
  employee_code: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<{ success: boolean; error?: string }>;
  task?: Task | null;
  counselors: CounselorOption[];
  universities: University[];
  onUniversityCreated?: (newUni: University) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  counselors = [],
  universities = [],
  onUniversityCreated,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState("10:00");
  const [scheduledEndTime, setScheduledEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [counselorId, setCounselorId] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [category, setCategory] = useState("");

  // Subtask drafting while creating/editing
  const [draftSubtasks, setDraftSubtasks] = useState<Array<{ id?: string; title: string; status: "pending" | "completed" }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Inline University creation state
  const [isAddingUni, setIsAddingUni] = useState(false);
  const [newUniName, setNewUniName] = useState("");
  const [uniError, setUniError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  // Populate or reset form
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setScheduledDate(task.scheduled_date);
      setScheduledStartTime(task.scheduled_start_time ? task.scheduled_start_time.substring(0, 5) : "10:00");
      setScheduledEndTime(task.scheduled_end_time ? task.scheduled_end_time.substring(0, 5) : "");
      setDurationMinutes(task.duration_minutes || 30);
      setPriority(task.priority);
      setStatus(task.status);
      setCounselorId(task.counselor_id || "");
      setUniversityId(task.university_id || "");
      setCategory(task.category || "");
      setDraftSubtasks(
        (task.subtasks || []).map((s) => ({
          id: s.id,
          title: s.title,
          status: s.status,
        }))
      );
    } else {
      // Default to today's date in IST
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      setTitle("");
      setDescription("");
      setScheduledDate(today);
      setScheduledStartTime("10:00");
      setScheduledEndTime("");
      setDurationMinutes(30);
      setPriority("medium");
      setStatus("pending");
      setCounselorId("");
      setUniversityId("");
      setCategory("");
      setDraftSubtasks([]);
    }
    setErrors({});
    setGeneralError(null);
    setIsAddingUni(false);
    setNewUniName("");
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleAddDraftSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setDraftSubtasks([
      ...draftSubtasks,
      { title: newSubtaskTitle.trim(), status: "pending" },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveDraftSubtask = (index: number) => {
    setDraftSubtasks(draftSubtasks.filter((_, i) => i !== index));
  };

  const handleCreateUniversity = async () => {
    if (!newUniName.trim()) return;
    setUniError(null);

    const res = await createUniversityAction(newUniName.trim());
    if (res.success && res.university) {
      onUniversityCreated?.(res.university);
      setUniversityId(res.university.id);
      setIsAddingUni(false);
      setNewUniName("");
    } else {
      setUniError(res.error || "Failed to create university");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    // Client-side validation
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = "Task title is required.";
    }
    if (!scheduledDate.trim()) {
      errs.scheduled_date = "Scheduled date is required.";
    }
    if (!scheduledStartTime.trim()) {
      errs.scheduled_start_time = "Start time is required.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: TaskFormData = {
      title: title.trim(),
      description: description.trim() || undefined,
      scheduled_date: scheduledDate.trim(),
      scheduled_start_time: scheduledStartTime.trim(),
      scheduled_end_time: scheduledEndTime.trim() || undefined,
      duration_minutes: Number(durationMinutes) || 30,
      priority,
      status,
      counselor_id: counselorId || undefined,
      university_id: universityId || undefined,
      category: category.trim() || undefined,
      subtasks: draftSubtasks,
    };

    startTransition(async () => {
      const result = await onSubmit(payload);
      if (result.success) {
        onClose();
      } else {
        setGeneralError(result.error || "Failed to save task.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-surface-border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-navy-950">
              {task ? "Edit Task" : "Create New Task"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated 6-interval email reminders (-60m, -30m, -15m, +15m, +30m, +60m) will be scheduled.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {generalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Task Title (Required) */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up on document verification for LPU Online"
              className={`w-full px-3.5 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-[11px] text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Description / Action Items
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context, required documents, or instructions..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                <span>Scheduled Date *</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                  errors.scheduled_date ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.scheduled_date && (
                <p className="text-[11px] text-red-600 mt-1">{errors.scheduled_date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-orange" />
                <span>Start Time (IST) *</span>
              </label>
              <input
                type="time"
                value={scheduledStartTime}
                onChange={(e) => setScheduledStartTime(e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                  errors.scheduled_start_time ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.scheduled_start_time && (
                <p className="text-[11px] text-red-600 mt-1">{errors.scheduled_start_time}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
                placeholder="30"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Priority & Status & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange font-semibold"
                disabled={isSubmitting}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange font-semibold"
                disabled={isSubmitting}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                <span>Category (Optional)</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Call, Review, Verification"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Assigned Counselor & University */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-gray-100">
            {/* Counselor Selection */}
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-brand-orange" />
                <span>Assigned Counselor (Optional)</span>
              </label>
              <select
                value={counselorId}
                onChange={(e) => setCounselorId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                disabled={isSubmitting}
              >
                <option value="">-- No Counselor Assigned --</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.employee_code})
                  </option>
                ))}
              </select>
            </div>

            {/* University Selection with Inline Add */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-navy-900 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Linked University (Optional)</span>
                </label>
                {!isAddingUni && (
                  <button
                    type="button"
                    onClick={() => setIsAddingUni(true)}
                    className="text-[11px] font-semibold text-brand-orange hover:text-orange-600"
                  >
                    + Add New
                  </button>
                )}
              </div>

              {!isAddingUni ? (
                <select
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  disabled={isSubmitting}
                >
                  <option value="">-- No University Linked --</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newUniName}
                      onChange={(e) => setNewUniName(e.target.value)}
                      placeholder="Enter new university name..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-brand-orange rounded-lg focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateUniversity}
                      className="px-2.5 py-1.5 bg-brand-orange text-white text-xs font-semibold rounded-lg hover:bg-orange-600"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingUni(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {uniError && <p className="text-[11px] text-red-600">{uniError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Subtask Drafting List */}
          <div className="pt-3 border-t border-gray-100">
            <label className="block text-xs font-semibold text-navy-900 mb-2">
              Subtasks Checklist ({draftSubtasks.length})
            </label>

            {draftSubtasks.length > 0 && (
              <div className="space-y-1.5 mb-2.5 max-h-36 overflow-y-auto">
                {draftSubtasks.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs text-navy-800"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                      <span>{st.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftSubtask(i)}
                      className="text-gray-400 hover:text-red-600 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a subtask item..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDraftSubtask();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddDraftSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-800 text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors"
              >
                + Add
              </button>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Saving Task..." : task ? "Update Task" : "Create Task"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
