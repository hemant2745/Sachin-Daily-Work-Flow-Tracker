"use client";

import React, { useState, useTransition } from "react";
import {
  Calendar,
  CalendarCheck,
  Search,
  Download,
  Printer,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  DollarSign,
  GraduationCap,
  Target,
  Flame,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { formatINR, formatMonthDisplay, getMonthOptions } from "@/lib/format";
import type { DailyTrackerSummary, CounselorDailyRow, DailyCellData } from "@/types/tracker";
import { DailyCellModal } from "./DailyCellModal";
import { CounselorDetailModal } from "./CounselorDetailModal";
import {
  getDailyTrackerAction,
  confirmDailyZeroAction,
  revokeDailyZeroAction,
} from "@/app/(dashboard)/dashboard/daily-tracker/actions";
import { assignSuggestedTargetsAction } from "@/app/(dashboard)/dashboard/counselors/actions";

interface DailyTrackerGridProps {
  initialSummary: DailyTrackerSummary;
  initialCounselors: CounselorDailyRow[];
  initialDays: Array<{ date: string; dayNumber: number; dayName: string; isWeekend: boolean }>;
  initialMonth: string;
  isConfigured: boolean;
  initialError?: string;
}

export function DailyTrackerGrid({
  initialSummary,
  initialCounselors,
  initialDays,
  initialMonth,
  isConfigured,
  initialError,
}: DailyTrackerGridProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [summary, setSummary] = useState<DailyTrackerSummary>(initialSummary);
  const [counselors, setCounselors] = useState<CounselorDailyRow[]>(initialCounselors);
  const [calendarDays, setCalendarDays] = useState(initialDays);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [selectedCell, setSelectedCell] = useState<{
    counselorId: string;
    counselorName: string;
    employeeCode: string;
    cellData: DailyCellData;
  } | null>(null);

  const [detailCounselor, setDetailCounselor] = useState<CounselorDailyRow | null>(null);

  const monthOptions = getMonthOptions(new Date());

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    startTransition(async () => {
      const res = await getDailyTrackerAction(newMonth);
      if (res.success) {
        setSummary(res.summary);
        setCounselors(res.counselors);
        setCalendarDays(res.calendarDays);
        setErrorMessage(null);
      } else {
        setErrorMessage(res.error || "Failed to load tracker for selected month.");
      }
    });
  };

  const handleConfirmZero = async (counselorId: string, date: string, notes?: string) => {
    const res = await confirmDailyZeroAction(counselorId, date, notes);
    if (res.success) {
      setSuccessMessage(res.message || "Zero collection confirmed.");
      // Refresh current month view
      handleMonthChange(selectedMonth);
    }
    return res;
  };

  const handleRevokeZero = async (counselorId: string, date: string, reason?: string) => {
    const res = await revokeDailyZeroAction(counselorId, date, reason);
    if (res.success) {
      setSuccessMessage(res.message || "Zero confirmation revoked.");
      handleMonthChange(selectedMonth);
    }
    return res;
  };

  const handleAssignSuggested = () => {
    startTransition(async () => {
      const res = await assignSuggestedTargetsAction(selectedMonth);
      if (res.success) {
        setSuccessMessage(res.message || "Targets assigned successfully.");
        handleMonthChange(selectedMonth);
      } else {
        setErrorMessage(res.error || "Failed to assign targets.");
      }
    });
  };

  // Filter counselors by search query
  const filteredCounselors = counselors.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return c.fullName.toLowerCase().includes(q) || c.employeeCode.toLowerCase().includes(q);
  });

  // Export to CSV
  const handleExportCSV = () => {
    const timestamp = new Date().toISOString();
    const rows: string[][] = [];

    // Header metadata
    rows.push([`Sachin Behera Daily Workflow - Daily Counselor Tracker`]);
    rows.push([`Month: ${summary.monthDisplay}`, `Generated At: ${timestamp}`]);
    rows.push([
      `Team Target: ${summary.teamTargetCollection ? `INR ${summary.teamTargetCollection}` : "Not Assigned"}`,
      `Team Collections: INR ${summary.teamActualCollection}`,
      `Team Admissions: ${summary.teamActualAdmissions}`,
    ]);
    rows.push([]);

    // Table Columns Header
    const colHeaders = [
      "Employee Code",
      "Counselor Name",
      "Target Collection (INR)",
      "Actual Collection (INR)",
      "Collection Ach %",
      "Target Admissions",
      "Actual Admissions",
      "Admission Ach %",
      "Admission Days",
      "Confirmed Zero Days",
      "No Data Days",
      "Current Zero Streak",
      "Max Zero Streak",
    ];

    calendarDays.forEach((day) => {
      colHeaders.push(`${day.dayNumber} (${day.dayName})`);
    });

    rows.push(colHeaders);

    // Counselor Rows
    counselors.forEach((c) => {
      const r = [
        c.employeeCode,
        c.fullName,
        c.isTargetAssigned && c.monthlyTargetCollection !== null ? String(c.monthlyTargetCollection) : "N/A",
        String(c.totalCollections),
        c.collectionAchievement,
        c.isTargetAssigned && c.monthlyTargetAdmissions !== null ? String(c.monthlyTargetAdmissions) : "N/A",
        String(c.totalAdmissions),
        c.admissionAchievement,
        String(c.admissionDays),
        String(c.confirmedZeroDays),
        String(c.noDataDays),
        String(c.currentZeroStreak),
        String(c.longestZeroStreak),
      ];

      calendarDays.forEach((day) => {
        const cell = c.days[day.date];
        if (cell?.status === "collection_recorded") {
          r.push(`COL: INR ${cell.collectionAmount} (${cell.admissionCount} adm)`);
        } else if (cell?.status === "admission_recorded") {
          r.push(`ADM: ${cell.admissionCount}`);
        } else if (cell?.status === "zero_confirmed") {
          r.push("ZERO_CONFIRMED");
        } else {
          r.push("NO_DATA");
        }
      });

      rows.push(r);
    });

    // Escape CSV
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows
        .map((row) =>
          row
            .map((field) => {
              const str = String(field || "").replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `daily_tracker_${selectedMonth.substring(0, 7)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Control Bar */}
      <div className="bg-white border border-surface-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-navy-950 border border-brand-orange/40 flex items-center justify-center text-brand-orange shrink-0 shadow-sm">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-navy-950">Daily Counselor Tracker</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-900 text-white">
                  {summary.daysInMonth} Days
                </span>
                {summary.targetsAssignmentState === "all_assigned" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    All Targets Assigned
                  </span>
                ) : summary.targetsAssignmentState === "partially_assigned" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Partially Assigned ({summary.assignedCount}/{summary.totalCounselors})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                    Target Not Assigned
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-600 mt-1">
                Month-wide calendar grid tracking verified admissions, collections, and explicit zero confirmations.
              </p>
            </div>
          </div>

          {/* Month Selector & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <div className="flex items-center space-x-2 bg-surface-light px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
              <Calendar className="w-4 h-4 text-brand-orange shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                disabled={isPending}
                className="bg-transparent text-xs font-semibold text-navy-900 focus:outline-none cursor-pointer pr-2"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pre-fill Suggested Targets (if unassigned) */}
            {summary.targetsAssignmentState !== "all_assigned" && (
              <button
                onClick={handleAssignSuggested}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50"
                title="Pre-fill suggested targets for unassigned counselors in this month"
              >
                <Target className="w-3.5 h-3.5 text-brand-orange" />
                <span>Pre-fill Quotas</span>
              </button>
            )}

            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-navy-900 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-all"
              title="Export complete month data as CSV"
            >
              <Download className="w-3.5 h-3.5 text-navy-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Legend Row */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-navy-900 text-[11px] uppercase tracking-wider">Legend:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Collection Recorded (₹)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Admission Recorded
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Zero Confirmed (0)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 font-normal text-[11px]">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              No Data Recorded (-)
            </span>
          </div>

          <div className="text-[11px] text-gray-400">
            Click any calendar day cell to view admissions or confirm zero collection.
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold">
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-600 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* 6 Key Performance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Collections */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-sm">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Collections</div>
          <div className="text-lg font-bold text-navy-950 mt-1">
            {formatINR(summary.teamActualCollection)}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            {summary.teamCollectionAchievement}
          </div>
        </div>

        {/* Admissions */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-sm">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Admissions</div>
          <div className="text-lg font-bold text-navy-950 mt-1">
            {summary.teamActualAdmissions}
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
            {summary.teamAdmissionAchievement}
          </div>
        </div>

        {/* Admission Days */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-sm">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Admission Days</div>
          <div className="text-lg font-bold text-navy-950 mt-1">
            {summary.teamAdmissionDays}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Days with ≥1 enrollment</div>
        </div>

        {/* Positive Collection Days */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-sm">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Positive Days</div>
          <div className="text-lg font-bold text-emerald-700 mt-1">
            {summary.teamPositiveCollectionDays}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Days with collection &gt; ₹0</div>
        </div>

        {/* Confirmed Zero Days */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-sm">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Confirmed Zeros</div>
          <div className="text-lg font-bold text-slate-700 mt-1">
            {summary.teamConfirmedZeroDays}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Admin confirmed</div>
        </div>

        {/* Missing Data Days */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-sm">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">No Data Recorded</div>
          <div className="text-lg font-bold text-gray-500 mt-1">
            {summary.teamNoDataDays}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Unreviewed calendar days</div>
        </div>
      </div>

      {/* Counselor Filter & Grid Container */}
      <div className="bg-white border border-surface-border rounded-2xl shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search counselor or code..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-light border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          <div className="text-xs text-gray-500">
            Showing <strong className="text-navy-950">{filteredCounselors.length}</strong> of {counselors.length} counselors for {summary.monthDisplay}
          </div>
        </div>

        {/* Horizontally Scrollable Calendar Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-950 text-white text-[11px] uppercase tracking-wider font-semibold border-b border-navy-800">
                {/* Sticky Left: Employee Code */}
                <th className="py-3 px-3.5 sticky left-0 z-20 bg-navy-950 w-24 text-center border-r border-navy-800">
                  Emp Code
                </th>
                {/* Sticky Left: Counselor Name */}
                <th className="py-3 px-4 sticky left-24 z-20 bg-navy-950 w-44 border-r border-navy-800">
                  Counselor
                </th>

                {/* Calendar Days (1 to 31) */}
                {calendarDays.map((day) => (
                  <th
                    key={day.date}
                    className={`py-2 px-1 text-center min-w-[42px] max-w-[48px] border-r border-navy-900/60 ${
                      day.isWeekend ? "bg-navy-900 text-brand-orange" : ""
                    }`}
                  >
                    <div className="text-xs font-bold">{day.dayNumber}</div>
                    <div className="text-[9px] font-normal opacity-80">{day.dayName}</div>
                  </th>
                ))}

                {/* Summary Metrics on Right */}
                <th className="py-3 px-3.5 text-right w-28 bg-navy-950">Target (₹)</th>
                <th className="py-3 px-3.5 text-right w-28 bg-navy-950">Actual (₹)</th>
                <th className="py-3 px-2.5 text-center w-20 bg-navy-950">Col Ach %</th>
                <th className="py-3 px-2 text-center w-16 bg-navy-950">Target Adm</th>
                <th className="py-3 px-2 text-center w-16 bg-navy-950">Actual Adm</th>
                <th className="py-3 px-2.5 text-center w-20 bg-navy-950">Adm Ach %</th>
                <th className="py-3 px-2 text-center w-16 bg-navy-950">Adm Days</th>
                <th className="py-3 px-2 text-center w-16 bg-navy-950">Zero Days</th>
                <th className="py-3 px-2 text-center w-16 bg-navy-950">Current Streak</th>
                <th className="py-3 px-2 text-center w-16 bg-navy-950">Max Streak</th>
                <th className="py-3 px-3 text-center w-20 bg-navy-950">Profile</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredCounselors.map((counselor) => (
                <tr key={counselor.counselorId} className="hover:bg-slate-50/80 transition-colors">
                  {/* Sticky Code */}
                  <td className="py-2.5 px-3.5 sticky left-0 z-10 bg-white font-mono font-bold text-brand-orange text-center border-r border-gray-200">
                    {counselor.employeeCode}
                  </td>

                  {/* Sticky Name */}
                  <td className="py-2.5 px-4 sticky left-24 z-10 bg-white font-semibold text-navy-950 border-r border-gray-200 whitespace-nowrap">
                    <button
                      onClick={() => setDetailCounselor(counselor)}
                      className="hover:text-brand-orange hover:underline text-left"
                    >
                      {counselor.fullName}
                    </button>
                  </td>

                  {/* Calendar Day Cells */}
                  {calendarDays.map((day) => {
                    const cell = counselor.days[day.date];
                    if (!cell) return <td key={day.date} className="p-1 border-r border-gray-100" />;

                    return (
                      <td
                        key={day.date}
                        onClick={() =>
                          setSelectedCell({
                            counselorId: counselor.counselorId,
                            counselorName: counselor.fullName,
                            employeeCode: counselor.employeeCode,
                            cellData: cell,
                          })
                        }
                        className={`p-1 text-center cursor-pointer border-r border-gray-100 transition-all hover:scale-105 select-none ${
                          cell.status === "collection_recorded"
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                            : cell.status === "admission_recorded"
                            ? "bg-blue-50 hover:bg-blue-100 text-blue-800"
                            : cell.status === "zero_confirmed"
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                            : day.isWeekend
                            ? "bg-gray-50/70 hover:bg-gray-100 text-gray-300"
                            : "hover:bg-gray-100 text-gray-300"
                        }`}
                        title={`${counselor.fullName} • ${cell.date}: ${
                          cell.status === "collection_recorded"
                            ? `Collection: ${formatINR(cell.collectionAmount)} (${cell.admissionCount} adm)`
                            : cell.status === "admission_recorded"
                            ? `Admission: ${cell.admissionCount}`
                            : cell.status === "zero_confirmed"
                            ? "Zero Collection Confirmed"
                            : "No Data Recorded"
                        }`}
                      >
                        <div className="min-h-[30px] flex flex-col items-center justify-center">
                          {cell.status === "collection_recorded" ? (
                            <div className="leading-tight">
                              <span className="font-bold text-[10px] text-emerald-700 block">
                                {cell.collectionAmount >= 100000
                                  ? `₹${(cell.collectionAmount / 100000).toFixed(1)}L`
                                  : `₹${Math.round(cell.collectionAmount / 1000)}k`}
                              </span>
                              <span className="text-[9px] text-emerald-600 font-medium">
                                {cell.admissionCount}a
                              </span>
                            </div>
                          ) : cell.status === "admission_recorded" ? (
                            <span className="font-bold text-[10px] text-blue-700">
                              {cell.admissionCount}a
                            </span>
                          ) : cell.status === "zero_confirmed" ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">
                              0
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Summary Metric Cells */}
                  <td className="py-2.5 px-3.5 text-right font-medium text-navy-900 border-l border-gray-200">
                    {counselor.isTargetAssigned && counselor.monthlyTargetCollection !== null
                      ? formatINR(counselor.monthlyTargetCollection)
                      : <span className="text-amber-700 text-[10px] italic">Not set</span>}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-emerald-700">
                    {formatINR(counselor.totalCollections)}
                  </td>
                  <td className="py-2.5 px-2.5 text-center font-bold text-navy-900">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        counselor.isTargetAssigned
                          ? "bg-emerald-50 text-emerald-700 font-bold"
                          : "text-gray-400"
                      }`}
                    >
                      {counselor.collectionAchievement}
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-center text-navy-900 font-medium">
                    {counselor.isTargetAssigned && counselor.monthlyTargetAdmissions !== null
                      ? counselor.monthlyTargetAdmissions
                      : <span className="text-gray-400 text-[10px]">-</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-blue-700">
                    {counselor.totalAdmissions}
                  </td>
                  <td className="py-2.5 px-2.5 text-center font-bold text-navy-900">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        counselor.isTargetAssigned
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-gray-400"
                      }`}
                    >
                      {counselor.admissionAchievement}
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-center font-semibold text-navy-800">
                    {counselor.admissionDays}
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-slate-700">
                    {counselor.confirmedZeroDays}
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-brand-orange">
                    {counselor.currentZeroStreak}d
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-navy-900">
                    {counselor.longestZeroStreak}d
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setDetailCounselor(counselor)}
                      className="p-1 rounded text-navy-700 hover:text-brand-orange hover:bg-orange-50 transition-colors"
                      title="View full daily history"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCounselors.length === 0 && (
                <tr>
                  <td
                    colSpan={calendarDays.length + 13}
                    className="py-12 text-center text-gray-500"
                  >
                    No counselors match your filter.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Team Totals Footer */}
            <tfoot>
              <tr className="bg-navy-900 text-white font-bold text-xs border-t-2 border-navy-800">
                <td
                  colSpan={2}
                  className="py-3 px-4 sticky left-0 z-20 bg-navy-900 uppercase tracking-wider text-[11px]"
                >
                  Team Totals ({filteredCounselors.length} Counselors)
                </td>

                {/* Day-by-day aggregated column footers */}
                {calendarDays.map((day) => {
                  let dayCollectionSum = 0;
                  let dayAdmissionSum = 0;
                  filteredCounselors.forEach((c) => {
                    const cell = c.days[day.date];
                    if (cell) {
                      dayCollectionSum += cell.collectionAmount;
                      dayAdmissionSum += cell.admissionCount;
                    }
                  });

                  return (
                    <td
                      key={day.date}
                      className="py-2 px-1 text-center min-w-[42px] max-w-[48px] border-r border-navy-800"
                    >
                      {dayCollectionSum > 0 ? (
                        <div className="text-[10px] text-emerald-400 font-bold leading-tight">
                          {dayCollectionSum >= 100000
                            ? `₹${(dayCollectionSum / 100000).toFixed(1)}L`
                            : `₹${Math.round(dayCollectionSum / 1000)}k`}
                        </div>
                      ) : dayAdmissionSum > 0 ? (
                        <div className="text-[10px] text-blue-300 font-bold">
                          {dayAdmissionSum}a
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[10px]">-</span>
                      )}
                    </td>
                  );
                })}

                {/* Summary totals */}
                <td className="py-3 px-3.5 text-right">
                  {summary.teamTargetCollection ? formatINR(summary.teamTargetCollection) : "N/A"}
                </td>
                <td className="py-3 px-3.5 text-right text-emerald-400">
                  {formatINR(summary.teamActualCollection)}
                </td>
                <td className="py-3 px-2.5 text-center text-emerald-400">
                  {summary.teamCollectionAchievement}
                </td>
                <td className="py-3 px-2 text-center">
                  {summary.teamTargetAdmissions ?? "N/A"}
                </td>
                <td className="py-3 px-2 text-center text-blue-300">
                  {summary.teamActualAdmissions}
                </td>
                <td className="py-3 px-2.5 text-center text-blue-300">
                  {summary.teamAdmissionAchievement}
                </td>
                <td className="py-3 px-2 text-center">{summary.teamAdmissionDays}</td>
                <td className="py-3 px-2 text-center">{summary.teamConfirmedZeroDays}</td>
                <td colSpan={3} className="py-3 px-3 text-right text-gray-400 text-[10px]">
                  All calendar days accounted
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Daily Cell Modal for Confirming/Revoking Zero Collection */}
      <DailyCellModal
        isOpen={Boolean(selectedCell)}
        onClose={() => setSelectedCell(null)}
        counselorName={selectedCell?.counselorName || ""}
        employeeCode={selectedCell?.employeeCode || ""}
        counselorId={selectedCell?.counselorId || ""}
        cellData={selectedCell?.cellData || null}
        onConfirmZero={handleConfirmZero}
        onRevokeZero={handleRevokeZero}
      />

      {/* Counselor Detail View Modal */}
      <CounselorDetailModal
        isOpen={Boolean(detailCounselor)}
        onClose={() => setDetailCounselor(null)}
        counselorRow={detailCounselor}
        monthDisplay={summary.monthDisplay}
      />
    </div>
  );
}
