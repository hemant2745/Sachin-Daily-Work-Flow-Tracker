"use client";

import React from "react";
import {
  Calendar,
  User,
  Building2,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import type { Projection, ProjectionStatus } from "@/types/projections";
import { formatINR } from "@/lib/format";

interface ProjectionTableProps {
  projections: Projection[];
  onEdit: (projection: Projection) => void;
  onDelete: (projection: Projection) => void;
  onRequestStatusChange: (projection: Projection, targetStatus: ProjectionStatus) => void;
}

export function ProjectionTable({
  projections,
  onEdit,
  onDelete,
  onRequestStatusChange,
}: ProjectionTableProps) {
  if (projections.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">No projections match your criteria</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          Try clearing your filters or add a new daily revenue projection above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
            <tr>
              <th scope="col" className="px-4 py-3.5 text-left">Date</th>
              <th scope="col" className="px-4 py-3.5 text-left">Counsellor</th>
              <th scope="col" className="px-4 py-3.5 text-left">University</th>
              <th scope="col" className="px-4 py-3.5 text-right">Projected Revenue</th>
              <th scope="col" className="px-4 py-3.5 text-center">Status</th>
              <th scope="col" className="px-4 py-3.5 text-left">Review Info</th>
              <th scope="col" className="px-4 py-3.5 text-left">Notes</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {projections.map((p) => {
              const isMet = p.status === "met";
              const isNotMet = p.status === "not_met";
              const isPending = p.status === "pending";

              return (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                  {/* Projection Date */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-900">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{p.projection_date}</span>
                    </div>
                  </td>

                  {/* Counsellor */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{p.counselor?.full_name || "Unknown"}</span>
                    </div>
                    {p.counselor?.employee_code && (
                      <div className="text-[11px] text-gray-400 ml-5">
                        {p.counselor.employee_code}
                      </div>
                    )}
                  </td>

                  {/* University */}
                  <td className="px-4 py-3.5 text-xs text-gray-700">
                    <div className="flex items-center space-x-1.5 max-w-[200px] truncate" title={p.university?.name}>
                      <Building2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{p.university?.name || "University"}</span>
                    </div>
                  </td>

                  {/* Projected Revenue */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-bold text-gray-900">
                    {formatINR(p.projected_revenue)}
                  </td>

                  {/* Completion Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isMet
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : isNotMet
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isMet ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Met</span>
                        </>
                      ) : isNotMet ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Not Met</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Reviewed Date / Timestamp */}
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {p.reviewed_at ? (
                      <div>
                        <div className="font-medium text-gray-800">
                          {new Date(p.reviewed_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        {p.reviewed_by && (
                          <div className="text-[10px] text-gray-400 truncate max-w-[120px]" title={p.reviewed_by}>
                            by {p.reviewed_by}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Not reviewed yet</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[180px] truncate" title={p.notes || ""}>
                    {p.notes || <span className="text-gray-300">-</span>}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-medium space-x-1">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onRequestStatusChange(p, "met")}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold"
                          title="Mark Met"
                        >
                          Met
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestStatusChange(p, "not_met")}
                          className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold"
                          title="Mark Not Met"
                        >
                          Not Met
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRequestStatusChange(p, isMet ? "not_met" : "met")}
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title={isMet ? "Change to Not Met" : "Change to Met"}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      title="Edit projection"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete projection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
