"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle, DollarSign, Calendar, GraduationCap, Building2, User, FileText, Info } from "lucide-react";
import { formatINR, validateAdmissionInput } from "@/lib/format";
import type { AdmissionWithCounselor, AdmissionFormData, PaymentMode } from "@/types/admissions";
import { PAYMENT_MODE_LABELS } from "@/types/admissions";
import { UNIVERSITY_NAMES } from "@/lib/constants/universities";

interface CounselorOption {
  id: string;
  full_name: string;
  employee_code: string;
  is_active: boolean;
}

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdmissionFormData) => Promise<{ success: boolean; error?: string }>;
  counselors: CounselorOption[];
  initialData?: AdmissionWithCounselor | null;
}

export function AdmissionModal({
  isOpen,
  onClose,
  onSubmit,
  counselors,
  initialData,
}: AdmissionModalProps) {
  const isEditing = Boolean(initialData);

  const getTodayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<AdmissionFormData>({
    counselor_id: "",
    admission_date: getTodayISO(),
    university_name: "",
    program_name: "",
    amount_collected: 0,
    payment_mode: "semester_fees",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        counselor_id: initialData.counselor_id,
        admission_date: initialData.admission_date,
        university_name: initialData.university_name,
        program_name: initialData.program_name,
        amount_collected: initialData.amount_collected,
        payment_mode: initialData.payment_mode,
        notes: initialData.notes || "",
      });
    } else {
      // For new admission, default counselor to first active counselor if available
      const defaultCounselor = counselors.find((c) => c.is_active);
      setFormData({
        counselor_id: defaultCounselor?.id || "",
        admission_date: getTodayISO(),
        university_name: "",
        program_name: "",
        amount_collected: 0,
        payment_mode: "semester_fees",
        notes: "",
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [initialData, counselors, isOpen]);

  if (!isOpen) return null;

  // Filter counselors: in edit mode, include initial counselor even if inactive
  const availableCounselors = counselors.filter(
    (c) => c.is_active || (isEditing && initialData?.counselor_id === c.id)
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount_collected" ? (value === "" ? 0 : Number(value)) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateAdmissionInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await onSubmit(formData);
      if (!res.success) {
        setSubmitError(res.error || "Failed to record admission. Please try again.");
      } else {
        onClose();
      }
    } catch (err: any) {
      setSubmitError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-surface-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-navy-950 px-6 py-4 flex items-center justify-between border-b border-navy-800 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-900 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditing ? "Edit Admission Record" : "Record New Admission"}
              </h3>
              <p className="text-[11px] text-gray-400">
                {isEditing
                  ? "Update admission details and actual collections"
                  : "Enter verified enrollment and payment information"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-navy-900 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Historical Warning in Edit Mode */}
          {isEditing && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-950">Historical Impact Warning: </span>
                Modifying the counselor, admission date, or amount collected directly updates past monthly revenue and counselor achievement reports.
              </div>
            </div>
          )}

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Counselor Selection */}
          <div>
            <label className="block text-xs font-bold text-navy-800 mb-1">
              Assigned Counselor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                name="counselor_id"
                value={formData.counselor_id}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all ${
                  errors.counselor_id ? "border-red-500" : "border-gray-200"
                }`}
              >
                <option value="">-- Select Counselor --</option>
                {availableCounselors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.employee_code}) {!c.is_active ? "[Inactive]" : ""}
                  </option>
                ))}
              </select>
            </div>
            {errors.counselor_id && (
              <p className="text-[11px] text-red-600 mt-1">{errors.counselor_id}</p>
            )}
          </div>

          {/* Admission Date */}
          <div>
            <label className="block text-xs font-bold text-navy-800 mb-1">
              Admission Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                name="admission_date"
                value={formData.admission_date}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all ${
                  errors.admission_date ? "border-red-500" : "border-gray-200"
                }`}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Collections are attributed to the reporting month of this admission date.
            </p>
            {errors.admission_date && (
              <p className="text-[11px] text-red-600 mt-1">{errors.admission_date}</p>
            )}
          </div>

          {/* University & Program Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* University Name */}
            <div>
              <label className="block text-xs font-bold text-navy-800 mb-1">
                University Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="university_name"
                  list="university-master-list"
                  value={formData.university_name}
                  onChange={handleChange}
                  placeholder="Select or enter university name"
                  className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all ${
                    errors.university_name ? "border-red-500" : "border-gray-200"
                  }`}
                  autoComplete="off"
                />
                <datalist id="university-master-list">
                  {UNIVERSITY_NAMES.map((uni) => (
                    <option key={uni} value={uni} />
                  ))}
                </datalist>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Choose from the 23 master universities or type a custom name.
              </p>
              {errors.university_name && (
                <p className="text-[11px] text-red-600 mt-1">{errors.university_name}</p>
              )}
            </div>

            {/* Program Name */}
            <div>
              <label className="block text-xs font-bold text-navy-800 mb-1">
                Program / Degree <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="program_name"
                  value={formData.program_name}
                  onChange={handleChange}
                  placeholder="e.g. Online MBA"
                  className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all ${
                    errors.program_name ? "border-red-500" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.program_name && (
                <p className="text-[11px] text-red-600 mt-1">{errors.program_name}</p>
              )}
            </div>
          </div>

          {/* Amount Actually Collected (₹) */}
          <div className="bg-surface-light p-3.5 rounded-xl border border-gray-200 space-y-1.5">
            <label className="block text-xs font-bold text-navy-800">
              Amount Actually Collected (₹) <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-gray-500 leading-snug">
              Enter only the amount actually received for this admission, not the total program fee unless the full amount was collected.
            </p>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                ₹
              </span>
              <input
                type="number"
                name="amount_collected"
                min="0"
                step="1"
                value={formData.amount_collected === 0 ? "" : formData.amount_collected}
                onChange={handleChange}
                placeholder="0"
                className={`w-full pl-8 pr-24 py-2 text-xs font-semibold bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all ${
                  errors.amount_collected ? "border-red-500" : "border-gray-300"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-orange pointer-events-none">
                {formatINR(Number(formData.amount_collected) || 0)}
              </div>
            </div>
            {errors.amount_collected && (
              <p className="text-[11px] text-red-600 mt-1">{errors.amount_collected}</p>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-navy-800 mb-1.5">
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["semester_fees", "annual_fees", "full_fees"] as PaymentMode[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, payment_mode: mode }));
                    if (errors.payment_mode) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.payment_mode;
                        return next;
                      });
                    }
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    formData.payment_mode === mode
                      ? "bg-navy-950 text-white border-navy-950 shadow-sm"
                      : "bg-surface-light hover:bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {PAYMENT_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
            {errors.payment_mode && (
              <p className="text-[11px] text-red-600 mt-1">{errors.payment_mode}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-navy-800 mb-1">
              Context Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
              <textarea
                name="notes"
                rows={2}
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="Optional notes or remarks regarding transaction/student..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-navy-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-orange hover:bg-brand-hover rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Record Admission"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
