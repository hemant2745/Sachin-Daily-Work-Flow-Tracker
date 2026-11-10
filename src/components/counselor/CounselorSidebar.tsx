"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  TrendingUp,
  LogOut,
  UserCheck,
  Award,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import type { CounselorCategory } from "@/types/counselor";

interface CounselorSidebarProps {
  counselorName: string;
  employeeCode: string;
  category: CounselorCategory;
}

export function CounselorSidebar({
  counselorName,
  employeeCode,
  category,
}: CounselorSidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOutAction();
    window.location.href = "/login?message=signed_out";
  };

  const navItems = [
    {
      label: "My Dashboard",
      href: "/counselor",
      icon: LayoutDashboard,
      isActive: pathname === "/counselor",
    },
    {
      label: "My Admissions",
      href: "#admissions",
      icon: GraduationCap,
      isActive: false,
    },
    {
      label: "Daily Projections",
      href: "#projections",
      icon: TrendingUp,
      isActive: false,
    },
  ];

  return (
    <aside className="w-60 bg-[#061B3D]/95 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between h-screen fixed left-0 top-0 z-40 text-white shadow-2xl">
      {/* Top Brand & Profile */}
      <div className="p-4 space-y-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center font-black text-white text-sm shadow-md">
            CV
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight text-white uppercase">
              College Vidya
            </h1>
            <p className="text-[10px] text-gray-400">Counselor Workspace</p>
          </div>
        </div>

        {/* Counselor Identity Card */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium">Logged In As</span>
            <span
              className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                category === "CDA"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : category === "SCDA"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              }`}
            >
              {category}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate">{counselorName}</div>
          <div className="text-[10px] font-mono text-brand-orange">{employeeCode}</div>
        </div>

        {/* Navigation Items (Strictly counselor-only; admin links omitted) */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  item.isActive
                    ? "bg-brand-orange text-white shadow-xs"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Sign Out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/40 text-xs font-bold transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
