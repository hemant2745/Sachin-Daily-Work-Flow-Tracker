import React from "react";
import Image from "next/image";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  ShieldCheck,
  AlertCircle,
  Database,
  Users,
  CheckSquare,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

export default function DashboardPage() {
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
            <span>Private Single-Administrator System &bull; Phase 2 Auth & Database Foundation</span>
          </div>
        </div>
      </section>

      {/* Phase 2 Verification Callout */}
      <section className="bg-white border border-surface-border rounded-xl p-4 sm:p-5 shadow-card flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-brand-orange flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-navy-800">
              Phase 2 Visual Foundation & Supabase Auth Architecture
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-light text-navy-800 border border-gray-200">
              Zero Fabricated Data Mode
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            All metrics and module sections below display neutral placeholders (&quot;Not configured&quot; / &quot;Data will appear after setup&quot;). No fake amounts, percentages, counselor records, or admissions have been created. Live Supabase database tables and real business calculations will be wired up during subsequent phases.
          </p>
        </div>
      </section>

      {/* 6 Required Placeholder Cards */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-navy-800 uppercase tracking-wider">
            Team Performance Metrics (Neutral Placeholders)
          </h3>
          <span className="text-xs text-gray-400">Phase 1 Specification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* 1. Team Monthly Target */}
          <MetricCard
            title="Team Monthly Target"
            iconName="target"
            placeholderValue="Not configured"
            description="Aggregated monthly target set for all counselors under Team Leader Sachin Behera."
            statusLabel="Target Setup Pending"
            phaseNote="Data will appear after setup"
          />

          {/* 2. Team Revenue Achieved */}
          <MetricCard
            title="Team Revenue Achieved"
            iconName="revenue"
            placeholderValue="Not configured"
            description="Total verified admission revenue achieved month-to-date across team counselors."
            statusLabel="Ledger Setup Pending"
            phaseNote="Data will appear after setup"
          />

          {/* 3. Team Achievement Percentage */}
          <MetricCard
            title="Team Achievement Percentage"
            iconName="percentage"
            placeholderValue="Not configured"
            description="Computed ratio of achieved team revenue against monthly target with projection pace."
            statusLabel="Formula Pending"
            phaseNote="Data will appear after setup"
          />

          {/* 4. Total Admissions */}
          <MetricCard
            title="Total Admissions"
            iconName="admissions"
            placeholderValue="Not configured"
            description="Total count of enrolled students credited to team counselors for current active cycle."
            statusLabel="Registry Pending"
            phaseNote="Data will appear after setup"
          />

          {/* 5. Pending Tasks */}
          <MetricCard
            title="Pending Tasks"
            iconName="tasks"
            placeholderValue="Not configured"
            description="Daily action items, reminders, and follow-ups assigned to counselors or the team leader."
            statusLabel="Task Queue Pending"
            phaseNote="Data will appear after setup"
          />

          {/* 6. Pending Projection Evaluations */}
          <MetricCard
            title="Pending Projection Evaluations"
            iconName="projections"
            placeholderValue="Not configured"
            description="Forecast models and individual counselor projection reviews awaiting evaluation."
            statusLabel="Model Setup Pending"
            phaseNote="Data will appear after setup"
          />
        </div>
      </section>

      {/* Visual Preview Modules (Identified clearly as non-implemented UI previews) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        
        {/* Counselors Module */}
        <div id="counselors" className="bg-white border border-surface-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center text-navy-800">
                <Users className="w-4 h-4 text-brand-orange" />
              </div>
              <h4 className="text-sm font-bold text-navy-800">Counselor Management & Targets</h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Phase 3 Implemented
            </span>
          </div>

          <div className="py-6 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg bg-surface-light/60">
            <div className="w-10 h-10 rounded-full bg-white mx-auto flex items-center justify-center shadow-sm text-gray-400 mb-2.5">
              <Users className="w-5 h-5 text-brand-orange" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Counselor Module is Active</p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Register counselors, configure month-by-month performance targets, and manage active team rosters in the dedicated section.
            </p>
            <a
              href="/dashboard/counselors"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <span>Manage Counselors & Targets</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Tasks & Daily Tracker Preview */}
        <div id="tasks" className="bg-white border border-surface-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center text-navy-800">
                <CheckSquare className="w-4 h-4 text-brand-orange" />
              </div>
              <h4 className="text-sm font-bold text-navy-800">Daily Workflow Tasks & Subtasks</h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
              Module Preview
            </span>
          </div>

          <div className="py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg bg-surface-light/60">
            <div className="w-10 h-10 rounded-full bg-white mx-auto flex items-center justify-center shadow-sm text-gray-400 mb-2.5">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Task Queue Awaiting Setup</p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto mt-1">
              Interactive task allocation, subtask tracking, and daily submission checkpoints will appear here once the database schema is integrated.
            </p>
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
              Data will appear after setup
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-light border border-gray-200">
            <p className="text-xs font-semibold text-navy-800">Daily Performance Reports</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Consolidated summaries of calling volume, pitch conversions, and verified leads.
            </p>
            <div className="mt-2.5 inline-block text-[10px] text-brand-orange font-medium">
              Data will appear after setup
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-light border border-gray-200">
            <p className="text-xs font-semibold text-navy-800">Settings & Security</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Single-administrator profile, Supabase connection status, and security keys.
            </p>
            <div className="mt-2.5 inline-block text-[10px] text-brand-orange font-medium">
              Awaiting Supabase Integration
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
