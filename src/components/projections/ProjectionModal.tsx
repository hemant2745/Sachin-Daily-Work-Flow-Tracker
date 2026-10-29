"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, Calendar, User, Building2, IndianRupee, FileText, AlertCircle, Sparkles } from "lucide-react";
import type { Projection, ProjectionFormData } from "@/types/projections";
import { getTodayIST } from "@/lib/projections";
import { formatINR } from "@/lib/format";

interface OptionItem {
  id: string;
  name: string;
  code?: string;
}

interface ProjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectionFormData) => Promise<{ success: boolean; error?: string }>;
  projection?: Projection | null;
  counselors: Array<{ id: string; full_name: string; employee_code: string }>;
  universities: Array<{ id: string; name: string }>;
}

export function ProjectionModal({
  isOpen,
  onClose,
  onSubmit,
  projection,
  counselors,
  universities,
}: ProjectionModalProps) {
  const [projectionDate, setProjectionDate] = useState(getTodayIST());
  const [counselorId, setCounselorId] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [projectedRevenue, setProjectedRevenue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(projection);

  useEffect(() => {
    if (projection) {
      setProjectionDate(projection.projection_date || getTodayIST());
      setCounselorId(projection.counselor_id || "");
      setUniversityId(projection.university_id || "");
      setProjectedRevenue(projection.projected_revenue ? String(projection.projected_revenue) : "");
      setNotes(projection.notes || "");
    } else {
      setProjectionDate(getTodayIST());
      setCounselorId(counselors[0]?.id || "");
      setUniversityId(universities[0]?.id || "");
      setProjectedRevenue("");
      setNotes("");
    }
    setError(null);
  }, [projection, isOpen, counselors, universities]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectionDate) {
      setError("Projection date is required.");
      return;
    }

    if (!counselorId) {
      setError("Please select a counselor.");
      return;
    }

    if (!universityId) {
      setError("Please select a university.");
      return;
    }

    const revenueNum = parseFloat(projectedRevenue);
    if (isNaN(revenueNum) || revenueNum <= 0) {
      setError("Please enter a valid projected revenue amount greater than ₹0.");
      return;
    }

    startTransition(async () => {
      const res = await onSubmit({
        projection_date: projectionDate,
        counselor_id: counselorId,
        university_id: universityId,
        projected_revenue: revenueNum,
        notes: notes.trim() || null,
      });

      if (!res.success) {
        setError(res.error || "Failed to save projection.");
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-200" />
            <h2 className="text-lg font-bold">
              {isEditing ? "Edit Revenue Projection" : "Add Daily Revenue Projection"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Projection Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Projection Date (IST) *</span>
            </label>
            <input
              type="date"
              value={projectionDate}
              onChange={(e) => setProjectionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Defaults to today. Projections become eligible for completion review the next calendar day.
            </p>
          </div>

          {/* Counselor Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <User className="w-4 h-4 text-blue-600" />
              <span>Counsellor *</span>
            </label>
            <select
              value={counselorId}
              onChange={(e) => setCounselorId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              required
            >
              <option value="" disabled>
                Select a counsellor...
              </option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.employee_code})
                </option>
              ))}
            </select>
          </div>

          {/* University Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>University *</span>
            </label>
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              required
            >
              <option value="" disabled>
                Select university...
              </option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Projected Revenue */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <IndianRupee className="w-4 h-4 text-blue-600" />
              <span>Projected Revenue Amount (₹) *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={projectedRevenue}
                onChange={(e) => setProjectedRevenue(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-8 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                required
              />
            </div>
            {projectedRevenue && !isNaN(Number(projectedRevenue)) && Number(projectedRevenue) > 0 && (
              <p className="text-xs text-blue-600 font-medium mt-1">
                Amount: {formatINR(Number(projectedRevenue))}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Notes / Details (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Follow-up student expected to pay 1st semester fee by evening..."
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Update Projection" : "Save Projection"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
