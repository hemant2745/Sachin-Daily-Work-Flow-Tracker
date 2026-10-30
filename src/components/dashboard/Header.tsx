"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Bell,
  LogOut,
  Calendar,
  Clock,
  User,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

export function Header({
  unreadAlertsCount = 0,
}: {
  unreadAlertsCount?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("Good Day");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour < 12) {
        setGreeting("Good Morning");
      } else if (hour < 17) {
        setGreeting("Good Afternoon");
      } else {
        setGreeting("Good Evening");
      }

      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );

      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <header className="bg-white border-b border-[#DFEAFE] sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-20 py-3.5 flex items-center justify-between gap-4">
        {/* Left Section: Greeting & Subtitle */}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-[#0A2454] tracking-tight leading-tight truncate">
            {greeting}, Sachin Behera
          </h1>
          <p className="text-xs sm:text-sm text-[#61789E] font-medium hidden sm:block mt-0.5 truncate">
            Track. Manage. Achieve. <span className="text-[#DFEAFE] mx-1.5">|</span> Team Workflow Dashboard
          </p>
        </div>

        {/* Right Section: Date, Time, Badges & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Live Date & Time Display */}
          <div className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#F3F8FF] border border-[#DFEAFE] text-xs text-[#0A2454]">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#0866F5]" />
              <span>{currentDate || "Loading date..."}</span>
            </div>
            <span className="text-[#DFEAFE]">&bull;</span>
            <div className="flex items-center gap-1 text-[#61789E]">
              <Clock className="w-3 h-3 text-[#18B9E8]" />
              <span>{currentTime ? `Updated: ${currentTime}` : ""}</span>
            </div>
          </div>

          {/* Single Admin Authorization Indicator */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#00A77B] border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-[#00A77B]" />
            <span>Single Admin Active</span>
          </div>

          {/* Notification Bell */}
          <Link
            href="/dashboard/tasks"
            title={unreadAlertsCount > 0 ? `${unreadAlertsCount} pending/overdue task items` : "Task Queue Notifications"}
            className="relative p-2 rounded-xl text-[#61789E] hover:text-[#0A2454] hover:bg-[#F3F8FF] border border-transparent hover:border-[#DFEAFE] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F04460] ring-2 ring-white animate-pulse" />
            )}
          </Link>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-[#F3F8FF] border border-transparent hover:border-[#DFEAFE] transition-all focus:outline-none"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0866F5] to-[#18B9E8] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                SB
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#61789E] hidden sm:block" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DFEAFE] p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-[#DFEAFE] mb-2">
                    <p className="font-bold text-[#0A2454] text-sm">Sachin Behera</p>
                    <p className="text-[11px] text-[#61789E] truncate">sachin.behera@collegevidya.com</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#0866F5] font-semibold text-[10px] border border-blue-100">
                      Authorized Super Administrator
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#0A2454] hover:bg-[#F3F8FF] transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#0866F5]" />
                      <span>Account Settings</span>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      disabled={isPending}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#F04460] hover:bg-rose-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isPending ? "Signing out..." : "Sign Out"}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#61789E] hover:text-[#F04460] bg-[#F3F8FF] hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-[#DFEAFE] hover:border-rose-200 transition-colors disabled:opacity-50"
            title="Sign out of administrator session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isPending ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
