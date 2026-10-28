import React from "react";
import {
  Target,
  DollarSign,
  Percent,
  GraduationCap,
  ListTodo,
  TrendingUp,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  iconName: "target" | "revenue" | "percentage" | "admissions" | "tasks" | "projections";
  placeholderValue?: string;
  value?: string;
  isLive?: boolean;
  description: string;
  statusLabel?: string;
  phaseNote?: string;
}

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  revenue: DollarSign,
  percentage: Percent,
  admissions: GraduationCap,
  tasks: ListTodo,
  projections: TrendingUp,
};

export function MetricCard({
  title,
  iconName,
  placeholderValue = "Not configured",
  value,
  isLive = false,
  description,
  statusLabel = "Awaiting Setup",
  phaseNote = "Data will appear after setup",
}: MetricCardProps) {
  const Icon = iconMap[iconName] || Target;

  return (
    <div className="bg-white border border-surface-border rounded-xl p-5 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </span>
          <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center shrink-0 border border-navy-100">
            <Icon className="w-4 h-4 text-brand-orange" />
          </div>
        </div>

        {/* Value Display */}
        <div className="my-2">
          {isLive && value !== undefined ? (
            <div className="text-2xl font-bold text-navy-800">
              {value}
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-light border border-dashed border-gray-300 text-sm font-medium text-gray-500">
              {placeholderValue}
            </div>
          )}
        </div>

        {/* Metric Purpose / Description */}
        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer / Status Label */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-gray-500">
          <span className={cn("w-1.5 h-1.5 rounded-full", isLive ? "bg-emerald-500" : "bg-gray-400")}></span>
          <span>{statusLabel}</span>
        </span>
        <span className={cn("font-medium text-[10px] tracking-tight", isLive ? "text-emerald-700 font-semibold" : "text-brand-orange")}>
          {phaseNote}
        </span>
      </div>
    </div>
  );
}
