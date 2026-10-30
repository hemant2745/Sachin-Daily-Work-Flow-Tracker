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
    subtitle: "Roster, quotas & monthly targets",
    href: "/dashboard/counselors",
    icon: Users,
    iconColor: "text-[#0866F5]",
    iconBg: "bg-[#0866F5]/10",
  },
  {
    title: "Manage Admissions",
    subtitle: "Student registry & fee collections",
    href: "/dashboard/admissions",
    icon: GraduationCap,
    iconColor: "text-[#00A77B]",
    iconBg: "bg-[#00A77B]/10",
  },
  {
    title: "Check Projections",
    subtitle: "Revenue forecasts & evaluations",
    href: "/dashboard/projections",
    icon: TrendingUp,
    iconColor: "text-[#FF8A00]",
    iconBg: "bg-[#FF8A00]/10",
  },
  {
    title: "Open Reports",
    subtitle: "Full analytics, CSV & Excel export",
    href: "/dashboard/reports",
    icon: BarChart3,
    iconColor: "text-[#18B9E8]",
    iconBg: "bg-[#18B9E8]/10",
  },
  {
    title: "Settings",
    subtitle: "System preferences & target defaults",
    href: "/dashboard/settings",
    icon: Settings,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
  },
];

export function QuickActionsCard() {
  return (
    <div className="bg-white border border-[#DFEAFE] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[380px]">
      <div>
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-[#DFEAFE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FF8A00]/10 flex items-center justify-center text-[#FF8A00] shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-[#0A2454]">Quick Actions</h4>
              <p className="text-xs text-[#61789E]">Direct access to primary modules</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#0866F5] border border-blue-100">
            5 Shortcuts
          </span>
        </div>

        <div className="space-y-2 mt-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.title}
                href={act.href}
                className="group flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-[#DFEAFE] hover:bg-[#F3F8FF] transition-all duration-150"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl ${act.iconBg} ${act.iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-xs`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0A2454] group-hover:text-[#0866F5] transition-colors truncate">
                      {act.title}
                    </p>
                    <p className="text-xs text-[#61789E] truncate">
                      {act.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-[#61789E] group-hover:text-[#0866F5] group-hover:translate-x-1.5 transition-all pl-2 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#DFEAFE] text-center">
        <span className="text-xs font-bold text-[#0866F5]">
          Single-Administrator Navigation Hub
        </span>
      </div>
    </div>
  );
}
