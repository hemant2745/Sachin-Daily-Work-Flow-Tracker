import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  CheckSquare,
  TrendingUp,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { normalizeMonthKey, formatINR, formatMonthDisplay } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCounselorsWithTargetsAction } from "./counselors/actions";
import { getAdmissionsAction } from "./admissions/actions";

export default async function DashboardPage() {
  const currentMonthKey = normalizeMonthKey(new Date());
  const monthDisplay = formatMonthDisplay(currentMonthKey);
  const configured = isSupabaseConfigured();

  // Fetch real metrics for the current reporting month
  const [counselorsRes, admissionsRes] = await Promise.all([
    getCounselorsWithTargetsAction(currentMonthKey),
    getAdmissionsAction({ monthKey: currentMonthKey }),
  ]);

  const hasData = counselorsRes.success || admissionsRes.success;

  const teamMonthlyTarget = counselorsRes.summary?.combinedMonthlyTarget || 0;
  const teamRevenueAchieved = admissionsRes.summary?.currentMonthCollections || 0;
  const teamAchievementPercentage =
    teamMonthlyTarget > 0 ? (teamRevenueAchieved / teamMonthlyTarget) * 100 : null;
  const totalAdmissionsCount = admissionsRes.summary?.currentMonthAdmissionsCount || 0;

  return (
    <div className="space-y-6">
      {/* Hero Banner Section using Supplied Image */}
      <section className="bg-navy-950 rounded-2xl overflow-hidden border border-navy-800 shadow-xl relative">
        <div className="relative w-full aspect-[2048/768] max-h-[280px] sm:max-h-[320px] bg-navy-950 flex items-center justify-center">
          <Image
            src="/images/sachin-workflow-hero.png"
            alt="Sachin Behera - Building Skills, Creating Opportunities for a Better Tomorrow"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="object-contain sm:object-cover object-center"
          />
          {/* Subtle gradient overlay at bottom edge */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-transparent to-transparent pointer-events-none" />

          {/* Badge top-left */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-navy-700/60 text-[11px] text-white">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            <span className="font-medium">Administrator Workspace Banner</span>
          </div>
        </div>

        {/* Banner Details Bar */}
        <div className="px-5 py-3.5 bg-navy-900 border-t border-navy-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-gray-300">
            <ShieldCheck className="w-4 h-4 text-brand-orange shrink-0" />
            <span className="font-medium text-white">Sachin Behera</span>
            <span className="text-gray-500">&bull;</span>
            <span className="text-gray-400">Team Leader, College Vidya</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Info className="w-3.5 h-3.5 text-brand-orange" />
            <span>Private Single-Administrator System &bull; Phase 4 Admissions & Revenue Active</span>
          </div>
        </div>
      </section>

      {/* Real Performance Metrics Cards */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-navy-800 uppercase tracking-wider">
            Team Performance Metrics ({monthDisplay})
          </h3>
          <span className="text-xs text-brand-orange font-semibold">
            {configured && hasData ? "Live Database Telemetry" : "Awaiting Database Records"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* 1. Team Monthly Target */}
          <MetricCard
            title="Team Monthly Target"
            iconName="target"
            isLive={configured && hasData}
            value={formatINR(teamMonthlyTarget)}
            placeholderValue="Not configured"
            description={`Aggregated monthly quota for all active team counselors for ${monthDisplay}.`}
            statusLabel={configured && hasData ? "Active Quota" : "Target Setup Pending"}
            phaseNote={configured && hasData ? `${counselorsRes.summary.activeCounselors} active counselor(s)` : "Data will appear after setup"}
          />

          {/* 2. Team Revenue Achieved */}
          <MetricCard
            title="Team Revenue Achieved"
            iconName="revenue"
            isLive={configured && hasData}
            value={formatINR(teamRevenueAchieved)}
            placeholderValue="Not configured"
            description={`Total verified admission revenue collected month-to-date across counselors for ${monthDisplay}.`}
            statusLabel={configured && hasData ? "Verified Ledger" : "Ledger Setup Pending"}
            phaseNote={configured && hasData ? "Admissions Pipeline" : "Data will appear after setup"}
          />

          {/* 3. Team Achievement Percentage */}
          <MetricCard
            title="Team Achievement Percentage"
            iconName="percentage"
            isLive={configured && hasData}
            value={teamAchievementPercentage !== null ? `${teamAchievementPercentage.toFixed(1)}%` : "N/A"}
            placeholderValue="Not configured"
            description="Computed ratio of achieved team revenue against active monthly target."
            statusLabel={configured && hasData ? (teamAchievementPercentage !== null ? "Calculated" : "Target ₹0 (N/A)") : "Formula Pending"}
            phaseNote={configured && hasData ? "Real-time Achievement" : "Data will appear after setup"}
          />

          {/* 4. Total Admissions */}
          <MetricCard
            title="Total Admissions"
            iconName="admissions"
            isLive={configured && hasData}
            value={`${totalAdmissionsCount}`}
            placeholderValue="Not configured"
            description={`Total count of enrolled students credited to team counselors for ${monthDisplay}.`}
            statusLabel={configured && hasData ? "Verified Enrolled" : "Registry Pending"}
            phaseNote={configured && hasData ? `${admissionsRes.summary.totalAdmissions} lifetime total` : "Data will appear after setup"}
          />

          {/* 5. Pending Tasks (Phase 7) */}
          <MetricCard
            title="Pending Tasks"
            iconName="tasks"
            placeholderValue="Not configured"
            description="Daily action items, reminders, and follow-ups assigned to counselors or the team leader."
            statusLabel="Task Queue Pending"
            phaseNote="Phase 7 Architecture"
          />

          {/* 6. Pending Projection Evaluations (Phase 6) */}
          <MetricCard
            title="Pending Projection Evaluations"
            iconName="projections"
            placeholderValue="Not configured"
            description="Forecast models and individual counselor projection reviews awaiting evaluation."
            statusLabel="Model Setup Pending"
            phaseNote="Phase 6 Architecture"
          />
        </div>
      </section>

      {/* Active Modules & Preview Modules */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
        {/* Counselors Module */}
        <div id="counselors" className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center text-navy-800">
                  <Users className="w-4 h-4 text-brand-orange" />
                </div>
                <h4 className="text-sm font-bold text-navy-800">Counselor Management</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Phase 3 Active
              </span>
            </div>

            <div className="py-5 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg bg-surface-light/60">
              <div className="w-10 h-10 rounded-full bg-white mx-auto flex items-center justify-center shadow-sm text-gray-400 mb-2">
                <Users className="w-5 h-5 text-brand-orange" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Team Roster & Targets</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1 mb-3">
                Register counselors, configure monthly quotas, and review individual revenue progress.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/dashboard/counselors"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <span>Open Counselor Roster</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Admissions Module */}
        <div id="admissions" className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center text-navy-800">
                  <GraduationCap className="w-4 h-4 text-brand-orange" />
                </div>
                <h4 className="text-sm font-bold text-navy-800">Admissions & Collections</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Phase 4 Active
              </span>
            </div>

            <div className="py-5 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg bg-surface-light/60">
              <div className="w-10 h-10 rounded-full bg-white mx-auto flex items-center justify-center shadow-sm text-gray-400 mb-2">
                <GraduationCap className="w-5 h-5 text-brand-orange" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Admissions Pipeline</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1 mb-3">
                Record student admissions, log verified fees collected, and calculate automatic revenue.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/dashboard/admissions"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <span>Manage Admissions & Fees</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Tasks & Daily Tracker Preview */}
        <div id="tasks" className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center text-navy-800">
                  <CheckSquare className="w-4 h-4 text-brand-orange" />
                </div>
                <h4 className="text-sm font-bold text-navy-800">Daily Workflow Tasks</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
                Module Preview
              </span>
            </div>

            <div className="py-5 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg bg-surface-light/60">
              <div className="w-10 h-10 rounded-full bg-white mx-auto flex items-center justify-center shadow-sm text-gray-400 mb-2">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Task Queue Awaiting Setup</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1 mb-3">
                Subtask tracking, daily calling volume checkpoints, and reminders will appear in Phase 7.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <div className="w-full text-center py-2 text-xs font-semibold text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
              Scheduled for Phase 7
            </div>
          </div>
        </div>
      </section>

      {/* Projections & Reports Architectural Placeholder */}
      <section id="projections" className="bg-white border border-surface-border rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center text-navy-800">
              <TrendingUp className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-sm font-bold text-navy-800">Projection Evaluation Engine & Reports</h4>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
            Module Preview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-3.5 rounded-lg bg-surface-light border border-gray-200">
            <p className="text-xs font-semibold text-navy-800">Admission Projections</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Evaluates conversion rates and counselor forecasts against target quotas.
            </p>
            <div className="mt-2.5 inline-block text-[10px] text-brand-orange font-medium">
              Scheduled for Phase 6
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-light border border-gray-200">
            <p className="text-xs font-semibold text-navy-800">Daily Performance Reports</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Consolidated summaries of calling volume, pitch conversions, and verified leads.
            </p>
            <div className="mt-2.5 inline-block text-[10px] text-brand-orange font-medium">
              Scheduled for Phase 5 / 8
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-light border border-gray-200">
            <p className="text-xs font-semibold text-navy-800">Settings & Security</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Single-administrator profile, Supabase connection status, and security keys.
            </p>
            <div className="mt-2.5 inline-block text-[10px] text-emerald-700 font-semibold">
              RLS & Admin Auth Active
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
