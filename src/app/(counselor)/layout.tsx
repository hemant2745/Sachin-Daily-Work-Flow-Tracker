import React from "react";
import { redirect } from "next/navigation";
import { CounselorSidebar } from "@/components/counselor/CounselorSidebar";
import { getAuthenticatedCounselor } from "./counselor/actions";

export const dynamic = "force-dynamic";

export default async function CounselorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedCounselor();

  if (!auth.isAuthorized || !auth.counselor) {
    redirect("/login?error=unauthorized");
  }

  const counselor = auth.counselor;

  return (
    <div className="min-h-screen bg-surface-canvas text-navy-800 flex">
      {/* Counselor Sidebar */}
      <div className="hidden lg:block">
        <CounselorSidebar
          counselorName={counselor.full_name}
          employeeCode={counselor.employee_code}
          category={counselor.category}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto space-y-5">
          {children}
        </main>
      </div>
    </div>
  );
}
