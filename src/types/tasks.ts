export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type SubtaskStatus = "pending" | "completed";

export type ReminderType =
  | "before_60m"
  | "before_30m"
  | "before_15m"
  | "after_15m"
  | "after_30m"
  | "after_60m";

export type ReminderStatus = "pending" | "sent" | "failed" | "cancelled" | "skipped";

export interface University {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  description?: string | null;
  status: SubtaskStatus;
  due_date?: string | null;
  due_time?: string | null;
  sort_order: number;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskReminder {
  id: string;
  task_id: string;
  reminder_type: ReminderType;
  scheduled_for: string; // ISO UTC string
  offset_minutes: number;
  status: ReminderStatus;
  sent_at?: string | null;
  recipient_email: string;
  attempt_count: number;
  last_attempt_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_start_time: string; // HH:mm:ss or HH:mm
  scheduled_end_time?: string | null;
  duration_minutes: number;
  timezone: string;
  scheduled_at: string; // ISO string in UTC
  priority: TaskPriority;
  status: TaskStatus;
  counselor_id?: string | null;
  university_id?: string | null;
  category?: string | null;
  created_by_email: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Attached relations
  counselor?: {
    id: string;
    full_name: string;
    employee_code: string;
  } | null;
  university?: {
    id: string;
    name: string;
  } | null;
  subtasks?: Subtask[];
  reminders?: TaskReminder[];
}

export interface TaskFormData {
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time?: string;
  duration_minutes?: number;
  timezone?: string;
  priority: TaskPriority;
  status: TaskStatus;
  counselor_id?: string;
  university_id?: string;
  category?: string;
  subtasks?: Array<{
    id?: string;
    title: string;
    description?: string;
    status?: SubtaskStatus;
  }>;
}

export interface SubtaskFormData {
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  sort_order?: number;
  status?: SubtaskStatus;
}

export interface TaskFilterOptions {
  search?: string;
  status?: string; // 'ALL' or specific
  priority?: string; // 'ALL' or specific
  counselor_id?: string; // 'ALL' or specific
  university_id?: string; // 'ALL' or specific
  date?: string; // specific date or 'ALL'
  dateRange?: "all" | "today" | "upcoming" | "past";
}

export interface TaskSummaryStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  urgentTasks: number;
  todayTasks: number;
  completionRate: number; // percentage (0-100)
}
