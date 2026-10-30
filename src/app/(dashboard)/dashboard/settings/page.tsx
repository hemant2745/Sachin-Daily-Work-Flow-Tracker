import React from "react";
import type { Metadata } from "next";
import { getAppSettingsAction, getUniversitiesListAction } from "./actions";
import { SettingsDashboard } from "@/components/settings/SettingsDashboard";

export const metadata: Metadata = {
  title: "System Settings | Sachin Behera Daily Workflow",
  description:
    "System administration, target defaults, notification settings, and partner directory.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settingsResponse, universitiesResponse] = await Promise.all([
    getAppSettingsAction(),
    getUniversitiesListAction(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <SettingsDashboard
        initialSettings={settingsResponse.settings}
        systemInfo={settingsResponse.systemInfo}
        universities={universitiesResponse.universities}
      />
    </div>
  );
}
