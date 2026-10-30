import React from "react";
import type { Metadata } from "next";
import { getCallingPerformanceAction } from "./actions";
import { getCounselorsWithTargetsAction } from "../counselors/actions";
import { CallingPerformanceDashboard } from "@/components/calling/CallingPerformanceDashboard";
import { normalizeMonthKey } from "@/lib/format";

export const metadata: Metadata = {
  title: "Calling Performance & APR | Sachin Behera Daily Workflow",
  description:
    "Track daily calling volume, talk-time, follow-ups, and APR benchmarks per counsellor.",
};

export const dynamic = "force-dynamic";

export default async function CallingPerformancePage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthKey = normalizeMonthKey(new Date());

  const [performanceRes, counselorsRes] = await Promise.all([
    getCallingPerformanceAction({ date: todayStr }),
    getCounselorsWithTargetsAction(currentMonthKey),
  ]);

  const activeCounselors = (counselorsRes.counselors || []).map((c) => ({
    id: c.id,
    full_name: c.full_name,
    employee_code: c.employee_code,
  }));

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <CallingPerformanceDashboard
        initialRecords={performanceRes.records || []}
        initialSummary={performanceRes.summary}
        counselors={activeCounselors}
        currentDate={todayStr}
      />
    </div>
  );
}
