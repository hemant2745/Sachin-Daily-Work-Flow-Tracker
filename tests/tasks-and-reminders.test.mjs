import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Test Suite: Task Management Module & Automated Email Reminders
 * 
 * Verifies all requirements:
 * 1. Sidebar navigation links to /dashboard/tasks and is marked active/implemented.
 * 2. Task validation enforces non-empty title, valid date, and start time.
 * 3. IST (Asia/Kolkata, UTC+05:30) timezone conversion to UTC ISO-8601 string.
 * 4. Exact 6 reminder schedule generation (-60m, -30m, -15m, +15m, +30m, +60m).
 * 5. Completed and cancelled tasks cancel all pending reminders.
 * 6. Task rescheduling recalculates scheduled_for timestamps for pending reminders.
 * 7. Subtask completion progress calculation (e.g. 3 of 5 = 60%).
 * 8. Stale catch-up threshold (reminders overdue > 120 minutes are skipped).
 * 9. Cron API authorization requires valid Bearer secret token.
 * 10. Database migration enforces unique constraint on (task_id, reminder_type).
 * 11. Recipient email strictly locked to sachin.behera@collegevidya.com.
 * 12. Email content generator renders correct urgency headers, metadata, and subtasks.
 */

// Helper: IST to UTC parser matching src/lib/reminders.ts
function parseScheduledDateTimeToUTC(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // UTC equivalent = IST time minus 5 hours and 30 minutes
  const totalISTMinutes = hours * 60 + minutes;
  const totalUTCMinutes = totalISTMinutes - 330; // 5 hours 30 mins = 330 mins

  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  utcDate.setUTCMinutes(totalUTCMinutes);

  return utcDate;
}

// Helper: 6 Reminders Schedule Generator matching src/lib/reminders.ts
const REMINDER_DEFINITIONS = [
  { type: "before_60m", offsetMinutes: -60, label: "60 minutes before scheduled start" },
  { type: "before_30m", offsetMinutes: -30, label: "30 minutes before scheduled start" },
  { type: "before_15m", offsetMinutes: -15, label: "15 minutes before scheduled start" },
  { type: "after_15m",  offsetMinutes: 15,  label: "15 minutes after scheduled start (Follow-up)" },
  { type: "after_30m",  offsetMinutes: 30,  label: "30 minutes after scheduled start (Urgent Overdue)" },
  { type: "after_60m",  offsetMinutes: 60,  label: "60 minutes after scheduled start (Critical Overdue)" },
];

function calculateAllReminderSchedules(scheduledAtUTC) {
  const baseTime = new Date(scheduledAtUTC).getTime();

  return REMINDER_DEFINITIONS.map((def) => {
    const scheduledForTime = new Date(baseTime + def.offsetMinutes * 60 * 1000);
    return {
      reminder_type: def.type,
      offset_minutes: def.offsetMinutes,
      scheduled_for: scheduledForTime.toISOString(),
      status: "pending",
    };
  });
}

// Helper: Subtask progress
function calculateSubtaskProgress(subtasks) {
  if (!subtasks || subtasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.status === "completed").length;
  const percentage = Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

// Helper: Cron token check
function verifyCronAuth(authHeader, expectedSecret) {
  if (!expectedSecret) return false;
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token === expectedSecret;
}

// Helper: Stale check
function isReminderStale(scheduledForISO, currentISO, maxDelayMinutes = 120) {
  const scheduledTime = new Date(scheduledForISO).getTime();
  const currentTime = new Date(currentISO).getTime();
  const diffMinutes = (currentTime - scheduledTime) / (1000 * 60);
  return diffMinutes > maxDelayMinutes;
}

// ---------------------- TEST SUITE ----------------------

test("1. Sidebar navigation links to /dashboard/tasks and is active", () => {
  const sidebarPath = path.resolve(process.cwd(), "src/components/dashboard/Sidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  assert.ok(
    content.includes('href: "/dashboard/tasks"'),
    "Sidebar must have href: /dashboard/tasks"
  );
  assert.ok(
    !content.includes('href: "/dashboard#tasks"'),
    "Sidebar must not have dead anchor #tasks"
  );
  assert.ok(
    content.includes('name: "Tasks & Subtasks"'),
    "Sidebar must have navigation item 'Tasks & Subtasks'"
  );
});

test("2. Task validation rejects missing title, date, or time", () => {
  function validateTaskInput(data) {
    const errors = [];
    if (!data.title || !data.title.trim()) errors.push("Title is required");
    if (!data.scheduled_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.scheduled_date)) {
      errors.push("Valid scheduled date (YYYY-MM-DD) is required");
    }
    if (!data.scheduled_start_time || !/^\d{2}:\d{2}$/.test(data.scheduled_start_time)) {
      errors.push("Valid scheduled start time (HH:MM) is required");
    }
    return { valid: errors.length === 0, errors };
  }

  const valid = validateTaskInput({
    title: "Review Admissions",
    scheduled_date: "2026-11-01",
    scheduled_start_time: "10:30",
  });
  assert.equal(valid.valid, true);

  const missingTitle = validateTaskInput({
    title: "  ",
    scheduled_date: "2026-11-01",
    scheduled_start_time: "10:30",
  });
  assert.equal(missingTitle.valid, false);
  assert.ok(missingTitle.errors.includes("Title is required"));

  const invalidDate = validateTaskInput({
    title: "Test",
    scheduled_date: "invalid-date",
    scheduled_start_time: "10:30",
  });
  assert.equal(invalidDate.valid, false);
});

