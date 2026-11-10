import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCounselorPortalDataAction } from "./actions";
import { CounselorDashboardClient } from "@/components/counselor/CounselorDashboardClient";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Counselor Workspace | Sachin Daily Work Flow Tracker",
  description: "Personal counselor performance dashboard, admissions pipeline, and daily projections.",
};

export const dynamic = "force-dynamic";

export default async function CounselorPage() {
  const res = await getCounselorPortalDataAction();

  if (!res.success || !res.data) {
    return (
      <div className="p-6 max-w-lg mx-auto my-12 text-center glass-card rounded-2xl border border-red-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-navy-800">Counselor Profile Notice</h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {res.error || "Unable to load counselor dashboard data."}
        </p>
        <p className="text-[11px] text-gray-400 mt-2">
          Please contact Sachin Behera (Administrator) to verify your counselor email registration.
        </p>
      </div>
    );
  }

  return <CounselorDashboardClient initialData={res.data} />;
}
