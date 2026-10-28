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
} from "@/app/(dashboard)/dashboard/counselors/actions";

interface CounselorListProps {
  initialCounselors: CounselorWithTarget[];
  initialSummary: {
    totalCounselors: number;
    activeCounselors: number;
    combinedMonthlyTarget: number;
    unconfiguredTargetsCount: number;
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
  const [sortBy, setSortBy] = useState<"NAME" | "EMP_CODE">("NAME");
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
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
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

  const handleSaveTarget = async (counselorId: string, month: string, amount: number) => {
    const res = await updateMonthlyTargetAction(counselorId, month, amount);
    if (res.success) {
      setSuccessMessage(`Target for ${formatMonthDisplay(month)} updated successfully.`);
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
            Private management console for Sachin Behera. Counselors are managed as records without login access.
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

          {/* Add Counselor Button */}
          <button
            onClick={() => {
              setEditingCounselor(null);
              setIsCounselorModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all shrink-0"
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
            Local application components, validations, and routes are fully operational. Once you configure your new dedicated Supabase credentials in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-semibold">.env.local</code> and run the migration in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950">supabase/migrations/20261028000000_create_counselors_and_targets.sql</code>, live records will persist directly to your PostgreSQL database.
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

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Counselors */}
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Counselors
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-orange" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-800">{summary.totalCounselors}</div>
          <p className="text-[11px] text-gray-500 mt-1">Total registered counselor records</p>
        </div>

        {/* Active Counselors */}
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Counselors
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-800">{summary.activeCounselors}</div>
          <p className="text-[11px] text-gray-500 mt-1">
            {summary.totalCounselors - summary.activeCounselors} inactive records preserved
          </p>
        </div>

        {/* Combined Monthly Target */}
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Team Target ({formatMonthDisplay(selectedMonth)})
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <Target className="w-4 h-4 text-brand-orange" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-800">
            {formatINR(summary.combinedMonthlyTarget)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {summary.unconfiguredTargetsCount > 0 ? (
              <span className="text-amber-600 font-medium">
                {summary.unconfiguredTargetsCount} active counselor(s) with ₹0 target
              </span>
            ) : (
              <span>Sum of all active counselor targets</span>
            )}
          </p>
        </div>

        {/* Combined Actual Revenue */}
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Team Actual Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-400 py-1.5">
            Not configured
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Admissions module scheduled for Phase 4
          </p>
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
              placeholder="Search by counselor name, code, email, or phone..."
              className="w-full pl-9 pr-3 py-2 bg-surface-light border border-gray-200 rounded-lg text-xs text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="inline-flex rounded-lg bg-surface-light p-1 border border-gray-200 text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === "ALL" ? "bg-white text-navy-800 shadow-sm" : "text-gray-500 hover:text-navy-800"
                }`}
              >
                All ({counselors.length})
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === "ACTIVE" ? "bg-white text-navy-800 shadow-sm" : "text-gray-500 hover:text-navy-800"
                }`}
              >
                Active ({summary.activeCounselors})
              </button>
              <button
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === "INACTIVE" ? "bg-white text-navy-800 shadow-sm" : "text-gray-500 hover:text-navy-800"
                }`}
              >
                Inactive ({summary.totalCounselors - summary.activeCounselors})
              </button>
            </div>

            {/* Sort Toggle */}
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
                ? "Start building your team by registering counselor records using the button below."
                : "Try clearing your search query or status filter to view all counselors."}
            </p>
            {counselors.length === 0 && (
              <button
                onClick={() => {
                  setEditingCounselor(null);
                  setIsCounselorModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Counselor</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-950 text-white text-[11px] uppercase tracking-wider font-semibold border-b border-navy-800">
                  <th className="py-3 px-4">Counselor</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">
                    Target ({formatMonthDisplay(selectedMonth)})
                  </th>
                  <th className="py-3 px-4 text-right">Actual Revenue</th>
                  <th className="py-3 px-4 text-center">Achievement</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredCounselors.map((c) => {
                  const achievement = calculateAchievement(c.actual_revenue, c.effective_target);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-surface-light/60 transition-colors ${
                        !c.is_active ? "bg-gray-50/70 opacity-75" : ""
                      }`}
                    >
                      {/* Name & Emp Code */}
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4">
                        <div className="text-gray-700">{c.email}</div>
                        <div className="text-[11px] text-gray-400">{c.phone}</div>
                      </td>

                      {/* Monthly Target for Selected Month */}
                      <td className="py-3.5 px-4 text-right font-semibold text-navy-800">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{formatINR(c.effective_target)}</span>
                          <button
                            onClick={() => {
                              setTargetModalCounselor(c);
                              setIsTargetModalOpen(true);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-brand-orange hover:bg-orange-50 transition-colors"
                            title={`Edit target specifically for ${formatMonthDisplay(selectedMonth)}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        {c.has_custom_target ? (
                          <div className="text-[10px] text-brand-orange font-normal">Month custom</div>
                        ) : (
                          <div className="text-[10px] text-gray-400 font-normal">Base quota</div>
                        )}
                      </td>

                      {/* Actual Revenue (Phase 4 Notice) */}
                      <td className="py-3.5 px-4 text-right text-gray-400">
                        <span className="italic">Not configured</span>
                        <div className="text-[10px] text-gray-400 font-normal">Admissions Phase 4</div>
                      </td>

                      {/* Achievement % */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                          {achievement.display}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
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
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
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

      {/* Counselor Add/Edit Modal */}
      <CounselorModal
        isOpen={isCounselorModalOpen}
        onClose={() => setIsCounselorModalOpen(false)}
        onSubmit={handleSaveCounselor}
        counselor={editingCounselor}
      />

      {/* Target Modal for Specific Month */}
      <TargetModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        counselor={targetModalCounselor}
        selectedMonth={selectedMonth}
        onSaveTarget={handleSaveTarget}
      />

      {/* Delete / Deactivate Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        counselor={deletingCounselor}
        onConfirmDelete={handleDeleteCounselor}
      />
    </div>
  );
}
