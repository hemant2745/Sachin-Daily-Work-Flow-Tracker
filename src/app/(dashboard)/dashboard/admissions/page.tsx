import React from "react";
import type { Metadata } from "next";
import { normalizeMonthKey } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAdmissionsAction, getCounselorsForAdmissionAction } from "./actions";
import { AdmissionsList } from "@/components/admissions/AdmissionsList";

export const metadata: Metadata = {
  title: "Admissions & Collections | Sachin Behera Daily Workflow",
  description: "Track verified student admissions, collections, and counselor revenue attribution.",
};

export default async function AdmissionsPage() {
  const currentMonthKey = normalizeMonthKey(new Date());
  const configured = isSupabaseConfigured();

  const [admissionsRes, counselorsRes] = await Promise.all([
    getAdmissionsAction({ monthKey: currentMonthKey }),
    getCounselorsForAdmissionAction(),
  ]);

  return (
    <AdmissionsList
      initialAdmissions={admissionsRes.admissions}
      initialSummary={admissionsRes.summary}
      initialMonth={currentMonthKey}
      counselors={counselorsRes.counselors}
      isConfigured={configured}
      initialError={admissionsRes.error || counselorsRes.error}
    />
  );
}
