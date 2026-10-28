import React from "react";
import type { Metadata } from "next";
import { normalizeMonthKey } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCounselorsWithTargetsAction } from "./actions";
import { CounselorList } from "@/components/counselors/CounselorList";

export const metadata: Metadata = {
  title: "Counselor Management & Monthly Targets | Sachin Behera Daily Workflow",
  description: "Manage team counselors and monthly performance targets for College Vidya.",
};

export default async function CounselorsPage() {
  const currentMonthKey = normalizeMonthKey(new Date());
  const configured = isSupabaseConfigured();

  const data = await getCounselorsWithTargetsAction(currentMonthKey);

  return (
    <CounselorList
      initialCounselors={data.counselors}
      initialSummary={data.summary}
      initialMonth={currentMonthKey}
      isConfigured={configured}
      initialError={data.error}
    />
  );
}
