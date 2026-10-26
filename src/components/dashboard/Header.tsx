"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { Shield, Sparkles, LogOut, Lock } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

export function Header() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <header className="bg-white border-b border-surface-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Page / Section Indicator */}
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-navy-800 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Single-Administrator Management Console &bull; Sachin Behera (Team Leader)
            </p>
          </div>
        </div>

        {/* Status and Action Buttons */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single Admin Authorization Active</span>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-red-600 bg-surface-light hover:bg-red-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition-colors disabled:opacity-50"
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
