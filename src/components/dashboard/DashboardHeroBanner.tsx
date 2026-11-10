import React from "react";
import { S3LogoIcon } from "@/components/ui/S3Logo";
import { TrendingUp, Sparkles } from "lucide-react";

export function DashboardHeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001A3D]/95 via-[#061B3D]/90 to-[#0866F5]/85 backdrop-blur-xl border border-white/20 shadow-xl p-4 sm:p-5 lg:p-6 text-white">
      {/* Decorative background glow and geometric lines */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#18B9E8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#0866F5]/25 rounded-full blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
        {/* Left Column: S3 Branding */}
        <div className="md:col-span-5 flex items-center space-x-3.5">
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center p-2 shrink-0 hover:scale-105 transition-transform duration-200">
            <S3LogoIcon size={46} />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-cyan-200 border border-white/20 mb-1">
              <Sparkles className="w-3 h-3 text-[#FF8A00]" />
              <span>College Vidya Leadership</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight truncate">
              Sachin Behera
            </h2>
            <p className="text-xs font-semibold text-blue-100/90 tracking-wide mt-0.5">
              Team Workflow Tracker
            </p>
          </div>
        </div>

        {/* Middle Column: Core Mission Mantra */}
        <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-white/15 pt-3 md:pt-0 md:pl-5 text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#18B9E8]">
            Core Performance Mantra
          </span>
          <p className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight mt-0.5 leading-snug drop-shadow-xs">
            &ldquo;Better Tracking{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFA41C] via-[#FF8A00] to-[#FF4D00]">
              Brings Bigger Success
            </span>&rdquo;
          </p>
        </div>

        {/* Right Column: Upward Performance Taglines */}
        <div className="md:col-span-3 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2.5">
          {/* Stylized compact neon graph preview */}
          <div className="flex items-end gap-1.5 h-10 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
            <div className="w-2 bg-blue-300/40 rounded-t-xs h-3" />
            <div className="w-2 bg-blue-300/60 rounded-t-xs h-5" />
            <div className="w-2 bg-[#18B9E8]/90 rounded-t-xs h-7 shadow-xs" />
            <div className="w-2 bg-[#1677FF] rounded-t-xs h-8 shadow-xs" />
            <div className="w-2.5 bg-gradient-to-t from-[#FF8A00] to-[#FFA41C] rounded-t-xs h-9 relative shadow-sm">
              <span className="absolute -top-3 -right-2 text-[#FF8A00]">
                <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              </span>
            </div>
          </div>

          {/* Tagline Glassmorphism Pills */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[10px] font-bold text-white shadow-2xs hover:bg-white/25 transition-colors">
              Focus
            </span>
            <span className="text-blue-200/50 text-[10px]">&bull;</span>
            <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[10px] font-bold text-white shadow-2xs hover:bg-white/25 transition-colors">
              Support
            </span>
            <span className="text-blue-200/50 text-[10px]">&bull;</span>
            <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[10px] font-bold text-white shadow-2xs hover:bg-white/25 transition-colors">
              Growth
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