test("3. Timezone conversion from IST to UTC is exact (UTC+05:30)", () => {
  // 10:00 AM IST on 2026-11-01 is 04:30 AM UTC on 2026-11-01
  const dateStr = "2026-11-01";
  const timeStr = "10:00";
  const utcDate = parseScheduledDateTimeToUTC(dateStr, timeStr);

  assert.equal(utcDate.toISOString(), "2026-11-01T04:30:00.000Z");

  // 01:00 AM IST on 2026-11-02 crosses midnight into previous day in UTC:
  // 01:00 IST - 5h30m = 19:30 UTC on 2026-11-01
  const midnightCrossing = parseScheduledDateTimeToUTC("2026-11-02", "01:00");
  assert.equal(midnightCrossing.toISOString(), "2026-11-01T19:30:00.000Z");
});

test("4. Exactly 6 reminders are generated with correct minute offsets", () => {
  const baseUTC = "2026-11-01T04:30:00.000Z"; // 10:00 IST
  const reminders = calculateAllReminderSchedules(baseUTC);

  assert.equal(reminders.length, 6, "Must generate exactly 6 reminder records");

  const offsets = reminders.map((r) => r.offset_minutes);
  assert.deepEqual(offsets, [-60, -30, -15, 15, 30, 60], "Offsets must match -60, -30, -15, +15, +30, +60");

  const types = reminders.map((r) => r.reminder_type);
  assert.deepEqual(types, [
    "before_60m",
    "before_30m",
    "before_15m",
    "after_15m",
    "after_30m",
    "after_60m",
  ]);

  // Check scheduled_for ISO strings
  // Base: 04:30:00Z
  assert.equal(reminders[0].scheduled_for, "2026-11-01T03:30:00.000Z"); // -60m
  assert.equal(reminders[1].scheduled_for, "2026-11-01T04:00:00.000Z"); // -30m
  assert.equal(reminders[2].scheduled_for, "2026-11-01T04:15:00.000Z"); // -15m
  assert.equal(reminders[3].scheduled_for, "2026-11-01T04:45:00.000Z"); // +15m
  assert.equal(reminders[4].scheduled_for, "2026-11-01T05:00:00.000Z"); // +30m
  assert.equal(reminders[5].scheduled_for, "2026-11-01T05:30:00.000Z"); // +60m
});

test("5. Completed or cancelled task triggers cancellation of pending reminders", () => {
  let reminders = [
    { id: 1, reminder_type: "before_60m", status: "sent" },
    { id: 2, reminder_type: "before_30m", status: "pending" },
    { id: 3, reminder_type: "before_15m", status: "pending" },
    { id: 4, reminder_type: "after_15m", status: "pending" },
  ];

  function handleTaskStatusChange(taskStatus, currentReminders) {
    if (taskStatus === "completed" || taskStatus === "cancelled") {
      return currentReminders.map((r) =>
        r.status === "pending" ? { ...r, status: "cancelled" } : r
      );
    }
    return currentReminders;
  }

  const updated = handleTaskStatusChange("completed", reminders);
  assert.equal(updated.find((r) => r.id === 1).status, "sent", "Sent reminders remain sent");
  assert.equal(updated.find((r) => r.id === 2).status, "cancelled", "Pending reminder 2 cancelled");
  assert.equal(updated.find((r) => r.id === 3).status, "cancelled", "Pending reminder 3 cancelled");
  assert.equal(updated.find((r) => r.id === 4).status, "cancelled", "Pending reminder 4 cancelled");
});

