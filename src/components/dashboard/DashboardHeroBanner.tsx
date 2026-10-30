import React from "react";
import { S3LogoIcon } from "@/components/ui/S3Logo";
import { TrendingUp, Sparkles, Target, Zap } from "lucide-react";

export function DashboardHeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#001A3D] via-[#061B3D] to-[#0866F5] border border-white/15 shadow-2xl p-7 sm:p-9 lg:p-10 text-white">
      {/* Decorative background glow and geometric lines */}
      <div className="absolute -top-32 -right-32 w-[420px] h-[420px] bg-[#18B9E8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[380px] h-[380px] bg-[#0866F5]/30 rounded-full blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25px 25px, white 2.5%, transparent 0%), radial-gradient(circle at 75px 75px, white 2.5%, transparent 0%)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: S3 Branding */}
        <div className="lg:col-span-5 flex items-center space-x-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center p-3 shrink-0 hover:scale-105 transition-transform duration-200">
            <S3LogoIcon size={68} />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-cyan-200 border border-white/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>College Vidya Leadership</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight truncate">
              Sachin Behera
            </h2>
            <p className="text-sm sm:text-base font-semibold text-blue-100/90 tracking-wide mt-0.5">
              Team Workflow Tracker
            </p>
          </div>
        </div>

        {/* Middle Column: Core Mission Mantra */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/15 pt-5 lg:pt-0 lg:pl-8 text-center lg:text-left">
          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#18B9E8]">
            Core Performance Mantra
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5 leading-tight drop-shadow-sm">
            &ldquo;Better Tracking <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFA41C] via-[#FF8A00] to-[#FF4D00]">
              Brings Bigger Success
            </span>&rdquo;
          </p>
        </div>

        {/* Right Column: Upward Performance Chart Illustration & Taglines */}
        <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center gap-4">
          {/* Stylized Upward Performance Multi-Bar Neon Illustration */}
          <div className="flex items-end gap-2 h-20 px-5 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
            <div className="w-3 bg-blue-300/40 rounded-t-sm h-6" />
            <div className="w-3 bg-blue-300/60 rounded-t-sm h-9" />
            <div className="w-3 bg-[#18B9E8]/90 rounded-t-sm h-12 shadow-sm" />
            <div className="w-3 bg-[#1677FF] rounded-t-sm h-15 shadow-sm" />
            <div className="w-3.5 bg-gradient-to-t from-[#FF8A00] to-[#FFA41C] rounded-t-sm h-18 relative shadow-md">
              <span className="absolute -top-3.5 -right-2.5 text-[#FF8A00] drop-shadow-md">
                <TrendingUp className="w-5 h-5 animate-pulse" />
              </span>
            </div>
          </div>

          {/* Tagline Glassmorphism Pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-end">
            <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-sm hover:bg-white/25 transition-colors">
              Focus
            </span>
            <span className="text-blue-200/50">&bull;</span>
            <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-sm hover:bg-white/25 transition-colors">
              Support
            </span>
            <span className="text-blue-200/50">&bull;</span>
            <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-sm hover:bg-white/25 transition-colors">
              Growth
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
