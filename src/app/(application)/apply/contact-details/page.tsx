"use client";

import { useApplicationStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContactDetailsPage() {
  const router = useRouter();
  const { contactDetails, setContactDetails } = useApplicationStore();

  const handleNext = () => {
    router.push("/apply/employment-details");
  };

  return (
    <div className="w-full">
      {/* Progress Header */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="text-secondary font-label-sm uppercase tracking-widest">Step 4 of 7</span>
            <h1 className="font-h2 text-h2 text-primary">Contact Details</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
              <span className="material-symbols-outlined text-[18px]">check</span>
            </div>
            <div className="w-12 h-[2px] bg-secondary"></div>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
              <span className="material-symbols-outlined text-[18px]">check</span>
            </div>
            <div className="w-12 h-[2px] bg-secondary"></div>
            <div className="w-8 h-8 rounded-full border-2 border-secondary flex items-center justify-center text-secondary font-bold shadow-sm">4</div>
          </div>
        </div>
        <div className="w-full bg-outline-variant h-1.5 rounded-full overflow-hidden">
          <div className="bg-secondary h-full w-[57%] rounded-full transition-all duration-500"></div>
        </div>
      </section>

      {/* Form Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-stack-sm">
        <div className="md:col-span-8 bg-surface p-8 rounded-xl border border-outline-variant shadow-sm space-y-8">
          <div className="space-y-stack-sm">
            <label className="block font-label-md text-on-surface-variant">Physical Address</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">home</span>
              <input 
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30" 
                placeholder="123 Financial District, Suite 100" 
                type="text"
                value={contactDetails.address}
                onChange={(e) => setContactDetails({ address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30" 
                placeholder="City" 
                type="text"
                value={contactDetails.city}
                onChange={(e) => setContactDetails({ city: e.target.value })}
              />
              <input 
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30" 
                placeholder="Postal Code" 
                type="text"
                value={contactDetails.postalCode}
                onChange={(e) => setContactDetails({ postalCode: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-stack-sm">
              <label className="block font-label-md text-on-surface-variant">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">smartphone</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="+1 (555) 000-0000" 
                  type="tel"
                  value={contactDetails.phoneNumber}
                  onChange={(e) => setContactDetails({ phoneNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-stack-sm">
              <label className="block font-label-md text-on-surface-variant">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">mail</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="client@company.com" 
                  type="email"
                  value={contactDetails.email}
                  onChange={(e) => setContactDetails({ email: e.target.value })}
                />
              </div>
              <p className="text-[12px] text-on-surface-variant/60 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                We'll use this for transaction receipts and security alerts.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-outline-variant">
            <button 
              className="w-full sm:w-auto px-8 py-3.5 bg-secondary text-on-secondary text-center font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-secondary/20" 
              onClick={handleNext}
            >
              Continue
            </button>
            <Link className="w-full sm:w-auto px-8 py-3.5 bg-transparent text-on-surface-variant text-center font-semibold hover:text-on-surface transition-colors" href="/apply/basic-info">
              Back
            </Link>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          <div className="bg-primary-container text-on-primary-container p-6 rounded-xl space-y-4 shadow-xl border border-outline">
            <span className="material-symbols-outlined text-3xl text-secondary">verified_user</span>
            <div className="space-y-2">
              <h3 className="font-h3 text-[18px] text-on-primary-container">Data Security</h3>
              <p className="text-sm opacity-80 leading-relaxed">Your data is encrypted with 256-bit institutional protocols. HTB GLOBAL ensures full compliance with financial privacy regulations.</p>
            </div>
          </div>
          <div className="bg-surface border border-outline-variant p-6 rounded-xl space-y-4 shadow-sm">
            <h4 className="font-label-md text-on-surface">Need Assistance?</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg hover:bg-surface-container-high cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-secondary">headset_mic</span>
                <span className="text-sm font-medium text-on-surface">Live Support</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg hover:bg-surface-container-high cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-secondary">help_center</span>
                <span className="text-sm font-medium text-on-surface">Knowledge Base</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
