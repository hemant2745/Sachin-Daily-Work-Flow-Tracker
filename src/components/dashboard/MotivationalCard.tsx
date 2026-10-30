import React from "react";
import { Sparkles, Quote } from "lucide-react";

export function MotivationalCard() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#DFEAFE]/90 via-[#F3F8FF] to-white border border-[#DFEAFE] rounded-3xl p-7 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[380px]">
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0866F5]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#FF8A00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Section with Quote Icon & Subtitle */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#0866F5]/10 flex items-center justify-center text-[#0866F5] shadow-xs">
            <Quote className="w-6 h-6 rotate-180" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#DFEAFE] text-xs font-bold text-[#0866F5] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>Daily Leadership Mantra</span>
          </span>
        </div>

        {/* Motivational Text */}
        <div className="my-3">
          <h3 className="text-2xl sm:text-3xl font-black text-[#0A2454] tracking-tight leading-snug">
            &ldquo;Small steps <br />
            every day lead to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0866F5] via-[#1677FF] to-[#18B9E8]">
              big results!
            </span>&rdquo;
          </h3>
        </div>

        {/* Signature */}
        <div className="mt-5 flex items-center gap-2.5">
          <div className="w-8 h-1 bg-[#FF8A00] rounded-full" />
          <p className="text-base font-black text-[#0A2454] tracking-tight">
            — Sachin Behera
          </p>
        </div>
        <p className="text-xs font-semibold text-[#61789E] ml-10 mt-0.5">
          Team Leader &bull; College Vidya
        </p>
      </div>

      {/* Blue & Orange Target Illustration */}
      <div className="mt-8 pt-5 border-t border-[#DFEAFE] flex items-center justify-between gap-4">
        <div className="text-xs text-[#61789E]">
          <p className="font-bold text-[#0A2454] text-sm">Consistency & Precision</p>
          <p className="text-xs mt-0.5">Execute daily targets with focus.</p>
        </div>

        {/* Enhanced SVG Bullseye Target with Arrow */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-md select-none"
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
