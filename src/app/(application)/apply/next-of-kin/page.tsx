"use client";

import { useApplicationStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NextOfKinPage() {
  const router = useRouter();
  const { nextOfKin, setNextOfKin } = useApplicationStore();

  const handleNext = () => {
    router.push("/apply/purchase-details");
  };

  return (
    <div className="w-full">
      {/* Progress Header */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-secondary font-label-sm tracking-widest uppercase">Step 6 of 7</span>
            <h1 className="font-h1 text-primary mt-2">Next of Kin</h1>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-on-surface-variant font-label-sm">Completion</span>
            <div className="text-xl font-bold text-on-surface">85%</div>
          </div>
        </div>
        {/* Stepper */}
        <div className="relative h-2 w-full bg-outline-variant rounded-full overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-secondary transition-all duration-500" style={{ width: "85%" }}></div>
        </div>
      </div>

      {/* Form Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-12 bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="font-label-md text-on-surface-variant block">Full Name</label>
              <input 
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/30" 
                placeholder="Enter kin's legal name" 
                type="text"
                value={nextOfKin.fullName}
                onChange={(e) => setNextOfKin({ fullName: e.target.value })}
              />
            </div>
            {/* Relationship */}
            <div className="space-y-2">
              <label className="font-label-md text-on-surface-variant block">Relationship</label>
              <select 
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
                value={nextOfKin.relationship}
                onChange={(e) => setNextOfKin({ relationship: e.target.value })}
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="child">Child</option>
                <option value="other">Other</option>
              </select>
            </div>
            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="font-label-md text-on-surface-variant block">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md">+263</span>
                <input 
                  className="w-full pl-16 pr-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="800 000 000" 
                  type="tel"
                  value={nextOfKin.phoneNumber}
                  onChange={(e) => setNextOfKin({ phoneNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informational Tile */}
        <div className="md:col-span-7 bg-surface-container rounded-xl border border-outline-variant p-6 flex gap-4 items-start shadow-inner">
          <span className="material-symbols-outlined text-secondary mt-1">info</span>
          <div>
            <h4 className="font-label-md text-on-surface">Why do we need this?</h4>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">In accordance with financial regulations, we require Next of Kin details to ensure security and accessibility of your account in unforeseen circumstances.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-12 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button className="w-full sm:w-auto px-8 py-3 text-on-surface-variant font-label-md hover:text-on-surface transition-colors order-2 sm:order-1">
            Save and Exit
          </button>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 order-1 sm:order-2">
            <Link className="w-full sm:w-auto px-10 py-3 border-2 border-secondary text-secondary rounded-lg font-label-md hover:bg-secondary/5 text-center transition-all" href="/apply/employment-details">
              Previous
            </Link>
            <button 
              className="w-full sm:w-auto px-12 py-3 bg-secondary text-on-secondary rounded-lg font-label-md shadow-lg shadow-secondary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all" 
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
