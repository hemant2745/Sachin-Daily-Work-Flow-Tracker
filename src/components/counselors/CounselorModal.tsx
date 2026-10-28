"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Save, AlertCircle } from "lucide-react";
import { validateCounselorInput } from "@/lib/format";
import type { Counselor, CounselorFormData } from "@/types/counselor";

interface CounselorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CounselorFormData) => Promise<{ success: boolean; error?: string }>;
  counselor?: Counselor | null; // If provided, edit mode; otherwise, add mode
}

export function CounselorModal({ isOpen, onClose, onSubmit, counselor }: CounselorModalProps) {
  const isEditMode = Boolean(counselor);

  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState<number | string>(0);
  const [monthlyAdmissionTarget, setMonthlyAdmissionTarget] = useState<number | string>(0);
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (counselor) {
      setEmployeeCode(counselor.employee_code);
      setFullName(counselor.full_name);
      setEmail(counselor.email || "");
      setPhone(counselor.phone || "");
      setMonthlyTarget(counselor.monthly_target);
      setMonthlyAdmissionTarget(counselor.monthly_admission_target || 0);
      setIsActive(counselor.is_active);
    } else {
      setEmployeeCode("");
      setFullName("");
      setEmail("");
      setPhone("");
      setMonthlyTarget(0);
      setMonthlyAdmissionTarget(0);
      setIsActive(true);
    }
    setErrors({});
    setServerError(null);
  }, [counselor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const formData: CounselorFormData = {
      employee_code: employeeCode.trim().toUpperCase(),
      full_name: fullName.trim(),
      email: email.trim().toLowerCase() || undefined,
      phone: phone.trim() || undefined,
      monthly_target: Math.max(0, Number(monthlyTarget) || 0),
      monthly_admission_target: Math.max(0, Number(monthlyAdmissionTarget) || 0),
      is_active: isActive,
    };

    const validation = validateCounselorInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await onSubmit(formData);
      if (!res.success) {
        setServerError(res.error || "Failed to save counselor.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setServerError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-900 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              {isEditMode ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {isEditMode ? "Edit Counselor Details" : "Add New Counselor"}
              </h3>
              <p className="text-[11px] text-gray-400">
                {isEditMode
                  ? "Update counselor information and default quota"
                  : "Register a team counselor record (records only; no login account)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Code */}
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
                Employee Code *
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                placeholder="e.g. CV-101"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-surface-light border border-gray-300 rounded-lg text-sm text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent uppercase"
              />
              {errors.employee_code && (
                <p className="text-[11px] text-red-600 mt-1">{errors.employee_code}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-surface-light border border-gray-300 rounded-lg text-sm text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              {errors.full_name && (
                <p className="text-[11px] text-red-600 mt-1">{errors.full_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
                Work Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul.s@collegevidya.com"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-surface-light border border-gray-300 rounded-lg text-sm text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-surface-light border border-gray-300 rounded-lg text-sm text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              {errors.phone && (
                <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Base Monthly Targets Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
                Monthly Collection Target (₹) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-semibold text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  placeholder="550000"
                  disabled={isSubmitting}
                  className="w-full pl-8 pr-3 py-2 bg-surface-light border border-gray-300 rounded-lg text-sm text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                />
              </div>
              {errors.monthly_target && (
                <p className="text-[11px] text-red-600 mt-1">{errors.monthly_target}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1 uppercase tracking-wider">
                Monthly Admission Target *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={monthlyAdmissionTarget}
                onChange={(e) => setMonthlyAdmissionTarget(e.target.value)}
                placeholder="6"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-surface-light border border-gray-300 rounded-lg text-sm text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              {errors.monthly_admission_target && (
                <p className="text-[11px] text-red-600 mt-1">{errors.monthly_admission_target}</p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-500 -mt-2">
            Baseline collection and admission quotas for counselor evaluations.
          </p>

          {/* Active Status */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <div>
              <span className="text-xs font-semibold text-navy-800 block">Active Status</span>
              <span className="text-[11px] text-gray-500 block">
                Active counselors are counted in monthly targets and active queues
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100">
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
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-orange hover:bg-brand-hover rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Save Changes" : "Create Counselor"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
