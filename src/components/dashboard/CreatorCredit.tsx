import React from "react";
import { Sparkles } from "lucide-react";

export function CreatorCredit() {
  return (
    <footer className="w-full pt-8 pb-4 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 border-t border-surface-border/80 pt-4">
        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
          <span>Sachin Behera Daily Workflow Portal</span>
          <span>&bull;</span>
          <span>College Vidya</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-surface-border shadow-xs hover:border-blue-300 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
          <span className="text-gray-500 font-normal">Created by</span>
          <span className="font-semibold text-blue-600 tracking-tight">
            Hemant Jha
          </span>
        </div>
      </div>
    </footer>
  );
}
