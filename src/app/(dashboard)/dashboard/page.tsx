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
  CalendarCheck,
  BarChart3,
  Settings,
  Clock,
  Sparkles,
  Info,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
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

  // 2. Task Telemetry
  const allTasks = tasksRes.tasks || [];
  const pendingTasksCount = allTasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();

  // Upcoming in next 24 hours & Today
  const todayTasks = allTasks.filter(
    (t) => t.scheduled_date === todayStr && t.status !== "completed" && t.status !== "cancelled"
  );

  // Overdue tasks: scheduled_at < now and not completed/cancelled
  const overdueTasks = allTasks.filter((t) => {
    if (t.status === "completed" || t.status === "cancelled") return false;
    const taskDate = new Date(t.scheduled_at || `${t.scheduled_date}T${t.scheduled_start_time}`);
    return taskDate < now;
  });

  // Next 24 hours tasks
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcoming24hTasks = allTasks.filter((t) => {
    if (t.status === "completed" || t.status === "cancelled") return false;
    const taskDate = new Date(t.scheduled_at || `${t.scheduled_date}T${t.scheduled_start_time}`);
    return taskDate >= now && taskDate <= next24h;
  });

  // 3. Projections Telemetry
  const allProjections = projectionsRes.projections || [];
  const pendingProjections = allProjections.filter((p) => p.status === "pending");
  const pendingProjectionsCount = pendingProjections.length;

  // Urgent projection reviews: past date projections still pending review
  const urgentProjections = pendingProjections.filter((p) => p.projection_date < todayStr);

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
            <span className="font-medium">Administrator Workspace Console</span>
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
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Complete Team Workflow Management &bull; Live Telemetry Synchronized</span>
          </div>
        </div>
      </section>

      {/* Real Performance Metrics Cards (Top 6 Live KPIs) */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-navy-800 uppercase tracking-wider">
            Team Performance Metrics ({monthDisplay})
          </h3>
          <span className="text-xs text-brand-orange font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
            phaseNote={
              configured && hasData
                ? `${counselorsRes.summary?.activeCounselors || 0} active counselor(s)`
                : "Data will appear after setup"
            }
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
            value={
              teamAchievementPercentage !== null ? `${teamAchievementPercentage.toFixed(1)}%` : "N/A"
            }
            placeholderValue="Not configured"
            description="Computed ratio of achieved team revenue against active monthly target."
            statusLabel={
              configured && hasData
                ? teamAchievementPercentage !== null
                  ? "Calculated"
                  : "Target ₹0 (N/A)"
                : "Formula Pending"
            }
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
            phaseNote={
              configured && hasData
                ? `${admissionsRes.summary?.totalAdmissions || 0} lifetime total`
                : "Data will appear after setup"
            }
          />

          {/* 5. Pending Tasks (Live Database Telemetry) */}
          <MetricCard
            title="Pending Tasks"
            iconName="tasks"
            isLive={configured && hasData}
            value={`${pendingTasksCount}`}
            placeholderValue="0"
            description="Scheduled action items, subtasks, and automated reminder alerts in active queue."
            statusLabel={overdueTasks.length > 0 ? `${overdueTasks.length} Overdue` : "Queue Up to Date"}
            phaseNote={`${todayTasks.length} due today &bull; ${allTasks.length} total tasks`}
          />

          {/* 6. Pending Projection Reviews (Live Database Telemetry) */}
          <MetricCard
            title="Pending Projection Reviews"
            iconName="projections"
            isLive={configured && hasData}
            value={`${pendingProjectionsCount}`}
            placeholderValue="0"
            description="Next-day counselor projection forecasts awaiting confirmation."
            statusLabel={
              urgentProjections.length > 0
                ? `${urgentProjections.length} Review Overdue`
                : "Reviews Current"
            }
            phaseNote={`${projectionsRes.overview?.metCount || 0} verified met in ${monthDisplay}`}
          />
        </div>
      </section>

      {/* Today's Calling Performance & APR Telemetry Banner */}
      {callingRes.summary && (
        <section className="bg-white border border-surface-border rounded-2xl p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-800">
                <PhoneCall className="w-4 h-4 text-brand-orange" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-800">Today&apos;s Team Calling Performance & APR</h4>
                <p className="text-[11px] text-gray-500">
                  Target benchmarks: 200 calls &bull; 90 min talk-time per counsellor.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/calling-performance"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange hover:text-brand-hover"
            >
              <span>Calling Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-surface-light border border-gray-200">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">Average Team APR</div>
              <div className="text-base font-bold text-navy-800 mt-0.5">
                {callingRes.summary.averageAPR !== null ? `${callingRes.summary.averageAPR}%` : "No Submissions"}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-light border border-gray-200">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">&ge; 100% APR</div>
              <div className="text-base font-bold text-emerald-600 mt-0.5">
                {callingRes.summary.acceptableCount} Counsellors
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-light border border-gray-200">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">&lt; 100% APR</div>
              <div className="text-base font-bold text-rose-600 mt-0.5">
                {callingRes.summary.underperformingCount} Counsellors
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-light border border-gray-200">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">Missing Submissions</div>
              <div className="text-base font-bold text-amber-600 mt-0.5">
                {callingRes.summary.missingSubmissions} Pending
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-light border border-gray-200">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">Highest APR</div>
              <div className="text-base font-bold text-teal-600 mt-0.5">
                {callingRes.summary.highestAPR !== null ? `${callingRes.summary.highestAPR}%` : "—"}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-light border border-gray-200">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">Lowest APR</div>
              <div className="text-base font-bold text-purple-600 mt-0.5">
                {callingRes.summary.lowestAPR !== null ? `${callingRes.summary.lowestAPR}%` : "—"}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Live Activity & Action Queue Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today & Upcoming Task Queue */}
        <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-800">Today & Upcoming Task Queue</h4>
                  <p className="text-[11px] text-gray-500">
                    Tasks scheduled for today or needing urgent attention.
                  </p>
                </div>
              </div>
              {overdueTasks.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {overdueTasks.length} Overdue
                </span>
              )}
            </div>

            {/* Task Item List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {todayTasks.length === 0 && overdueTasks.length === 0 && upcoming24hTasks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700">All Tasks Up to Date</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No overdue or pending tasks scheduled for the next 24 hours.
                  </p>
                </div>
              ) : (
                <>
                  {/* Overdue Items */}
                  {overdueTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-rose-900 truncate">{t.title}</div>
                        <div className="text-[11px] text-rose-600 flex items-center gap-2 mt-0.5">
                          <span>Due: {t.scheduled_date} at {t.scheduled_start_time}</span>
                          {t.counselor && <span>&bull; {t.counselor.full_name}</span>}
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200/80 text-rose-800 shrink-0 uppercase">
                        Overdue
                      </span>
                    </div>
                  ))}

                  {/* Today's Tasks */}
                  {todayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-surface-light border border-gray-200 flex items-center justify-between text-xs hover:border-gray-300 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-navy-800 truncate">{t.title}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>Today at {t.scheduled_start_time}</span>
                          <span className="uppercase text-[10px] font-semibold text-brand-orange">
                            {t.priority}
                          </span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 mt-3">
            <Link
              href="/dashboard/tasks"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-light hover:bg-gray-100 text-navy-800 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
            >
              <span>Manage All Tasks & Reminders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Projection Review Queue */}
        <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-800">Projection Evaluation Queue</h4>
                  <p className="text-[11px] text-gray-500">
                    Counsellor forecast evaluations and completion tracking.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {pendingProjectionsCount} Pending
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {pendingProjections.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700">All Projections Evaluated</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No pending forecasts awaiting status confirmation.
                  </p>
                </div>
              ) : (
                pendingProjections.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-surface-light border border-gray-200 flex items-center justify-between text-xs hover:border-gray-300 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-navy-800 truncate">
                        {p.counselor?.full_name || "Assigned Counsellor"}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>Date: {p.projection_date}</span>
                        <span>&bull;</span>
                        <span className="text-brand-orange font-medium">
                          {formatINR(p.projected_revenue)}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      Needs Review
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 mt-3">
            <Link
              href="/dashboard/projections"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-light hover:bg-gray-100 text-navy-800 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
            >
              <span>Review Projections & Conversion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Production Operational Modules Directory Grid */}
      <section className="pt-2">
        <h3 className="text-sm font-bold text-navy-800 uppercase tracking-wider mb-3.5">
          Operational Management Modules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Counselor Management */}
          <Link
            href="/dashboard/counselors"
            className="group bg-white border border-surface-border hover:border-brand-orange rounded-xl p-4 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-50 group-hover:bg-brand-orange/10 flex items-center justify-center text-navy-800 group-hover:text-brand-orange transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Production Active
                </span>
              </div>
              <h4 className="text-xs font-bold text-navy-800 group-hover:text-brand-orange transition-colors">
                Counselor Management
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Configure quotas, adjust monthly targets, and track individual progress.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand-orange gap-1 group-hover:translate-x-1 transition-transform">
              <span>Open Roster</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* 2. Admissions Pipeline */}
          <Link
            href="/dashboard/admissions"
            className="group bg-white border border-surface-border hover:border-brand-orange rounded-xl p-4 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-50 group-hover:bg-brand-orange/10 flex items-center justify-center text-navy-800 group-hover:text-brand-orange transition-colors">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Production Active
                </span>
              </div>
              <h4 className="text-xs font-bold text-navy-800 group-hover:text-brand-orange transition-colors">
                Admissions & Collections
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Enrollment registry, verified fee collections, and automatic financial attribution.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand-orange gap-1 group-hover:translate-x-1 transition-transform">
              <span>Manage Admissions</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* 3. Daily Tracker */}
          <Link
            href="/dashboard/daily-tracker"
            className="group bg-white border border-surface-border hover:border-brand-orange rounded-xl p-4 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-50 group-hover:bg-brand-orange/10 flex items-center justify-center text-navy-800 group-hover:text-brand-orange transition-colors">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Production Active
                </span>
              </div>
              <h4 className="text-xs font-bold text-navy-800 group-hover:text-brand-orange transition-colors">
                Daily Calendar Tracker
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                31-day team matrix, confirmed zero days, and consecutive zero streaks.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand-orange gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Daily Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* 4. Task Management */}
          <Link
            href="/dashboard/tasks"
            className="group bg-white border border-surface-border hover:border-brand-orange rounded-xl p-4 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-50 group-hover:bg-brand-orange/10 flex items-center justify-center text-navy-800 group-hover:text-brand-orange transition-colors">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Production Active
                </span>
              </div>
              <h4 className="text-xs font-bold text-navy-800 group-hover:text-brand-orange transition-colors">
                Tasks & Reminders
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Subtasks, 6-stage email dispatches, and priority tracking.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand-orange gap-1 group-hover:translate-x-1 transition-transform">
              <span>Open Task Manager</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* 5. Daily Projections */}
          <Link
            href="/dashboard/projections"
            className="group bg-white border border-surface-border hover:border-brand-orange rounded-xl p-4 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-50 group-hover:bg-brand-orange/10 flex items-center justify-center text-navy-800 group-hover:text-brand-orange transition-colors">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Production Active
                </span>
              </div>
              <h4 className="text-xs font-bold text-navy-800 group-hover:text-brand-orange transition-colors">
                Daily Projections
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Daily revenue forecasts, next-day evaluation reviews, and conversion metrics.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand-orange gap-1 group-hover:translate-x-1 transition-transform">
              <span>Evaluate Projections</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* 6. Reports & Analytics */}
          <Link
            href="/dashboard/reports"
            className="group bg-white border border-surface-border hover:border-brand-orange rounded-xl p-4 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-50 group-hover:bg-brand-orange/10 flex items-center justify-center text-navy-800 group-hover:text-brand-orange transition-colors">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Production Active
                </span>
              </div>
              <h4 className="text-xs font-bold text-navy-800 group-hover:text-brand-orange transition-colors">
                Reports & Analytics
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Multi-month target aggregations, university breakdown, Excel and RFC-4180 CSV exports.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand-orange gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Executive Reports</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
