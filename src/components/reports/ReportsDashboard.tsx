"use client";

import React, { useState, useTransition } from "react";
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getComprehensiveReportsAction } from "@/app/(dashboard)/dashboard/reports/actions";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { CounselorPerformanceTable } from "./CounselorPerformanceTable";
import { UniversityBreakdownTable } from "./UniversityBreakdownTable";
import { PerformanceTrendsChart } from "./PerformanceTrendsChart";
import { ExportReportModal } from "./ExportReportModal";
import type {
  ComprehensiveReportData,
  ReportDateRangeType,
  ReportFilterOptions,
} from "@/types/reports";
import { UNIVERSITY_MASTER_LIST } from "@/lib/constants/universities";

interface ReportsDashboardProps {
  initialData: ComprehensiveReportData;
}

export function ReportsDashboard({ initialData }: ReportsDashboardProps) {
  const [data, setData] = useState<ComprehensiveReportData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [dateRangeType, setDateRangeType] = useState<ReportDateRangeType>(
    initialData.filters.dateRangeType || "this_month"
  );
  const [startDate, setStartDate] = useState(initialData.filters.startDate);
  const [endDate, setEndDate] = useState(initialData.filters.endDate);
  const [selectedCounselor, setSelectedCounselor] = useState(
    initialData.filters.counselorId || "ALL"
  );
  const [selectedUniversity, setSelectedUniversity] = useState(
    initialData.filters.universityName || "ALL"
  );
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"counselors" | "universities" | "trends">(
    "counselors"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const filterPayload: ReportFilterOptions = {
      dateRangeType,
      startDate,
      endDate,
      counselorId: selectedCounselor,
      universityName: selectedUniversity,
    };

    startTransition(async () => {
      const res = await getComprehensiveReportsAction(filterPayload);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setErrorMessage(res.error || "Failed to load report data.");
      }
    });
  };

  const handleRangeChange = (type: ReportDateRangeType) => {
    setDateRangeType(type);
    setErrorMessage(null);

    const filterPayload: ReportFilterOptions = {
      dateRangeType: type,
      startDate,
      endDate,
      counselorId: selectedCounselor,
      universityName: selectedUniversity,
    };

    startTransition(async () => {
      const res = await getComprehensiveReportsAction(filterPayload);
      if (res.success && res.data) {
        setData(res.data);
        setStartDate(res.data.filters.startDate);
        setEndDate(res.data.filters.endDate);
      } else {
        setErrorMessage(res.error || "Failed to load report data.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-navy-900/90 border border-navy-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Executive Reports & Analytics
              </h1>
              <p className="text-xs text-gray-400">
                Audited performance records, targets, and forecast accuracy across College Vidya.
              </p>
            </div>
          </div>
        </div>

        {/* Global Export & Refresh Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleApplyFilter()}
            disabled={isPending}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-navy-800 border border-navy-700 text-xs font-medium text-gray-300 hover:text-white hover:bg-navy-700 transition-colors disabled:opacity-50"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Date Range & Filter Toolbar */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleApplyFilter} className="space-y-3">
          {/* Quick Range Presets */}
          <div className="flex flex-wrap items-center gap-2 border-b border-navy-800 pb-3">
            <span className="text-xs font-semibold text-gray-400 mr-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-orange" />
              Period:
            </span>
            {(
              [
                { label: "This Month", value: "this_month" },
                { label: "Last Month", value: "last_month" },
                { label: "Quarter-to-Date", value: "quarter_to_date" },
                { label: "Year-to-Date", value: "year_to_date" },
                { label: "Custom Range", value: "custom" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRangeChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRangeType === opt.value
                    ? "bg-navy-800 border-2 border-brand-orange text-white shadow-sm font-semibold"
                    : "bg-navy-950/80 border border-navy-800 text-gray-400 hover:text-white hover:bg-navy-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Detailed Filters Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRangeType("custom");
                }}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRangeType("custom");
                }}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* Counselor Filter */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Filter by Counsellor
              </label>
              <select
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              >
                <option value="ALL">All Counsellors ({data.counselors.length})</option>
                {data.counselors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.employee_code})
                  </option>
                ))}
              </select>
            </div>

            {/* University Filter */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Filter by University
              </label>
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
              >
                <option value="ALL">All Partner Universities</option>
                {UNIVERSITY_MASTER_LIST.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-navy-800 border border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <ReportSummaryCards summary={data.summary} />

      {/* Detailed Matrix Section with Tab Selectors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-navy-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("counselors")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "counselors"
                  ? "bg-navy-800 text-brand-orange border border-brand-orange/40 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-navy-900"
              }`}
            >
              Counsellor Matrix ({data.counselors.length})
            </button>
            <button
              onClick={() => setActiveTab("universities")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "universities"
                  ? "bg-navy-800 text-brand-orange border border-brand-orange/40 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-navy-900"
              }`}
            >
              University Breakdown ({data.universities.length})
            </button>
            <button
              onClick={() => setActiveTab("trends")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "trends"
                  ? "bg-navy-800 text-brand-orange border border-brand-orange/40 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-navy-900"
              }`}
            >
              Timeline Trends ({data.dailyTrends.length} days)
            </button>
          </div>

          <div className="text-[11px] text-gray-500 hidden sm:block">
            Data window: {data.filters.startDate} &rarr; {data.filters.endDate}
          </div>
        </div>

        {/* Tab Displays */}
        {activeTab === "counselors" && (
          <CounselorPerformanceTable counselors={data.counselors} />
        )}
        {activeTab === "universities" && (
          <UniversityBreakdownTable universities={data.universities} />
        )}
        {activeTab === "trends" && (
          <PerformanceTrendsChart trends={data.dailyTrends} />
        )}
      </div>

      {/* Export Modal */}
      <ExportReportModal
        reportData={data}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
