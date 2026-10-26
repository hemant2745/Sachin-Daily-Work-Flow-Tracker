"use client";

import React from "react";
import Link from "next/link";
import { Shield, Sparkles, LogOut, ExternalLink } from "lucide-react";

export function Header() {
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
          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Phase 1 Visual Preview</span>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* Quick link back to Login UI Preview */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-800 hover:text-brand-orange bg-surface-light hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
          >
            <span>View Login Page</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}
