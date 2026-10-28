import React from "react";
import type { Metadata } from "next";
import { normalizeMonthKey } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDailyTrackerAction } from "./actions";
import { DailyTrackerGrid } from "@/components/tracker/DailyTrackerGrid";

export const metadata: Metadata = {
  title: "Daily Counselor Tracker | Sachin Behera Daily Workflow",
  description: "Track calendar-day admissions, collections, and confirmed zeros across team counselors.",
};

export default async function DailyTrackerPage() {
  const currentMonthKey = normalizeMonthKey(new Date());
  const configured = isSupabaseConfigured();

  const data = await getDailyTrackerAction(currentMonthKey);

  return (
    <DailyTrackerGrid
      initialSummary={data.summary}
      initialCounselors={data.counselors}
      initialDays={data.calendarDays}
      initialMonth={currentMonthKey}
      isConfigured={configured}
      initialError={data.error}
    />
  );
}