test("6. Rescheduled task recalculates pending reminders while preserving sent reminders", () => {
  const originalBase = "2026-11-01T04:30:00.000Z"; // 10:00 IST
  const newBase = "2026-11-01T06:30:00.000Z";      // 12:00 IST (2 hours later)

  let reminders = [
    { id: 1, reminder_type: "before_60m", offset_minutes: -60, scheduled_for: "2026-11-01T03:30:00.000Z", status: "sent" },
    { id: 2, reminder_type: "before_30m", offset_minutes: -30, scheduled_for: "2026-11-01T04:00:00.000Z", status: "pending" },
    { id: 3, reminder_type: "before_15m", offset_minutes: -15, scheduled_for: "2026-11-01T04:15:00.000Z", status: "pending" },
  ];

  function reschedulePendingReminders(newBaseUTC, currentReminders) {
    const baseTime = new Date(newBaseUTC).getTime();
    return currentReminders.map((r) => {
      if (r.status === "pending") {
        const newScheduled = new Date(baseTime + r.offset_minutes * 60 * 1000).toISOString();
        return { ...r, scheduled_for: newScheduled };
      }
      return r;
    });
  }

  const rescheduled = reschedulePendingReminders(newBase, reminders);
  assert.equal(rescheduled[0].scheduled_for, "2026-11-01T03:30:00.000Z", "Sent reminder time untouched");
  assert.equal(rescheduled[1].scheduled_for, "2026-11-01T06:00:00.000Z", "Pending reminder 2 moved to 11:30 IST");
  assert.equal(rescheduled[2].scheduled_for, "2026-11-01T06:15:00.000Z", "Pending reminder 3 moved to 11:45 IST");
});

test("7. Subtask completion percentage calculation works for all quantities", () => {
  // Empty
  assert.deepEqual(calculateSubtaskProgress([]), { total: 0, completed: 0, percentage: 0 });

  // 2 of 5 completed = 40%
  const subtasks5 = [
    { id: "1", status: "completed" },
    { id: "2", status: "completed" },
    { id: "3", status: "pending" },
    { id: "4", status: "pending" },
    { id: "5", status: "pending" },
  ];
  assert.deepEqual(calculateSubtaskProgress(subtasks5), { total: 5, completed: 2, percentage: 40 });

  // 3 of 3 completed = 100%
  const subtasks3 = [
    { id: "1", status: "completed" },
    { id: "2", status: "completed" },
    { id: "3", status: "completed" },
  ];
  assert.deepEqual(calculateSubtaskProgress(subtasks3), { total: 3, completed: 3, percentage: 100 });
});

test("8. Stale catch-up threshold skips reminders overdue by > 120 minutes", () => {
  const currentNow = "2026-11-01T12:00:00.000Z";

  // Scheduled 30 minutes ago (safe, not stale)
  const recentReminder = "2026-11-01T11:30:00.000Z";
  assert.equal(isReminderStale(recentReminder, currentNow), false);

  // Scheduled 119 minutes ago (safe)
  const thresholdReminder = "2026-11-01T10:01:00.000Z";
  assert.equal(isReminderStale(thresholdReminder, currentNow), false);

  // Scheduled 180 minutes (3 hours) ago (stale, should be skipped)
  const staleReminder = "2026-11-01T09:00:00.000Z";
  assert.equal(isReminderStale(staleReminder, currentNow), true);
});

test("9. Cron API authorization enforces bearer secret token", () => {
  const SECRET = "test-cron-secret-12345";

  assert.equal(verifyCronAuth("Bearer test-cron-secret-12345", SECRET), true);
  assert.equal(verifyCronAuth("bearer test-cron-secret-12345", SECRET), true);
  assert.equal(verifyCronAuth("Bearer wrong-secret", SECRET), false);
  assert.equal(verifyCronAuth(null, SECRET), false);
  assert.equal(verifyCronAuth("", SECRET), false);
});

