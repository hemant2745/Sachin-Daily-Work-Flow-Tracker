"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Users,
  UserCheck,
  Target,
  DollarSign,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Database,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import {
  formatINR,
  calculateAchievement,
  formatMonthDisplay,
  getMonthOptions,
  normalizeMonthKey,
} from "@/lib/format";
import type { CounselorWithTarget, CounselorFormData } from "@/types/counselor";
import { CounselorModal } from "./CounselorModal";
import { TargetModal } from "./TargetModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import {
  getCounselorsWithTargetsAction,
  createCounselorAction,
  updateCounselorAction,
  updateMonthlyTargetAction,
  deleteCounselorAction,
  toggleCounselorStatusAction,
  importMasterCounselorsAction,
} from "@/app/(dashboard)/dashboard/counselors/actions";

interface CounselorListProps {
  initialCounselors: CounselorWithTarget[];
  initialSummary: {
    totalCounselors: number;
    activeCounselors: number;
    combinedMonthlyTarget: number;
    combinedAdmissionTarget?: number;
    unconfiguredTargetsCount: number;
    teamActualRevenue?: number;
    teamActualAdmissions?: number;
    teamAchievementPercentage?: number | null;
    teamAdmissionAchievementPercentage?: number | null;
  };
  initialMonth: string;
  isConfigured: boolean;
  initialError?: string;
}

