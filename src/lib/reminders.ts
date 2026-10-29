import type { ReminderType } from "@/types/tasks";

export interface ReminderDefinition {
  type: ReminderType;
  offsetMinutes: number; // negative for before, positive for after
  label: string;
}

export const REMINDER_DEFINITIONS: readonly ReminderDefinition[] = [
  { type: "before_60m", offsetMinutes: -60, label: "60 minutes before" },
  { type: "before_30m", offsetMinutes: -30, label: "30 minutes before" },
  { type: "before_15m", offsetMinutes: -15, label: "15 minutes before" },
  { type: "after_15m", offsetMinutes: 15, label: "15 minutes after" },
  { type: "after_30m", offsetMinutes: 30, label: "30 minutes after" },
  { type: "after_60m", offsetMinutes: 60, label: "60 minutes after" },
] as const;

/**
 * Parses a date (YYYY-MM-DD) and time (HH:mm or HH:mm:ss) string in a specific timezone
 * and returns the exact UTC Date.
 * Defaults to Asia/Kolkata (IST = UTC+05:30).
 */
export function parseScheduledDateTimeToUTC(
  dateStr: string,
  timeStr: string,
  timeZone: string = "Asia/Kolkata"
): Date {
  // Normalize time format to HH:mm:ss
  const cleanTime = timeStr.trim();
  const timeParts = cleanTime.split(":");
  const hours = timeParts[0].padStart(2, "0");
  const minutes = (timeParts[1] || "00").padStart(2, "0");
  const seconds = (timeParts[2] || "00").padStart(2, "0");
  const formattedTime = `${hours}:${minutes}:${seconds}`;

  // If timeZone is Asia/Kolkata (standard for College Vidya / Sachin Behera)
  if (timeZone === "Asia/Kolkata" || timeZone === "IST") {
    // Construct ISO string with +05:30 offset
    const isoString = `${dateStr.trim()}T${formattedTime}+05:30`;
    const date = new Date(isoString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // General fallback using Intl
  try {
    const rawGuess = new Date(`${dateStr.trim()}T${formattedTime}Z`);
    // Adjust for target timezone offset
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    
    // For Asia/Kolkata specifically:
    // IST is fixed UTC+05:30 (no daylight saving time changes)
    const [y, m, d] = dateStr.trim().split("-").map(Number);
    const [hh, mm, ss] = [Number(hours), Number(minutes), Number(seconds)];
    // UTC ms = Local ms - (5h 30m in ms)
    const utcMs = Date.UTC(y, m - 1, d, hh, mm, ss) - (5 * 60 + 30) * 60 * 1000;
    return new Date(utcMs);
  } catch {
    return new Date(`${dateStr.trim()}T${formattedTime}+05:30`);
  }
}

/**
 * Calculates the exact scheduled UTC timestamps for all 6 required reminder offsets.
 */
export function calculateAllReminderSchedules(
  scheduledAtUTC: Date | string
): Array<{
  reminderType: ReminderType;
  offsetMinutes: number;
  scheduledFor: Date;
}> {
  const baseDate = typeof scheduledAtUTC === "string" ? new Date(scheduledAtUTC) : scheduledAtUTC;
  const baseMs = baseDate.getTime();

  return REMINDER_DEFINITIONS.map((def) => {
    const reminderMs = baseMs + def.offsetMinutes * 60 * 1000;
    return {
      reminderType: def.type,
      offsetMinutes: def.offsetMinutes,
      scheduledFor: new Date(reminderMs),
    };
  });
}

/**
 * Formats a Date or ISO string into friendly Indian Standard Time (IST) representation.
 */
export function formatInIST(
  dateInput: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat("en-IN", options || defaultOptions).format(date);
}

/**
 * Generates email subject line and HTML content for reminders
 */
export function generateEmailContent(task: {
  title: string;
  description?: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time?: string | null;
  priority: string;
  status: string;
  counselor?: { full_name: string; employee_code: string } | null;
  university?: { name: string } | null;
  subtasks?: Array<{ title: string; status: string }> | null;
}, reminderType: ReminderType, offsetMinutes: number): {
  subject: string;
  html: string;
} {
  const isBefore = offsetMinutes < 0;
  const absMinutes = Math.abs(offsetMinutes);

  let urgencyPrefix = "";
  if (task.priority === "urgent") urgencyPrefix = "[URGENT] ";
  else if (task.priority === "high") urgencyPrefix = "[HIGH PRIORITY] ";

  const statusLabel = isBefore
    ? `starts in ${absMinutes} minutes`
    : `is now ${absMinutes} minutes overdue`;

  const subject = isBefore
    ? `${urgencyPrefix}Task Reminder: "${task.title}" starts in ${absMinutes} minutes`
    : `${urgencyPrefix}Task Follow-up: "${task.title}" is ${absMinutes} minutes overdue`;

  const priorityColor =
    task.priority === "urgent"
      ? "#dc2626"
      : task.priority === "high"
      ? "#ea580c"
      : task.priority === "medium"
      ? "#2563eb"
      : "#16a34a";

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasksCount = task.subtasks?.filter((s) => s.status === "completed").length || 0;

  const subtasksHtml =
    subtasksCount > 0
      ? `
      <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1e293b;">
          Subtask Checklist (${completedSubtasksCount} of ${subtasksCount} completed):
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
          ${task.subtasks
            ?.map(
              (s) =>
                `<li style="margin-bottom: 4px; ${s.status === "completed" ? "text-decoration: line-through; color: #94a3b8;" : ""}">
                  ${s.title} ${s.status === "completed" ? "✓" : "○"}
                </li>`
            )
            .join("")}
        </ul>
      </div>
    `
      : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0b192c; padding: 20px 24px; border-bottom: 3px solid #ff6500;">
              <table width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                      Sachin Behera Daily Workflow
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
                      Automated Task Reminders & Tracking
                    </p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: ${isBefore ? "#1e293b" : "#7f1d1d"}; color: #ffffff; font-size: 11px; font-weight: 600; border-radius: 9999px; text-transform: uppercase;">
                      ${isBefore ? `${absMinutes}m Before` : `${absMinutes}m Overdue`}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 24px;">
              <div style="background-color: ${isBefore ? "#eff6ff" : "#fff7ed"}; border-left: 4px solid ${isBefore ? "#3b82f6" : "#f97316"}; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${isBefore ? "#1e40af" : "#9a3412"};">
                  ${isBefore ? "Scheduled Task Starting Soon" : "Action Required: Task Follow-up"}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: ${isBefore ? "#1e3a8a" : "#7c2d12"};">
                  This task <strong>${statusLabel}</strong>.
                </p>
              </div>

              <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0b192c;">
                ${task.title}
              </h2>

              ${task.description ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.5;">${task.description}</p>` : ""}

              <table width="100%" style="margin-top: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9; padding: 12px; font-size: 13px;">
                <tr>
                  <td style="padding: 6px; color: #64748b; width: 140px;">Scheduled Date:</td>
                  <td style="padding: 6px; font-weight: 600; color: #0f172a;">${task.scheduled_date}</td>
                </tr>
                <tr>
                  <td style="padding: 6px; color: #64748b;">Scheduled Time:</td>
                  <td style="padding: 6px; font-weight: 600; color: #0f172a;">${task.scheduled_start_time} IST</td>
                </tr>
                <tr>
                  <td style="padding: 6px; color: #64748b;">Priority:</td>
                  <td style="padding: 6px; font-weight: 700; color: ${priorityColor}; text-transform: uppercase;">
                    ${task.priority}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px; color: #64748b;">Status:</td>
                  <td style="padding: 6px; font-weight: 600; color: #0f172a; text-transform: capitalize;">
                    ${task.status.replace("_", " ")}
                  </td>
                </tr>
                ${task.counselor ? `
                <tr>
                  <td style="padding: 6px; color: #64748b;">Assigned Counselor:</td>
                  <td style="padding: 6px; font-weight: 600; color: #0f172a;">
                    ${task.counselor.full_name} (${task.counselor.employee_code})
                  </td>
                </tr>` : ""}
                ${task.university ? `
                <tr>
                  <td style="padding: 6px; color: #64748b;">Linked University:</td>
                  <td style="padding: 6px; font-weight: 600; color: #0f172a;">
                    ${task.university.name}
                  </td>
                </tr>` : ""}
              </table>

              ${subtasksHtml}

              <div style="margin-top: 24px; text-align: center;">
                <a href="https://sachin-daily-work-flow-tracker.vercel.app/dashboard/tasks" style="display: inline-block; padding: 12px 24px; background-color: #ff6500; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(255, 101, 0, 0.25);">
                  Open Task Management Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
              This notification was delivered to <strong>sachin.behera@collegevidya.com</strong>.
              <br>
              Sachin Behera Daily Workflow &bull; Single-Administrator System &bull; College Vidya
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}
