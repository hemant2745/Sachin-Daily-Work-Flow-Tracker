"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import {
  parseScheduledDateTimeToUTC,
  calculateAllReminderSchedules,
} from "@/lib/reminders";
import type {
  Task,
  TaskFormData,
  Subtask,
  SubtaskFormData,
  TaskFilterOptions,
  TaskSummaryStats,
  University,
} from "@/types/tasks";

/**
 * Ensures caller is an authorized administrator before executing server action
 */
async function verifyAdminAuth() {
  if (!isSupabaseConfigured()) {
    return {
      isAuthorized: false,
      isConfigured: false,
      error: "Supabase database credentials are not configured in .env.local yet.",
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        isAuthorized: false,
        isConfigured: true,
        error: "Unauthorized: Active administrator session required.",
      };
    }

    const evaluation = evaluateSessionAccess(data.user);
    if (!evaluation.isAuthorized) {
      return {
        isAuthorized: false,
        isConfigured: true,
        error: "Access denied: Account is not authorized as an administrator.",
      };
    }

    return {
      isAuthorized: true,
      isConfigured: true,
      supabase,
      user: data.user,
    };
  } catch (err: any) {
    return {
      isAuthorized: false,
      isConfigured: true,
      error: "Authentication service error: " + (err?.message || "Failed to verify session."),
    };
  }
}

/**
 * Fetches all tasks matching optional filters, with attached counsellors, universities, and subtasks
 */
export async function getTasksAction(filters?: TaskFilterOptions): Promise<{
  success: boolean;
  isConfigured: boolean;
  tasks: Task[];
  summary: TaskSummaryStats;
  error?: string;
}> {
  const fallbackSummary: TaskSummaryStats = {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    cancelledTasks: 0,
    urgentTasks: 0,
    todayTasks: 0,
    completionRate: 0,
  };

  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      isConfigured: auth.isConfigured,
      tasks: [],
      summary: fallbackSummary,
      error: auth.error,
    };
  }

  const supabase = auth.supabase;

  try {
    let query = supabase
      .from("tasks")
      .select(`
        *,
        counselor:counselors(id, full_name, employee_code),
        university:universities(id, name),
        subtasks(*),
        reminders:task_reminders(*)
      `)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_start_time", { ascending: true });

    // Status filter
    if (filters?.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }

    // Priority filter
    if (filters?.priority && filters.priority !== "ALL") {
      query = query.eq("priority", filters.priority);
    }

    // Counselor filter
    if (filters?.counselor_id && filters.counselor_id !== "ALL") {
      query = query.eq("counselor_id", filters.counselor_id);
    }

    // University filter
    if (filters?.university_id && filters.university_id !== "ALL") {
      query = query.eq("university_id", filters.university_id);
    }

    // Date filter
    if (filters?.date && filters.date !== "ALL") {
      query = query.eq("scheduled_date", filters.date);
    }

    const { data: rawTasks, error: tErr } = await query;
    if (tErr) {
      return {
        success: false,
        isConfigured: true,
        tasks: [],
        summary: fallbackSummary,
        error: "Database error retrieving tasks: " + tErr.message,
      };
    }

    let taskList: Task[] = (rawTasks || []).map((t: any) => ({
      ...t,
      subtasks: (t.subtasks || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
      reminders: t.reminders || [],
    }));

    // Today's date string YYYY-MM-DD in IST
    const todayIST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Date range filter
    if (filters?.dateRange) {
      if (filters.dateRange === "today") {
        taskList = taskList.filter((t) => t.scheduled_date === todayIST);
      } else if (filters.dateRange === "upcoming") {
        taskList = taskList.filter((t) => t.scheduled_date >= todayIST && t.status !== "completed");
      } else if (filters.dateRange === "past") {
        taskList = taskList.filter((t) => t.scheduled_date < todayIST || t.status === "completed");
      }
    }

    // Search filter
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      taskList = taskList.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || "").toLowerCase().includes(q);
        const counselorMatch = (t.counselor?.full_name || "").toLowerCase().includes(q) ||
          (t.counselor?.employee_code || "").toLowerCase().includes(q);
        const uniMatch = (t.university?.name || "").toLowerCase().includes(q);
        const catMatch = (t.category || "").toLowerCase().includes(q);
        return titleMatch || descMatch || counselorMatch || uniMatch || catMatch;
      });
    }

    // Calculate Summary Stats from rawTasks (whole dataset)
    const all = rawTasks || [];
    const totalTasks = all.length;
    const pendingTasks = all.filter((t: any) => t.status === "pending").length;
    const inProgressTasks = all.filter((t: any) => t.status === "in_progress").length;
    const completedTasks = all.filter((t: any) => t.status === "completed").length;
    const cancelledTasks = all.filter((t: any) => t.status === "cancelled").length;
    const urgentTasks = all.filter((t: any) => t.priority === "urgent" && t.status !== "completed").length;
    const todayTasks = all.filter((t: any) => t.scheduled_date === todayIST).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const summary: TaskSummaryStats = {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      urgentTasks,
      todayTasks,
      completionRate,
    };

    return {
      success: true,
      isConfigured: true,
      tasks: taskList,
      summary,
    };
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      tasks: [],
      summary: fallbackSummary,
      error: "Unexpected error: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Creates a new task, its subtasks, and generates the 6 initial email reminder schedules
 */
