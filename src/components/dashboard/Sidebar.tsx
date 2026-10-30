"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  CheckSquare,
  CalendarCheck,
  PhoneCall,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/auth/actions";
import { S3Logo } from "@/components/ui/S3Logo";

interface NavItem {
  name: string;
  label?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isImplemented: boolean;
}

const navigationItems: NavItem[] = [
  { name: "Dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, isImplemented: true },
  { name: "Counselors", label: "Counsellors", href: "/dashboard/counselors", icon: Users, isImplemented: true },
  { name: "Admissions", label: "Admissions", href: "/dashboard/admissions", icon: GraduationCap, isImplemented: true },
  { name: "Universities", label: "Universities", href: "/dashboard/universities", icon: Building2, isImplemented: true },
  { name: "Tasks & Subtasks", label: "Tasks & Subtasks", href: "/dashboard/tasks", icon: CheckSquare, isImplemented: true },
  { name: "Daily Tracker", label: "Daily Tracker", href: "/dashboard/daily-tracker", icon: CalendarCheck, isImplemented: true },
  { name: "Calling Performance", label: "Calling Performance", href: "/dashboard/calling-performance", icon: PhoneCall, isImplemented: true },
  { name: "Projections", label: "Projections", href: "/dashboard/projections", icon: TrendingUp, isImplemented: true },
  { name: "Reports", label: "Reports", href: "/dashboard/reports", icon: BarChart3, isImplemented: true },
  { name: "Settings", label: "Settings", href: "/dashboard/settings", icon: Settings, isImplemented: true },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#061B3D] border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-md">
        <S3Logo size="sm" variant="dark" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#061B3D] border-r border-[#DFEAFE]/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Branding Section */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <S3Logo size="md" variant="dark" subtitle="Team Workflow Tracker" />
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-blue-200/60">
            Workflow Modules
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/") ||
              (item.href !== "/dashboard" && !item.href.includes("#") && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-[13px] font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-[#1677FF] text-white shadow-md font-bold"
                    : "text-blue-100/80 hover:text-white hover:bg-white/10"
                )}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      isActive ? "text-white" : "text-blue-200/75 group-hover:text-white"
                    )}
                  />
                  <span className="truncate">{item.label || item.name}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white shrink-0 shadow-xs" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/10 space-y-2.5 bg-[#001A3D]/70">
          {/* Production Suite Status Card */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
                <span>Production Suite</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live & Secure
              </span>
            </div>
            <p className="text-[10px] text-blue-200/60 leading-tight">
              Single-Admin RLS Protected &bull; College Vidya
            </p>
          </div>

          {/* Admin Profile Card */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0866F5] to-[#18B9E8] flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                SB
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">Sachin Behera</p>
                <p className="text-[10px] text-blue-200/70 truncate">Team Leader (Admin)</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isPending}
              title="Sign Out"
              className="p-1.5 rounded-lg text-blue-200/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
