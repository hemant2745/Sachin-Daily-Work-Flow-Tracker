import React from "react";
import {
  Target,
  Percent,
  GraduationCap,
  ListTodo,
  PhoneCall,
  LucideIcon,
  IndianRupee,
  TrendingUp,
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
    iconBg: "bg-[#0866F5]/10 text-[#0866F5] border border-[#0866F5]/20",
    borderHover: "hover:border-[#0866F5]/50",
    badge: "bg-blue-50/90 text-[#0866F5] border-blue-200",
    progress: "bg-[#0866F5]",
  },
  green: {
    iconBg: "bg-[#00A77B]/10 text-[#00A77B] border border-[#00A77B]/20",
    borderHover: "hover:border-[#00A77B]/50",
    badge: "bg-emerald-50/90 text-[#00A77B] border-emerald-200",
    progress: "bg-[#00A77B]",
  },
  orange: {
    iconBg: "bg-[#FF8A00]/10 text-[#FF8A00] border border-[#FF8A00]/20",
    borderHover: "hover:border-[#FF8A00]/50",
    badge: "bg-amber-50/90 text-[#FF8A00] border-amber-200",
    progress: "bg-[#FF8A00]",
  },
  cyan: {
    iconBg: "bg-[#18B9E8]/10 text-[#18B9E8] border border-[#18B9E8]/20",
    borderHover: "hover:border-[#18B9E8]/50",
    badge: "bg-cyan-50/90 text-[#18B9E8] border-cyan-200",
    progress: "bg-[#18B9E8]",
  },
  purple: {
    iconBg: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
    borderHover: "hover:border-purple-300",
    badge: "bg-purple-50/90 text-purple-700 border-purple-200",
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
        "glass-card glass-card-hover rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between group min-h-[145px] sm:min-h-[155px]",
        style.borderHover
      )}
    >
      <div>
        {/* Top Header: Title and Circular Colored Icon */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-[#61789E] uppercase tracking-wider truncate">
            {title}
          </span>
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs",
              style.iconBg
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Large Metric Value */}
        <div className="my-1">
          {isLive && value !== undefined ? (
            <div className="text-2xl sm:text-[26px] font-black text-[#0A2454] tracking-tight leading-tight">
              {value}
            </div>
          ) : (
            <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/60 border border-dashed border-[#DFEAFE] text-xs font-semibold text-[#61789E]">
              {placeholderValue}
            </div>
          )}
        </div>

        {/* Optional Progress Bar (for achievement percentage) */}
        {percentageProgress !== undefined && percentageProgress !== null && (
          <div className="w-full bg-[#DFEAFE]/80 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={cn("h-full rounded-full transition-all duration-500", style.progress)}
              style={{ width: `${Math.min(100, Math.max(0, percentageProgress))}%` }}
            />
          </div>
        )}

        {/* Short Description */}
        <p className="text-[11px] text-[#61789E] mt-2 line-clamp-1 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Bottom Status Row */}
      <div className="mt-3 pt-2.5 border-t border-[#DFEAFE]/60 flex items-center justify-between text-[10px] gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border",
            isLive ? style.badge : "bg-gray-50/80 text-gray-500 border-gray-200"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isLive ? "bg-current animate-pulse" : "bg-gray-400"
            )}
          />
          <span className="truncate">{statusLabel}</span>
        </span>

        <span className="font-medium text-[#61789E] truncate">
          {phaseNote}
        </span>
      </div>
    </div>
  );
}
