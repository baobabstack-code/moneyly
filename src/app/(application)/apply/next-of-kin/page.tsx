"use client";

import { useState } from "react";
import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { FieldTooltip, validateMobile } from "@/components/FieldTooltip";

export default function NextOfKinPage() {
  const router = useRouter();
  const { nextOfKin, setNextOfKin, contactDetails, basicInfo } = useApplicationStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (field: string, value: string, compareMobile?: string) => {
    let error = "";
    switch (field) {
      case "fullName":
        if (!value.trim()) error = "Required";
        else if (value.toLowerCase().trim() === `${basicInfo.firstName} ${basicInfo.lastName}`.toLowerCase().trim()) error = "Cannot be yourself";
        else if (value.toLowerCase().trim() === basicInfo.firstName.toLowerCase().trim() || value.toLowerCase().trim() === basicInfo.lastName.toLowerCase().trim()) error = "Cannot be yourself";
        break;
      case "mobileNumber":
        error = validateMobile(value) || "";
        if (!error && compareMobile && value.replace(/[\s-]/g, "") === compareMobile.replace(/[\s-]/g, "")) error = "Cannot be your own number";
        break;
      case "relationship":
        if (!value.trim()) error = "Required";
        break;
      case "address":
        if (!value.trim()) error = "Required";
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleNext = () => {
    validate("fullName", nextOfKin.fullName);
    validate("mobileNumber", nextOfKin.mobileNumber, contactDetails.mobileNumber);
    validate("relationship", nextOfKin.relationship);
    validate("address", nextOfKin.address);
    
    if (!errors.fullName && !errors.mobileNumber && !errors.relationship && !errors.address) {
      router.push("/apply/summary");
    }
  };

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-secondary font-bold text-[10px] uppercase tracking-widest block">Step 7 of 8</span>
              <div className="group relative">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 cursor-help">help</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-on-primary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl text-center">
                  This person will be contacted only in case of emergency regarding this application.
                </div>
              </div>
            </div>
            <h1 className="font-h1 text-primary mb-2">Next of Kin</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Please provide details for an emergency contact.
            </p>
          </div>
        </div>
        <div className="mt-6 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
          <div className="bg-secondary h-full w-[84%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="font-h2 text-primary border-b border-outline-variant/30 pb-4">Next of Kin Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="font-label-md text-label-md text-on-surface">
                Full Name <span className="text-red-500">*</span>
              </label>
              <FieldTooltip field="nokFullName" />
            </div>
            <input
              type="text"
              className={`w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 transition-all outline-none ${errors.fullName && touched.fullName ? 'border-red-500' : 'border-outline-variant'}`}
              placeholder="First and Last Name"
              value={nextOfKin.fullName}
              onChange={(e) => { setNextOfKin({ fullName: e.target.value }); if (touched.fullName) validate("fullName", e.target.value); }}
              onBlur={() => validate("fullName", nextOfKin.fullName)}
            />
            {errors.fullName && touched.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label-md text-label-md text-on-surface">
                Relationship <span className="text-red-500">*</span>
              </label>
              <FieldTooltip field="nokRelationship" />
            </div>
            <select
              className={`w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 transition-all outline-none ${errors.relationship && touched.relationship ? 'border-red-500' : 'border-outline-variant'}`}
              value={nextOfKin.relationship}
              onChange={(e) => { setNextOfKin({ relationship: e.target.value }); if (touched.relationship) validate("relationship", e.target.value); }}
              onBlur={() => validate("relationship", nextOfKin.relationship)}
            >
              <option value="">Select</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Child">Child</option>
              <option value="Other">Other</option>
            </select>
            {errors.relationship && touched.relationship && <p className="text-red-500 text-sm mt-1">{errors.relationship}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label-md text-label-md text-on-surface">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <FieldTooltip field="nokMobileNumber" />
            </div>
            <input
              type="tel"
              className={`w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 transition-all outline-none ${errors.mobileNumber && touched.mobileNumber ? 'border-red-500' : 'border-outline-variant'}`}
              placeholder="+263 7X XXX XXXX"
              value={nextOfKin.mobileNumber}
              onChange={(e) => { setNextOfKin({ mobileNumber: e.target.value }); if (touched.mobileNumber) validate("mobileNumber", e.target.value, contactDetails.mobileNumber); }}
              onBlur={() => validate("mobileNumber", nextOfKin.mobileNumber, contactDetails.mobileNumber)}
            />
            {errors.mobileNumber && touched.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="font-label-md text-label-md text-on-surface">
                Address <span className="text-red-500">*</span>
              </label>
              <FieldTooltip field="nokAddress" />
            </div>
            <textarea
              className={`w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 transition-all outline-none min-h-[100px] ${errors.address && touched.address ? 'border-red-500' : 'border-outline-variant'}`}
              placeholder="Full physical address"
              value={nextOfKin.address}
              onChange={(e) => { setNextOfKin({ address: e.target.value }); if (touched.address) validate("address", e.target.value); }}
              onBlur={() => validate("address", nextOfKin.address)}
            />
            {errors.address && touched.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>
        </div>
      </div>

      {/* Navigation - Hidden on mobile, handled by layout */}
      <div className="mt-8 hidden lg:flex justify-between items-center">
        <button
          onClick={() => router.push("/apply/employment-details")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!nextOfKin.fullName || !nextOfKin.relationship || !nextOfKin.mobileNumber || !nextOfKin.address}
          className="flex items-center gap-2 px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
