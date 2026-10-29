import React from "react";
import type { Metadata } from "next";
import { normalizeMonthKey } from "@/lib/format";
import {
  getProjectionsAction,
  getProjectionOptionsAction,
} from "./actions";
import { ProjectionManager } from "@/components/projections/ProjectionManager";

export const metadata: Metadata = {
  title: "Revenue Projections & Next-Day Tracking | Sachin Behera Daily Workflow",
  description: "Track morning counselor revenue projections, next-day outcomes, and monthly completion ratios.",
};

export const dynamic = "force-dynamic";

export default async function ProjectionsPage() {
  const currentMonthKey = normalizeMonthKey(new Date());

  const [projectionsRes, optionsRes] = await Promise.all([
    getProjectionsAction({ monthKey: currentMonthKey }),
    getProjectionOptionsAction(),
  ]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <ProjectionManager
        initialProjections={projectionsRes.projections || []}
        initialOverview={projectionsRes.overview || null}
        initialMonth={currentMonthKey}
        counselors={optionsRes.counselors || []}
        universities={optionsRes.universities || []}
      />
    </div>
  );
}
