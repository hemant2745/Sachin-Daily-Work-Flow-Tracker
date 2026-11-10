import React from "react";
import { Sparkles, Quote } from "lucide-react";

export function MotivationalCard() {
  return (
    <div className="relative overflow-hidden glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[320px]">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#0866F5]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#FF8A00]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Section with Quote Icon & Subtitle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#0866F5]/10 border border-[#0866F5]/20 flex items-center justify-center text-[#0866F5] shadow-2xs">
            <Quote className="w-4 h-4 rotate-180" />
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 border border-[#DFEAFE] text-[10px] font-bold text-[#0866F5] shadow-2xs backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-[#FF8A00]" />
            <span>Daily Leadership Mantra</span>
          </span>
        </div>

        {/* Motivational Text */}
        <div className="my-2">
          <h3 className="text-xl sm:text-2xl font-black text-[#0A2454] tracking-tight leading-snug">
            &ldquo;Small steps <br />
            every day lead to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0866F5] via-[#1677FF] to-[#18B9E8]">
              big results!
            </span>&rdquo;
          </h3>
        </div>

        {/* Signature */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[#FF8A00] rounded-full" />
          <p className="text-sm font-black text-[#0A2454] tracking-tight">
            — Sachin Behera
          </p>
        </div>
        <p className="text-[10px] font-semibold text-[#61789E] ml-8 mt-0.5">
          Team Leader &bull; College Vidya
        </p>
      </div>

      {/* Blue & Orange Target Illustration */}
      <div className="mt-4 pt-3 border-t border-[#DFEAFE]/70 flex items-center justify-between gap-3">
        <div className="text-[11px] text-[#61789E]">
          <p className="font-bold text-[#0A2454] text-xs">Consistency & Precision</p>
          <p className="text-[10px] mt-0.5">Execute daily targets with focus.</p>
        </div>

        {/* Enhanced SVG Bullseye Target with Arrow */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-sm select-none"
          aria-label="Target Illustration"
        >
          {/* Outer circle */}
          <circle cx="50" cy="50" r="44" stroke="#0866F5" strokeWidth="3" strokeOpacity="0.25" fill="#F3F8FF" />
          {/* Middle circle */}
          <circle cx="50" cy="50" r="30" stroke="#0866F5" strokeWidth="4" strokeOpacity="0.6" fill="#EBF3FF" />
          {/* Inner bullseye */}
          <circle cx="50" cy="50" r="15" fill="#0866F5" />
          <circle cx="50" cy="50" r="6" fill="#FF8A00" />

          {/* Dart / Arrow penetrating bullseye */}
          <path
            d="M 86 14 L 54 46"
            stroke="#FF8A00"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Dart flights */}
          <path
            d="M 86 14 L 92 8 M 86 14 L 80 8 M 86 14 L 92 20"
            stroke="#FF8A00"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
