"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { CounselorPortalData } from "@/app/(counselor)/counselor/actions";
import { CounselorHeader } from "./CounselorHeader";
import { CounselorPerformanceOverview } from "./CounselorPerformanceOverview";
import { CounselorWeeklyCards } from "./CounselorWeeklyCards";
import { CounselorAdmissionsSection } from "./CounselorAdmissionsSection";
import { CounselorProjectionsSection } from "./CounselorProjectionsSection";
import { CounselorAdmissionModal } from "./CounselorAdmissionModal";
import { CounselorProjectionModal } from "./CounselorProjectionModal";
import { WeeklyComparisonChart } from "@/components/analytics/WeeklyComparisonChart";
import type { WeeklyComparisonPoint, WeekIdentifier } from "@/types/analytics";

interface CounselorDashboardClientProps {
  initialData: CounselorPortalData;
}

export function CounselorDashboardClient({ initialData }: CounselorDashboardClientProps) {
  const router = useRouter();
  const [data, setData] = useState<CounselorPortalData>(initialData);

  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isProjectionModalOpen, setIsProjectionModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleAdmissionSuccess = () => {
    setToastMessage("Admission recorded successfully and queued for admin verification.");
    router.refresh();
  };

  const handleProjectionSuccess = () => {
    setToastMessage("Morning projection submitted successfully.");
    router.refresh();
  };

  // Build weekly chart points for the counselor
  const weekKeys: WeekIdentifier[] = ["W1", "W2", "W3", "W4"];
  const weeklyChartPoints: WeeklyComparisonPoint[] = weekKeys.map((wKey, idx) => {
    const w = data.performance.weeks[wKey];
    const periodLabels = ["1st – 7th", "8th – 14th", "15th – 21st", "22nd – End"];
    return {
      week: wKey,
      weekName: `Week ${idx + 1}`,
      periodLabel: periodLabels[idx],
      expectedRevenue: w?.expectedRevenue || 0,
      actualRevenue: w?.actualRevenue || 0,
      actualAdmissions: w?.actualAdmissions || 0,
      achievementPercentage: w?.achievementPercentage || null,
    };
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <CounselorHeader
        counselorName={data.counselor.fullName}
        category={data.counselor.category}
        onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
        onOpenProjectionModal={() => setIsProjectionModalOpen(true)}
      />

      {/* Success Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* 1. Personal Performance Overview */}
      <CounselorPerformanceOverview
        performance={data.performance}
        counselorName={data.counselor.fullName}
        category={data.counselor.category}
        monthName={data.period.monthName}
      />

      {/* 2. Four Weekly Reporting Cards */}
      <CounselorWeeklyCards weeks={data.performance.weeks} />

      {/* 3. Personal Performance Graph (Weekly Comparison) */}
      <WeeklyComparisonChart
        weeks={weeklyChartPoints}
        title="My Weekly Progress Curve"
        subtitle="Expected targets vs verified actual collections across 4 fixed reporting periods"
      />

      {/* 4. My Daily Projections Section */}
      <CounselorProjectionsSection
        todayProjection={data.todayProjection}
        recentProjections={data.recentProjections}
        onOpenProjectionModal={() => setIsProjectionModalOpen(true)}
      />

      {/* 5. My Admissions Section */}
      <CounselorAdmissionsSection
        admissions={data.admissions}
        onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
      />

      {/* Permission 1: Add Admission Modal */}
      <CounselorAdmissionModal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        onSuccess={handleAdmissionSuccess}
      />

      {/* Permission 2: Morning Projection Modal */}
      <CounselorProjectionModal
        isOpen={isProjectionModalOpen}
        onClose={() => setIsProjectionModalOpen(false)}
        onSuccess={handleProjectionSuccess}
        initialProjection={data.todayProjection}
      />
    </div>
  );
}
