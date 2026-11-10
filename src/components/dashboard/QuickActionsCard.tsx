import React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Settings,
  ArrowRight,
  Zap,
} from "lucide-react";

interface ActionItem {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

const actions: ActionItem[] = [
  {
    title: "View All Counsellors",
    subtitle: "Roster, quotas & targets",
    href: "/dashboard/counselors",
    icon: Users,
    iconColor: "text-[#0866F5]",
    iconBg: "bg-[#0866F5]/10 border border-[#0866F5]/20",
  },
  {
    title: "Manage Admissions",
    subtitle: "Registry & fee collections",
    href: "/dashboard/admissions",
    icon: GraduationCap,
    iconColor: "text-[#00A77B]",
    iconBg: "bg-[#00A77B]/10 border border-[#00A77B]/20",
  },
  {
    title: "Check Projections",
    subtitle: "Daily targets & completion",
    href: "/dashboard/projections",
    icon: TrendingUp,
    iconColor: "text-[#FF8A00]",
    iconBg: "bg-[#FF8A00]/10 border border-[#FF8A00]/20",
  },
  {
    title: "Open Reports",
    subtitle: "Analytics, CSV & Excel",
    href: "/dashboard/reports",
    icon: BarChart3,
    iconColor: "text-[#18B9E8]",
    iconBg: "bg-[#18B9E8]/10 border border-[#18B9E8]/20",
  },
  {
    title: "Settings",
    subtitle: "Preferences & target defaults",
    href: "/dashboard/settings",
    icon: Settings,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-500/10 border border-purple-500/20",
  },
];

export function QuickActionsCard() {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[320px]">
      <div>
        <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-[#DFEAFE]/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF8A00]/10 border border-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00] shadow-2xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#0A2454]">Quick Actions</h4>
              <p className="text-[11px] text-[#61789E]">Direct access to primary modules</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50/90 text-[#0866F5] border border-blue-200">
            5 Shortcuts
          </span>
        </div>

        <div className="space-y-1.5 mt-1.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.title}
                href={act.href}
                className="group flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-[#DFEAFE] hover:bg-white/80 transition-all duration-150 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg ${act.iconBg} ${act.iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0A2454] group-hover:text-[#0866F5] transition-colors truncate">
                      {act.title}
                    </p>
                    <p className="text-[10px] text-[#61789E] truncate">
                      {act.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-[#61789E] group-hover:text-[#0866F5] group-hover:translate-x-1 transition-all pl-2 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#DFEAFE]/70 text-center">
        <span className="text-[11px] font-bold text-[#0866F5]">
          Single-Administrator Navigation Hub
        </span>
      </div>
    </div>
  );
}
