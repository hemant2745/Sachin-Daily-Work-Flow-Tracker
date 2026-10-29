import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmailContent } from "@/lib/reminders";
import type { ReminderType } from "@/types/tasks";

/**
 * Scheduled Cron Worker for Automated Email Reminders
 * Can be triggered by Vercel Cron or external scheduler.
 * Target Recipient: sachin.behera@collegevidya.com
 */
export async function GET(request: NextRequest) {
  return handleReminderCron(request);
}

export async function POST(request: NextRequest) {
  return handleReminderCron(request);
}

async function handleReminderCron(request: NextRequest) {
  const startTime = Date.now();

  // 1. Authorization Check: Protect cron endpoint with secret
  const authHeader = request.headers.get("authorization");
  const providedBearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : null;
  const providedQuerySecret = request.nextUrl.searchParams.get("secret");

  const expectedSecret =
    process.env.REMINDER_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();

  // If a secret is configured in environment, require it
  if (expectedSecret) {
    const isAuthorized =
      providedBearerToken === expectedSecret ||
      providedQuerySecret === expectedSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid cron secret." },
        { status: 401 }
      );
    }
  }

  // 2. Initialize Supabase Client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase credentials are not configured in environment." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 3. Query Pending Reminders that are due (scheduled_for <= now)
  const now = new Date();
  const nowISO = now.toISOString();

  // Two hours ago threshold for stale reminder protection
  const staleThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const staleThresholdISO = staleThreshold.toISOString();

  const { data: dueReminders, error: fetchErr } = await supabase
    .from("task_reminders")
    .select(`
      id,
      task_id,
      reminder_type,
      scheduled_for,
      offset_minutes,
      attempt_count,
      status,
      recipient_email,
      task:tasks (
        id,
        title,
        description,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        priority,
        status,
        counselor:counselors (
          id,
          full_name,
          employee_code
        ),
        university:universities (
          id,
          name
        ),
        subtasks (
          id,
          title,
          status
        )
      )
    `)
    .eq("status", "pending")
    .lte("scheduled_for", nowISO)
    .order("scheduled_for", { ascending: true })
    .limit(50); // Process in batches of 50 per execution

  if (fetchErr) {
    return NextResponse.json(
      { error: "Failed to fetch due reminders: " + fetchErr.message },
      { status: 500 }
    );
  }

  const results = {
    totalDue: dueReminders?.length || 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [] as Array<{
      reminderId: string;
      taskId: string;
      action: string;
      reason?: string;
    }>,
  };

  if (!dueReminders || dueReminders.length === 0) {
    return NextResponse.json({
      message: "No pending reminders are due.",
      timestamp: nowISO,
      durationMs: Date.now() - startTime,
      ...results,
    });
  }

  // 4. Process Each Due Reminder
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.REMINDER_FROM_EMAIL?.trim() ||
    "Sachin Behera Workflow <onboarding@resend.dev>";

  for (const reminder of dueReminders) {
    const parentTask: any = Array.isArray(reminder.task) ? reminder.task[0] : reminder.task;

    // Rule A: If parent task does not exist or was deleted, cancel reminder
    if (!parentTask) {
      await supabase
        .from("task_reminders")
        .update({ status: "cancelled", error_message: "Parent task not found" })
        .eq("id", reminder.id);

      results.skipped++;
      results.details.push({
        reminderId: reminder.id,
        taskId: reminder.task_id,
        action: "cancelled",
        reason: "Parent task missing",
      });
      continue;
    }

    // Rule B: Completed or Cancelled tasks must NOT receive future reminders
    if (parentTask.status === "completed" || parentTask.status === "cancelled") {
      await supabase
        .from("task_reminders")
        .update({
          status: "cancelled",
          error_message: `Task is ${parentTask.status}`,
        })
        .eq("id", reminder.id);

      results.skipped++;
      results.details.push({
        reminderId: reminder.id,
        taskId: reminder.task_id,
        action: "cancelled",
        reason: `Task status is ${parentTask.status}`,
      });
      continue;
    }

    // Rule C: Catch-up / Stale Reminder Protection
    // If a reminder was scheduled more than 2 hours ago, skip sending burst email
    if (reminder.scheduled_for < staleThresholdISO) {
      await supabase
        .from("task_reminders")
        .update({
          status: "skipped",
          error_message: "Skipped stale reminder scheduled > 2 hours ago",
        })
        .eq("id", reminder.id);

      results.skipped++;
      results.details.push({
        reminderId: reminder.id,
        taskId: reminder.task_id,
        action: "skipped",
        reason: "Stale reminder (>2 hours past schedule)",
      });
      continue;
    }

    // Rule D: Send Email Notification
    const { subject, html } = generateEmailContent(
      parentTask,
      reminder.reminder_type as ReminderType,
      reminder.offset_minutes
    );

    const recipient = reminder.recipient_email || "sachin.behera@collegevidya.com";

    // If Resend API key is configured, send live email
    if (resendApiKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipient],
            subject,
            html,
          }),
        });

        if (response.ok) {
          await supabase
            .from("task_reminders")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              attempt_count: (reminder.attempt_count || 0) + 1,
              error_message: null,
            })
            .eq("id", reminder.id);

          results.sent++;
          results.details.push({
            reminderId: reminder.id,
            taskId: reminder.task_id,
            action: "sent",
          });
        } else {
          const errData = await response.text();
          await supabase
            .from("task_reminders")
            .update({
              status: reminder.attempt_count >= 2 ? "failed" : "pending", // Retry up to 3 times
              attempt_count: (reminder.attempt_count || 0) + 1,
              last_attempt_at: new Date().toISOString(),
              error_message: `Resend API error (${response.status}): ${errData.substring(0, 300)}`,
            })
            .eq("id", reminder.id);

          results.failed++;
          results.details.push({
            reminderId: reminder.id,
            taskId: reminder.task_id,
            action: "failed",
            reason: `Resend HTTP ${response.status}`,
          });
        }
      } catch (sendErr: any) {
        await supabase
          .from("task_reminders")
          .update({
            status: reminder.attempt_count >= 2 ? "failed" : "pending",
            attempt_count: (reminder.attempt_count || 0) + 1,
            last_attempt_at: new Date().toISOString(),
            error_message: `Network error: ${sendErr?.message || "Unknown error"}`,
          })
          .eq("id", reminder.id);

        results.failed++;
        results.details.push({
          reminderId: reminder.id,
          taskId: reminder.task_id,
          action: "failed",
          reason: sendErr?.message,
        });
      }
    } else {
      // RESEND_API_KEY is not configured yet (e.g. local environment or pre-configuration)
      // Log delivery intent and keep reminder pending or mark simulated
      await supabase
        .from("task_reminders")
        .update({
          attempt_count: (reminder.attempt_count || 0) + 1,
          last_attempt_at: new Date().toISOString(),
          error_message: "RESEND_API_KEY is not configured in environment.",
        })
        .eq("id", reminder.id);

      results.failed++;
      results.details.push({
        reminderId: reminder.id,
        taskId: reminder.task_id,
        action: "pending_provider_setup",
        reason: "RESEND_API_KEY missing in environment variables.",
      });
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: nowISO,
    durationMs: Date.now() - startTime,
    ...results,
  });
}
