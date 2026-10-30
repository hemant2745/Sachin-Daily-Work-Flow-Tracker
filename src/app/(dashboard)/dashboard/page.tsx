import React from "react";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardHeroBanner } from "@/components/dashboard/DashboardHeroBanner";
import { TeamPerformanceChart } from "@/components/dashboard/TeamPerformanceChart";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { MotivationalCard } from "@/components/dashboard/MotivationalCard";
import {
  Users,
  GraduationCap,
  CheckSquare,
  TrendingUp,
  CalendarCheck,
  BarChart3,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Target,
} from "lucide-react";
import { normalizeMonthKey, formatINR, formatMonthDisplay } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCounselorsWithTargetsAction } from "./counselors/actions";
import { getAdmissionsAction } from "./admissions/actions";
import { getTasksAction } from "./tasks/actions";
import { getProjectionsAction } from "./projections/actions";
import { getCallingPerformanceAction } from "./calling-performance/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentMonthKey = normalizeMonthKey(new Date());
  const todayDateStr = new Date().toISOString().split("T")[0];
  const monthDisplay = formatMonthDisplay(currentMonthKey);
  const configured = isSupabaseConfigured();

  // Fetch real metrics in parallel across all core modules
  const [counselorsRes, admissionsRes, tasksRes, projectionsRes, callingRes] = await Promise.all([
    getCounselorsWithTargetsAction(currentMonthKey),
    getAdmissionsAction({ monthKey: currentMonthKey }),
    getTasksAction(),
    getProjectionsAction({ monthKey: currentMonthKey }),
    getCallingPerformanceAction({ date: todayDateStr }),
  ]);

  const hasData =
    counselorsRes.success ||
    admissionsRes.success ||
    tasksRes.success ||
    projectionsRes.success;

  // 1. Financial & Admissions Metrics
  const teamMonthlyTarget = counselorsRes.summary?.combinedMonthlyTarget || 0;
  const teamRevenueAchieved = admissionsRes.summary?.currentMonthCollections || 0;
  const teamAchievementPercentage =
    teamMonthlyTarget > 0 ? (teamRevenueAchieved / teamMonthlyTarget) * 100 : null;
  const totalAdmissionsCount = admissionsRes.summary?.currentMonthAdmissionsCount || 0;
  const admissionsList = admissionsRes.admissions || [];

  // 2. Task Telemetry
  const allTasks = tasksRes.tasks || [];
  const pendingTasksCount = allTasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();

  const todayTasks = allTasks.filter(
    (t) => t.scheduled_date === todayStr && t.status !== "completed" && t.status !== "cancelled"
  );

  const overdueTasks = allTasks.filter((t) => {
    if (t.status === "completed" || t.status === "cancelled") return false;
    const taskDate = new Date(t.scheduled_at || `${t.scheduled_date}T${t.scheduled_start_time}`);
    return taskDate < now;
  });

  // 3. Projections Telemetry
  const allProjections = projectionsRes.projections || [];
  const pendingProjections = allProjections.filter((p) => p.status === "pending");
  const pendingProjectionsCount = pendingProjections.length;
  const urgentProjections = pendingProjections.filter((p) => p.projection_date < todayStr);

  // 4. Calling Performance Summary
  const callingSummary = callingRes.summary;

  return (
    <div className="space-y-6">
      {/* 1. Main Dashboard Banner (Navy to Royal Blue Gradient, S3 Logo, Mission Statement, Taglines) */}
      <DashboardHeroBanner />

      {/* 2. Team Performance Metrics (Four Key KPI Cards) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-[#0A2454] uppercase tracking-wider">
              Team Performance Metrics
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0866F5] border border-blue-100">
              {monthDisplay}
            </span>
          </div>

          <span className="text-xs text-[#0866F5] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00A77B] animate-pulse" />
            {configured && hasData ? "Live Production Database" : "Awaiting Database Records"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Team Monthly Target */}
          <MetricCard
            title="Team Monthly Target"
            iconName="target"
            isLive={configured && hasData}
            value={formatINR(teamMonthlyTarget)}
            placeholderValue="Not configured"
            description={`Aggregated monthly target quota allocated across active counsellors for ${monthDisplay}.`}
            statusLabel={configured && hasData ? "Active Quota" : "Setup Pending"}
            phaseNote={
              configured && hasData
                ? `${counselorsRes.summary?.activeCounselors || 0} active counsellor(s)`
                : "Awaiting setup"
            }
            accentColor="blue"
          />

          {/* Card 2: Team Revenue Achieved */}
          <MetricCard
            title="Team Revenue Achieved"
            iconName="revenue"
            isLive={configured && hasData}
            value={formatINR(teamRevenueAchieved)}
            placeholderValue="Not configured"
            description={`Total verified admission revenue collected month-to-date across counsellors for ${monthDisplay}.`}
            statusLabel={configured && hasData ? "Verified Ledger" : "Ledger Pending"}
            phaseNote={configured && hasData ? "Admissions Pipeline" : "Awaiting setup"}
            accentColor="green"
          />

          {/* Card 3: Team Achievement Percentage */}
          <MetricCard
            title="Team Achievement %"
            iconName="percentage"
            isLive={configured && hasData}
            value={
              teamAchievementPercentage !== null ? `${teamAchievementPercentage.toFixed(1)}%` : "N/A"
            }
            placeholderValue="Not configured"
            percentageProgress={teamAchievementPercentage}
            description="Actual revenue divided by active monthly target. Accurate unscaled percentage."
            statusLabel={
              configured && hasData
                ? teamAchievementPercentage !== null
                  ? "Calculated"
                  : "Target ₹0 (N/A)"
                : "Formula Pending"
            }
            phaseNote={configured && hasData ? "Real-time Tracking" : "Awaiting setup"}
            accentColor="orange"
          />

          {/* Card 4: Total Admissions */}
          <MetricCard
            title="Total Admissions"
            iconName="admissions"
            isLive={configured && hasData}
            value={`${totalAdmissionsCount}`}
            placeholderValue="Not configured"
            description={`Total verified enrolled students credited to team counsellors for ${monthDisplay}.`}
            statusLabel={configured && hasData ? "Verified Enrolled" : "Registry Pending"}
            phaseNote={
              configured && hasData
                ? `${admissionsRes.summary?.totalAdmissions || 0} lifetime admissions`
                : "Awaiting setup"
            }
            accentColor="cyan"
          />
        </div>
      </section>

      {/* 3. Featured Calling Performance & APR Telemetry Panel (Prominent Full-Width Section) */}
      <section className="bg-white border border-[#DFEAFE] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-[#DFEAFE]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0866F5] to-[#18B9E8] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#0A2454]">
                  Calling Performance & APR Telemetry
                </h3>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0866F5] border border-blue-200">
                  Daily Checkpoint
                </span>
              </div>
              <p className="text-xs text-[#61789E] mt-0.5">
                Official Benchmarks: <strong className="text-[#0A2454]">200 calls</strong> &bull; <strong className="text-[#0A2454]">90 mins talk time</strong> per counsellor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#61789E]">Team APR Status</span>
              <span className={`text-xs font-black ${
                (callingSummary?.averageAPR ?? 0) >= 100 ? "text-[#00A77B]" : "text-[#0866F5]"
              }`}>
                {callingSummary?.averageAPR !== null && callingSummary?.averageAPR !== undefined
                  ? `${callingSummary.averageAPR}% Overall`
                  : "Awaiting Records"}
              </span>
            </div>
            <Link
              href="/dashboard/calling-performance"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0866F5] to-[#1677FF] hover:from-[#0650c5] hover:to-[#0866F5] text-white text-xs sm:text-[13px] font-bold rounded-xl shadow-xs transition-all"
            >
              <span>Calling Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Telemetry Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Metric 1: Average APR */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#F3F8FF] to-white border border-[#DFEAFE] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#0866F5]">
                  Average APR
                </span>
                <span className="w-2 h-2 rounded-full bg-[#0866F5]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#0A2454]">
                {callingSummary?.averageAPR !== null && callingSummary?.averageAPR !== undefined
                  ? `${callingSummary.averageAPR}%`
                  : "0.0%"}
              </p>
            </div>
            <p className="text-[11px] text-[#61789E] mt-2 font-medium">
              50/50 Calls & Talk Time
            </p>
          </div>

          {/* Metric 2: Benchmark Met (>=100% APR) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#00A77B]">
                  &ge; 100% APR
                </span>
                <span className="w-2 h-2 rounded-full bg-[#00A77B]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#00A77B]">
                {callingSummary?.acceptableCount || 0}
              </p>
            </div>
            <p className="text-[11px] text-[#00A77B] mt-2 font-semibold">
              Counsellors on target
            </p>
          </div>

          {/* Metric 3: Underperforming (<100% APR) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-rose-50/50 to-white border border-rose-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#F04460]">
                  &lt; 100% APR
                </span>
                <span className="w-2 h-2 rounded-full bg-[#F04460]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#F04460]">
                {callingSummary?.underperformingCount || 0}
              </p>
            </div>
            <p className="text-[11px] text-[#F04460] mt-2 font-semibold">
              Reason required
            </p>
          </div>

          {/* Metric 4: Daily Submissions */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-50/50 to-white border border-amber-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#FF8A00]">
                  Submissions
                </span>
                <span className="w-2 h-2 rounded-full bg-[#FF8A00]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#FF8A00]">
                {callingSummary?.totalSubmissions || 0}
                <span className="text-base text-[#61789E] font-medium">/{callingSummary?.expectedSubmissions || 0}</span>
              </p>
            </div>
            <p className="text-[11px] text-[#61789E] mt-2 font-medium">
              {callingSummary?.missingSubmissions || 0} missing today
            </p>
          </div>

          {/* Metric 5: Peak APR Score */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-50/50 to-white border border-purple-200/70 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-purple-600">
                  Peak APR
                </span>
                <span className="w-2 h-2 rounded-full bg-purple-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-purple-700">
                {callingSummary?.highestAPR !== null && callingSummary?.highestAPR !== undefined
                  ? `${callingSummary.highestAPR}%`
                  : "—"}
              </p>
            </div>
            <p className="text-[11px] text-purple-600 mt-2 font-semibold">
              Top daily counsellor
            </p>
          </div>
        </div>
      </section>

      {/* 4. Operational Queues (Pending Tasks and Pending Projections Side-by-Side) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* A. Pending Tasks Card */}
        <div className="bg-white border border-[#DFEAFE] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#DFEAFE]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#0866F5]/10 flex items-center justify-center text-[#0866F5]">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#0A2454]">Pending Tasks</h4>
                  <p className="text-xs text-[#61789E]">Active queue and automated alerts</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#0A2454]">
                  {pendingTasksCount}
                </span>
                {overdueTasks.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-[#F04460] border border-rose-200 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> {overdueTasks.length} Overdue
                  </span>
                )}
              </div>
            </div>

            {/* Tasks Preview List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {todayTasks.length === 0 && overdueTasks.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[#DFEAFE] rounded-xl bg-[#F3F8FF]/50">
                  <CheckCircle2 className="w-8 h-8 text-[#00A77B] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#0A2454]">Task Queue Clear</p>
                  <p className="text-[11px] text-[#61789E]">No urgent tasks overdue or pending today.</p>
                </div>
              ) : (
                <>
                  {overdueTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-rose-950 truncate">{t.title}</p>
                        <p className="text-[11px] text-[#F04460] mt-0.5">
                          Overdue: {t.scheduled_date} at {t.scheduled_start_time}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F04460] text-white shrink-0 uppercase">
                        Overdue
                      </span>
                    </div>
                  ))}

                  {todayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-[#F3F8FF] border border-[#DFEAFE] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-semibold text-[#0A2454] truncate">{t.title}</p>
                        <p className="text-[11px] text-[#61789E] mt-0.5">
                          Due today &bull; {t.priority}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0866F5] border border-blue-100 shrink-0 capitalize">
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="pt-3.5 border-t border-[#DFEAFE] mt-4">
            <Link
              href="/dashboard/tasks"
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#F3F8FF] hover:bg-blue-50 text-[#0866F5] text-xs sm:text-[13px] font-bold rounded-xl border border-[#DFEAFE] transition-colors"
            >
              <span>Manage Tasks & Subtasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* B. Pending Projection Reviews Card */}
        <div className="bg-white border border-[#DFEAFE] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#DFEAFE]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#00A77B]/10 flex items-center justify-center text-[#00A77B]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#0A2454]">Pending Projections</h4>
                  <p className="text-xs text-[#61789E]">Forecast evaluations & verification</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#0A2454]">
                  {pendingProjectionsCount}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#00A77B] border border-emerald-200">
                  Reviews
                </span>
              </div>
            </div>

            {/* Projections Preview List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {pendingProjections.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[#DFEAFE] rounded-xl bg-[#F3F8FF]/50">
                  <CheckCircle2 className="w-8 h-8 text-[#00A77B] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#0A2454]">All Projections Evaluated</p>
                  <p className="text-[11px] text-[#61789E]">No pending forecasts awaiting status confirmation.</p>
                </div>
              ) : (
                pendingProjections.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[#F3F8FF] border border-[#DFEAFE] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-[#0A2454] truncate">
                        {p.counselor?.full_name || "Assigned Counsellor"}
                      </p>
                      <p className="text-[11px] text-[#61789E] mt-0.5">
                        {p.projection_date} &bull; <span className="font-bold text-[#FF8A00]">{formatINR(p.projected_revenue)}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-[#FF8A00] border border-amber-200 shrink-0">
                      Needs Review
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3.5 border-t border-[#DFEAFE] mt-4">
            <Link
              href="/dashboard/projections"
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#F3F8FF] hover:bg-emerald-50 text-[#00A77B] text-xs sm:text-[13px] font-bold rounded-xl border border-[#DFEAFE] transition-colors"
            >
              <span>Review Projections</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Analytics and Quick Actions (Three Columns: Trend Chart, Quick Actions, Motivational Card) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column A: Team Performance Trend Chart */}
        <div className="lg:col-span-1">
          <TeamPerformanceChart
            admissions={admissionsList}
            monthlyTarget={teamMonthlyTarget}
            monthKey={currentMonthKey}
          />
        </div>

        {/* Column B: Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActionsCard />
        </div>

        {/* Column C: Motivational Card */}
        <div className="lg:col-span-1">
          <MotivationalCard />
        </div>
      </section>
    </div>
  );
}
