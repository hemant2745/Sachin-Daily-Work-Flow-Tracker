import React, { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { Shield, Sparkles, Building2, CheckCircle2 } from "lucide-react";
import { S3Logo } from "@/components/ui/S3Logo";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#001A3D] relative overflow-hidden flex flex-col justify-between selection:bg-brand-orange selection:text-white">
      {/* Ambient background glows for glassmorphism */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#0866F5]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[400px] bg-[#18B9E8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#FF8A00]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-[#061B3D]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-15 flex items-center justify-between">
          <S3Logo size="sm" variant="dark" subtitle="Team Leader Portal • College Vidya" />
          <div className="hidden sm:flex items-center space-x-2 text-xs text-blue-200/80 bg-white/5 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs">
            <Shield className="w-3.5 h-3.5 text-brand-orange" />
            <span>Workflow & Performance System</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          
          {/* Supplied Hero Banner Showcase */}
          <div className="w-full bg-[#061B3D]/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative backdrop-blur-md">
            <div className="relative w-full aspect-[2048/768] max-h-[300px] sm:max-h-[340px] bg-[#001A3D] flex items-center justify-center">
              <Image
                src="/images/sachin-workflow-hero.png"
                alt="Sachin Behera - Building Skills, Creating Opportunities for a Better Tomorrow"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-contain sm:object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001A3D]/90 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 bg-[#001A3D]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[10px] text-white">
                <Sparkles className="w-3 h-3 text-brand-orange" />
                <span className="font-semibold">Official Brand Visual Identity</span>
              </div>
            </div>
          </div>

          {/* Form and System Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* System Overview Information */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-card-dark rounded-2xl p-5 sm:p-6 backdrop-blur-xl border border-white/10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-semibold mb-3">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>College Vidya Leadership</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                  Sachin Daily Work Flow Tracker
                </h2>
                <p className="text-xs sm:text-sm text-blue-100/75 leading-relaxed mb-4">
                  Unified operational suite for managing counselor performance, category-based dynamic targets, admission revenue, daily calling checkpoints, and projections.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-start gap-2.5 p-2.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs">
                    <CheckCircle2 className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Role-Based Security</h4>
                      <p className="text-[10px] text-blue-200/70 mt-0.5">Strict authorization with PostgreSQL Row-Level Security.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs">
                    <CheckCircle2 className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Dynamic Targets</h4>
                      <p className="text-[10px] text-blue-200/70 mt-0.5">CDA, SCDA, and PCA category quotas with individual adjustments.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs">
                    <CheckCircle2 className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Weekly Tracking</h4>
                      <p className="text-[10px] text-blue-200/70 mt-0.5">Fixed 4-period monthly analytics and performance gap calculations.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs">
                    <CheckCircle2 className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Verified Admissions</h4>
                      <p className="text-[10px] text-blue-200/70 mt-0.5">Real-time collections validation across partner universities.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="lg:col-span-5 w-full">
              <Suspense
                fallback={
                  <div className="w-full max-w-md mx-auto glass-card-dark rounded-2xl p-6 text-center text-gray-400">
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
      <footer className="border-t border-white/10 bg-[#001A3D]/80 backdrop-blur-md py-3 text-center text-[11px] text-blue-200/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Sachin Behera Daily Workflow &bull; College Vidya Team Operations. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