export async function createTaskAction(
  formData: TaskFormData
): Promise<{ success: boolean; task?: Task; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;
  const adminEmail = auth.user?.email || "sachin.behera@collegevidya.com";

  if (!formData.title || !formData.title.trim()) {
    return { success: false, error: "Task title is required." };
  }
  if (!formData.scheduled_date || !formData.scheduled_date.trim()) {
    return { success: false, error: "Scheduled date is required." };
  }
  if (!formData.scheduled_start_time || !formData.scheduled_start_time.trim()) {
    return { success: false, error: "Scheduled start time is required." };
  }

  try {
    const timeZone = formData.timezone || "Asia/Kolkata";
    const scheduledAtUTC = parseScheduledDateTimeToUTC(
      formData.scheduled_date,
      formData.scheduled_start_time,
      timeZone
    );

    const taskPayload = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      scheduled_date: formData.scheduled_date.trim(),
      scheduled_start_time: formData.scheduled_start_time.trim(),
      scheduled_end_time: formData.scheduled_end_time?.trim() || null,
      duration_minutes: Number(formData.duration_minutes) || 30,
      timezone: timeZone,
      scheduled_at: scheduledAtUTC.toISOString(),
      priority: formData.priority || "medium",
      status: formData.status || "pending",
      counselor_id: formData.counselor_id || null,
      university_id: formData.university_id || null,
      category: formData.category?.trim() || null,
      created_by_email: adminEmail,
    };

    // 1. Insert Task
    const { data: createdTask, error: tErr } = await supabase
      .from("tasks")
      .insert(taskPayload)
      .select()
      .single();

    if (tErr || !createdTask) {
      return { success: false, error: "Failed to create task: " + tErr?.message };
    }

    // 2. Insert Subtasks if provided
    if (formData.subtasks && formData.subtasks.length > 0) {
      const subtaskInserts = formData.subtasks
        .filter((s) => s.title && s.title.trim().length > 0)
        .map((s, idx) => ({
          task_id: createdTask.id,
          title: s.title.trim(),
          description: s.description?.trim() || null,
          status: s.status || "pending",
          sort_order: idx,
        }));

      if (subtaskInserts.length > 0) {
        await supabase.from("subtasks").insert(subtaskInserts);
      }
    }

    // 3. Generate and insert the 6 automated reminder schedules
    const reminderSchedules = calculateAllReminderSchedules(scheduledAtUTC);
    const reminderInserts = reminderSchedules.map((r) => ({
      task_id: createdTask.id,
      reminder_type: r.reminderType,
      scheduled_for: r.scheduledFor.toISOString(),
      offset_minutes: r.offsetMinutes,
      status: "pending",
      recipient_email: "sachin.behera@collegevidya.com",
    }));

    await supabase.from("task_reminders").insert(reminderInserts);

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");

    return { success: true, task: createdTask };
  } catch (err: any) {
    return { success: false, error: "Error creating task: " + (err?.message || "Unknown error") };
  }
}

