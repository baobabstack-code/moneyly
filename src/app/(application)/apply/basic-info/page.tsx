"use client";

import { useApplicationStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BasicInfoPage() {
  const router = useRouter();
  const { basicInfo, setBasicInfo } = useApplicationStore();

  const handleNext = () => {
    router.push("/apply/contact-details");
  };

  return (
    <div className="w-full">
      {/* Page Header & Stepper */}
      <div className="mb-stack-lg">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-h1 text-primary mb-2">Executive Onboarding</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">Complete your institutional profile to activate global loan facilities.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
            <span className="text-secondary uppercase tracking-widest">Step 3 of 7</span>
            <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
              <div className="bg-secondary h-full w-[42%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
            </div>
          </div>
        </div>

        <div className="mt-stack-md flex items-center justify-between overflow-x-auto pb-4 gap-8 scrollbar-hide">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined">check</span>
            </div>
            <div>
              <p className="text-label-md font-label-md text-on-surface">Identity & KYC</p>
              <p className="text-label-sm font-label-sm text-secondary">Completed</p>
            </div>
          </div>
          <div className="h-px bg-outline-variant flex-1 min-w-[40px]"></div>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="w-10 h-10 rounded-full bg-surface text-secondary flex items-center justify-center border-2 border-secondary font-bold shadow-sm">2</div>
            <div>
              <p className="text-label-md font-label-md text-on-surface">Business Verification</p>
              <p className="text-label-sm font-label-sm text-secondary">In Progress</p>
            </div>
          </div>
          <div className="h-px bg-outline-variant flex-1 min-w-[40px]"></div>
          <div className="flex items-center gap-3 opacity-50 whitespace-nowrap grayscale">
            <div className="w-10 h-10 rounded-full bg-surface text-on-surface-variant flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined">security</span>
            </div>
            <div>
              <p className="text-label-md font-label-md text-on-surface-variant">Risk Compliance</p>
              <p className="text-label-sm font-label-sm">Locked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Form Section */}
        <div className="lg:col-span-7 bg-surface rounded-xl p-stack-md border border-outline-variant shadow-sm">
          <h2 className="font-h2 text-h2 mb-stack-md">Basic Information</h2>
          <form className="space-y-gutter">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant block">Legal First Name</label>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="e.g. Alexander" 
                  type="text"
                  value={basicInfo.firstName}
                  onChange={(e) => setBasicInfo({ firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant block">Legal Last Name</label>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="e.g. Hamilton" 
                  type="text"
                  value={basicInfo.lastName}
                  onChange={(e) => setBasicInfo({ lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant block">National ID / Passport Number</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">badge</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="ID Number" 
                  type="text"
                  value={basicInfo.idNumber}
                  onChange={(e) => setBasicInfo({ idNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant block">Date of Birth</label>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" 
                  type="date"
                  value={basicInfo.dateOfBirth}
                  onChange={(e) => setBasicInfo({ dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant block">Gender</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
                  value={basicInfo.gender}
                  onChange={(e) => setBasicInfo({ gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="pt-stack-md flex justify-end">
              <button 
                className="px-8 py-3 bg-secondary text-on-secondary font-bold rounded-lg shadow-lg hover:shadow-secondary/20 transition-all active:scale-[0.98]" 
                onClick={handleNext}
                type="button"
              >
                Save & Continue
              </button>
            </div>
          </form>
        </div>

        {/* KYC Selfie Sidebar */}
        {/* KYC Selfie Sidebar */}
        <div className="lg:col-span-5 space-y-gutter">
          <div className="bg-primary-container text-on-primary-container rounded-xl p-stack-md relative overflow-hidden shadow-xl border border-outline">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary">photo_camera</span>
                <h3 className="font-h3 text-h3 text-on-primary-container">Liveness Verification</h3>
              </div>
              <p className="text-on-primary-container/80 text-body-sm mb-6">Our institutional security protocol requires a biometric liveness check to confirm your identity.</p>
              
              <div className="relative aspect-square max-w-[280px] mx-auto bg-black/20 rounded-full border-4 border-dashed border-white/20 flex flex-col items-center justify-center group cursor-pointer hover:border-secondary transition-colors">
                <div className="absolute inset-4 rounded-full overflow-hidden">
                  <img alt="Selfie Example" className="w-full h-full object-cover opacity-20 grayscale group-hover:opacity-40 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlZUVkqjJsXJwrjf3ad-KpNLlCc3EmG75YrTRuajNEXz1vobnJZkH3DMEmVP5Uvg0PV-v50qMhNGF4utgGvLp-9Q8bAvYWZKVR4qra2-kz5HCZUfyspSemgPuNzlJ69t31bM9CopBaOd67-rHWZDl7KrwNXkp3JQ_WBqBwI3vUgjn_iILGjZTKK_P-cKpGK5zNILvguz6lDN0Mp32JMuovUziMfHnRRKnjf6XIV0y_4csBMoKKJVLuCdNjedNknyxmW8gAtY7xqTfZ" />
                </div>
                <div className="z-20 flex flex-col items-center">
                  <div className="w-14 h-14 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                  </div>
                  <p className="mt-4 font-bold text-sm tracking-wide uppercase">Capture Selfie</p>
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary shadow-[0_0_15px_rgba(49,107,243,0.8)] animate-pulse"></div>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-sm text-on-primary-container">
                  <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Remove glasses or face coverings</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-on-primary-container">
                  <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Ensure neutral, bright lighting</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
          </div>

          <div className="bg-surface rounded-xl p-stack-md border border-outline-variant shadow-sm">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary">verified_user</span>
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface mb-1">Bank-Grade Encryption</h4>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">Your data is secured with AES-256 military-grade encryption and stored in compliance with local privacy regulations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
