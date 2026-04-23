"use client";

import { useApplicationStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmploymentDetailsPage() {
  const router = useRouter();
  const { employmentDetails, setEmploymentDetails } = useApplicationStore();

  const handleNext = () => {
    router.push("/apply/next-of-kin");
  };

  return (
    <div className="w-full pb-32">
      {/* Stepper Progress */}
      <div className="bg-surface p-6 rounded-xl border border-outline-variant shadow-sm mb-stack-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-h2 text-h2 text-primary">Employment Details</h2>
          <span className="text-label-md font-label-md text-on-surface-variant">Step 5 of 7</span>
        </div>
        <div className="relative w-full h-2 bg-outline-variant rounded-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-secondary w-[71%] transition-all duration-500"></div>
        </div>
        <div className="flex justify-between mt-4">
          <div className="flex flex-col items-center gap-1 opacity-50 grayscale">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-label-sm font-label-sm text-on-surface">Basic Info</span>
          </div>
          <div className="flex flex-col items-center gap-1 opacity-50 grayscale">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-label-sm font-label-sm text-on-surface">Contact</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-secondary">radio_button_checked</span>
            <span className="text-label-sm font-label-sm text-secondary font-bold">Employment</span>
          </div>
          <div className="flex flex-col items-center gap-1 opacity-30 grayscale">
            <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">Next of Kin</span>
          </div>
          <div className="flex flex-col items-center gap-1 opacity-30 grayscale">
            <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">Finish</span>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <form className="space-y-stack-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* Employer Name */}
          <div className="col-span-full md:col-span-2">
            <label className="block text-label-md font-label-md text-on-surface mb-2">Name of Employer</label>
            <input 
              className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/30 text-on-surface" 
              placeholder="e.g. Global Tech Solutions" 
              type="text"
              value={employmentDetails.employerName}
              onChange={(e) => setEmploymentDetails({ employerName: e.target.value })}
            />
          </div>

          {/* Job Title */}
          <div className="col-span-full md:col-span-1">
            <label className="block text-label-md font-label-md text-on-surface mb-2">Job Title</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50 text-body-md">work</span>
              <input 
                className="w-full bg-surface border border-outline-variant rounded-lg pl-12 pr-4 py-3 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/30 text-on-surface" 
                placeholder="Software Engineer" 
                type="text"
                value={employmentDetails.jobTitle}
                onChange={(e) => setEmploymentDetails({ jobTitle: e.target.value })}
              />
            </div>
          </div>

          {/* Monthly Income */}
          <div className="col-span-full md:col-span-1">
            <label className="block text-label-md font-label-md text-on-surface mb-2">Monthly Net Income</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50 text-body-md">payments</span>
              <input 
                className="w-full bg-surface border border-outline-variant rounded-lg pl-12 pr-4 py-3 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/30 text-on-surface" 
                placeholder="5000" 
                type="number"
                value={employmentDetails.monthlyIncome}
                onChange={(e) => setEmploymentDetails({ monthlyIncome: e.target.value })}
              />
            </div>
          </div>

          {/* Employment Type */}
          <div className="col-span-full">
            <label className="block text-label-md font-label-md text-on-surface mb-2">Employment Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Full-time", "Part-time", "Contract", "Self-employed"].map((type) => (
                <label key={type} className="cursor-pointer group">
                  <input 
                    className="hidden peer" 
                    name="employment_type" 
                    type="radio" 
                    value={type}
                    checked={employmentDetails.employmentType === type}
                    onChange={(e) => setEmploymentDetails({ employmentType: e.target.value })}
                  />
                  <div className="flex items-center justify-center p-4 bg-surface border border-outline-variant rounded-xl peer-checked:border-secondary peer-checked:bg-secondary/5 hover:bg-surface-container-low transition-all text-center h-full group-hover:border-secondary/50">
                    <span className="font-bold text-sm text-on-surface peer-checked:text-secondary">{type}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Layout for Actions */}
        <div className="pt-8 flex flex-col-reverse md:flex-row justify-between gap-4">
          <Link className="px-8 py-3 text-on-surface-variant font-bold hover:bg-surface-container rounded-lg transition-colors flex items-center justify-center gap-2" href="/apply/contact-details">
            <span className="material-symbols-outlined">arrow_back</span>
            Go Back
          </Link>
          <button 
            className="px-10 py-3 bg-secondary text-on-secondary font-bold rounded-lg hover:opacity-90 shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 transition-all active:scale-95" 
            onClick={handleNext}
            type="button"
          >
            Save & Continue
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </form>

      {/* Contextual Information Card */}
      <div className="mt-stack-lg grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="col-span-1 md:col-span-2 bg-surface p-6 rounded-2xl border border-outline-variant flex items-start gap-4 shadow-sm">
          <div className="bg-secondary/10 p-3 rounded-xl text-secondary shadow-inner">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          </div>
          <div>
            <h4 className="font-h3 text-body-md font-bold mb-1 text-on-surface">Data Verification</h4>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">We verify your employment status with official records to expedite your application process. All data is encrypted.</p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col justify-center items-center text-center shadow-sm">
          <span className="text-h2 font-black text-secondary">98%</span>
          <span className="text-label-sm uppercase font-bold text-on-surface-variant">Approval Rate</span>
        </div>
      </div>
    </div>
  );
}
