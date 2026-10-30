"use client";

import React, { useState, useMemo } from "react";
import { Building2, Search, ArrowUpDown } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { UniversityReportItem } from "@/types/reports";

interface UniversityBreakdownTableProps {
  universities: UniversityReportItem[];
}

export function UniversityBreakdownTable({ universities }: UniversityBreakdownTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "admissions" | "revenue">("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = universities.filter((u) =>
      u.universityName.toLowerCase().includes(search.toLowerCase())
    );

    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === "name") {
        valA = a.universityName.toLowerCase();
        valB = b.universityName.toLowerCase();
      } else if (sortField === "admissions") {
        valA = a.admissionsCount;
        valB = b.admissionsCount;
      } else {
        valA = a.revenueCollected;
        valB = b.revenueCollected;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    return list;
  }, [universities, search, sortField, sortOrder]);

  const toggleSort = (field: "name" | "admissions" | "revenue") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="bg-navy-900/90 border border-navy-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-950/40">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-brand-orange" />
          <div>
            <h3 className="text-sm font-semibold text-white">University Distribution</h3>
            <p className="text-xs text-gray-400">
              Admission volume and fee revenue across approved academic partners.
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-navy-950/80 text-gray-400 border-b border-navy-800 font-medium">
            <tr>
              <th
                onClick={() => toggleSort("name")}
                className="py-3 px-4 cursor-pointer hover:text-white select-none"
              >
                <div className="flex items-center gap-1">
                  <span>University Partner</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("admissions")}
                className="py-3 px-4 cursor-pointer hover:text-white select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Admissions (% Total)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("revenue")}
                className="py-3 px-4 cursor-pointer hover:text-white select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Revenue (% Share)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Avg Ticket Size</th>
              <th className="py-3 px-4 text-left w-36">Revenue Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 text-gray-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No admissions recorded for the selected period.
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => (
                <tr key={i} className="hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-white">{u.universityName}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-white">{u.admissionsCount}</span>
                    <span className="text-[11px] text-gray-400 ml-1.5">
                      ({u.percentageOfTotalAdmissions}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-emerald-400">
                      {formatINR(u.revenueCollected)}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-1.5">
                      ({u.percentageOfTotalRevenue}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-200">
                    {formatINR(u.averagePerAdmission)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-navy-950 rounded-full h-2 overflow-hidden border border-navy-800">
                      <div
                        className="bg-brand-orange h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, u.percentageOfTotalRevenue)}%` }}
                      />
                    </div>
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
