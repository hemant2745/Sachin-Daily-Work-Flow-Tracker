import React from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { evaluateSessionAccess } from "@/lib/auth/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: Server-side authorization check on dashboard layout
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    try {
      const { data } = await supabase.auth.getUser();
      const evaluation = evaluateSessionAccess(data.user);

      if (evaluation.status === "UNAUTHENTICATED") {
        redirect("/login?error=unauthenticated");
      }

      if (evaluation.status === "UNAUTHORIZED_USER") {
        redirect("/login?error=unauthorized");
      }
    } catch {
      redirect("/login?error=unauthenticated");
    }
  }

  return (
    <div className="min-h-screen bg-surface-light flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
