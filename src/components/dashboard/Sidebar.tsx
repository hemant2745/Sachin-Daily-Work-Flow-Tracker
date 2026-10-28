"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  GraduationCap,
  Building2,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/auth/actions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isImplemented: boolean;
}

const navigationItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, isImplemented: true },
  { name: "Counselors", href: "/dashboard/counselors", icon: Users, isImplemented: true },
  { name: "Admissions", href: "/dashboard/admissions", icon: GraduationCap, isImplemented: true },
  { name: "Universities", href: "/dashboard/universities", icon: Building2, isImplemented: true },
  { name: "Tasks & Subtasks", href: "/dashboard#tasks", icon: CheckSquare, isImplemented: false },
  { name: "Daily Tracker", href: "/dashboard/daily-tracker", icon: CalendarCheck, isImplemented: true },
  { name: "Projections", href: "/dashboard#projections", icon: TrendingUp, isImplemented: false },
  { name: "Reports", href: "/dashboard#reports", icon: BarChart3, isImplemented: false },
  { name: "Settings", href: "/dashboard#settings", icon: Settings, isImplemented: false },
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
      {/* Mobile Top Bar with Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy-950 border-b border-navy-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange font-bold text-sm">
            SB
          </div>
          <span className="text-sm font-semibold text-white">Sachin Behera Daily Workflow</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-navy-900 border border-navy-800 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
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
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-950 border-r border-navy-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-navy-900 border border-brand-orange/40 flex items-center justify-center text-brand-orange font-bold text-base shadow-sm">
              SB
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                Sachin Behera
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">Daily Workflow Portal</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Badge */}
        <div className="px-4 py-2.5 bg-navy-900/60 border-b border-navy-800/80">
          <div className="flex items-center gap-2 text-[11px] text-gray-300">
            <Shield className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span className="truncate">Single Administrator &bull; Team Leader</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
            Navigation Menu
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
                  "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-navy-800 text-white border-l-4 border-brand-orange shadow-sm font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-navy-900/70"
                )}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-brand-orange" : "text-gray-300 group-hover:text-white"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {!item.isImplemented && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-normal bg-navy-900 text-gray-300 border border-navy-800 shrink-0">
                    Preview
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Phase Status Banner in Sidebar */}
        <div className="p-3 mx-3 mb-3 rounded-lg bg-navy-900/80 border border-navy-800">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange mt-0.5 shrink-0" />
            <div className="text-[11px] text-gray-300 leading-snug">
              <span className="font-semibold text-white">Phase 3:</span> Counselor Management & Monthly Target Tracking active.
            </div>
          </div>
        </div>

        {/* Administrator Profile / Sign Out */}
        <div className="p-3.5 border-t border-navy-800 bg-navy-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-xs font-semibold text-brand-orange">
                SB
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">Sachin Behera</p>
                <p className="text-[10px] text-gray-300 truncate">Team Leader (Admin)</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isPending}
              title="Sign Out"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
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