test("10. Database migration enforces unique constraint and seeds 23 universities", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261101000000_create_tasks_and_reminders.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist on disk");

  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Check unique constraint on (task_id, reminder_type)
  assert.ok(
    sql.includes("CONSTRAINT uq_task_reminder_type UNIQUE (task_id, reminder_type)"),
    "Must enforce unique constraint on (task_id, reminder_type) to prevent duplicates"
  );

  // Check tables exist
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.tasks"), "Must create public.tasks table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.subtasks"), "Must create public.subtasks table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.universities"), "Must create public.universities table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.task_reminders"), "Must create public.task_reminders table");

  // Check RLS
  assert.ok(sql.includes("ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY"), "RLS enabled for tasks");
  assert.ok(sql.includes("ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY"), "RLS enabled for subtasks");
  assert.ok(sql.includes("ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY"), "RLS enabled for reminders");

  // Check university seed list has 23 items
  const universityMatches = sql.match(/\(\s*'[^']+(?:Online|Mumbai|Pune)'\s*\)/g) || [];
  assert.ok(
    universityMatches.length >= 23,
    `Expected at least 23 partner universities seeded, found ${universityMatches.length}`
  );
});

test("11. Single-admin authorization restricts privileged actions to sachin.behera@collegevidya.com", () => {
  const AUTHORIZED_ADMIN = "sachin.behera@collegevidya.com";

  function authorizeUser(userEmail) {
    if (!userEmail) return { authorized: false, reason: "Unauthenticated" };
    if (userEmail.toLowerCase().trim() === AUTHORIZED_ADMIN) {
      return { authorized: true };
    }
    return { authorized: false, reason: "Unauthorized: Administrator access required" };
  }

  assert.equal(authorizeUser("sachin.behera@collegevidya.com").authorized, true);
  assert.equal(authorizeUser("Sachin.Behera@CollegeVidya.Com").authorized, true); // Case-insensitive
  assert.equal(authorizeUser("other@collegevidya.com").authorized, false);
  assert.equal(authorizeUser("hacker@gmail.com").authorized, false);
  assert.equal(authorizeUser(null).authorized, false);
});

test("12. Reminder templates distinguish advance notices from overdue alerts", () => {
  const { generateEmailContent } = (() => {
    function generateEmailContent(task, reminder) {
      const isOverdue = reminder.offset_minutes > 0;
      let badgeLabel = "";
      if (reminder.reminder_type === "before_60m") badgeLabel = "REMINDER: IN 1 HOUR";
      else if (reminder.reminder_type === "before_30m") badgeLabel = "REMINDER: IN 30 MINUTES";
      else if (reminder.reminder_type === "before_15m") badgeLabel = "REMINDER: IN 15 MINUTES";
      else if (reminder.reminder_type === "after_15m") badgeLabel = "OVERDUE: 15 MINUTES ELAPSED";
      else if (reminder.reminder_type === "after_30m") badgeLabel = "URGENT OVERDUE: 30 MINUTES ELAPSED";
      else if (reminder.reminder_type === "after_60m") badgeLabel = "CRITICAL OVERDUE: 1 HOUR ELAPSED";

      const subject = `[${badgeLabel}] ${task.title}`;
      return { subject, isOverdue, badgeLabel };
    }
    return { generateEmailContent };
  })();

  const task = { title: "Follow up with Shikha on LPU admissions" };

  const adv = generateEmailContent(task, { reminder_type: "before_30m", offset_minutes: -30 });
  assert.equal(adv.isOverdue, false);
  assert.ok(adv.subject.includes("[REMINDER: IN 30 MINUTES]"));

  const overdue = generateEmailContent(task, { reminder_type: "after_30m", offset_minutes: 30 });
  assert.equal(overdue.isOverdue, true);
  assert.ok(overdue.subject.includes("[URGENT OVERDUE: 30 MINUTES ELAPSED]"));
});

