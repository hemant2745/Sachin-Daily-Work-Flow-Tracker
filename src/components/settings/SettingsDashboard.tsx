"use client";

import React, { useState, useTransition } from "react";
import {
  Settings,
  Shield,
  User,
  Globe,
  Bell,
  Target,
  FileSpreadsheet,
  Server,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
} from "lucide-react";
import { updateAppSettingAction } from "@/app/(dashboard)/dashboard/settings/actions";
import type { AppSettings, SystemInfo } from "@/types/settings";
import { formatINR } from "@/lib/format";

interface SettingsDashboardProps {
  initialSettings: AppSettings;
  systemInfo: SystemInfo;
  universities: Array<{ id: string | number; name: string; is_active: boolean }>;
}

export function SettingsDashboard({
  initialSettings,
  systemInfo,
  universities,
}: SettingsDashboardProps) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<
    "admin" | "targets" | "notifications" | "regional" | "universities" | "system"
  >("admin");

  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Form states
  const [adminName, setAdminName] = useState(settings.admin_profile.name);
  const [adminRole, setAdminRole] = useState(settings.admin_profile.role);
  const [adminOrg, setAdminOrg] = useState(settings.admin_profile.organization);

  const [defaultColTarget, setDefaultColTarget] = useState(
    settings.target_defaults.default_collection_target
  );
  const [defaultAdmTarget, setDefaultAdmTarget] = useState(
    settings.target_defaults.default_admission_target
  );
  const [teamColTarget, setTeamColTarget] = useState(
    settings.target_defaults.team_target_amount
  );
  const [teamAdmTarget, setTeamAdmTarget] = useState(
    settings.target_defaults.team_target_admissions
  );

  const [senderEmail, setSenderEmail] = useState(
    settings.notification_preferences.sender_email
  );
  const [recipientFallback, setRecipientFallback] = useState(
    settings.notification_preferences.recipient_fallback
  );

  const handleSaveAdminProfile = () => {
    setSaveStatus(null);
    startTransition(async () => {
      const res = await updateAppSettingAction("admin_profile", {
        name: adminName,
        role: adminRole,
        organization: adminOrg,
      });

      if (res.success) {
        setSaveStatus({
          success: true,
          message: "Admin profile metadata successfully updated in Supabase.",
        });
      } else {
        setSaveStatus({
          success: false,
          message: res.error || "Failed to update profile.",
        });
      }
    });
  };

  const handleSaveTargets = () => {
    setSaveStatus(null);
    startTransition(async () => {
      const res = await updateAppSettingAction("target_defaults", {
        default_collection_target: Number(defaultColTarget),
        default_admission_target: Number(defaultAdmTarget),
        team_target_amount: Number(teamColTarget),
        team_target_admissions: Number(teamAdmTarget),
      });

      if (res.success) {
        setSaveStatus({
          success: true,
          message: "Target defaults persisted for new counsellors and monthly cycles.",
        });
      } else {
        setSaveStatus({
          success: false,
          message: res.error || "Failed to update target defaults.",
        });
      }
    });
  };

  const handleSaveNotifications = () => {
    setSaveStatus(null);
    startTransition(async () => {
      const res = await updateAppSettingAction("notification_preferences", {
        sender_email: senderEmail,
        recipient_fallback: recipientFallback,
      });

      if (res.success) {
        setSaveStatus({
          success: true,
          message: "Notification configurations saved.",
        });
      } else {
        setSaveStatus({
          success: false,
          message: res.error || "Failed to update notifications.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-900/90 border border-navy-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">System Settings</h1>
            <p className="text-xs text-gray-400">
              Administrative configurations, targets, notification preferences, and system parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-800 text-gray-400">
          <Shield className="w-3.5 h-3.5 text-brand-orange" />
          <span>Single-Admin: <strong className="text-white">Sachin Behera</strong></span>
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveStatus && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
            saveStatus.success
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
              : "bg-rose-950/80 border-rose-800 text-rose-300"
          }`}
        >
          {saveStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-navy-800 pb-2">
        <button
          onClick={() => {
            setActiveTab("admin");
            setSaveStatus(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "admin"
              ? "bg-navy-800 text-white border-l-4 border-brand-orange shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-navy-900"
          }`}
        >
          <User className="w-4 h-4 text-brand-orange" />
          <span>Admin Profile</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("targets");
            setSaveStatus(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "targets"
              ? "bg-navy-800 text-white border-l-4 border-brand-orange shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-navy-900"
          }`}
        >
          <Target className="w-4 h-4 text-blue-400" />
          <span>Targets & Benchmarks</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("universities");
            setSaveStatus(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "universities"
              ? "bg-navy-800 text-white border-l-4 border-brand-orange shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-navy-900"
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-400" />
          <span>Partner Directory</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("notifications");
            setSaveStatus(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "notifications"
              ? "bg-navy-800 text-white border-l-4 border-brand-orange shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-navy-900"
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Notification & Reminders</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("regional");
            setSaveStatus(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "regional"
              ? "bg-navy-800 text-white border-l-4 border-brand-orange shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-navy-900"
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Regional & Localization</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("system");
            setSaveStatus(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "system"
              ? "bg-navy-800 text-white border-l-4 border-brand-orange shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-navy-900"
          }`}
        >
          <Server className="w-4 h-4 text-teal-400" />
          <span>System Architecture</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. Admin Profile & Security */}
      {activeTab === "admin" && (
        <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-navy-800 pb-3">
            <h3 className="text-base font-semibold text-white">Administrator Account & Credentials</h3>
            <p className="text-xs text-gray-400">
              Sachin Behera is the sole authorized administrator. Access is secured by email verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center justify-between">
                <span>Authorized Email</span>
                <span className="text-[10px] text-brand-orange flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked to Sachin Behera
                </span>
              </label>
              <input
                type="text"
                value={settings.admin_profile.email}
                disabled
                className="w-full bg-navy-950/60 border border-navy-800 rounded-lg px-3 py-2 text-xs text-gray-400 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Organizational Designation
              </label>
              <input
                type="text"
                value={adminRole}
                onChange={(e) => setAdminRole(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Enterprise Name
              </label>
              <input
                type="text"
                value={adminOrg}
                onChange={(e) => setAdminOrg(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-navy-950/60 border border-navy-800 text-xs text-gray-300 space-y-2">
            <div className="font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Single-Admin Hardened RLS Security Model</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Row-Level Security (RLS) restricts mutation and insertion actions across admissions, counsellors, monthly targets, task reminders, and settings exclusively to authenticated sessions matching <code className="text-brand-orange font-mono">sachin.behera@collegevidya.com</code>. All database operations are cryptographically checked using Supabase Auth JWTs.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveAdminProfile}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Admin Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Target Defaults */}
      {activeTab === "targets" && (
        <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-navy-800 pb-3">
            <h3 className="text-base font-semibold text-white">Default Targets & Team Benchmarks</h3>
            <p className="text-xs text-gray-400">
              Standard initial monthly targets applied to newly registered counsellors and aggregated team milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Default Counsellor Collection Target (₹)
              </label>
              <input
                type="number"
                value={defaultColTarget}
                onChange={(e) => setDefaultColTarget(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Formatted: {formatINR(defaultColTarget)} per counsellor
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Default Counsellor Admission Target (Seats)
              </label>
              <input
                type="number"
                value={defaultAdmTarget}
                onChange={(e) => setDefaultAdmTarget(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Standard monthly student enrollments
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Team Collection Target (₹)
              </label>
              <input
                type="number"
                value={teamColTarget}
                onChange={(e) => setTeamColTarget(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Aggregate monthly goal across entire department: {formatINR(teamColTarget)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Team Admission Target (Seats)
              </label>
              <input
                type="number"
                value={teamAdmTarget}
                onChange={(e) => setTeamAdmTarget(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Total admissions required for team achievement
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveTargets}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Target Benchmarks</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Partner Directory */}
      {activeTab === "universities" && (
        <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="border-b border-navy-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Approved Partner Universities ({universities.length})</h3>
              <p className="text-xs text-gray-400">
                Official canonical directory of institutions accepted for student admissions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {universities.map((u, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-navy-950/70 border border-navy-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-navy-900 border border-navy-700 flex items-center justify-center text-xs text-brand-orange font-bold shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-xs text-white truncate font-medium">{u.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold shrink-0">
                  Active Partner
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Notifications & Reminders */}
      {activeTab === "notifications" && (
        <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-navy-800 pb-3">
            <h3 className="text-base font-semibold text-white">Automated Reminder Configurations</h3>
            <p className="text-xs text-gray-400">
              Notification engine settings for upcoming task reminders and daily workflow pings.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Official Sender Address (Resend Verified Domain)
              </label>
              <input
                type="text"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                During onboarding/trial, Resend uses onboarding@resend.dev.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Default Recipient Fallback Address
              </label>
              <input
                type="text"
                value={recipientFallback}
                onChange={(e) => setRecipientFallback(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                If REMINDER_TO_EMAIL is set on the server, it takes precedence during sandbox test mode.
              </span>
            </div>

            <div className="p-4 rounded-lg bg-navy-950/60 border border-navy-800 space-y-2 text-xs text-gray-300">
              <div className="font-semibold text-white">Active Trigger Schedule</div>
              <p className="text-gray-400">
                Task reminders fire at configured intervals before scheduled deadlines:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {settings.notification_preferences.offsets.map((offset) => (
                  <span
                    key={offset}
                    className="px-2.5 py-1 rounded bg-navy-900 border border-navy-700 text-brand-orange font-mono text-xs font-semibold"
                  >
                    {offset < 0 ? `${Math.abs(offset)}m Before` : `${offset}m After`}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveNotifications}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Reminder Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Regional & Localization */}
      {activeTab === "regional" && (
        <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-navy-800 pb-3">
            <h3 className="text-base font-semibold text-white">Regional Preferences & Localization</h3>
            <p className="text-xs text-gray-400">
              Timezone standards, date representation, and currency formatting for College Vidya operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-navy-950 border border-navy-800 space-y-1">
              <div className="text-gray-400">Standard Timezone</div>
              <div className="text-base font-bold text-white">{settings.regional_preferences.timezone_label}</div>
              <div className="text-[11px] text-gray-500 font-mono">IANA: Asia/Kolkata</div>
            </div>

            <div className="p-4 rounded-lg bg-navy-950 border border-navy-800 space-y-1">
              <div className="text-gray-400">Primary Financial Currency</div>
              <div className="text-base font-bold text-emerald-400">
                INR (₹) Indian Rupee
              </div>
              <div className="text-[11px] text-gray-500">Lakhs / Crores notation formatted with formatINR()</div>
            </div>

            <div className="p-4 rounded-lg bg-navy-950 border border-navy-800 space-y-1">
              <div className="text-gray-400">Date Format</div>
              <div className="text-base font-bold text-white">YYYY-MM-DD / DD-MM-YYYY</div>
              <div className="text-[11px] text-gray-500">Consistent with Indian banking and admission records</div>
            </div>

            <div className="p-4 rounded-lg bg-navy-950 border border-navy-800 space-y-1">
              <div className="text-gray-400">Audit Timestamp Precision</div>
              <div className="text-base font-bold text-white">ISO-8601 UTC with IST Projection</div>
              <div className="text-[11px] text-gray-500">Recorded on all database modifications</div>
            </div>
          </div>
        </div>
      )}

      {/* 6. System Architecture */}
      {activeTab === "system" && (
        <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-navy-800 pb-3">
            <h3 className="text-base font-semibold text-white">System Architecture & Diagnostic Telemetry</h3>
            <p className="text-xs text-gray-400">
              Live environment parameters, framework version, and runtime status.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800">
              <span className="text-gray-400 block mb-1">Application Name</span>
              <span className="text-sm font-semibold text-white">{systemInfo.appName}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800">
              <span className="text-gray-400 block mb-1">Architecture Version</span>
              <span className="text-sm font-semibold text-brand-orange font-mono">v{systemInfo.version}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800">
              <span className="text-gray-400 block mb-1">Framework & Runtime</span>
              <span className="text-sm font-semibold text-white">{systemInfo.framework}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800">
              <span className="text-gray-400 block mb-1">Environment</span>
              <span className="text-sm font-semibold text-teal-400 uppercase font-mono">{systemInfo.nodeEnv}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800">
              <span className="text-gray-400 block mb-1">Supabase Database Connection</span>
              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {systemInfo.databaseStatus}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800">
              <span className="text-gray-400 block mb-1">Reminder Scheduler Status</span>
              <span className="text-sm font-semibold text-blue-400">{systemInfo.schedulerStatus}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
