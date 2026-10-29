"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  TrendingUp,
  Plus,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Calendar,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import type {
  Projection,
  ProjectionFormData,
  ProjectionStatus,
  MonthlyProjectionOverview,
} from "@/types/projections";
import { ProjectionOverviewCards } from "./ProjectionOverviewCards";
import { PendingReviewsList } from "./PendingReviewsList";
import { ProjectionTable } from "./ProjectionTable";
import { CounselorProjectionSummary } from "./CounselorProjectionSummary";
import { ProjectionModal } from "./ProjectionModal";
import { DeleteProjectionModal } from "./DeleteProjectionModal";
import { ReviewConfirmModal } from "./ReviewConfirmModal";
import {
  getProjectionsAction,
  createProjectionAction,
  updateProjectionAction,
  reviewProjectionAction,
  deleteProjectionAction,
} from "@/app/(dashboard)/dashboard/projections/actions";

interface CounselorOption {
  id: string;
  full_name: string;
  employee_code: string;
}

interface UniversityOption {
  id: string;
  name: string;
}

interface ProjectionManagerProps {
  initialProjections: Projection[];
  initialOverview: MonthlyProjectionOverview | null;
  initialMonth: string;
  counselors: CounselorOption[];
  universities: UniversityOption[];
}

export function ProjectionManager({
  initialProjections,
  initialOverview,
  initialMonth,
  counselors,
  universities,
}: ProjectionManagerProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [projections, setProjections] = useState<Projection[]>(initialProjections);
  const [overview, setOverview] = useState<MonthlyProjectionOverview | null>(initialOverview);

  // Tabs
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "counselors">("all");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [counselorFilter, setCounselorFilter] = useState("ALL");
  const [universityFilter, setUniversityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjection, setEditingProjection] = useState<Projection | null>(null);
  const [deletingProjection, setDeletingProjection] = useState<Projection | null>(null);
  const [confirmReviewState, setConfirmReviewState] = useState<{
    projection: Projection;
    targetStatus: ProjectionStatus;
  } | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Re-fetch data from server
  const refreshData = async (month: string = selectedMonth) => {
    setIsRefreshing(true);
    try {
      const res = await getProjectionsAction({
        monthKey: month,
      });

      if (res.success) {
        setProjections(res.projections || []);
        setOverview(res.overview || null);
      } else {
        showToast("error", res.error || "Failed to load projections.");
      }
    } catch {
      showToast("error", "Error connecting to projections service.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    refreshData(newMonth);
  };

  // Pending projections (projections needing review in the current month)
  const pendingProjections = useMemo(() => {
    return projections.filter((p) => p.status === "pending");
  }, [projections]);

  // Filtered projections for table
  const filteredProjections = useMemo(() => {
    return projections.filter((p) => {
      if (counselorFilter !== "ALL" && p.counselor_id !== counselorFilter) return false;
      if (universityFilter !== "ALL" && p.university_id !== universityFilter) return false;
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesC = p.counselor?.full_name?.toLowerCase().includes(q) || false;
        const matchesCode = p.counselor?.employee_code?.toLowerCase().includes(q) || false;
        const matchesU = p.university?.name?.toLowerCase().includes(q) || false;
        const matchesNotes = p.notes?.toLowerCase().includes(q) || false;
        if (!matchesC && !matchesCode && !matchesU && !matchesNotes) return false;
      }

      return true;
    });
  }, [projections, counselorFilter, universityFilter, statusFilter, searchQuery]);

  // Create or Update
  const handleSaveProjection = async (formData: ProjectionFormData) => {
    if (editingProjection) {
      const res = await updateProjectionAction(editingProjection.id, formData);
      if (res.success) {
        showToast("success", "Projection updated successfully.");
        await refreshData();
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = await createProjectionAction(formData);
      if (res.success) {
        showToast("success", "Daily projection recorded successfully.");
        await refreshData();
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  // Review confirmation
  const handleConfirmReview = async (id: string, targetStatus: ProjectionStatus) => {
    const res = await reviewProjectionAction(id, targetStatus as "met" | "not_met");
    if (res.success) {
      showToast(
        "success",
        `Projection confirmed as ${targetStatus === "met" ? "Met" : "Not Met"}.`
      );
      await refreshData();
      return { success: true };
    } else {
      showToast("error", res.error || "Failed to update review status.");
      return { success: false, error: res.error };
    }
  };

  // Request review (either direct or ask for confirmation if previously reviewed)
  const handleRequestReview = (projection: Projection, targetStatus: ProjectionStatus) => {
    // If projection was already reviewed, always confirm first
    if (projection.status !== "pending") {
      setConfirmReviewState({ projection, targetStatus });
    } else {
      // Direct review for pending
      startTransition(async () => {
        await handleConfirmReview(projection.id, targetStatus);
      });
    }
  };

  // Delete
  const handleConfirmDelete = async (id: string) => {
    const res = await deleteProjectionAction(id);
    if (res.success) {
      showToast("success", "Projection deleted.");
      await refreshData();
      return { success: true };
    }
    showToast("error", res.error || "Failed to delete projection.");
    return { success: false, error: res.error };
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            <span>Revenue Projections & Next-Day Tracking</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Log morning counsellor revenue projections and perform next-day completion audits for College Vidya.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => refreshData()}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 mr-1.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProjection(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Projection
          </button>
        </div>
      </div>

      {/* Monthly Overview Cards */}
      <ProjectionOverviewCards
        overview={overview}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Section Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>All Projections</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {projections.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "pending"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Reviews</span>
          {pendingProjections.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {pendingProjections.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("counselors")}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "counselors"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Counsellor Breakdown</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "pending" ? (
        <PendingReviewsList
          pendingProjections={pendingProjections}
          onReview={handleRequestReview}
          onRefresh={() => refreshData()}
        />
      ) : activeTab === "counselors" ? (
        <CounselorProjectionSummary
          counselorStats={overview?.counselorStats || []}
          onSelectCounselor={(cId) => {
            setCounselorFilter(cId);
            setActiveTab("all");
          }}
        />
      ) : (
        /* Tab: All Projections */
        <div className="space-y-4">
          {/* Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search counsellor, university, employee code or notes..."
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Quick Filter */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Counselor Filter */}
                <select
                  value={counselorFilter}
                  onChange={(e) => setCounselorFilter(e.target.value)}
                  className="px-2.5 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-xs font-medium"
                >
                  <option value="ALL">All Counsellors</option>
                  {counselors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.employee_code})
                    </option>
                  ))}
                </select>

                {/* University Filter */}
                <select
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                  className="px-2.5 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-xs font-medium"
                >
                  <option value="ALL">All Universities</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-xs font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="met">Met</option>
                  <option value="not_met">Not Met</option>
                </select>

                {/* Clear button */}
                {(searchQuery || counselorFilter !== "ALL" || universityFilter !== "ALL" || statusFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCounselorFilter("ALL");
                      setUniversityFilter("ALL");
                      setStatusFilter("ALL");
                    }}
                    className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800 font-bold text-center border border-blue-200 rounded-xl bg-blue-50/50"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100">
              <span>
                Showing {filteredProjections.length} of {projections.length} projections
              </span>
            </div>
          </div>

          {/* Table */}
          <ProjectionTable
            projections={filteredProjections}
            onEdit={(p) => {
              setEditingProjection(p);
              setIsModalOpen(true);
            }}
            onDelete={(p) => setDeletingProjection(p)}
            onRequestStatusChange={handleRequestReview}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProjectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProjection(null);
        }}
        onSubmit={handleSaveProjection}
        projection={editingProjection}
        counselors={counselors}
        universities={universities}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProjectionModal
        isOpen={Boolean(deletingProjection)}
        onClose={() => setDeletingProjection(null)}
        projection={deletingProjection}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Review Status Change Confirmation Modal */}
      <ReviewConfirmModal
        isOpen={Boolean(confirmReviewState)}
        onClose={() => setConfirmReviewState(null)}
        projection={confirmReviewState?.projection || null}
        targetStatus={confirmReviewState?.targetStatus || "pending"}
        onConfirmReview={handleConfirmReview}
      />
    </div>
  );
}
