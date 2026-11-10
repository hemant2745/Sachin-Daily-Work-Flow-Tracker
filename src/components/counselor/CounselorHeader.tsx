"use client";

import React from "react";
import { Plus, TrendingUp, Calendar, GraduationCap } from "lucide-react";
import type { CounselorCategory } from "@/types/counselor";

interface CounselorHeaderProps {
  counselorName: string;
  category: CounselorCategory;
  onOpenAdmissionModal: () => void;
  onOpenProjectionModal: () => void;
}

export function CounselorHeader({
  counselorName,
  category,
  onOpenAdmissionModal,
  onOpenProjectionModal,
}: CounselorHeaderProps) {
  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="glass-header h-14 sm:h-15 px-4 sm:px-6 flex items-center justify-between border-b border-surface-border/80 sticky top-0 z-30 shadow-xs">
      {/* Left: Greeting & Date */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-navy-800 leading-tight">
            Welcome, {counselorName}
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Calendar className="w-3 h-3 text-brand-orange" />
            <span>{todayStr}</span>
          </div>
        </div>
      </div>

      {/* Right: Operational Permission Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Permission 2: Morning Projection */}
        <button
          onClick={onOpenProjectionModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-xs transition-all"
        >
          <TrendingUp className="w-3.5 h-3.5 text-brand-orange" />
          <span className="hidden sm:inline">Morning Projection</span>
          <span className="sm:hidden">Projection</span>
        </button>

        {/* Permission 1: Add Admission */}
        <button
          onClick={onOpenAdmissionModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Admission</span>
        </button>
      </div>
    </header>
  );
}
