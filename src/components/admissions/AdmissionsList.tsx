"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  BookOpen,
  ArrowUpDown,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  Coins,
} from "lucide-react";
import {
  formatINR,
  formatMonthDisplay,
  getMonthOptions,
  normalizeMonthKey,
} from "@/lib/format";
import type {
  AdmissionWithCounselor,
  AdmissionsSummary,
  AdmissionFormData,
  PaymentMode,
} from "@/types/admissions";
import { PAYMENT_MODE_LABELS } from "@/types/admissions";
import { AdmissionModal } from "./AdmissionModal";
import {
  getAdmissionsAction,
  createAdmissionAction,
  updateAdmissionAction,
} from "@/app/(dashboard)/dashboard/admissions/actions";

interface CounselorOption {
  id: string;
  full_name: string;
  employee_code: string;
  is_active: boolean;
}

interface AdmissionsListProps {
  initialAdmissions: AdmissionWithCounselor[];
  initialSummary: AdmissionsSummary;
  initialMonth: string;
  counselors: CounselorOption[];
  isConfigured: boolean;
  initialError?: string;
}

export function AdmissionsList({
  initialAdmissions,
  initialSummary,
  initialMonth,
  counselors,
  isConfigured,
  initialError,
}: AdmissionsListProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [counselorFilter, setCounselorFilter] = useState<string>("ALL");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"DATE" | "AMOUNT">("DATE");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  const [admissions, setAdmissions] = useState<AdmissionWithCounselor[]>(initialAdmissions);
  const [summary, setSummary] = useState<AdmissionsSummary>(initialSummary);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState<AdmissionWithCounselor | null>(null);

  const [isPending, startTransition] = useTransition();

  const monthOptions = useMemo(() => {
    const list = getMonthOptions();
    return [{ value: "ALL", label: "All Months (Lifetime)" }, ...list];
  }, []);

  // Fetch / Refresh data from server
  const refreshData = (month: string, cId: string, pMode: string, search: string) => {
    startTransition(async () => {
      const res = await getAdmissionsAction({
        monthKey: month,
        counselorId: cId,
        paymentMode: pMode,
        search,
      });

      if (res.success) {
        setAdmissions(res.admissions);
        setSummary(res.summary);
      } else {
        setErrorMessage(res.error || "Failed to load admissions.");
      }
    });
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setErrorMessage(null);
    setSuccessMessage(null);
    refreshData(newMonth, counselorFilter, paymentModeFilter, searchQuery);
  };

  const handleCounselorFilterChange = (cId: string) => {
    setCounselorFilter(cId);
    refreshData(selectedMonth, cId, paymentModeFilter, searchQuery);
  };

  const handlePaymentModeFilterChange = (mode: string) => {
    setPaymentModeFilter(mode);
    refreshData(selectedMonth, counselorFilter, mode, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    refreshData(selectedMonth, counselorFilter, paymentModeFilter, query);
  };

  // Sort admissions
  const sortedAdmissions = useMemo(() => {
    return [...admissions].sort((a, b) => {
      if (sortBy === "DATE") {
        const dateA = new Date(a.admission_date).getTime();
        const dateB = new Date(b.admission_date).getTime();
        return sortDirection === "ASC" ? dateA - dateB : dateB - dateA;
      } else {
        return sortDirection === "ASC"
          ? a.amount_collected - b.amount_collected
          : b.amount_collected - a.amount_collected;
      }
    });
  }, [admissions, sortBy, sortDirection]);

  // Modal Save Handler
  const handleModalSubmit = async (formData: AdmissionFormData) => {
    if (editingAdmission) {
      const res = await updateAdmissionAction(editingAdmission.id, formData);
      if (res.success) {
        setSuccessMessage("Admission record updated successfully.");
        refreshData(selectedMonth, counselorFilter, paymentModeFilter, searchQuery);
      }
      return res;
    } else {
      const res = await createAdmissionAction(formData);
      if (res.success) {
        setSuccessMessage("Admission recorded successfully.");
        refreshData(selectedMonth, counselorFilter, paymentModeFilter, searchQuery);
      }
      return res;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-navy-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-orange" />
            <span>Admissions & Collections</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track admissions, record actual collections, and monitor counselor revenue.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Month Selector */}
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="pl-8 pr-8 py-2 text-xs font-semibold text-navy-800 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Add Admission Button */}
          <button
            onClick={() => {
              setEditingAdmission(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-orange hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admission</span>
          </button>
        </div>
      </div>

      {/* Database Not Configured Notice */}
      {!isConfigured && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Database className="w-5 h-5 text-brand-orange mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold text-amber-950">Database Configuration Notice: </span>
            Ensure your database credentials in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-semibold">.env.local</code> and the migration in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950">supabase/migrations/20261029000000_create_admissions.sql</code> are applied.
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

      {/* 4 Summary Cards (Computed from Real Records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Admissions (Lifetime) */}
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Admissions
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-brand-orange" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-800">{summary.totalAdmissions}</div>
          <p className="text-[11px] text-gray-500 mt-1">Lifetime verified enrollments across team</p>
        </div>

        {/* 2. Total Actual Collections (Lifetime) */}
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Collections (Lifetime)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-800">
            {formatINR(summary.totalCollections)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Cumulative verified money collected</p>
        </div>

        {/* 3. Current Month Collections */}
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {selectedMonth === "ALL" ? "Current Month" : formatMonthDisplay(selectedMonth)} Collections
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <Coins className="w-4 h-4 text-brand-orange" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-800">
            {formatINR(summary.currentMonthCollections)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {summary.currentMonthAdmissionsCount} admission(s) credited to this period
          </p>
        </div>

        {/* 4. Average Collection per Admission */}
        <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Average per Admission
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-800">
            {formatINR(summary.averageCollection)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Lifetime average collected ticket size</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search counselor, university, or program..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface-light border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Counselor Filter */}
            <select
              value={counselorFilter}
              onChange={(e) => handleCounselorFilterChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light hover:bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              <option value="ALL">All Counselors</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.employee_code})
                </option>
              ))}
            </select>

            {/* Payment Mode Filter */}
            <select
              value={paymentModeFilter}
              onChange={(e) => handlePaymentModeFilterChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light hover:bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="semester_fees">Semester Fees</option>
              <option value="annual_fees">Annual Fees</option>
              <option value="full_fees">Full Fees</option>
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => {
                if (sortBy === "DATE") {
                  setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
                } else {
                  setSortBy("DATE");
                  setSortDirection("DESC");
                }
              }}
              className="px-2.5 py-1.5 bg-surface-light hover:bg-gray-100 text-xs font-semibold text-navy-800 rounded-lg border border-gray-200 flex items-center gap-1.5 transition-colors"
              title="Toggle Sort by Date"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-orange" />
              <span>Date {sortBy === "DATE" && (sortDirection === "ASC" ? "↑" : "↓")}</span>
            </button>

            <button
              onClick={() => {
                if (sortBy === "AMOUNT") {
                  setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
                } else {
                  setSortBy("AMOUNT");
                  setSortDirection("DESC");
                }
              }}
              className="px-2.5 py-1.5 bg-surface-light hover:bg-gray-100 text-xs font-semibold text-navy-800 rounded-lg border border-gray-200 flex items-center gap-1.5 transition-colors"
              title="Toggle Sort by Amount"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-orange" />
              <span>Amount {sortBy === "AMOUNT" && (sortDirection === "ASC" ? "↑" : "↓")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-card overflow-hidden">
        {sortedAdmissions.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center text-navy-800 mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-brand-orange" />
            </div>
            <h4 className="text-sm font-bold text-navy-800">
              {admissions.length === 0 ? "No Admissions Recorded" : "No Matching Admissions Found"}
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {admissions.length === 0
                ? "Start recording verified student enrollments and fee collections using the button below."
                : "Try clearing your search query or adjusting your filters to view admissions."}
            </p>
            {admissions.length === 0 && (
              <button
                onClick={() => {
                  setEditingAdmission(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Record First Admission</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-950 text-white text-[11px] uppercase tracking-wider font-semibold border-b border-navy-800">
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4">Counselor</th>
                  <th className="py-3 px-4">University & Program</th>
                  <th className="py-3 px-4 text-right">Amount Collected</th>
                  <th className="py-3 px-4 text-center">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {sortedAdmissions.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-light/60 transition-colors">
                    {/* Admission Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy-800">{item.admission_date}</div>
                      <div className="text-[10px] text-gray-400">
                        {formatMonthDisplay(normalizeMonthKey(item.admission_date))}
                      </div>
                    </td>

                    {/* Counselor */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-800">
                        {item.counselor?.full_name || "Unassigned"}
                      </div>
                      <div className="text-[10px] font-mono text-brand-orange font-semibold">
                        {item.counselor?.employee_code || "N/A"}
                      </div>
                    </td>

                    {/* University & Program */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800">{item.university_name}</div>
                      <div className="text-[11px] text-gray-500">{item.program_name}</div>
                      {item.notes && (
                        <div className="text-[10px] text-gray-400 italic mt-0.5 max-w-xs truncate">
                          &quot;{item.notes}&quot;
                        </div>
                      )}
                    </td>

                    {/* Amount Collected */}
                    <td className="py-3.5 px-4 text-right font-bold text-navy-800">
                      <div className="text-brand-orange">{formatINR(item.amount_collected)}</div>
                      <div className="text-[10px] text-gray-400 font-normal">Verified payment</div>
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-navy-50 text-navy-800 border border-navy-200">
                        {PAYMENT_MODE_LABELS[item.payment_mode] || item.payment_mode}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingAdmission(item);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-navy-800 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Edit Admission Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add / Edit */}
      <AdmissionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAdmission(null);
        }}
        onSubmit={handleModalSubmit}
        counselors={counselors}
        initialData={editingAdmission}
      />
    </div>
  );
}
