"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Info,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { signInAction } from "@/app/auth/actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Read URL status flags
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const noticeParam = searchParams.get("notice");
    const messageParam = searchParams.get("message");

    if (errorParam === "unauthenticated") {
      setErrorMessage("Authentication required. Please sign in to access your dashboard.");
    } else if (errorParam === "unauthorized") {
      setErrorMessage("Access denied. Your account is not authorized for Sachin Behera Daily Workflow.");
    } else if (errorParam === "session_expired") {
      setErrorMessage("Your session has expired. Please sign in again.");
    }

    if (noticeParam === "setup_required") {
      setSuccessNotice("Supabase credentials are not configured in .env.local yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication.");
    } else if (messageParam === "signed_out") {
      setSuccessNotice("You have successfully signed out of the portal.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", trimmedEmail);
      formData.append("password", password);

      const result = await signInAction(formData);

      if (!result.success) {
        setErrorMessage(result.error || "Authentication failed. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      // Successful authentication
      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected network or service error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card-dark rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl border border-white/15">
        
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
            </span>
            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-300">
              Secure Portal
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-brand-orange border border-white/15">
            Role-Based Access
          </span>
        </div>

        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Sign In</h2>
          <p className="text-xs text-blue-200/70 mt-1">
            Access your authorized workflow dashboard with your credentials.
          </p>
        </div>

        {/* Informative Notification Banner */}
        {successNotice && (
          <div className="mb-4 p-3 bg-blue-500/10 border-l-3 border-[#1677FF] rounded-r-lg flex items-start gap-2 backdrop-blur-xs">
            <Info className="w-3.5 h-3.5 text-[#1677FF] mt-0.5 shrink-0" />
            <p className="text-xs text-blue-100 leading-relaxed">{successNotice}</p>
          </div>
        )}

        {/* Error Message Display */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-lg flex items-start gap-2 backdrop-blur-xs animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-200 leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-[11px] font-bold text-blue-200/80 mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sachin.behera@collegevidya.com"
                disabled={isLoading}
                className="block w-full pl-9 pr-3 py-2 bg-black/25 border border-white/15 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-[11px] font-bold text-blue-200/80 mb-1 uppercase tracking-wider">
              Password
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="block w-full pl-9 pr-9 py-2 bg-black/25 border border-white/15 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-brand-orange to-[#FF6B00] hover:from-[#FF7A00] hover:to-[#E65C00] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange focus:ring-offset-[#061B3D] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Authenticating with Supabase...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footnote */}
        <div className="mt-4 pt-3.5 border-t border-white/10 text-left">
          <div className="flex items-start gap-1.5 text-[10px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-orange shrink-0 mt-0.5" />
            <span>
              Server-enforced authorization active. All access is protected via Supabase Row-Level Security.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
