import React from "react";
import type { Metadata } from "next";
import { UniversityMasterList } from "@/components/universities/UniversityMasterList";

export const metadata: Metadata = {
  title: "University Master List | Sachin Behera Daily Workflow",
  description: "Official canonical master list of approved partner universities for admissions.",
};

export default function UniversitiesPage() {
  return <UniversityMasterList />;
}
