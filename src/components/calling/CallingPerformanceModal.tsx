"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { calculateAPR } from "@/lib/calling";
import { saveCallingPerformanceAction } from "@/app/(dashboard)/dashboard/calling-performance/actions";
import type {
  CallingPerformanceRecord,
  CallingPerformanceFormData,
} from "@/types/calling";

interface CallingPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (record: CallingPerformanceRecord) => void;
  counselors: Array<{ id: string; full_name: string; employee_code: string }>;
  initialRecord?: CallingPerformanceRecord | null;
  defaultDate?: string;
}

const APR_REASON_OPTIONS = [
  "Low call volume",
  "Low talk time",
  "Network or technical issues",
  "Lead availability",
  "Student follow-up workload",
  "Personal or emergency reasons",
  "Other",
];

export function CallingPerformanceModal({
  isOpen,
  onClose,
  onSaved,
  counselors,
  initialRecord,
  defaultDate,
}: CallingPerformanceModalProps) {
  const [counselorId, setCounselorId] = useState("");
  const [date, setDate] = useState(
    defaultDate || new Date().toISOString().split("T")[0]
  );
  const [callsMade, setCallsMade] = useState<number | string>(0);
  const [callsConnected, setCallsConnected] = useState<number | string>(0);
  const [talkTimeMinutes, setTalkTimeMinutes] = useState<number | string>(0);
  const [followUps, setFollowUps] = useState<number | string>(0);
  const [admissionsConverted, setAdmissionsConverted] = useState<number | string>(0);
  const [selectedReasonOption, setSelectedReasonOption] = useState("");
  const [customReasonDetails, setCustomReasonDetails] = useState("");
  const [dailyNotes, setDailyNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when opening or editing
  useEffect(() => {
    if (initialRecord) {
      setCounselorId(initialRecord.counselor_id);
      setDate(initialRecord.checkpoint_date);
      setCallsMade(initialRecord.calls_made);
      setCallsConnected(initialRecord.calls_connected);
      setTalkTimeMinutes(initialRecord.talk_time_minutes);
      setFollowUps(initialRecord.follow_ups);
      setAdmissionsConverted(initialRecord.admissions_converted);
      setDailyNotes(initialRecord.daily_notes || "");

      const reason = initialRecord.apr_reason || "";
      const match = APR_REASON_OPTIONS.find((opt) => reason.startsWith(opt));
      if (match) {
        setSelectedReasonOption(match);
        setCustomReasonDetails(
          reason.replace(match, "").replace(/^ - /, "").trim()
        );
      } else if (reason) {
        setSelectedReasonOption("Other");
        setCustomReasonDetails(reason);
      } else {
        setSelectedReasonOption("");
        setCustomReasonDetails("");
      }
    } else {
      setCounselorId(counselors[0]?.id || "");
      setDate(defaultDate || new Date().toISOString().split("T")[0]);
      setCallsMade(0);
      setCallsConnected(0);
      setTalkTimeMinutes(0);
      setFollowUps(0);
      setAdmissionsConverted(0);
      setSelectedReasonOption("");
      setCustomReasonDetails("");
      setDailyNotes("");
    }
    setErrors({});
    setGeneralError(null);
  }, [initialRecord, defaultDate, counselors, isOpen]);

  // Compute live APR preview
  const liveAPR = calculateAPR(Number(callsMade) || 0, Number(talkTimeMinutes) || 0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    // Build combined reason string if APR < 100%
    let combinedReason = "";
    if (!liveAPR.isAcceptable) {
      if (!selectedReasonOption) {
        setErrors((prev) => ({
          ...prev,
          apr_reason: "Please select an underperformance reason category.",
        }));
        return;
      }
      combinedReason = customReasonDetails.trim()
        ? `${selectedReasonOption} - ${customReasonDetails.trim()}`
        : selectedReasonOption;
    }

    const payload: CallingPerformanceFormData = {
      counselor_id: counselorId,
      checkpoint_date: date,
      calls_made: Math.max(0, parseInt(String(callsMade), 10) || 0),
      calls_connected: Math.max(0, parseInt(String(callsConnected), 10) || 0),
      talk_time_minutes: Math.max(0, parseFloat(String(talkTimeMinutes)) || 0),
      follow_ups: Math.max(0, parseInt(String(followUps), 10) || 0),
      admissions_converted: Math.max(0, parseInt(String(admissionsConverted), 10) || 0),
      apr_reason: combinedReason,
      daily_notes: dailyNotes,
    };

    setIsSubmitting(true);
    try {
      const res = await saveCallingPerformanceAction(payload, initialRecord?.id);
      if (res.success && res.record) {
        onSaved(res.record);
        onClose();
      } else {
        if (res.errors) {
          setErrors(res.errors);
        }
        setGeneralError(res.error || "Failed to save calling performance record.");
      }
    } catch (err: any) {
      setGeneralError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-surface-border overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-navy-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-navy-900 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialRecord ? "Edit Calling Performance Record" : "Log Daily Calling Performance"}
              </h3>
              <p className="text-xs text-gray-400">
                Track calls, talk-time, follow-ups, admissions, and APR benchmark metrics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {generalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Counsellor & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1.5">
                Counsellor <span className="text-rose-500">*</span>
              </label>
              <select
                value={counselorId}
                onChange={(e) => setCounselorId(e.target.value)}
                disabled={Boolean(initialRecord)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-surface-light focus:outline-none focus:border-brand-orange ${
                  errors.counselor_id ? "border-rose-400" : "border-gray-200"
                } ${initialRecord ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.employee_code})
                  </option>
                ))}
              </select>
              {errors.counselor_id && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.counselor_id}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1.5">
                Checkpoint Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={Boolean(initialRecord)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-surface-light focus:outline-none focus:border-brand-orange ${
                  errors.checkpoint_date ? "border-rose-400" : "border-gray-200"
                } ${initialRecord ? "opacity-75 cursor-not-allowed" : ""}`}
              />
              {errors.checkpoint_date && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.checkpoint_date}</p>
              )}
            </div>
          </div>

          {/* Numerical Input Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Calls Made */}
            <div className="bg-surface-light/60 p-3.5 rounded-xl border border-gray-200">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Total Calls Made (Target: 200) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={callsMade}
                onChange={(e) => setCallsMade(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 focus:outline-none focus:border-brand-orange bg-white"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Ach: {liveAPR.callAchievementPercent}%
              </span>
              {errors.calls_made && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.calls_made}</p>
              )}
            </div>

            {/* Calls Connected */}
            <div className="bg-surface-light/60 p-3.5 rounded-xl border border-gray-200">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Calls Connected <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={callsConnected}
                onChange={(e) => setCallsConnected(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 focus:outline-none focus:border-brand-orange bg-white"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Connected Ratio:{" "}
                {Number(callsMade) > 0
                  ? `${Math.round(((Number(callsConnected) || 0) / Number(callsMade)) * 100)}%`
                  : "0%"}
              </span>
              {errors.calls_connected && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.calls_connected}</p>
              )}
            </div>

            {/* Total Talk Time */}
            <div className="bg-surface-light/60 p-3.5 rounded-xl border border-gray-200">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Talk Time (Minutes, Target: 90) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={talkTimeMinutes}
                onChange={(e) => setTalkTimeMinutes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 focus:outline-none focus:border-brand-orange bg-white"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Ach: {liveAPR.talkTimeAchievementPercent}%
              </span>
              {errors.talk_time_minutes && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.talk_time_minutes}</p>
              )}
            </div>
          </div>

          {/* Follow-ups and Admissions Converted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1">
                Follow-ups Handled
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={followUps}
                onChange={(e) => setFollowUps(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-surface-light focus:outline-none focus:border-brand-orange"
              />
              {errors.follow_ups && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.follow_ups}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1">
                Admissions Converted
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={admissionsConverted}
                onChange={(e) => setAdmissionsConverted(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-surface-light focus:outline-none focus:border-brand-orange"
              />
              {errors.admissions_converted && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.admissions_converted}</p>
              )}
            </div>
          </div>

          {/* Real-time APR Calculation Summary Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              liveAPR.isAcceptable
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                : "bg-rose-50/70 border-rose-300 text-rose-950"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {liveAPR.isAcceptable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
                <div>
                  <h4 className="text-xs font-bold">
                    APR: {liveAPR.aprPercent}% &bull;{" "}
                    {liveAPR.isAcceptable ? "Acceptable Performance" : "Below 100% (Action Required)"}
                  </h4>
                  <p className="text-[11px] opacity-80">
                    Formula: (Call Ach {liveAPR.callAchievementPercent}% + Talk-Time Ach {liveAPR.talkTimeAchievementPercent}%) / 2
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                  liveAPR.isAcceptable
                    ? "bg-emerald-200/80 text-emerald-900"
                    : "bg-rose-200/80 text-rose-900"
                }`}
              >
                {liveAPR.aprPercent}%
              </span>
            </div>
          </div>

          {/* Underperformance Reason Section - Mandatory when APR < 100% */}
          {!liveAPR.isAcceptable && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Mandatory Reason for APR Below 100%</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Because this counsellor&apos;s daily APR is below 100%, an official justification is strictly required to save the record.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Primary Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedReasonOption}
                  onChange={(e) => setSelectedReasonOption(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="">-- Select Reason Category --</option>
                  {APR_REASON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors.apr_reason && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.apr_reason}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Specific Details / Explanation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inbound server downtime between 2-4 PM; heavy document verification for 3 enrollments"
                  value={customReasonDetails}
                  onChange={(e) => setCustomReasonDetails(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
          )}

          {/* Daily Notes */}
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              General Daily Observations / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Any additional remarks regarding student engagements or pitch insights..."
              value={dailyNotes}
              onChange={(e) => setDailyNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-surface-light focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-orange hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Calling Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
