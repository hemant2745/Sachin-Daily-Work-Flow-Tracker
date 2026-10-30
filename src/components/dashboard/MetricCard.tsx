import React from "react";
import {
  Target,
  TrendingUp,
  Percent,
  GraduationCap,
  ListTodo,
  PhoneCall,
  LucideIcon,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  iconName: "target" | "revenue" | "percentage" | "admissions" | "tasks" | "projections" | "calling";
  placeholderValue?: string;
  value?: string;
  isLive?: boolean;
  description: string;
  statusLabel?: string;
  phaseNote?: string;
  percentageProgress?: number | null;
  accentColor?: "blue" | "green" | "orange" | "cyan" | "purple";
}

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  revenue: IndianRupee,
  percentage: Percent,
  admissions: GraduationCap,
  tasks: ListTodo,
  projections: TrendingUp,
  calling: PhoneCall,
};

const colorStyles = {
  blue: {
    iconBg: "bg-[#0866F5]/10 text-[#0866F5]",
    borderHover: "hover:border-[#0866F5]/50",
    badge: "bg-blue-50 text-[#0866F5] border-blue-200",
    progress: "bg-[#0866F5]",
  },
  green: {
    iconBg: "bg-[#00A77B]/10 text-[#00A77B]",
    borderHover: "hover:border-[#00A77B]/50",
    badge: "bg-emerald-50 text-[#00A77B] border-emerald-200",
    progress: "bg-[#00A77B]",
  },
  orange: {
    iconBg: "bg-[#FF8A00]/10 text-[#FF8A00]",
    borderHover: "hover:border-[#FF8A00]/50",
    badge: "bg-amber-50 text-[#FF8A00] border-amber-200",
    progress: "bg-[#FF8A00]",
  },
  cyan: {
    iconBg: "bg-[#18B9E8]/10 text-[#18B9E8]",
    borderHover: "hover:border-[#18B9E8]/50",
    badge: "bg-cyan-50 text-[#18B9E8] border-cyan-200",
    progress: "bg-[#18B9E8]",
  },
  purple: {
    iconBg: "bg-purple-50 text-purple-600",
    borderHover: "hover:border-purple-300",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    progress: "bg-purple-600",
  },
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
  percentageProgress,
  accentColor = "blue",
}: MetricCardProps) {
  const Icon = iconMap[iconName] || Target;
  const style = colorStyles[accentColor] || colorStyles.blue;

  return (
    <div
      className={cn(
        "bg-white border border-[#DFEAFE] rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group min-h-[220px]",
        style.borderHover
      )}
    >
      <div>
        {/* Top Header: Title and Circular Colored Icon */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <span className="text-xs sm:text-[13px] font-bold text-[#61789E] uppercase tracking-wider">
            {title}
          </span>
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-xs",
              style.iconBg
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>

        {/* Large Metric Value */}
        <div className="my-1.5">
          {isLive && value !== undefined ? (
            <div className="text-3xl sm:text-4xl lg:text-[38px] font-black text-[#0A2454] tracking-tight leading-none">
              {value}
            </div>
          ) : (
            <div className="inline-flex items-center px-3.5 py-2 rounded-xl bg-[#F3F8FF] border border-dashed border-[#DFEAFE] text-sm font-semibold text-[#61789E]">
              {placeholderValue}
            </div>
          )}
        </div>

        {/* Optional Progress Bar (for achievement percentage) */}
        {percentageProgress !== undefined && percentageProgress !== null && (
          <div className="w-full bg-[#DFEAFE]/70 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className={cn("h-full rounded-full transition-all duration-500", style.progress)}
              style={{ width: `${Math.min(100, Math.max(0, percentageProgress))}%` }}
            />
          </div>
        )}

        {/* Short Description */}
        <p className="text-xs sm:text-[13px] text-[#61789E] mt-3 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Bottom Status Row */}
      <div className="mt-5 pt-3.5 border-t border-[#DFEAFE]/70 flex items-center justify-between text-xs gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
            isLive ? style.badge : "bg-gray-50 text-gray-500 border-gray-200"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-current animate-pulse" : "bg-gray-400"
            )}
          />
          <span className="truncate">{statusLabel}</span>
        </span>

        <span className="font-semibold text-xs text-[#61789E] truncate">
          {phaseNote}
        </span>
      </div>
    </div>
  );
}
