"use client";

import React, { useState, useMemo } from "react";
import { Building2, Search, CheckCircle2, ShieldCheck, GraduationCap } from "lucide-react";
import { UNIVERSITY_MASTER_LIST } from "@/lib/constants/universities";

export function UniversityMasterList() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUniversities = useMemo(() => {
    if (!searchTerm.trim()) {
      return UNIVERSITY_MASTER_LIST;
    }
    const term = searchTerm.toLowerCase().trim();
    return UNIVERSITY_MASTER_LIST.filter(
      (uni) =>
        uni.name.toLowerCase().includes(term) ||
        uni.id.toString().includes(term)
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-surface-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-navy-950 border border-brand-orange/40 flex items-center justify-center text-brand-orange shrink-0 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-navy-950">University Master List</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {UNIVERSITY_MASTER_LIST.length} Universities
                </span>
              </div>
              <p className="text-xs text-navy-600 mt-1">
                Official canonical directory of approved partner universities used for admission tracking and attribution.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search university name or #..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface-light border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        {/* Verification Note */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-navy-600">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Single source of truth for admissions enrollment forms. No external links or promotional bias.</span>
          </div>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            Preserving exact official numbering (1 to 23)
          </span>
        </div>
      </div>

      {/* University Directory Table */}
      <div className="bg-white border border-surface-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900">
            Partner Roster ({filteredUniversities.length} {filteredUniversities.length === 1 ? "University" : "Universities"})
          </h2>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs text-brand-orange hover:underline font-medium"
            >
              Clear search filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-light text-[11px] font-bold text-navy-700 uppercase tracking-wider border-b border-gray-200">
                <th className="py-3.5 px-6 w-20 text-center">#</th>
                <th className="py-3.5 px-6">University Name</th>
                <th className="py-3.5 px-6 text-center w-36">Catalog Status</th>
                <th className="py-3.5 px-6 text-right w-44">Modal Integration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredUniversities.map((uni) => (
                <tr key={uni.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 text-center font-mono font-semibold text-navy-600">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-navy-900 text-xs">
                      {uni.id}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-navy-950 text-sm">{uni.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Approved</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right text-gray-500 font-mono text-[11px]">
                    Option #{uni.id}
                  </td>
                </tr>
              ))}

              {filteredUniversities.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium text-navy-800">No universities match your search</p>
                    <p className="text-[11px] text-gray-400 mt-1">Try searching by partial university name or order number.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
