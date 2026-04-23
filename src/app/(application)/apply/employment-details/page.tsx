"use client";

import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function EmploymentDetailsPage() {
  const router = useRouter();
  const { employmentDetails, setEmploymentDetails } = useApplicationStore();

  const handleNext = () => {
    router.push("/apply/next-of-kin");
  };

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-2 block">Step 6 of 8</span>
            <h1 className="font-h1 text-primary mb-2">Employment Details</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Tell us about your current employment.
            </p>
          </div>
        </div>
        <div className="mt-6 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
          <div className="bg-secondary h-full w-[70%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="font-h2 text-primary border-b border-outline-variant/30 pb-4">Current Employment</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block font-label-md text-label-md mb-2 text-on-surface">
              Name of Employer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
              placeholder="Company or Organization Name"
              value={employmentDetails.employerName}
              onChange={(e) => setEmploymentDetails({ employerName: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 pt-2 border-t border-outline-variant/30 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <label className="block font-label-md text-label-md text-on-surface">
                Are you a Civil Servant? <span className="text-red-500">*</span>
              </label>
              <div className="group relative">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 cursor-help">help</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-on-primary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                  This helps us determine eligibility for SSB (Salary Service Bureau) deductions.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[true, false].map((isCivil) => (
                <button
                  key={isCivil.toString()}
                  type="button"
                  onClick={() => setEmploymentDetails({ isCivilServant: isCivil })}
                  className={`py-4 rounded-xl border-2 font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                    employmentDetails.isCivilServant === isCivil
                      ? "bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/20"
                      : "bg-surface text-on-surface-variant border-outline-variant hover:border-secondary/50 hover:bg-secondary/5"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {isCivil ? "account_balance" : "business"}
                  </span>
                  {isCivil ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Fields for Civil Servants */}
          {employmentDetails.isCivilServant === true && (
            <>
              <div>
                <label className="block font-label-md text-label-md mb-2 text-on-surface">
                  Employer No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
                  placeholder="e.g. EC Number"
                  value={employmentDetails.employerNo}
                  onChange={(e) => setEmploymentDetails({ employerNo: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md mb-2 text-on-surface">
                  Ministry <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
                  placeholder="Ministry of..."
                  value={employmentDetails.ministry}
                  onChange={(e) => setEmploymentDetails({ ministry: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 pt-2 border-t border-outline-variant/30 mt-2">
            <label className="block font-label-md text-label-md mb-2 text-on-surface">
              Employer Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
              placeholder="+263 242 XXX XXX"
              value={employmentDetails.phoneNumber}
              onChange={(e) => setEmploymentDetails({ phoneNumber: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Navigation - Hidden on mobile, handled by layout */}
      <div className="mt-8 hidden lg:flex justify-between items-center">
        <button
          onClick={() => router.push("/apply/contact-details")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={
            !employmentDetails.employerName ||
            employmentDetails.isCivilServant === null ||
            !employmentDetails.phoneNumber ||
            (employmentDetails.isCivilServant === true && (!employmentDetails.employerNo || !employmentDetails.ministry))
          }
          className="flex items-center gap-2 px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