/**
 * Updates an existing task and reconciles reminder schedules
 */
export async function updateTaskAction(
  id: string,
  formData: Partial<TaskFormData>
): Promise<{ success: boolean; task?: Task; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    // Fetch existing task to compare scheduled time and status
    const { data: existing, error: fetchErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: "Task not found." };
    }

    const updates: any = {};
    if (formData.title !== undefined) updates.title = formData.title.trim();
    if (formData.description !== undefined) updates.description = formData.description?.trim() || null;
    if (formData.priority !== undefined) updates.priority = formData.priority;
    if (formData.category !== undefined) updates.category = formData.category?.trim() || null;
    if (formData.counselor_id !== undefined) updates.counselor_id = formData.counselor_id || null;
    if (formData.university_id !== undefined) updates.university_id = formData.university_id || null;
    if (formData.duration_minutes !== undefined) updates.duration_minutes = Number(formData.duration_minutes) || 30;
    if (formData.scheduled_end_time !== undefined) updates.scheduled_end_time = formData.scheduled_end_time?.trim() || null;

    // Check status change
    let statusChanged = false;
    if (formData.status !== undefined && formData.status !== existing.status) {
      updates.status = formData.status;
      statusChanged = true;
      if (formData.status === "completed") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }
    }

    // Check if scheduled date/time changed
    const newDate = formData.scheduled_date || existing.scheduled_date;
    const newTime = formData.scheduled_start_time || existing.scheduled_start_time;
    const newTimezone = formData.timezone || existing.timezone || "Asia/Kolkata";

    const dateOrTimeChanged =
      (formData.scheduled_date && formData.scheduled_date !== existing.scheduled_date) ||
      (formData.scheduled_start_time && formData.scheduled_start_time !== existing.scheduled_start_time);

    let newScheduledAtUTC: Date | null = null;
    if (dateOrTimeChanged) {
      updates.scheduled_date = newDate;
      updates.scheduled_start_time = newTime;
      updates.timezone = newTimezone;
      newScheduledAtUTC = parseScheduledDateTimeToUTC(newDate, newTime, newTimezone);
      updates.scheduled_at = newScheduledAtUTC.toISOString();
    }

    // 1. Update Task Record
    const { data: updatedTask, error: updateErr } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: "Failed to update task: " + updateErr.message };
    }

    // 2. Reconcile Reminders
    if (statusChanged && (updates.status === "completed" || updates.status === "cancelled")) {
      // Cancel pending reminders for completed or cancelled tasks
      await supabase
        .from("task_reminders")
        .update({ status: "cancelled" })
        .eq("task_id", id)
        .eq("status", "pending");
    } else if (dateOrTimeChanged && newScheduledAtUTC) {
      // Reschedule outstanding/pending reminders
      const newSchedules = calculateAllReminderSchedules(newScheduledAtUTC);
      for (const s of newSchedules) {
        // Upsert pending reminders for this task
        await supabase
          .from("task_reminders")
          .update({
            scheduled_for: s.scheduledFor.toISOString(),
            status: "pending",
          })
          .eq("task_id", id)
          .eq("reminder_type", s.reminderType)
          .in("status", ["pending", "cancelled", "failed"]);
      }
    } else if (statusChanged && (updates.status === "pending" || updates.status === "in_progress")) {
      // Re-enable cancelled reminders if task is reverted to pending
      await supabase
        .from("task_reminders")
        .update({ status: "pending" })
        .eq("task_id", id)
        .eq("status", "cancelled");
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");

    return { success: true, task: updatedTask };
  } catch (err: any) {
    return { success: false, error: "Error updating task: " + (err?.message || "Unknown error") };
  }
}

/**
 * Deletes a task, its subtasks, and all scheduled reminders
 */
export async function deleteTaskAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    const { error: delErr } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (delErr) {
      return { success: false, error: "Failed to delete task: " + delErr.message };
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Error deleting task: " + (err?.message || "Unknown error") };
  }
}

/**
 * Toggles a task's completion status
 */
export async function toggleTaskCompleteAction(
  id: string,
  isCompleted: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateTaskAction(id, {
    status: isCompleted ? "completed" : "pending",
  });
}

