"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/format";
import { GraduationCap, Plus, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface AdmissionItem {
  id: string;
  studentName?: string;
  admissionDate: string;
  universityName: string;
  programName: string;
  amountCollected: number;
  paymentMode: string;
  verificationStatus: string;
  notes?: string;
}

interface CounselorAdmissionsSectionProps {
  admissions: AdmissionItem[];
  onOpenAdmissionModal: () => void;
}

export function CounselorAdmissionsSection({
  admissions,
  onOpenAdmissionModal,
}: CounselorAdmissionsSectionProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "verified" | "unverified">("ALL");

  const filtered = admissions.filter((a) => {
    if (statusFilter !== "ALL" && a.verificationStatus !== statusFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.studentName && a.studentName.toLowerCase().includes(q)) ||
      a.universityName.toLowerCase().includes(q) ||
      a.programName.toLowerCase().includes(q)
    );
  });

  return (
    <div id="admissions" className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-orange" />
            <h3 className="text-sm font-bold text-navy-800 tracking-tight">
              My Admissions History ({admissions.length})
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Admissions recorded under your counselor account & audit verification status
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-semibold text-navy-800 bg-surface-light border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Pending Audit</option>
          </select>

          {/* Add Admission Button */}
          <button
            onClick={onOpenAdmissionModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Admission</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-500">
            <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-navy-800">No Admissions Found</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Click &quot;Add Admission&quot; to submit student enrollments.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#061B3D]/95 text-white text-[10px] uppercase tracking-wider font-bold border-b border-white/10">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">University</th>
                <th className="py-2.5 px-3">Program</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-2.5 text-center">Payment Mode</th>
                <th className="py-2.5 px-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs bg-white/40">
              {filtered.map((a) => {
                const isVerified = a.verificationStatus === "verified";
                return (
                  <tr key={a.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-gray-600">
                      {a.admissionDate}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-navy-800">
                      {a.studentName || "Student"}
                    </td>
                    <td className="py-2.5 px-3 text-gray-800 font-medium">
                      {a.universityName}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      {a.programName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-navy-900">
                      {formatINR(a.amountCollected)}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-[10px] text-gray-500 capitalize">
                      {a.paymentMode.replace("_", " ")}
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isVerified
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Audit</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