export function CounselorList({
  initialCounselors,
  initialSummary,
  initialMonth,
  isConfigured,
  initialError,
}: CounselorListProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [counselors, setCounselors] = useState<CounselorWithTarget[]>(initialCounselors);
  const [summary, setSummary] = useState(initialSummary);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = useState<"NAME" | "EMP_CODE">("EMP_CODE");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");

  // Modals state
  const [isCounselorModalOpen, setIsCounselorModalOpen] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState<CounselorWithTarget | null>(null);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetModalCounselor, setTargetModalCounselor] = useState<CounselorWithTarget | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCounselor, setDeletingCounselor] = useState<CounselorWithTarget | null>(null);

  const [isPending, startTransition] = useTransition();

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // Reload data when month changes
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await getCounselorsWithTargetsAction(newMonth);
      if (res.success) {
        setCounselors(res.counselors);
        setSummary(res.summary);
      } else {
        setErrorMessage(res.error || "Failed to load counselors for selected month.");
      }
    });
  };

  // Sync Master Roster Handler
  const handleSyncMaster = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await importMasterCounselorsAction();
      if (res.success) {
        setSuccessMessage(res.message || "Master roster synchronized successfully.");
        const refreshed = await getCounselorsWithTargetsAction(selectedMonth);
        if (refreshed.success) {
          setCounselors(refreshed.counselors);
          setSummary(refreshed.summary);
        }
      } else {
        setErrorMessage(res.error || "Failed to synchronize master roster.");
      }
    });
  };

  // Filtered & Sorted Counselors
  const filteredCounselors = useMemo(() => {
    let list = [...counselors];

    // Status Filter
    if (statusFilter === "ACTIVE") {
      list = list.filter((c) => c.is_active);
    } else if (statusFilter === "INACTIVE") {
      list = list.filter((c) => !c.is_active);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.employee_code.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "NAME") {
        comparison = a.full_name.localeCompare(b.full_name);
      } else {
        comparison = a.employee_code.localeCompare(b.employee_code);
      }
      return sortDirection === "ASC" ? comparison : -comparison;
    });

    return list;
  }, [counselors, statusFilter, searchQuery, sortBy, sortDirection]);

  // Handlers for mutations
  const handleSaveCounselor = async (formData: CounselorFormData) => {
    if (editingCounselor) {
      const res = await updateCounselorAction(editingCounselor.id, formData);
      if (res.success) {
        setSuccessMessage("Counselor details updated successfully.");
        handleMonthChange(selectedMonth);
      }
      return res;
    } else {
      const res = await createCounselorAction(formData, selectedMonth);
      if (res.success) {
        setSuccessMessage("New counselor added successfully.");
        handleMonthChange(selectedMonth);
      }
      return res;
    }
  };

  const handleSaveTarget = async (
    counselorId: string,
    month: string,
    amount: number,
    admissions: number = 0,
    notes?: string
  ) => {
    const res = await updateMonthlyTargetAction(counselorId, month, amount, admissions, notes);
    if (res.success) {
      setSuccessMessage(`Targets for ${formatMonthDisplay(month)} updated successfully.`);
      handleMonthChange(selectedMonth);
    }
    return res;
  };

  const handleDeleteCounselor = async (counselorId: string, forceDeactivate: boolean) => {
    const res = await deleteCounselorAction(counselorId, forceDeactivate);
    if (res.success) {
      setSuccessMessage(res.message || "Operation completed successfully.");
      handleMonthChange(selectedMonth);
    }
    return res;
  };

  const handleToggleStatus = (counselor: CounselorWithTarget) => {
    startTransition(async () => {
      const newStatus = !counselor.is_active;
      const res = await toggleCounselorStatusAction(counselor.id, newStatus);
      if (res.success) {
        setSuccessMessage(`Counselor ${counselor.full_name} marked as ${newStatus ? "Active" : "Inactive"}.`);
        handleMonthChange(selectedMonth);
      } else {
        setErrorMessage(res.error || "Failed to update counselor status.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-800 tracking-tight">
            Counselor Management & Targets
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Private management console for Sachin Behera. Counselors are managed as records without individual login accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-surface-border shadow-sm">
            <Calendar className="w-4 h-4 text-brand-orange shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={isPending}
              className="bg-transparent text-xs font-semibold text-navy-800 focus:outline-none cursor-pointer pr-2"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sync 9 Master Counselors Button */}
          <button
            onClick={handleSyncMaster}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-navy-700 disabled:opacity-50"
            title="Synchronize/Import the 9 authorized team counselors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-orange ${isPending ? "animate-spin" : ""}`} />
            <span>Sync Master Roster</span>
          </button>

          {/* Add Counselor Button */}
          <button
            onClick={() => {
              setEditingCounselor(null);
              setIsCounselorModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange"
          >
            <Plus className="w-4 h-4" />
            <span>Add Counselor</span>
          </button>
        </div>
      </div>

      {/* Database Not Configured Notice */}
      {!isConfigured && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Database className="w-5 h-5 text-brand-orange mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold text-amber-950">Remote Supabase Database Setup Required: </span>
            Ensure your Supabase project credentials in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-semibold">.env.local</code> and migrations are applied.
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-900 text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Summary Metrics Row (6 Comprehensive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Counselors */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Counselors
            </span>
            <div className="w-7 h-7 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-brand-orange" />
            </div>
          </div>
          <div className="text-xl font-bold text-navy-800">{summary.totalCounselors}</div>
          <p className="text-[10px] text-gray-500 mt-0.5">{summary.activeCounselors} active roster</p>
        </div>

        {/* Team Collection Target */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Collection Target
            </span>
            <div className="w-7 h-7 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-brand-orange" />
            </div>
          </div>
          <div className="text-xl font-bold text-navy-800">
            {formatINR(summary.combinedMonthlyTarget)}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Sum of active quotas</p>
        </div>

        {/* Team Admission Target */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Admission Target
            </span>
            <div className="w-7 h-7 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-brand-orange" />
            </div>
          </div>
          <div className="text-xl font-bold text-navy-800">
            {summary.combinedAdmissionTarget ?? 0}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Enrolled student quota</p>
        </div>

        {/* Team Actual Collections */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Actual Collections
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl font-bold text-navy-800">
            {formatINR(summary.teamActualRevenue || 0)}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {summary.teamAchievementPercentage !== null && summary.teamAchievementPercentage !== undefined ? (
              <span className="text-emerald-600 font-medium">
                {summary.teamAchievementPercentage.toFixed(2)}% achieved
              </span>
            ) : (
              <span>₹0 verified collections</span>
            )}
          </p>
        </div>

        {/* Team Actual Admissions */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Actual Admissions
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
          <div className="text-xl font-bold text-navy-800">
            {summary.teamActualAdmissions ?? 0}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {summary.teamAdmissionAchievementPercentage !== null && summary.teamAdmissionAchievementPercentage !== undefined ? (
              <span className="text-blue-600 font-medium">
                {summary.teamAdmissionAchievementPercentage.toFixed(2)}% achieved
              </span>
            ) : (
              <span>0 admissions recorded</span>
            )}
          </p>
        </div>

        {/* Overall Progress Status */}
        <div className="bg-white border border-surface-border rounded-xl p-3.5 shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Period
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-navy-800 truncate">
            {formatMonthDisplay(selectedMonth)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Active reporting cycle</p>
        </div>
      </div>

      {/* Table Toolbar: Search, Filters, and Sorting */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by counselor name, code, contact..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface-light border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center space-x-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light hover:bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Sort Toggle: Employee Code */}
            <button
              onClick={() => {
                if (sortBy === "EMP_CODE") {
                  setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
                } else {
                  setSortBy("EMP_CODE");
                  setSortDirection("ASC");
                }
              }}
              className="px-2.5 py-1.5 bg-surface-light hover:bg-gray-100 text-xs font-semibold text-navy-800 rounded-lg border border-gray-200 flex items-center gap-1.5 transition-colors"
              title="Toggle Sort by Employee Code"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-orange" />
              <span>Code {sortBy === "EMP_CODE" && (sortDirection === "ASC" ? "↑" : "↓")}</span>
            </button>

            {/* Sort Toggle: Name */}
            <button
              onClick={() => {
                if (sortBy === "NAME") {
                  setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
                } else {
                  setSortBy("NAME");
                  setSortDirection("ASC");
                }
              }}
              className="px-2.5 py-1.5 bg-surface-light hover:bg-gray-100 text-xs font-semibold text-navy-800 rounded-lg border border-gray-200 flex items-center gap-1.5 transition-colors"
              title="Toggle Sort by Name"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-orange" />
              <span>Name {sortBy === "NAME" && (sortDirection === "ASC" ? "↑" : "↓")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Counselors Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-card overflow-hidden">
        {filteredCounselors.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center text-navy-800 mx-auto mb-3">
              <Users className="w-6 h-6 text-brand-orange" />
            </div>
            <h4 className="text-sm font-bold text-navy-800">
              {counselors.length === 0 ? "No Counselors Configured" : "No Matching Counselors Found"}
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {counselors.length === 0
                ? "Click 'Sync Master Roster' to import the nine authorized team counselors automatically."
                : "Try clearing your search query or status filter to view all counselors."}
            </p>
            {counselors.length === 0 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={handleSyncMaster}
                  className="inline-flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
                >
                  <RefreshCw className="w-4 h-4 text-brand-orange" />
                  <span>Sync 9 Master Counselors</span>
                </button>
                <button
                  onClick={() => {
                    setEditingCounselor(null);
                    setIsCounselorModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Counselor</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-950 text-white text-[11px] uppercase tracking-wider font-semibold border-b border-navy-800">
                  <th className="py-3 px-3.5">Counselor</th>
                  <th className="py-3 px-3.5">Contact</th>
                  <th className="py-3 px-3.5 text-right">Collection Target</th>
                  <th className="py-3 px-3 text-center">Adm. Target</th>
                  <th className="py-3 px-3.5 text-right">Actual Collections</th>
                  <th className="py-3 px-3 text-center">Actual Adm.</th>
                  <th className="py-3 px-3 text-center">Collection Ach. %</th>
                  <th className="py-3 px-3 text-center">Adm. Ach. %</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredCounselors.map((c) => {
                  const collectionAchievement = calculateAchievement(c.actual_revenue, c.effective_target, 2);
                  const admissionAchievement = calculateAchievement(c.actual_admissions, c.effective_admission_target, 2);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-surface-light/60 transition-colors ${
                        !c.is_active ? "bg-gray-50/70 opacity-75" : ""
                      }`}
                    >
                      {/* Name & Emp Code */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {c.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-navy-800">{c.full_name}</div>
                            <div className="text-[10px] font-mono text-brand-orange font-semibold">
                              {c.employee_code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-3.5">
                        <div className="text-gray-700 text-[11px]">{c.email || "No email on record"}</div>
                        <div className="text-[10px] text-gray-400">{c.phone || "No phone on record"}</div>
                      </td>

                      {/* Collection Target for Selected Month */}
                      <td className="py-3 px-3.5 text-right font-semibold text-navy-800">
                        {c.is_target_assigned ? (
                          <>
                            <div className="flex items-center justify-end gap-1">
                              <span>{formatINR(c.effective_target)}</span>
                              <button
                                onClick={() => {
                                  setTargetModalCounselor(c);
                                  setIsTargetModalOpen(true);
                                }}
                                className="p-1 rounded text-gray-400 hover:text-brand-orange hover:bg-orange-50 transition-colors"
                                title={`Revise targets specifically for ${formatMonthDisplay(selectedMonth)}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-[10px] text-emerald-600 font-normal">Assigned</div>
                          </>
                        ) : (
                          <div className="flex flex-col items-end">
                            <button
                              onClick={() => {
                                setTargetModalCounselor(c);
                                setIsTargetModalOpen(true);
                              }}
                              className="text-xs text-amber-700 hover:text-brand-orange hover:underline font-medium flex items-center gap-1"
                            >
                              <span>Assign Target</span>
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-gray-400 font-normal">
                              Suggested: {formatINR(c.monthly_target)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Admission Target for Selected Month */}
                      <td className="py-3 px-3 text-center font-semibold text-navy-800">
                        {c.is_target_assigned ? (
                          <>
                            <div>{c.effective_admission_target}</div>
                            <div className="text-[9px] text-emerald-600 font-normal">Assigned</div>
                          </>
                        ) : (
                          <div>
                            <span className="text-gray-400 text-xs">-</span>
                            <div className="text-[9px] text-gray-400 font-normal">
                              Suggested: {c.monthly_admission_target || 6}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actual Collections */}
                      <td className="py-3 px-3.5 text-right font-semibold text-navy-800">
                        <div>{formatINR(c.actual_revenue || 0)}</div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          {c.actual_revenue && c.actual_revenue > 0 ? "Verified" : "₹0 recorded"}
                        </div>
                      </td>

                      {/* Actual Admissions */}
                      <td className="py-3 px-3 text-center font-semibold text-navy-800">
                        <div>{c.actual_admissions ?? 0}</div>
                        <div className="text-[9px] text-gray-400 font-normal">Enrolled</div>
                      </td>

                      {/* Collection Achievement % */}
                      <td className="py-3 px-3 text-center">
                        {c.is_target_assigned ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              collectionAchievement.status === "CALCULATED"
                                ? (collectionAchievement.percentage || 0) >= 100
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : (collectionAchievement.percentage || 0) > 0
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-gray-100 text-gray-600"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {collectionAchievement.display}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 italic">Target not assigned</span>
                        )}
                      </td>

                      {/* Admission Achievement % */}
                      <td className="py-3 px-3 text-center">
                        {c.is_target_assigned ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              admissionAchievement.status === "CALCULATED"
                                ? (admissionAchievement.percentage || 0) >= 100
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : (admissionAchievement.percentage || 0) > 0
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-gray-100 text-gray-600"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {admissionAchievement.display}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 italic">Target not assigned</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                            c.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200"
                          }`}
                          title={`Click to mark as ${c.is_active ? "Inactive" : "Active"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.is_active ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          <span>{c.is_active ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setEditingCounselor(c);
                              setIsCounselorModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-navy-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Counselor Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Deactivate */}
                          <button
                            onClick={() => {
                              setDeletingCounselor(c);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete or Deactivate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Counselor Add / Edit Modal */}
      <CounselorModal
        isOpen={isCounselorModalOpen}
        onClose={() => {
          setIsCounselorModalOpen(false);
          setEditingCounselor(null);
        }}
        counselor={editingCounselor}
        onSubmit={handleSaveCounselor}
      />

      {/* Target Setting Modal */}
      <TargetModal
        isOpen={isTargetModalOpen}
        onClose={() => {
          setIsTargetModalOpen(false);
          setTargetModalCounselor(null);
        }}
        counselor={targetModalCounselor}
        selectedMonth={selectedMonth}
        onSaveTarget={handleSaveTarget}
      />

      {/* Delete / Deactivate Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCounselor(null);
        }}
        counselor={deletingCounselor}
        onConfirmDelete={handleDeleteCounselor}
      />
    </div>
  );
}
