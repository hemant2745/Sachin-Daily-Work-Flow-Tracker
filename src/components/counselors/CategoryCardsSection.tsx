"use client";

import React from "react";
import { Award, Users, Target, TrendingUp, Edit3, Filter, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { CounselorCategory, CategoryCardSummary } from "@/types/counselor";

interface CategoryCardsSectionProps {
  categorySummaries: Record<CounselorCategory, CategoryCardSummary>;
  selectedCategoryFilter: CounselorCategory | "ALL";
  onSelectCategoryFilter: (category: CounselorCategory | "ALL") => void;
  onEditCategoryTarget: (category: CounselorCategory) => void;
  selectedMonth: string;
}

const CATEGORY_META: Record<
  CounselorCategory,
  {
    name: string;
    fullName: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    borderGlow: string;
    accentColor: string;
    progressBar: string;
  }
> = {
  CDA: {
    name: "CDA",
    fullName: "Counselor Development Associate",
    description: "Core admissions & proactive counseling",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700",
    badgeText: "text-emerald-700",
    borderGlow: "hover:border-emerald-500/40",
    accentColor: "from-emerald-500 to-teal-600",
    progressBar: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
  SCDA: {
    name: "SCDA",
    fullName: "Senior Counselor Development Associate",
    description: "Senior advisory & high-conversion portfolio",
    badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-700",
    badgeText: "text-blue-700",
    borderGlow: "hover:border-blue-500/40",
    accentColor: "from-blue-600 to-indigo-600",
    progressBar: "bg-gradient-to-r from-blue-500 to-indigo-500",
  },
  PCA: {
    name: "PCA",
    fullName: "Principal Counselor Associate",
    description: "Specialized guidance & strategic conversions",
    badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-700",
    badgeText: "text-purple-700",
    borderGlow: "hover:border-purple-500/40",
    accentColor: "from-purple-600 to-pink-600",
    progressBar: "bg-gradient-to-r from-purple-500 to-pink-500",
  },
};

export function CategoryCardsSection({
  categorySummaries,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onEditCategoryTarget,
}: CategoryCardsSectionProps) {
  const categories: CounselorCategory[] = ["CDA", "SCDA", "PCA"];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-orange" />
          <h3 className="text-xs sm:text-sm font-bold text-navy-800 uppercase tracking-wider">
            Counselor Categories & Dynamic Targets
          </h3>
        </div>
        {selectedCategoryFilter !== "ALL" && (
          <button
            onClick={() => onSelectCategoryFilter("ALL")}
            className="text-[11px] font-semibold text-brand-orange hover:text-brand-hover hover:underline transition-colors"
          >
            Clear Filter (Show All Categories)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
        {categories.map((catKey) => {
          const meta = CATEGORY_META[catKey];
          const summary = categorySummaries[catKey] || {
            category: catKey,
            counselorCount: 0,
            baseTarget: catKey === "CDA" ? 800000 : catKey === "SCDA" ? 600000 : 400000,
            baseAdmissionTarget: catKey === "CDA" ? 8 : catKey === "SCDA" ? 6 : 4,
            totalTarget: 0,
            totalRevenue: 0,
            achievementPercentage: null,
          };

          const isFiltered = selectedCategoryFilter === catKey;
          const achievementVal =
            summary.achievementPercentage !== null && summary.achievementPercentage !== undefined
              ? summary.achievementPercentage
              : summary.totalTarget > 0
              ? (summary.totalRevenue / summary.totalTarget) * 100
              : 0;

          return (
            <div
              key={catKey}
              className={`glass-card rounded-2xl p-4 transition-all duration-200 border ${
                isFiltered
                  ? "ring-2 ring-brand-orange/60 border-brand-orange/40 bg-white/90 shadow-md"
                  : `border-white/80 ${meta.borderGlow} hover:shadow-md`
              }`}
            >
              {/* Card Header: Category Badge, Name, Count */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`px-2.5 py-1 rounded-lg border font-black text-xs tracking-wider uppercase ${meta.badgeBg}`}
                  >
                    {meta.name}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-800 leading-tight">{meta.fullName}</h4>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{meta.description}</p>
                  </div>
                </div>

                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 shrink-0"
                  title={`${summary.counselorCount} assigned counselors`}
                >
                  <Users className="w-3 h-3 text-gray-500" />
                  <span>{summary.counselorCount}</span>
                </div>
              </div>

              {/* Monthly Base Target (Default Quota) */}
              <div className="p-2.5 rounded-xl bg-white/70 border border-gray-100/80 mb-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Monthly Base Target</span>
                  <span className="font-mono font-black text-navy-800 text-sm">
                    {formatINR(summary.baseTarget)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>Base Admissions Quota</span>
                  <span className="font-semibold text-gray-700">
                    {summary.baseAdmissionTarget || 0} students
                  </span>
                </div>
              </div>

              {/* Aggregated Performance Metric */}
              <div className="space-y-1.5 mb-3.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500 font-medium">Team Actual / Target</span>
                  <span className="font-semibold text-navy-800">
                    {formatINR(summary.totalRevenue)} / {formatINR(summary.totalTarget)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100/90 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${meta.progressBar}`}
                    style={{ width: `${Math.min(100, Math.max(0, achievementVal))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400">Achievement</span>
                  <span
                    className={`font-bold ${
                      achievementVal >= 100
                        ? "text-emerald-600"
                        : achievementVal >= 50
                        ? "text-blue-600"
                        : "text-navy-700"
                    }`}
                  >
                    {achievementVal.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100/80">
                {/* Edit Base Target */}
                <button
                  type="button"
                  onClick={() => onEditCategoryTarget(catKey)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold text-navy-800 bg-surface-light hover:bg-gray-100 border border-gray-200/80 transition-all hover:text-brand-orange"
                  title={`Edit default base targets for ${catKey}`}
                >
                  <Edit3 className="w-3 h-3 text-brand-orange" />
                  <span>Edit Target</span>
                </button>

                {/* View / Filter Counselors */}
                <button
                  type="button"
                  onClick={() => onSelectCategoryFilter(isFiltered ? "ALL" : catKey)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                    isFiltered
                      ? "bg-brand-orange text-white shadow-xs"
                      : "text-navy-700 hover:text-navy-900 bg-surface-light hover:bg-gray-100 border border-gray-200/80"
                  }`}
                  title={isFiltered ? "Show all counselors" : `Filter table by ${catKey}`}
                >
                  <Filter className="w-3 h-3" />
                  <span>{isFiltered ? "Showing" : "View"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
