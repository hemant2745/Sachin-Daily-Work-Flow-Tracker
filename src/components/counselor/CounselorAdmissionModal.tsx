"use client";

import React, { useState } from "react";
import { X, Plus, Save, AlertCircle, Info, GraduationCap } from "lucide-react";
import { formatINR } from "@/lib/format";
import { UNIVERSITY_MASTER_LIST } from "@/lib/constants/universities";
import { counselorSubmitAdmissionAction } from "@/app/(counselor)/counselor/actions";

interface CounselorAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CounselorAdmissionModal({
  isOpen,
  onClose,
  onSuccess,
}: CounselorAdmissionModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [studentName, setStudentName] = useState("");
  const [admissionDate, setAdmissionDate] = useState(todayStr);
  const [universityName, setUniversityName] = useState("");
  const [programName, setProgramName] = useState("");
  const [amountCollected, setAmountCollected] = useState<number | string>("");
  const [paymentMode, setPaymentMode] = useState<string>("semester_fees");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(amountCollected);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid collection amount greater than zero.");
      return;
    }

    if (!universityName.trim()) {
      setError("Please select or enter the university name.");
      return;
    }

    if (!programName.trim()) {
      setError("Please enter the enrolled program name (e.g. Online MBA).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await counselorSubmitAdmissionAction({
        studentName: studentName.trim() || undefined,
        admissionDate,
        universityName: universityName.trim(),
        programName: programName.trim(),
        amountCollected: amount,
        paymentMode,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit admission record.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        // Reset form
        setStudentName("");
        setUniversityName("");
        setProgramName("");
        setAmountCollected("");
        setNotes("");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/80">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#061B3D]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Submit New Admission
              </h3>
              <p className="text-[11px] text-gray-400">
                Will be automatically queued for administrator verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Name */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
              Student Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Rohit Mehra"
              className="w-full px-3 py-2 text-xs text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Admission Date */}
            <div>
              <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
                Admission Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all font-mono"
              />
            </div>

            {/* University Selection */}
            <div>
              <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
                Partner University <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                className="w-full px-3 py-2 text-xs text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Select University</option>
                {UNIVERSITY_MASTER_LIST.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Program Name */}
            <div>
              <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
                Program Enrolled <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g. Online MBA, BCA, MCA"
                className="w-full px-3 py-2 text-xs text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
              />
            </div>

            {/* Collection Amount */}
            <div>
              <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
                Amount Collected (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={amountCollected}
                  onChange={(e) => setAmountCollected(e.target.value)}
                  placeholder="e.g. 55000"
                  className="w-full pl-8 pr-3 py-2 text-xs font-bold font-mono text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "semester_fees", label: "Semester Fees" },
                { key: "annual_fees", label: "Annual Fees" },
                { key: "full_fees", label: "Full Course Fees" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMode(m.key)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                    paymentMode === m.key
                      ? "bg-brand-orange text-white border-brand-orange shadow-xs"
                      : "bg-surface-light text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks / Notes */}
          <div>
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
              Remarks / Transaction Reference
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. UTR reference, special scholarship applied"
              className="w-full px-3 py-2 text-xs text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Security Notice */}
          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              This admission will be registered under your counselor account and will automatically update verified collections once approved by Sachin Behera.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-orange hover:bg-brand-hover rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Submitting..." : "Submit Admission"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
