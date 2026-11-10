"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import type {
  WeeklyAnalyticsData,
  WeeklyAnalyticsFilterOptions,
  WeekIdentifier,
} from "@/types/analytics";
import type { CounselorCategory } from "@/types/counselor";
import { ExpectedVsActualChart } from "./ExpectedVsActualChart";
import { WeeklyComparisonChart } from "./WeeklyComparisonChart";
import { PerformanceGapChart } from "./PerformanceGapChart";
import { CounselorComparisonChart } from "./CounselorComparisonChart";
import { WeeklyPerformanceTable } from "./WeeklyPerformanceTable";
import { getWeeklyAnalyticsAction } from "@/app/(dashboard)/dashboard/reports/actions";

interface WeeklyAnalyticsSectionProps {
  initialData?: WeeklyAnalyticsData | null;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function WeeklyAnalyticsSection({ initialData }: WeeklyAnalyticsSectionProps) {
  const currentDate = new Date();
  const defaultYear = initialData?.filters.year || currentDate.getFullYear();
  const defaultMonth = initialData?.filters.month || currentDate.getMonth() + 1;

  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(defaultMonth);
  const [counselorId, setCounselorId] = useState<string>(initialData?.filters.counselorId || "ALL");
  const [category, setCategory] = useState<CounselorCategory | "ALL">(
    initialData?.filters.category || "ALL"
  );
  const [week, setWeek] = useState<WeekIdentifier | "ALL">(
    initialData?.filters.week || "ALL"
  );

  const [data, setData] = useState<WeeklyAnalyticsData | null>(initialData || null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load analytics when filters change
  const fetchAnalytics = (filterOverrides?: Partial<WeeklyAnalyticsFilterOptions>) => {
    setErrorMessage(null);
    const filterPayload: WeeklyAnalyticsFilterOptions = {
      year: filterOverrides?.year ?? year,
      month: filterOverrides?.month ?? month,
      counselorId: filterOverrides?.counselorId ?? counselorId,
      category: filterOverrides?.category ?? category,
      week: filterOverrides?.week ?? week,
    };

    startTransition(async () => {
      const res = await getWeeklyAnalyticsAction(filterPayload);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setErrorMessage(res.error || "Failed to load weekly analytics.");
      }
    });
  };

  useEffect(() => {
    if (!initialData) {
      fetchAnalytics();
    }
  }, []);

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchAnalytics();
  };

  const team = data?.teamSummary;
  const isAhead = team?.isTeamAhead ?? false;

  return (
    <div className="space-y-5">
      {/* Dynamic Filters Bar */}
      <div className="glass-card rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-brand-orange flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy-800">
                Weekly Performance Tracking & Advanced Analytics
              </h2>
              <p className="text-[11px] text-gray-500">
                Prorated expected targets vs verified collections across 4 fixed reporting periods
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchAnalytics()}
            disabled={isPending}
            className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-orange ${isPending ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Year Selector */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => {
                const y = parseInt(e.target.value, 10);
                setYear(y);
                fetchAnalytics({ year: y });
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => {
                const m = parseInt(e.target.value, 10);
                setMonth(m);
                fetchAnalytics({ month: m });
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                const cat = e.target.value as CounselorCategory | "ALL";
                setCategory(cat);
                fetchAnalytics({ category: cat });
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="CDA">CDA Only</option>
              <option value="SCDA">SCDA Only</option>
              <option value="PCA">PCA Only</option>
            </select>
          </div>

          {/* Counselor Selector */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Counselor
            </label>
            <select
              value={counselorId}
              onChange={(e) => {
                const cid = e.target.value;
                setCounselorId(cid);
                fetchAnalytics({ counselorId: cid });
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              <option value="ALL">All Nine Counselors</option>
              {(data?.counselorPerformances || []).map((c) => (
                <option key={c.counselorId} value={c.counselorId}>
                  {c.counselorName} ({c.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Week Filter */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Week Period
            </label>
            <select
              value={week}
              onChange={(e) => {
                const w = e.target.value as WeekIdentifier | "ALL";
                setWeek(w);
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              <option value="ALL">Full Month (All 4 Weeks)</option>
              <option value="W1">Week 1 (1st – 7th)</option>
              <option value="W2">Week 2 (8th – 14th)</option>
              <option value="W3">Week 3 (15th – 21st)</option>
              <option value="W4">Week 4 (22nd – End)</option>
            </select>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Team Aggregate Summary Cards */}
      {team && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {/* Monthly Target */}
          <div className="glass-card glass-card-hover rounded-xl p-3 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Monthly Target
            </span>
            <div className="text-base font-black text-navy-800 font-mono">
              {formatINR(team.totalMonthlyTarget)}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Sum of team quotas</p>
          </div>

          {/* Expected Revenue */}
          <div className="glass-card glass-card-hover rounded-xl p-3 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Expected (Prorated)
            </span>
            <div className="text-base font-black text-navy-800 font-mono">
              {formatINR(team.totalExpectedRevenue)}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Day {data?.elapsedMonthDays} of {data?.monthDays}
            </p>
          </div>

          {/* Actual Verified Revenue */}
          <div className="glass-card glass-card-hover rounded-xl p-3 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Verified Revenue
            </span>
            <div className="text-base font-black text-emerald-700 font-mono">
              {formatINR(team.totalActualRevenue)}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {team.totalActualAdmissions} admissions
            </p>
          </div>

          {/* Performance Gap */}
          <div className="glass-card glass-card-hover rounded-xl p-3 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Performance Gap
            </span>
            <div
              className={`text-base font-black font-mono ${
                isAhead ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isAhead ? `+${formatINR(team.totalPerformanceGap)}` : `-${formatINR(Math.abs(team.totalPerformanceGap))}`}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isAhead ? "Ahead of expected" : "Behind expected"}
            </p>
          </div>

          {/* Remaining Target */}
          <div className="glass-card glass-card-hover rounded-xl p-3 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Remaining Target
            </span>
            <div className="text-base font-black text-navy-800 font-mono">
              {formatINR(team.totalRemainingTarget)}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">To achieve 100%</p>
          </div>

          {/* Achievement % */}
          <div className="glass-card glass-card-hover rounded-xl p-3 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Achievement
            </span>
            <div className="text-base font-black text-brand-orange">
              {team.overallAchievementPercentage !== null
                ? `${team.overallAchievementPercentage.toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Overall collection %</p>
          </div>
        </div>
      )}

      {/* 4 Dedicated Analytics Charts (Responsive Grid) */}
      {data?.charts && (
        <div className="space-y-4">
          {/* Top Row: Expected vs Actual Revenue (Chart 1) & Weekly Comparison (Chart 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ExpectedVsActualChart data={data.charts.expectedVsActual} />
            <WeeklyComparisonChart weeks={data.charts.weeklyComparison} />
          </div>

          {/* Bottom Row: Performance Gap (Chart 3) & Counselor Comparison (Chart 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceGapChart data={data.charts.performanceGap} />
            <CounselorComparisonChart counselors={data.charts.counselorComparison} />
          </div>
        </div>
      )}

      {/* Detailed Weekly Breakdown Table */}
      {data?.counselorPerformances && (
        <WeeklyPerformanceTable
          performances={data.counselorPerformances}
          selectedWeekFilter={week}
        />
      )}
    </div>
  );
}
