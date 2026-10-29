"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Building2,
  User,
  ListTodo,
  Grid,
  Table as TableIcon,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import type {
  Task,
  TaskFormData,
  TaskPriority,
  TaskStatus,
  University,
  TaskSummaryStats,
} from "@/types/tasks";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { DeleteTaskModal } from "./DeleteTaskModal";
import {
  getTasksAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskCompleteAction,
} from "@/app/(dashboard)/dashboard/tasks/actions";

interface CounselorOption {
  id: string;
  full_name: string;
  employee_code: string;
}

interface TaskManagerProps {
  initialTasks: Task[];
  initialCounselors: CounselorOption[];
  initialUniversities: University[];
}

export function TaskManager({
  initialTasks,
  initialCounselors,
  initialUniversities,
}: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [counselors] = useState<CounselorOption[]>(initialCounselors);
  const [universities, setUniversities] = useState<University[]>(initialUniversities);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [counselorFilter, setCounselorFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "upcoming" | "past">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [, startTransition] = useTransition();

  // Show temporary toast message
  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Re-fetch tasks from server
  const refreshTasks = async () => {
    setIsRefreshing(true);
    try {
      const res = await getTasksAction();
      if (res.tasks) {
        setTasks(res.tasks);
      }
    } catch {
      showFeedback("error", "Failed to refresh task list.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  // Handle Create or Update
  const handleSaveTask = async (data: TaskFormData) => {
    try {
      if (taskToEdit) {
        const res = await updateTaskAction(taskToEdit.id, data);
        if (res.success) {
          showFeedback("success", "Task updated successfully!");
          await refreshTasks();
          return { success: true };
        } else {
          return { success: false, error: res.error || "Failed to update task" };
        }
      } else {
        const res = await createTaskAction(data);
        if (res.success) {
          showFeedback("success", "Task created successfully with 6 scheduled reminders!");
          await refreshTasks();
          return { success: true };
        } else {
          return { success: false, error: res.error || "Failed to create task" };
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      return { success: false, error: msg };
    }
  };

  // Handle Delete
  const handleConfirmDelete = async (taskId: string) => {
    try {
      const res = await deleteTaskAction(taskId);
      if (res.success) {
        showFeedback("success", "Task and associated reminders deleted.");
        await refreshTasks();
        return { success: true };
      } else {
        showFeedback("error", res.error || "Failed to delete task.");
        return { success: false, error: res.error };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting task";
      showFeedback("error", msg);
      return { success: false, error: msg };
    }
  };

  // Handle new university added inside TaskModal
  const handleUniversityCreated = (newUni: University) => {
    setUniversities((prev) => [...prev, newUni].sort((a, b) => a.name.localeCompare(b.name)));
  };

  // Today's date string in YYYY-MM-DD
  const todayDateStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }, []);

  // Compute Summary Statistics
  const stats: TaskSummaryStats = useMemo(() => {
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;
    let cancelledTasks = 0;
    let urgentTasks = 0;
    let todayTasks = 0;

    tasks.forEach((t) => {
      if (t.status === "completed") {
        completedTasks++;
      } else if (t.status === "in_progress") {
        inProgressTasks++;
      } else if (t.status === "cancelled") {
        cancelledTasks++;
      } else {
        pendingTasks++;
      }

      if (t.priority === "urgent" || t.priority === "high") {
        urgentTasks++;
      }

      if (t.scheduled_date === todayDateStr) {
        todayTasks++;
      }
    });

    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      urgentTasks,
      todayTasks,
      completionRate,
    };
  }, [tasks, todayDateStr]);

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || "").toLowerCase().includes(q);
        const matchesCounselor = task.counselor?.full_name.toLowerCase().includes(q);
        const matchesUniversity = task.university?.name.toLowerCase().includes(q);
        const matchesCategory = (task.category || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCounselor && !matchesUniversity && !matchesCategory) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      // Priority
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Counselor
      if (counselorFilter !== "all" && task.counselor_id !== counselorFilter) {
        return false;
      }

      // University
      if (universityFilter !== "all" && task.university_id !== universityFilter) {
        return false;
      }

      // Date
      if (dateFilter === "today" && task.scheduled_date !== todayDateStr) {
        return false;
      }
      if (dateFilter === "upcoming" && task.scheduled_date <= todayDateStr) {
        return false;
      }
      if (dateFilter === "past" && task.scheduled_date >= todayDateStr) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, counselorFilter, universityFilter, dateFilter, todayDateStr]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2 transition-all duration-300 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <ListTodo className="w-7 h-7 text-indigo-600" />
            <span>Task Management</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize daily tasks, track subtasks, and manage automated 6-step email reminders for Sachin Behera.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshTasks}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            title="Refresh tasks"
          >
            <RotateCcw className={`w-4 h-4 mr-1.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Task
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pending</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{stats.pendingTasks}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">In Progress</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">{stats.inProgressTasks}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Completed</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{stats.completedTasks}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">Today</div>
          <div className="mt-1 text-2xl font-bold text-purple-700">{stats.todayTasks}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-rose-600 uppercase tracking-wider flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Urgent / High</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-700">{stats.urgentTasks}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, descriptions, counselors, universities..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Quick Date Range Filter */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 self-start md:self-auto">
            {(
              [
                { id: "all", label: "All Dates" },
                { id: "today", label: "Today" },
                { id: "upcoming", label: "Upcoming" },
                { id: "past", label: "Past" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  dateFilter === tab.id
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 self-start md:self-auto">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md ${
                viewMode === "cards" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
              title="Cards view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md ${
                viewMode === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 text-xs">
          {/* Status */}
          <div>
            <label className="block font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-medium text-gray-500 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Counselor */}
          <div>
            <label className="block font-medium text-gray-500 mb-1">Counselor</label>
            <select
              value={counselorFilter}
              onChange={(e) => setCounselorFilter(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 truncate"
            >
              <option value="all">All Counselors</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.employee_code})
                </option>
              ))}
            </select>
          </div>

          {/* University */}
          <div>
            <label className="block font-medium text-gray-500 mb-1">University</label>
            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 truncate"
            >
              <option value="all">All Universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters helper */}
        {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || counselorFilter !== "all" || universityFilter !== "all" || dateFilter !== "all") && (
          <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredTasks.length} of {tasks.length} tasks
            </span>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setCounselorFilter("all");
                setUniversityFilter("all");
                setDateFilter("all");
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Task Content List / Table */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No tasks found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {tasks.length === 0
              ? "Get started by creating your first task. Six automated email reminders will be scheduled for Sachin."
              : "No tasks matched your active search and filter criteria."}
          </p>
          <div className="mt-5">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Task
            </button>
          </div>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleOpenEditModal}
              onDelete={(t) => setTaskToDelete(t)}
              onRefresh={refreshTasks}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">Status</th>
                  <th scope="col" className="px-4 py-3 text-left">Title</th>
                  <th scope="col" className="px-4 py-3 text-left">Scheduled Time (IST)</th>
                  <th scope="col" className="px-4 py-3 text-left">Priority</th>
                  <th scope="col" className="px-4 py-3 text-left">Counselor / University</th>
                  <th scope="col" className="px-4 py-3 text-left">Subtasks</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === "completed";
                  const subtasks = task.subtasks || [];
                  const completedSubs = subtasks.filter((s) => s.status === "completed").length;

                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            startTransition(async () => {
                              await toggleTaskCompleteAction(task.id, !isCompleted);
                              await refreshTasks();
                            });
                          }}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {task.status}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-medium ${isCompleted ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {task.title}
                        </div>
                        {task.category && (
                          <div className="text-xs text-gray-400 mt-0.5">{task.category}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        <div className="font-medium text-gray-900">{task.scheduled_date}</div>
                        <div className="text-xs text-gray-500">
                          {task.scheduled_start_time}
                          {task.scheduled_end_time ? ` - ${task.scheduled_end_time}` : ""} (IST)
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                            task.priority === "urgent"
                              ? "bg-rose-100 text-rose-800"
                              : task.priority === "high"
                              ? "bg-orange-100 text-orange-800"
                              : task.priority === "medium"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {task.counselor && (
                          <div className="flex items-center space-x-1 text-gray-700">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{task.counselor.full_name}</span>
                          </div>
                        )}
                        {task.university && (
                          <div className="flex items-center space-x-1 text-indigo-600 mt-0.5">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{task.university.name}</span>
                          </div>
                        )}
                        {!task.counselor && !task.university && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {subtasks.length > 0 ? (
                          <span>
                            {completedSubs}/{subtasks.length} completed
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(task)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setTaskToDelete(task)}
                          className="text-rose-600 hover:text-rose-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleSaveTask}
        task={taskToEdit}
        counselors={counselors}
        universities={universities}
        onUniversityCreated={handleUniversityCreated}
      />

      {/* Task Deletion Confirmation Modal */}
      <DeleteTaskModal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        task={taskToDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
