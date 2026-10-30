"use client";

import React, { useState, useMemo } from "react";
import { Search, ArrowUpDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { CounselorReportItem } from "@/types/reports";

interface CounselorPerformanceTableProps {
  counselors: CounselorReportItem[];
}

type SortField = "name" | "revenue" | "achievement" | "admissions" | "accuracy";
type SortOrder = "asc" | "desc";

export function CounselorPerformanceTable({ counselors }: CounselorPerformanceTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = counselors.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.employee_code.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "revenue":
          valA = a.actualCollections;
          valB = b.actualCollections;
          break;
        case "achievement":
          valA = a.collectionAchievementPercentage ?? -1;
          valB = b.collectionAchievementPercentage ?? -1;
          break;
        case "admissions":
          valA = a.actualAdmissions;
          valB = b.actualAdmissions;
          break;
        case "accuracy":
          valA = a.revenueWeightedPercentage ?? -1;
          valB = b.revenueWeightedPercentage ?? -1;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    return result;
  }, [counselors, search, sortField, sortOrder]);

  const renderBadge = (pct: number | null) => {
    if (pct === null) {
      return <span className="text-gray-500 text-xs">N/A</span>;
    }
    if (pct >= 100) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
          {pct}%
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800">
          {pct}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800">
        {pct}%
      </span>
    );
  };

  return (
    <div className="bg-navy-900/90 border border-navy-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-950/40">
        <div>
          <h3 className="text-sm font-semibold text-white">Counsellor Performance Matrix</h3>
          <p className="text-xs text-gray-400">
            Real collections, admissions, and projection completion per team member.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search counsellor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-navy-950/80 text-gray-400 border-b border-navy-800 font-medium">
            <tr>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 cursor-pointer hover:text-white select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Counsellor</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("revenue")}
                className="py-3 px-4 cursor-pointer hover:text-white select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Collections (Target)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("achievement")}
                className="py-3 px-4 cursor-pointer hover:text-white select-none text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Rev %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("admissions")}
                className="py-3 px-4 cursor-pointer hover:text-white select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Admissions (Target)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Adm %</th>
              <th className="py-3 px-4 text-center">Forecast Count</th>
              <th
                onClick={() => handleSort("accuracy")}
                className="py-3 px-4 cursor-pointer hover:text-white select-none text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Rev-Weighted %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 text-gray-300">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No counsellor data found matching query.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((c) => (
                <tr key={c.id} className="hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-[11px] text-gray-400">{c.employee_code}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-semibold text-white">{formatINR(c.actualCollections)}</div>
                    <div className="text-[11px] text-gray-400">
                      Target: {formatINR(c.collectionTarget)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderBadge(c.collectionAchievementPercentage)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-semibold text-white">{c.actualAdmissions}</div>
                    <div className="text-[11px] text-gray-400">Target: {c.admissionTarget}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderBadge(c.admissionAchievementPercentage)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <span className="text-emerald-400 font-semibold" title="Met">
                        {c.projectionsMet}
                      </span>
                      <span className="text-gray-500">/</span>
                      <span className="text-rose-400" title="Not Met">
                        {c.projectionsNotMet}
                      </span>
                      <span className="text-gray-500">/</span>
                      <span className="text-amber-400" title="Pending">
                        {c.projectionsPending}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {c.projectionCompletionPercentage !== null
                        ? `${c.projectionCompletionPercentage}% met`
                        : "No reviews"}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {c.revenueWeightedPercentage !== null ? (
                      <span className="font-semibold text-teal-400">
                        {c.revenueWeightedPercentage}%
                      </span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
