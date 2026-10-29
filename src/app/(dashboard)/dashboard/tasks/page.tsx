import React from "react";
import type { Metadata } from "next";
import { getTasksAction, getCounselorsAndUniversitiesAction } from "./actions";
import { TaskManager } from "@/components/tasks/TaskManager";

export const metadata: Metadata = {
  title: "Task Management | Sachin Behera Daily Workflow",
  description: "Manage tasks, subtasks, and automated 6-step email reminders.",
};

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasksResult, optionsResult] = await Promise.all([
    getTasksAction(),
    getCounselorsAndUniversitiesAction(),
  ]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <TaskManager
        initialTasks={tasksResult.tasks || []}
        initialCounselors={optionsResult.counselors || []}
        initialUniversities={optionsResult.universities || []}
      />
    </div>
  );
}
