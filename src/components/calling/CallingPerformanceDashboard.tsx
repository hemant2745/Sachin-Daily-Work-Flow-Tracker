"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  PhoneCall,
  Clock,
  Calendar,
  Filter,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  Users,
} from "lucide-react";
import { CallingPerformanceModal } from "./CallingPerformanceModal";
import {
  getCallingPerformanceAction,
  deleteCallingPerformanceAction,
} from "@/app/(dashboard)/dashboard/calling-performance/actions";
import type {
  CallingPerformanceRecord,
  TeamCallingSummary,
  CallingPerformanceFilterOptions,
} from "@/types/calling";

interface CallingPerformanceDashboardProps {
  initialRecords: CallingPerformanceRecord[];
  initialSummary: TeamCallingSummary | null;
  counselors: Array<{ id: string; full_name: string; employee_code: string }>;
  currentDate: string;
}

export function CallingPerformanceDashboard({
  initialRecords,
  initialSummary,
  counselors,
  currentDate,
}: CallingPerformanceDashboardProps) {
  const [records, setRecords] = useState<CallingPerformanceRecord[]>(initialRecords);
  const [summary, setSummary] = useState<TeamCallingSummary | null>(initialSummary);
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [selectedCounselor, setSelectedCounselor] = useState("ALL");
  const [selectedAPRStatus, setSelectedAPRStatus] = useState<"ALL" | "acceptable" | "underperforming">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CallingPerformanceRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRefresh = (newDate?: string) => {
    const targetDate = newDate || selectedDate;
    startTransition(async () => {
      const res = await getCallingPerformanceAction({
        date: targetDate,
        counselor_id: selectedCounselor,
        apr_status: selectedAPRStatus,
        search: searchTerm,
      });

      if (res.success) {
        setRecords(res.records);
        setSummary(res.summary);
      }
    });
  };

  const handleRecordSaved = (savedRecord: CallingPerformanceRecord) => {
    setRecords((prev) => {
      const index = prev.findIndex((r) => r.id === savedRecord.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = savedRecord;
        return next;
      }
      return [savedRecord, ...prev];
    });
    handleRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calling performance entry?")) return;
    const res = await deleteCallingPerformanceAction(id);
    if (res.success) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      handleRefresh();
    } else {
      alert("Failed to delete record: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-800">
            <PhoneCall className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-navy-800">Counsellor Daily Calling Performance</h1>
            <p className="text-xs text-gray-500">
              Track calls, talk-time, follow-ups, and APR benchmarks (200 calls &bull; 90 min talk time).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Performance Checkpoint</span>
        </button>
      </div>

      {/* KPI Cards Section */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Team Average APR */}
          <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Average Team APR
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-navy-800 mb-1">
              {summary.averageAPR !== null ? `${summary.averageAPR}%` : "No Submissions"}
            </div>
            <div className="text-[11px] text-gray-500">
              {summary.acceptableCount} acceptable &bull; {summary.underperformingCount} below 100%
            </div>
          </div>

          {/* Card 2: Total Calls Made */}
          <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Calls Made
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <PhoneCall className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-navy-800 mb-1">
              {summary.totalCallsMade.toLocaleString()}
            </div>
            <div className="text-[11px] text-gray-500">
              {summary.totalCallsConnected.toLocaleString()} connected ({summary.totalCallsMade > 0 ? Math.round((summary.totalCallsConnected / summary.totalCallsMade) * 100) : 0}%)
            </div>
          </div>

          {/* Card 3: Total Talk Time */}
          <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Talk Time
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-navy-800 mb-1">
              {summary.totalTalkTimeMinutes} <span className="text-sm font-semibold text-gray-500">mins</span>
            </div>
            <div className="text-[11px] text-gray-500">
              {(summary.totalTalkTimeMinutes / 60).toFixed(1)} total talk hours logged
            </div>
          </div>

          {/* Card 4: Submissions & Follow-ups */}
          <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Submissions Status
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-navy-800 mb-1">
              {summary.totalSubmissions} / {summary.expectedSubmissions}
            </div>
            <div className="text-[11px] text-gray-500">
              {summary.missingSubmissions > 0 ? (
                <span className="text-rose-600 font-semibold">{summary.missingSubmissions} missing submissions</span>
              ) : (
                <span className="text-emerald-600 font-semibold">100% submitted</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Date Selection Toolbar */}
      <div className="bg-white border border-surface-border rounded-2xl p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Checkpoint Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                handleRefresh(e.target.value);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-surface-light focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Counsellor Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Filter by Counsellor
            </label>
            <select
              value={selectedCounselor}
              onChange={(e) => setSelectedCounselor(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-surface-light focus:outline-none focus:border-brand-orange"
            >
              <option value="ALL">All Counsellors ({counselors.length})</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.employee_code})
                </option>
              ))}
            </select>
          </div>

          {/* APR Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              APR Status
            </label>
            <select
              value={selectedAPRStatus}
              onChange={(e) => setSelectedAPRStatus(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-surface-light focus:outline-none focus:border-brand-orange"
            >
              <option value="ALL">All APR Outcomes</option>
              <option value="acceptable">&ge; 100% APR (Acceptable)</option>
              <option value="underperforming">&lt; 100% APR (Underperforming)</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Search by Keyword
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-surface-light focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={() => handleRefresh()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-orange bg-brand-light rounded-xl hover:bg-brand-orange hover:text-white transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {/* Daily Records Data Table */}
      <div className="bg-white border border-surface-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-white font-semibold border-b border-navy-900">
              <tr>
                <th className="py-3 px-4">Counsellor</th>
                <th className="py-3 px-3 text-center">Date</th>
                <th className="py-3 px-3 text-center">Calls (200)</th>
                <th className="py-3 px-3 text-center">Connected</th>
                <th className="py-3 px-3 text-center">Talk Time (90m)</th>
                <th className="py-3 px-3 text-center">Follow-ups</th>
                <th className="py-3 px-3 text-center">Adm</th>
                <th className="py-3 px-3 text-center">Call %</th>
                <th className="py-3 px-3 text-center">Talk %</th>
                <th className="py-3 px-4 text-center">APR %</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-400">
                    <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-gray-600">No performance records found</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Click &ldquo;Log Performance Checkpoint&rdquo; above to record today&apos;s calling metrics.
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isPass = r.apr_percent >= 100;
                  return (
                    <tr key={r.id} className="hover:bg-surface-light/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-navy-800">
                        {r.counselor?.full_name || "Unknown"}
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {r.counselor?.employee_code}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                        {r.checkpoint_date}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{r.calls_made}</td>
                      <td className="py-3 px-3 text-center text-gray-600">{r.calls_connected}</td>
                      <td className="py-3 px-3 text-center font-semibold">{r.talk_time_minutes}m</td>
                      <td className="py-3 px-3 text-center">{r.follow_ups}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                        {r.admissions_converted}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-600 font-mono text-[11px]">
                        {r.call_achievement_percent}%
                      </td>
                      <td className="py-3 px-3 text-center text-gray-600 font-mono text-[11px]">
                        {r.talk_time_achievement_percent}%
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            isPass
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {r.apr_percent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] max-w-xs">
                        {r.apr_reason ? (
                          <div className="text-rose-700 font-medium">{r.apr_reason}</div>
                        ) : (
                          <div className="text-gray-400 italic">Target Achieved</div>
                        )}
                        {r.daily_notes && (
                          <div className="text-gray-500 text-[10px] truncate mt-0.5">
                            {r.daily_notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded text-gray-500 hover:text-navy-800 hover:bg-gray-100 mr-1"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry / Edit Modal */}
      <CallingPerformanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSaved={handleRecordSaved}
        counselors={counselors}
        initialRecord={editingRecord}
        defaultDate={selectedDate}
      />
    </div>
  );
}
