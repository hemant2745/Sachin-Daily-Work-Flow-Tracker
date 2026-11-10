"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Users,
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
  Award,
  GraduationCap,
  RefreshCw,
  Calculator,
  History,
  TrendingUp,
} from "lucide-react";
import {
  formatINR,
  calculateAchievement,
  formatMonthDisplay,
  getMonthOptions,
  normalizeMonthKey,
} from "@/lib/format";
import type {
  CounselorWithTarget,
  CounselorFormData,
  CounselorCategory,
  CategoryCardSummary,
} from "@/types/counselor";
import { CategoryCardsSection } from "./CategoryCardsSection";
import { CategoryTargetModal } from "./CategoryTargetModal";
import { AdditionalTargetModal } from "./AdditionalTargetModal";
import { CategoryChangeModal } from "./CategoryChangeModal";
import { TargetAuditModal } from "./TargetAuditModal";
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
  updateCategoryBaseTargetAction,
  updateCounselorCategoryAction,
  updateCounselorAdditionalTargetAction,
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
    categorySummaries?: Record<CounselorCategory, CategoryCardSummary>;
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
  const [categoryFilter, setCategoryFilter] = useState<CounselorCategory | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"NAME" | "EMP_CODE" | "FINAL_TARGET" | "ACHIEVEMENT">("EMP_CODE");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");

  // Modals state
  const [isCounselorModalOpen, setIsCounselorModalOpen] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState<CounselorWithTarget | null>(null);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetModalCounselor, setTargetModalCounselor] = useState<CounselorWithTarget | null>(null);

  const [isAdditionalTargetModalOpen, setIsAdditionalTargetModalOpen] = useState(false);
  const [additionalModalCounselor, setAdditionalModalCounselor] = useState<CounselorWithTarget | null>(null);

  const [isCategoryChangeModalOpen, setIsCategoryChangeModalOpen] = useState(false);
  const [categoryModalCounselor, setCategoryModalCounselor] = useState<CounselorWithTarget | null>(null);

  const [isCategoryTargetModalOpen, setIsCategoryTargetModalOpen] = useState(false);
  const [selectedCategoryForTarget, setSelectedCategoryForTarget] = useState<CounselorCategory | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditModalCounselor, setAuditModalCounselor] = useState<CounselorWithTarget | null>(null);

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

    // Category Filter
    if (categoryFilter !== "ALL") {
      list = list.filter((c) => c.category === categoryFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.employee_code.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "NAME") {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortBy === "FINAL_TARGET") {
        const targetA = a.final_target || a.effective_target || 0;
        const targetB = b.final_target || b.effective_target || 0;
        comparison = targetA - targetB;
      } else if (sortBy === "ACHIEVEMENT") {
        const achA = a.achievement_percentage || 0;
        const achB = b.achievement_percentage || 0;
        comparison = achA - achB;
      } else {
        comparison = a.employee_code.localeCompare(b.employee_code);
      }
      return sortDirection === "ASC" ? comparison : -comparison;
    });

    return list;
  }, [counselors, statusFilter, categoryFilter, searchQuery, sortBy, sortDirection]);

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

  const handleSaveCategoryTarget = async (
    cat: CounselorCategory,
    monthKey: string,
    baseTarget: number,
    baseAdmissionTarget?: number,
    reason?: string
  ) => {
    const res = await updateCategoryBaseTargetAction(
      cat,
      monthKey,
      baseTarget,
      baseAdmissionTarget,
      reason
    );
    if (res.success) {
      setSuccessMessage(res.message || `${cat} base target updated.`);
      handleMonthChange(selectedMonth);
    }
    return res;
  };

  const handleSaveCounselorCategory = async (
    counselorId: string,
    newCategory: CounselorCategory,
    monthKey?: string
  ) => {
    const res = await updateCounselorCategoryAction(counselorId, newCategory, monthKey);
    if (res.success) {
      setSuccessMessage(res.message || "Category updated successfully.");
      handleMonthChange(selectedMonth);
    }
    return res;
  };

  const handleSaveAdditionalTarget = async (
    counselorId: string,
    monthKey: string,
    additionalTarget: number,
    reason: string
  ) => {
    const res = await updateCounselorAdditionalTargetAction(
      counselorId,
      monthKey,
      additionalTarget,
      reason
    );
    if (res.success) {
      setSuccessMessage("Additional target updated successfully.");
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

  const categorySummaries = summary.categorySummaries || {
    CDA: {
      category: "CDA",
      counselorCount: counselors.filter((c) => c.category === "CDA" && c.is_active).length,
      baseTarget: 800000,
      baseAdmissionTarget: 8,
      totalTarget: 0,
      totalRevenue: 0,
      achievementPercentage: null,
    },
    SCDA: {
      category: "SCDA",
      counselorCount: counselors.filter((c) => c.category === "SCDA" && c.is_active).length,
      baseTarget: 600000,
      baseAdmissionTarget: 6,
      totalTarget: 0,
      totalRevenue: 0,
      achievementPercentage: null,
    },
    PCA: {
      category: "PCA",
      counselorCount: counselors.filter((c) => c.category === "PCA" && c.is_active).length,
      baseTarget: 400000,
      baseAdmissionTarget: 4,
      totalTarget: 0,
      totalRevenue: 0,
      achievementPercentage: null,
    },
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-800 tracking-tight">
            Counselor Management & Targets
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Admin console for Sachin Behera &bull; Role-based category quotas, dynamic target formulas & audit logs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-border shadow-xs">
            <Calendar className="w-4 h-4 text-brand-orange shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={isPending}
              className="bg-transparent text-xs font-bold text-navy-800 focus:outline-none cursor-pointer pr-1"
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
            className="inline-flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all focus:outline-none disabled:opacity-50"
            title="Synchronize/Import the 9 authorized team counselors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-orange ${isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync Master Roster</span>
            <span className="sm:hidden">Sync</span>
          </button>

          {/* Add Counselor Button */}
          <button
            onClick={() => {
              setEditingCounselor(null);
              setIsCounselorModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-brand-hover text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Counselor</span>
          </button>
        </div>
      </div>

      {/* Database Not Configured Notice */}
      {!isConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold text-amber-950">Remote Supabase Setup Required: </span>
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

      {/* PHASE 2: 3 CATEGORY CARDS SECTION AT TOP */}
      <CategoryCardsSection
        categorySummaries={categorySummaries}
        selectedCategoryFilter={categoryFilter}
        onSelectCategoryFilter={(cat) => setCategoryFilter(cat)}
        onEditCategoryTarget={(cat) => {
          setSelectedCategoryForTarget(cat);
          setIsCategoryTargetModalOpen(true);
        }}
        selectedMonth={selectedMonth}
      />

      {/* Summary Metrics Row (6 Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {/* Total Counselors */}
        <div className="glass-card glass-card-hover rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Counselors
            </span>
            <div className="w-5 h-5 rounded-md bg-[#0866F5]/10 text-navy-800 flex items-center justify-center">
              <Users className="w-3 h-3 text-brand-orange" />
            </div>
          </div>
          <div className="text-base font-black text-navy-800">{summary.totalCounselors}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">{summary.activeCounselors} active</p>
        </div>

        {/* Team Collection Target */}
        <div className="glass-card glass-card-hover rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Collection Target
            </span>
            <div className="w-5 h-5 rounded-md bg-[#0866F5]/10 text-navy-800 flex items-center justify-center">
              <Target className="w-3 h-3 text-brand-orange" />
            </div>
          </div>
          <div className="text-base font-black text-navy-800">
            {formatINR(summary.combinedMonthlyTarget)}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Sum of active quotas</p>
        </div>

        {/* Team Admission Target */}
        <div className="glass-card glass-card-hover rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Adm. Target
            </span>
            <div className="w-5 h-5 rounded-md bg-[#0866F5]/10 text-navy-800 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-brand-orange" />
            </div>
          </div>
          <div className="text-base font-black text-navy-800">
            {summary.combinedAdmissionTarget ?? 0}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Enrolled quota</p>
        </div>

        {/* Team Actual Collections */}
        <div className="glass-card glass-card-hover rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Actual Collections
            </span>
            <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-3 h-3 text-emerald-600" />
            </div>
          </div>
          <div className="text-base font-black text-navy-800">
            {formatINR(summary.teamActualRevenue || 0)}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {summary.teamAchievementPercentage !== null && summary.teamAchievementPercentage !== undefined ? (
              <span className="text-emerald-600 font-bold">
                {summary.teamAchievementPercentage.toFixed(1)}% achieved
              </span>
            ) : (
              <span>₹0 recorded</span>
            )}
          </p>
        </div>

        {/* Team Actual Admissions */}
        <div className="glass-card glass-card-hover rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Actual Adm.
            </span>
            <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-blue-600" />
            </div>
          </div>
          <div className="text-base font-black text-navy-800">
            {summary.teamActualAdmissions ?? 0}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {summary.teamAdmissionAchievementPercentage !== null && summary.teamAdmissionAchievementPercentage !== undefined ? (
              <span className="text-blue-600 font-bold">
                {summary.teamAdmissionAchievementPercentage.toFixed(1)}%
              </span>
            ) : (
              <span>0 enrolled</span>
            )}
          </p>
        </div>

        {/* Reporting Cycle */}
        <div className="glass-card glass-card-hover rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Cycle
            </span>
            <div className="w-5 h-5 rounded-md bg-orange-500/10 text-brand-orange flex items-center justify-center">
              <Calendar className="w-3 h-3" />
            </div>
          </div>
          <div className="text-sm font-bold text-navy-800 truncate">
            {formatMonthDisplay(selectedMonth)}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Active period</p>
        </div>
      </div>

      {/* Table Toolbar: Search, Category Filter Pills, Status, and Sorting */}
      <div className="glass-card rounded-xl p-2.5 shadow-xs space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, category..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-light border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Category:
            </span>
            {(["ALL", "CDA", "SCDA", "PCA"] as const).map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-navy-900 text-white shadow-xs"
                      : "bg-surface-light text-navy-700 hover:bg-gray-100 border border-gray-200/80"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Status & Sorting Controls */}
          <div className="flex items-center space-x-1.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 text-xs font-semibold text-navy-800 bg-surface-light hover:bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
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
              className="px-2 py-1 bg-surface-light hover:bg-gray-100 text-xs font-semibold text-navy-800 rounded-lg border border-gray-200 flex items-center gap-1 transition-colors"
              title="Toggle Sort by Employee Code"
            >
              <ArrowUpDown className="w-3 h-3 text-brand-orange" />
              <span>Code {sortBy === "EMP_CODE" && (sortDirection === "ASC" ? "↑" : "↓")}</span>
            </button>

            {/* Sort Toggle: Target */}
            <button
              onClick={() => {
                if (sortBy === "FINAL_TARGET") {
                  setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
                } else {
                  setSortBy("FINAL_TARGET");
                  setSortDirection("DESC");
                }
              }}
              className="px-2 py-1 bg-surface-light hover:bg-gray-100 text-xs font-semibold text-navy-800 rounded-lg border border-gray-200 flex items-center gap-1 transition-colors"
              title="Toggle Sort by Final Target"
            >
              <Target className="w-3 h-3 text-brand-orange" />
              <span>Target {sortBy === "FINAL_TARGET" && (sortDirection === "ASC" ? "↑" : "↓")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Counselors Table */}
      <div className="glass-card rounded-xl shadow-xs overflow-hidden">
        {filteredCounselors.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-9 h-9 rounded-full bg-navy-50 flex items-center justify-center text-navy-800 mx-auto mb-2">
              <Users className="w-4 h-4 text-brand-orange" />
            </div>
            <h4 className="text-sm font-bold text-navy-800">
              {counselors.length === 0 ? "No Counselors Configured" : "No Matching Counselors Found"}
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {counselors.length === 0
                ? "Click 'Sync Master Roster' to import the nine authorized team counselors automatically."
                : "Try clearing your search query, category, or status filter to view all counselors."}
            </p>
            {counselors.length === 0 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={handleSyncMaster}
                  className="inline-flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Sync 9 Master Counselors</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#061B3D]/95 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-bold border-b border-white/10">
                  <th className="py-2.5 px-3">Counselor</th>
                  <th className="py-2.5 px-2 text-center">Category</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Base Target</th>
                  <th className="py-2.5 px-3 text-right">Additional</th>
                  <th className="py-2.5 px-3 text-right">Final Target</th>
                  <th className="py-2.5 px-3 text-right">Collections</th>
                  <th className="py-2.5 px-2 text-center">Ach. %</th>
                  <th className="py-2.5 px-2 text-center">Adm.</th>
                  <th className="py-2.5 px-2 text-center">Proj. %</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/70 text-xs bg-white/40 backdrop-blur-xs">
                {filteredCounselors.map((c) => {
                  const baseTarget = c.base_target || c.monthly_target || 800000;
                  const additionalTarget = c.additional_target || 0;
                  const finalTarget = c.final_target || c.effective_target || (baseTarget + additionalTarget);
                  const collectionAchievement = calculateAchievement(c.actual_revenue, finalTarget, 1);
                  const category = (c.category as CounselorCategory) || "CDA";

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-white/90 transition-colors ${
                        !c.is_active ? "bg-gray-50/50 opacity-75" : ""
                      }`}
                    >
                      {/* Name & Emp Code */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {c.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-navy-800 leading-tight">{c.full_name}</div>
                            <div className="text-[10px] font-mono text-brand-orange font-semibold">
                              {c.employee_code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge & Quick Change */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryModalCounselor(c);
                            setIsCategoryChangeModalOpen(true);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border ${
                            category === "CDA"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20"
                              : category === "SCDA"
                              ? "bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20"
                              : "bg-purple-500/10 text-purple-700 border-purple-500/30 hover:bg-purple-500/20"
                          }`}
                          title={`Category: ${category}. Click to change counselor category`}
                        >
                          <span>{category}</span>
                        </button>
                      </td>

                      {/* Contact Info */}
                      <td className="py-2.5 px-3">
                        <div className="text-gray-700 text-[11px] truncate max-w-[150px]">
                          {c.email || "No email on record"}
                        </div>
                        <div className="text-[10px] text-gray-400">{c.phone || "No phone"}</div>
                      </td>

                      {/* Monthly Base Target */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-navy-800">
                        <div>{formatINR(baseTarget)}</div>
                        <div className="text-[9px] text-gray-400 font-normal">Base Quota</div>
                      </td>

                      {/* Additional Target & Adjust Modal Trigger */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={`font-mono text-xs font-semibold ${
                              additionalTarget > 0 ? "text-brand-orange font-bold" : "text-gray-400"
                            }`}
                          >
                            {additionalTarget > 0 ? `+${formatINR(additionalTarget)}` : "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdditionalModalCounselor(c);
                              setIsAdditionalTargetModalOpen(true);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-brand-orange hover:bg-orange-50 transition-colors"
                            title="Add, edit or remove individual additional target"
                          >
                            <Calculator className="w-3 h-3" />
                          </button>
                        </div>
                        {c.additional_target_reason && (
                          <div className="text-[9px] text-gray-400 truncate max-w-[120px]" title={c.additional_target_reason}>
                            {c.additional_target_reason}
                          </div>
                        )}
                      </td>

                      {/* Final Monthly Target */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-mono font-black text-navy-900 text-xs">
                          {formatINR(finalTarget)}
                        </div>
                        <div className="text-[9px] text-emerald-600 font-medium">
                          {additionalTarget > 0 ? "Base + Addl." : "Category Standard"}
                        </div>
                      </td>

                      {/* Actual Collections */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-navy-800">
                        <div>{formatINR(c.actual_revenue || 0)}</div>
                        <div className="text-[9px] text-gray-400 font-normal">
                          {c.actual_revenue && c.actual_revenue > 0 ? "Verified" : "₹0 recorded"}
                        </div>
                      </td>

                      {/* Achievement % */}
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            collectionAchievement.status === "CALCULATED"
                              ? (collectionAchievement.percentage || 0) >= 100
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : (collectionAchievement.percentage || 0) >= 50
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-gray-100 text-navy-700 border border-gray-200"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {collectionAchievement.display}
                        </span>
                      </td>

                      {/* Admissions Count / Target */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="font-semibold text-navy-800">
                          {c.actual_admissions ?? 0}
                          <span className="text-gray-400 font-normal">
                            /{c.effective_admission_target || 8}
                          </span>
                        </div>
                      </td>

                      {/* Projection Achievement % */}
                      <td className="py-2.5 px-2 text-center">
                        {c.projection_completion_percentage !== null && c.projection_completion_percentage !== undefined ? (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              c.projection_completion_percentage >= 70
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : c.projection_completion_percentage >= 40
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {c.projection_completion_percentage.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-2.5 px-2 text-center">
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
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Audit History */}
                          <button
                            onClick={() => {
                              setAuditModalCounselor(c);
                              setIsAuditModalOpen(true);
                            }}
                            className="p-1 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Target & Category Audit Trail"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setEditingCounselor(c);
                              setIsCounselorModalOpen(true);
                            }}
                            className="p-1 text-gray-500 hover:text-navy-800 hover:bg-gray-100 rounded-lg transition-colors"
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
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Category Base Target Modal */}
      <CategoryTargetModal
        isOpen={isCategoryTargetModalOpen}
        onClose={() => {
          setIsCategoryTargetModalOpen(false);
          setSelectedCategoryForTarget(null);
        }}
        category={selectedCategoryForTarget}
        selectedMonth={selectedMonth}
        initialBaseTarget={
          selectedCategoryForTarget ? categorySummaries[selectedCategoryForTarget]?.baseTarget : 800000
        }
        initialAdmissionTarget={
          selectedCategoryForTarget ? categorySummaries[selectedCategoryForTarget]?.baseAdmissionTarget : 8
        }
        onSaveCategoryTarget={handleSaveCategoryTarget}
      />

      {/* Additional Target Adjustment Modal */}
      <AdditionalTargetModal
        isOpen={isAdditionalTargetModalOpen}
        onClose={() => {
          setIsAdditionalTargetModalOpen(false);
          setAdditionalModalCounselor(null);
        }}
        counselor={additionalModalCounselor}
        selectedMonth={selectedMonth}
        onSaveAdditionalTarget={handleSaveAdditionalTarget}
      />

      {/* Category Change Modal */}
      <CategoryChangeModal
        isOpen={isCategoryChangeModalOpen}
        onClose={() => {
          setIsCategoryChangeModalOpen(false);
          setCategoryModalCounselor(null);
        }}
        counselor={categoryModalCounselor}
        selectedMonth={selectedMonth}
        onSaveCategory={handleSaveCounselorCategory}
      />

      {/* Target Audit Trail Modal */}
      <TargetAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setAuditModalCounselor(null);
        }}
        counselor={auditModalCounselor}
        selectedMonth={selectedMonth}
      />

      {/* Month Target Setting Modal (Fallback/Manual override) */}
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
