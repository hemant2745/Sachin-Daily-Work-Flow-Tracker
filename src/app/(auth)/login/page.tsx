import React, { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { Shield, Sparkles, Building2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-between selection:bg-brand-orange selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-navy-800 bg-navy-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-navy-800 border border-brand-orange/40 flex items-center justify-center text-brand-orange font-bold text-base shadow-sm">
              SB
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                Sachin Behera Daily Workflow
              </h1>
              <p className="text-[11px] text-gray-400 font-medium">
                Team Leader Portal &bull; College Vidya
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400 bg-navy-900 px-3 py-1.5 rounded-full border border-navy-800">
            <Shield className="w-3.5 h-3.5 text-brand-orange" />
            <span>Private Single-Administrator System</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl w-full mx-auto space-y-8">
          
          {/* Supplied Hero Banner Showcase */}
          <div className="w-full bg-navy-900 border border-navy-800/80 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="relative w-full aspect-[2048/768] max-h-[380px] bg-navy-950 flex items-center justify-center">
              <Image
                src="/images/sachin-workflow-hero.png"
                alt="Sachin Behera - Building Skills, Creating Opportunities for a Better Tomorrow"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-contain sm:object-cover object-center"
              />
              {/* Subtle gradient overlay at the base for seamless integration */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Badge overlay on top-left of image area */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-navy-700/60 text-[11px] text-white">
                <Sparkles className="w-3 h-3 text-brand-orange" />
                <span className="font-medium">Official Brand Visual Identity</span>
              </div>
            </div>
          </div>

          {/* Form and System Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* System Overview Information */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-navy-900/60 border border-navy-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-semibold mb-4">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>College Vidya Team Leadership</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Dedicated Workflow Management Portal
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  Engineered specifically for Sachin Behera to manage daily operations, counselor performance records, admission pipelines, targets, and projections in a unified, private dashboard.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex items-start gap-3 p-3 bg-navy-950/60 rounded-xl border border-navy-800">
                    <CheckCircle2 className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Single Admin Security</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Strict single-user authorization. No public signup.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-navy-950/60 rounded-xl border border-navy-800">
                    <CheckCircle2 className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Counselor Records</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Counselors are tracked as records without accounts.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-navy-950/60 rounded-xl border border-navy-800">
                    <CheckCircle2 className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Admissions & Targets</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Live tracking for monthly targets and revenue metrics.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-navy-950/60 rounded-xl border border-navy-800">
                    <CheckCircle2 className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Phase 2 Supabase Auth</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Server-enforced single-admin authentication & SSR cookies.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="lg:col-span-5 w-full">
              <Suspense
                fallback={
                  <div className="w-full max-w-md mx-auto bg-navy-900/90 border border-navy-700/80 rounded-2xl p-8 text-center text-gray-400">
                    Loading login interface...
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-900 bg-navy-950 py-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Sachin Behera Daily Workflow &bull; College Vidya Team Operations. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
