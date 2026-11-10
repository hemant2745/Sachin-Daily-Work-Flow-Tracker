"use client";

import React, { useState, useEffect } from "react";
import { X, Award, Save, AlertCircle, Info } from "lucide-react";
import type { CounselorCategory, CounselorWithTarget } from "@/types/counselor";

interface CategoryChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselor: CounselorWithTarget | null;
  selectedMonth: string;
  onSaveCategory: (
    counselorId: string,
    newCategory: CounselorCategory,
    monthKey?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const CATEGORY_DESCRIPTIONS: Record<CounselorCategory, { title: string; desc: string; defaultBase: string }> = {
  CDA: {
    title: "CDA (Counselor Development Associate)",
    desc: "Core admissions, student counseling & lead outreach",
    defaultBase: "₹8,00,000",
  },
  SCDA: {
    title: "SCDA (Senior Counselor Development Associate)",
    desc: "Senior conversion specialist & high-ticket admissions",
    defaultBase: "₹6,00,000",
  },
  PCA: {
    title: "PCA (Principal Counselor Associate)",
    desc: "Specialized advisory & premier admissions portfolio",
    defaultBase: "₹4,00,000",
  },
};

export function CategoryChangeModal({
  isOpen,
  onClose,
  counselor,
  selectedMonth,
  onSaveCategory,
}: CategoryChangeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<CounselorCategory>("CDA");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (counselor) {
      setSelectedCategory((counselor.category as CounselorCategory) || "CDA");
    }
    setError(null);
  }, [counselor, isOpen]);

  if (!isOpen || !counselor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedCategory === counselor.category) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSaveCategory(counselor.id, selectedCategory, selectedMonth);
      if (!res.success) {
        setError(res.error || "Failed to update category.");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-modal rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-white/80">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#061B3D]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Change Counselor Category
              </h3>
              <p className="text-[11px] text-gray-400">
                {counselor.full_name} ({counselor.employee_code})
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider">
              Select New Category
            </label>

            {(["CDA", "SCDA", "PCA"] as CounselorCategory[]).map((cat) => {
              const meta = CATEGORY_DESCRIPTIONS[cat];
              const isSelected = selectedCategory === cat;

              return (
                <label
                  key={cat}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-orange/60 bg-brand-orange/5 ring-1 ring-brand-orange"
                      : "border-gray-200 hover:bg-gray-50/80"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={isSelected}
                    onChange={() => setSelectedCategory(cat)}
                    className="mt-1 text-brand-orange focus:ring-brand-orange"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-800">{cat}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Base: {meta.defaultBase}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">{meta.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{meta.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
            <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
            <div>
              Changing this counselor&apos;s category will immediately adopt the new category&apos;s
              base target. Any existing individual additional target will be added on top.
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
              <span>{isSubmitting ? "Updating..." : "Update Category"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
