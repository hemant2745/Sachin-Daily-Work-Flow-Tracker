import React from "react";
import { cn } from "@/lib/utils";

interface S3LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "banner";
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export function S3LogoIcon({
  className,
  size = 46,
}: {
  className?: string;
  size?: number;
}) {
  const uniqueId = React.useId().replace(/:/g, "");
  const blueGradientId = `s3-blue-gradient-${uniqueId}`;
  const orangeGradientId = `s3-orange-gradient-${uniqueId}`;
  const glowFilterId = `s3-glow-${uniqueId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label="S3 Logo - Sachin Behera Team Workflow Tracker"
    >
      <defs>
        {/* Vibrant Cyan to Royal Blue Gradient for S */}
        <linearGradient
          id={blueGradientId}
          x1="8"
          y1="12"
          x2="48"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#18B9E8" />
          <stop offset="45%" stopColor="#1677FF" />
          <stop offset="100%" stopColor="#0866F5" />
        </linearGradient>

        {/* Vibrant Orange Gradient for 3 and Arrow */}
        <linearGradient
          id={orangeGradientId}
          x1="52"
          y1="8"
          x2="94"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFA41C" />
          <stop offset="40%" stopColor="#FF8A00" />
          <stop offset="100%" stopColor="#FF4D00" />
        </linearGradient>

        {/* Subtle drop glow */}
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#061B3D" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter={`url(#${glowFilterId})`}>
        {/* Stylized Letter S (Left Glyph - Bold Modern Ribbon) */}
        <path
          d="M 44 24 C 44 15 36 10 26 10 C 15 10 9 17 9 27 C 9 43 42 37 42 58 C 42 74 30 78 20 78 C 11 78 5 71 5 63 L 15 60 C 15 66 18 69 22 69 C 28 69 32 65 32 58 C 32 43 6 46 6 27 C 6 11 18 3 29 3 C 43 3 53 12 53 23 Z"
          fill={`url(#${blueGradientId})`}
        />

        {/* Stylized Number 3 with Integrated Growth Arrow */}
        <g>
          {/* Main 3 Body */}
          <path
            d="M 52 20 L 74 20 L 60 40 C 67 40 80 43 80 58 C 80 73 67 78 55 78 C 45 78 39 72 38 65 L 48 61 C 49 66 52 69 57 69 C 64 69 69 64 69 57 C 69 48 62 45 54 45 L 48 45 L 48 37 L 61 24 L 49 24 Z"
            fill={`url(#${orangeGradientId})`}
          />

          {/* Integrated Upward Trending Growth Arrow on top-right */}
          {/* Arrow shaft */}
          <path
            d="M 72 22 L 88 6"
            stroke={`url(#${orangeGradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Arrow head pointing 45° up and right */}
          <path
            d="M 76 5 L 90 5 L 90 19"
            stroke={`url(#${orangeGradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}

export function S3Logo({
  size = "md",
  variant = "dark",
  showText = true,
  className,
  subtitle = "Team Workflow Tracker",
}: S3LogoProps) {
  const sizeMap = {
    sm: { icon: 34, text: "text-sm", sub: "text-[11px]" },
    md: { icon: 44, text: "text-base sm:text-lg", sub: "text-xs" },
    lg: { icon: 56, text: "text-xl sm:text-2xl", sub: "text-sm" },
    xl: { icon: 70, text: "text-2xl sm:text-3xl", sub: "text-base" },
  };

  const { icon, text, sub } = sizeMap[size];

  const textColor =
    variant === "dark" || variant === "banner"
      ? "text-white"
      : "text-[#0A2454]";

  const subColor =
    variant === "dark"
      ? "text-blue-100/90"
      : variant === "banner"
      ? "text-blue-100"
      : "text-[#61789E]";

  return (
    <div className={cn("inline-flex items-center gap-3.5 select-none", className)}>
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center p-2 transition-transform duration-200 hover:scale-105",
          variant === "dark"
            ? "bg-[#001A3D] border border-white/15 shadow-md"
            : variant === "banner"
            ? "bg-white/15 backdrop-blur-md border border-white/25 shadow-lg"
            : "bg-white border border-[#DFEAFE] shadow-sm"
        )}
      >
        <S3LogoIcon size={icon} />
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-black tracking-tight leading-tight truncate font-sans",
              text,
              textColor
            )}
          >
            Sachin Behera
          </span>
          <span
            className={cn(
              "font-semibold tracking-normal leading-tight truncate mt-0.5",
              sub,
              subColor
            )}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
