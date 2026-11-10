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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#061B3D]/95 backdrop-blur-md border-b border-white/10 px-3.5 py-2.5 flex items-center justify-between shadow-md">
        <S3Logo size="sm" variant="dark" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg bg-white/10 border border-white/15 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Compact Glassmorphism Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-60 glass-sidebar flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Header & Logo */}
        <div>
          <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between">
            <S3Logo size="sm" variant="dark" subtitle="Team Workflow Tracker" />
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Navigation List */}
          <nav className="px-2.5 py-2.5 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="px-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-200/50">
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
                    "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 group",
                    isActive
                      ? "bg-gradient-to-r from-[#0866F5] to-[#1677FF] text-white shadow-[0_2px_12px_rgba(8,102,245,0.4)]"
                      : "text-blue-100/75 hover:text-white hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-blue-200/70 group-hover:text-white"
                      )}
                    />
                    <span className="truncate">{item.label || item.name}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-xs" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Section */}
        <div className="p-2.5 border-t border-white/10 bg-[#001A3D]/70 space-y-2">
          {/* User Profile Card */}
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between backdrop-blur-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0866F5] to-[#18B9E8] flex items-center justify-center text-[10px] font-bold text-white shadow-xs shrink-0">
                SB
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-white truncate leading-tight">Sachin Behera</p>
                <p className="text-[9px] text-blue-200/60 truncate leading-none mt-0.5">Team Leader (Admin)</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isPending}
              title="Sign Out"
              className="p-1 rounded-md text-blue-200/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
