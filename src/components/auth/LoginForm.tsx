"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Info, ArrowRight, ShieldCheck } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setAuthStatusMessage(null);

    // Client-side validation
    if (!email.trim()) {
      setValidationError("Please enter your administrator email or work ID.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError("Please enter a valid administrator email address.");
      return;
    }

    if (!password) {
      setValidationError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    // Trigger loading state for verification demonstration
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Phase 1 requirement: Do not simulate successful login or claim authentication is active
      setAuthStatusMessage(
        "Phase 1 Verification: Authentication system is not yet active. Supabase auth integration will be connected in a future phase. You can explore the Dashboard Visual Preview below."
      );
    }, 800);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-navy-900/90 border border-navy-700/80 rounded-2xl p-6 sm:p-8 shadow-panel backdrop-blur-md">
        {/* Administrator Badge */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-navy-800">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-orange"></span>
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-300">
              Administrator Portal
            </span>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-brand-orange border border-navy-700">
            Single Admin
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Sign In</h2>
          <p className="text-sm text-gray-300 mt-1">
            Access restricted strictly to Sachin Behera (Team Leader). Counselors do not have login accounts.
          </p>
        </div>

        {/* Phase Notice */}
        <div className="mb-5 p-3.5 bg-navy-800/80 border-l-4 border-brand-orange rounded-r-lg">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
            <div className="text-xs text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">Phase 1 UI Notice: </span>
              Authentication is intentionally not connected to live Supabase backend in this phase.
            </div>
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="mb-5 p-3.5 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-200">{validationError}</p>
          </div>
        )}

        {/* Auth Notice Message after submit */}
        {authStatusMessage && (
          <div className="mb-5 p-3.5 bg-amber-950/50 border border-amber-500/40 rounded-lg flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200 leading-relaxed">{authStatusMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email / ID Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-200 mb-1.5 uppercase tracking-wider">
              Administrator Email
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sachin.behera@collegevidya.com"
                disabled={isLoading}
                className="block w-full pl-10 pr-3.5 py-2.5 bg-navy-950/90 border border-navy-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-200 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="block w-full pl-10 pr-10 py-2.5 bg-navy-950/90 border border-navy-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all disabled:opacity-60"
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
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-brand-orange hover:bg-brand-hover active:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange focus:ring-offset-navy-900 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
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
                <span>Validating Request...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Dashboard Visual Preview Shortcut */}
        <div className="mt-6 pt-5 border-t border-navy-800 text-center">
          <p className="text-xs text-gray-300 mb-2.5">
            Looking to inspect the visual architecture preview?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:text-orange-400 transition-colors"
          >
            <span>Proceed to Dashboard Visual Preview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