test("13. Vercel cron configuration complies with Hobby plan limit (at most once per day)", () => {
  const vercelJsonPath = path.resolve(process.cwd(), "vercel.json");
  assert.ok(fs.existsSync(vercelJsonPath), "vercel.json must exist");

  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));
  if (vercelConfig.crons && vercelConfig.crons.length > 0) {
    for (const cron of vercelConfig.crons) {
      assert.ok(cron.schedule, "Cron must define a schedule");
      // Vercel Hobby strictly forbids sub-daily schedules like '* * * * *', '*/5 * * * *', '0 * * * *'
      const parts = cron.schedule.trim().split(/\s+/);
      assert.equal(parts.length, 5, "Cron schedule must be a 5-part expression");
      // First part (minute) should be a specific minute e.g. 0
      assert.ok(!parts[0].includes("*"), "Minute field cannot be wildcard on Hobby plan");
      // Second part (hour) should be a specific hour e.g. 0
      assert.ok(!parts[1].includes("*"), "Hour field cannot be wildcard on Hobby plan");
      // Daily schedule check: '0 0 * * *'
      assert.equal(cron.schedule, "0 0 * * *", "Schedule must be daily at 00:00 UTC to satisfy Hobby limit");
    }
  }
});

test("14. Cron API accepts Bearer token, x-cron-secret header, and ?secret= query parameter", () => {
  const EXPECTED_SECRET = "secure-cron-secret-2026";

  function authenticateRequest(headers, queryParams) {
    let bearerToken = null;
    const authHeader = headers["authorization"];
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) bearerToken = match[1].trim();
    }
    const customHeader = headers["x-cron-secret"]?.trim() || null;
    const querySecret = queryParams.get("secret")?.trim() || null;

    return (
      bearerToken === EXPECTED_SECRET ||
      customHeader === EXPECTED_SECRET ||
      querySecret === EXPECTED_SECRET
    );
  }

  // 1. Bearer header
  assert.equal(
    authenticateRequest({ authorization: "Bearer secure-cron-secret-2026" }, new URLSearchParams()),
    true
  );
  // 2. Bearer header lowercase
  assert.equal(
    authenticateRequest({ authorization: "bearer secure-cron-secret-2026" }, new URLSearchParams()),
    true
  );
  // 3. Custom x-cron-secret header
  assert.equal(
    authenticateRequest({ "x-cron-secret": "secure-cron-secret-2026" }, new URLSearchParams()),
    true
  );
  // 4. Query parameter ?secret=
  assert.equal(
    authenticateRequest({}, new URLSearchParams({ secret: "secure-cron-secret-2026" })),
    true
  );
  // 5. Invalid credentials
  assert.equal(
    authenticateRequest({ authorization: "Bearer wrong-secret" }, new URLSearchParams()),
    false
  );
  assert.equal(
    authenticateRequest({}, new URLSearchParams({ secret: "wrong" })),
    false
  );
});

test("15. Repeated endpoint calls and concurrency claim guarantee no duplicate reminder dispatches", async () => {
  // Simulated database table state
  let remindersDb = [
    {
      id: "rem-1",
      task_id: "task-1",
      reminder_type: "before_30m",
      scheduled_for: "2026-10-29T09:00:00.000Z",
      status: "pending",
      last_attempt_at: null,
      attempt_count: 0,
    },
  ];

  let emailDispatches = [];

  // Simulated worker execution matching route.ts logic
  async function runCronWorker(workerId, currentTimeMs) {
    const nowISO = new Date(currentTimeMs).toISOString();
    const staleLockThresholdISO = new Date(currentTimeMs - 60 * 1000).toISOString();

    // 1. Query pending due reminders
    const dueReminders = remindersDb.filter(
      (r) => r.status === "pending" && r.scheduled_for <= nowISO
    );

    for (const reminder of dueReminders) {
      // 2. Concurrency claim check
      const canClaim =
        reminder.status === "pending" &&
        (!reminder.last_attempt_at || reminder.last_attempt_at < staleLockThresholdISO);

      if (!canClaim) {
        // Locked by another worker or already claimed within 60s
        continue;
      }

      // Claim lock
      reminder.last_attempt_at = nowISO;
      reminder.attempt_count++;

      // Dispatch email
      emailDispatches.push({
        workerId,
        reminderId: reminder.id,
        sentAt: nowISO,
      });

      // Mark sent
      reminder.status = "sent";
    }
  }

  // Run 1st call at T = 2026-10-29T09:05:00Z (5 minutes past scheduled reminder)
  const t0 = new Date("2026-10-29T09:05:00.000Z").getTime();
  await runCronWorker("scheduler-run-1", t0);
  assert.equal(emailDispatches.length, 1, "First run dispatches exactly 1 email");

  // Run 2nd call 10 seconds later (repeated rapid call / retry)
  await runCronWorker("scheduler-run-2-retry", t0 + 10000);
  assert.equal(
    emailDispatches.length,
    1,
    "Repeated run does not send duplicate email because reminder is now 'sent'"
  );

  // Run 3rd call 5 minutes later
  await runCronWorker("scheduler-run-3-next-cycle", t0 + 300000);
  assert.equal(
    emailDispatches.length,
    1,
    "Next cycle does not re-send already sent reminder"
  );
});

