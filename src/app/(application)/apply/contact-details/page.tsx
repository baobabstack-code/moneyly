"use client";

import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function ContactDetailsPage() {
  const router = useRouter();
  const { contactDetails, setContactDetails } = useApplicationStore();

  const handleNext = () => {
    router.push("/apply/employment-details");
  };

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-secondary font-bold text-[10px] uppercase tracking-widest block">Step 5 of 8</span>
              <div className="group relative">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 cursor-help">help</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-on-primary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl text-center">
                  We use these details for application status updates and verification.
                </div>
              </div>
            </div>
            <h1 className="font-h1 text-primary mb-2">Contact Details</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              How can we reach you?
            </p>
          </div>
        </div>
        <div className="mt-6 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
          <div className="bg-secondary h-full w-[56%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="font-h2 text-primary border-b border-outline-variant/30 pb-4">Contact Information</h2>

        <div>
          <label className="block font-label-md text-label-md mb-2 text-on-surface">
            Physical Address <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30 min-h-[100px]"
            placeholder="Full physical address"
            value={contactDetails.physicalAddress}
            onChange={(e) => setContactDetails({ physicalAddress: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-label-md text-label-md mb-2 text-on-surface">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
              placeholder="+263 7X XXX XXXX"
              value={contactDetails.mobileNumber}
              onChange={(e) => setContactDetails({ mobileNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md mb-2 text-on-surface">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
              placeholder="your@email.com"
              value={contactDetails.emailAddress}
              onChange={(e) => setContactDetails({ emailAddress: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Navigation - Hidden on mobile, handled by layout */}
      <div className="mt-8 hidden lg:flex justify-between items-center">
        <button
          onClick={() => router.push("/apply/basic-info")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!contactDetails.physicalAddress || !contactDetails.mobileNumber || !contactDetails.emailAddress}
          className="flex items-center gap-2 px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