/**
 * Subtask Actions
 */
export async function createSubtaskAction(
  taskId: string,
  formData: SubtaskFormData
): Promise<{ success: boolean; subtask?: Subtask; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  if (!formData.title || !formData.title.trim()) {
    return { success: false, error: "Subtask title is required." };
  }

  try {
    const { data, error } = await supabase
      .from("subtasks")
      .insert({
        task_id: taskId,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        due_date: formData.due_date || null,
        due_time: formData.due_time || null,
        status: formData.status || "pending",
        sort_order: formData.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: "Failed to create subtask: " + error.message };
    }

    revalidatePath("/dashboard/tasks");
    return { success: true, subtask: data };
  } catch (err: any) {
    return { success: false, error: "Error creating subtask: " + (err?.message || "Unknown error") };
  }
}

export async function updateSubtaskAction(
  id: string,
  formData: Partial<SubtaskFormData>
): Promise<{ success: boolean; subtask?: Subtask; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    const updates: any = {};
    if (formData.title !== undefined) updates.title = formData.title.trim();
    if (formData.description !== undefined) updates.description = formData.description?.trim() || null;
    if (formData.due_date !== undefined) updates.due_date = formData.due_date || null;
    if (formData.due_time !== undefined) updates.due_time = formData.due_time || null;
    if (formData.sort_order !== undefined) updates.sort_order = formData.sort_order;
    if (formData.status !== undefined) {
      updates.status = formData.status;
      updates.completed_at = formData.status === "completed" ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from("subtasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: "Failed to update subtask: " + error.message };
    }

    revalidatePath("/dashboard/tasks");
    return { success: true, subtask: data };
  } catch (err: any) {
    return { success: false, error: "Error updating subtask: " + (err?.message || "Unknown error") };
  }
}

export async function toggleSubtaskCompleteAction(
  id: string,
  isCompleted: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateSubtaskAction(id, {
    status: isCompleted ? "completed" : "pending",
  });
}

export async function deleteSubtaskAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const supabase = auth.supabase;

  try {
    const { error } = await supabase.from("subtasks").delete().eq("id", id);
    if (error) {
      return { success: false, error: "Failed to delete subtask: " + error.message };
    }

    revalidatePath("/dashboard/tasks");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Error deleting subtask: " + (err?.message || "Unknown error") };
  }
}

/**
 * Creates a new university on-the-fly and returns the record
 */
export async function createUniversityAction(
  name: string
): Promise<{ success: boolean; university?: University; error?: string }> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { success: false, error: auth.error };
  }

  const cleanName = (name || "").trim();
  if (!cleanName) {
    return { success: false, error: "University name cannot be empty." };
  }

  const supabase = auth.supabase;

  try {
    const { data, error } = await supabase
      .from("universities")
      .insert({ name: cleanName, is_active: true })
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.message.includes("unique")) {
        // If already exists, fetch existing
        const { data: existing } = await supabase
          .from("universities")
          .select("*")
          .ilike("name", cleanName)
          .single();
        if (existing) {
          return { success: true, university: existing };
        }
      }
      return { success: false, error: "Failed to create university: " + error.message };
    }

    revalidatePath("/dashboard/universities");
    revalidatePath("/dashboard/tasks");
    return { success: true, university: data };
  } catch (err: any) {
    return { success: false, error: "Error creating university: " + (err?.message || "Unknown error") };
  }
}

/**
 * Fetches counselors and universities for task form dropdowns
 */
export async function getCounselorsAndUniversitiesAction(): Promise<{
  counselors: Array<{ id: string; full_name: string; employee_code: string; is_active: boolean }>;
  universities: University[];
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return { counselors: [], universities: [] };
  }

  const supabase = auth.supabase;

  try {
    const [cRes, uRes] = await Promise.all([
      supabase.from("counselors").select("id, full_name, employee_code, is_active").order("full_name"),
      supabase.from("universities").select("*").eq("is_active", true).order("name"),
    ]);

    return {
      counselors: cRes.data || [],
      universities: uRes.data || [],
    };
  } catch {
    return { counselors: [], universities: [] };
  }
}