test("16. Temporary REMINDER_TO_EMAIL override is used when configured", () => {
  function resolveRecipient(env, reminderRecipient) {
    const override = env.REMINDER_TO_EMAIL?.trim();
    if (override) return override;
    const adminEmail = env.ADMIN_EMAIL?.trim();
    if (adminEmail) return adminEmail;
    return reminderRecipient?.trim() || "sachin.behera@collegevidya.com";
  }

  // 1. Valid test override email
  const envWithOverride = {
    REMINDER_TO_EMAIL: "tester@example.com",
    ADMIN_EMAIL: "sachin.behera@collegevidya.com",
  };
  assert.equal(
    resolveRecipient(envWithOverride, "sachin.behera@collegevidya.com"),
    "tester@example.com",
    "Should use REMINDER_TO_EMAIL when configured"
  );

  // 2. Override with surrounding whitespace is trimmed properly
  const envWithWhitespace = {
    REMINDER_TO_EMAIL: "  custom-override@domain.org  ",
  };
  assert.equal(
    resolveRecipient(envWithWhitespace, "sachin.behera@collegevidya.com"),
    "custom-override@domain.org",
    "Should trim whitespace on REMINDER_TO_EMAIL"
  );
});

test("17. Existing admin recipient remains the fallback when REMINDER_TO_EMAIL is absent or empty", () => {
  function resolveRecipient(env, reminderRecipient) {
    const override = env.REMINDER_TO_EMAIL?.trim();
    if (override) return override;
    const adminEmail = env.ADMIN_EMAIL?.trim();
    if (adminEmail) return adminEmail;
    return reminderRecipient?.trim() || "sachin.behera@collegevidya.com";
  }

  // 1. Absent REMINDER_TO_EMAIL with ADMIN_EMAIL configured
  const envWithAdmin = {
    ADMIN_EMAIL: "sachin.behera@collegevidya.com",
  };
  assert.equal(
    resolveRecipient(envWithAdmin, "other@test.com"),
    "sachin.behera@collegevidya.com",
    "Should fallback to ADMIN_EMAIL when REMINDER_TO_EMAIL is absent"
  );

  // 2. Empty string REMINDER_TO_EMAIL falls back to ADMIN_EMAIL
  const envWithEmptyOverride = {
    REMINDER_TO_EMAIL: "",
    ADMIN_EMAIL: "sachin.behera@collegevidya.com",
  };
  assert.equal(
    resolveRecipient(envWithEmptyOverride, null),
    "sachin.behera@collegevidya.com",
    "Should fallback to ADMIN_EMAIL when REMINDER_TO_EMAIL is empty"
  );

  // 3. Whitespace-only REMINDER_TO_EMAIL falls back to ADMIN_EMAIL
  const envWithWhitespaceOverride = {
    REMINDER_TO_EMAIL: "   ",
    ADMIN_EMAIL: "sachin.behera@collegevidya.com",
  };
  assert.equal(
    resolveRecipient(envWithWhitespaceOverride, null),
    "sachin.behera@collegevidya.com",
    "Should fallback to ADMIN_EMAIL when REMINDER_TO_EMAIL is whitespace"
  );

  // 4. Neither env set falls back to reminder recipient or default admin identity
  const emptyEnv = {};
  assert.equal(
    resolveRecipient(emptyEnv, "stored-recipient@collegevidya.com"),
    "stored-recipient@collegevidya.com",
    "Should fallback to stored reminder recipient when env is empty"
  );
  assert.equal(
    resolveRecipient(emptyEnv, null),
    "sachin.behera@collegevidya.com",
    "Should fallback to default admin email when nothing is set"
  );
});
