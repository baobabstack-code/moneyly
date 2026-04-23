"use client";

import { useRef, useState } from "react";
import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function BasicInfoPage() {
  const router = useRouter();
  const { basicInfo, setBasicInfo } = useApplicationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(basicInfo.photoUrl || "");

  const handleNext = () => {
    router.push("/apply/contact-details");
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setBasicInfo({ photoUrl: result });
      setIsProcessing(false);
    };
    reader.onerror = () => {
      alert("Error reading file.");
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-2 block">Step 4 of 8</span>
            <h1 className="font-h1 text-primary mb-2">Personal Information</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Tell us a bit about yourself to complete your profile.
            </p>
          </div>
        </div>
        <div className="mt-6 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
          <div className="bg-secondary h-full w-[42%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Selfie Capture */}
        <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-on-surface">Your Photo</h2>
            <div className="group relative">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 cursor-help">help</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-on-primary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl">
                A clear, front-facing photo is required for identity verification.
              </div>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm mb-6">Take a selfie or upload a photo for identity verification.</p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Preview */}
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-secondary/40 overflow-hidden bg-surface-container flex items-center justify-center shrink-0 relative">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-surface/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {previewUrl ? (
                <img src={previewUrl} alt="Your selfie" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-4xl">account_circle</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">No Photo</span>
                </div>
              )}
            </div>

            {/* Camera Button */}
            <div className="flex flex-col gap-3 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handlePhotoCapture}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center justify-center gap-3 w-full py-4 border-2 border-secondary text-secondary rounded-xl font-bold hover:bg-secondary/5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">
                  {isProcessing ? "sync" : "photo_camera"}
                </span>
                {isProcessing ? "Processing..." : previewUrl ? "Retake Photo" : "Take Selfie / Upload Photo"}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => { setPreviewUrl(""); setBasicInfo({ photoUrl: "" }); }}
                  className="text-sm text-on-surface-variant/60 hover:text-red-500 transition-colors underline underline-offset-2"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 md:p-8 space-y-6">
          <h2 className="font-bold text-on-surface border-b border-outline-variant/30 pb-4">Personal Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-label-md text-label-md mb-2 text-on-surface">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
                placeholder="First name"
                value={basicInfo.firstName}
                onChange={(e) => setBasicInfo({ firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md mb-2 text-on-surface">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
                placeholder="Last name"
                value={basicInfo.lastName}
                onChange={(e) => setBasicInfo({ lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-label-md text-label-md mb-2 text-on-surface">Date of Birth</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
              value={basicInfo.dateOfBirth}
              onChange={(e) => setBasicInfo({ dateOfBirth: e.target.value })}
            />
          </div>

          {/* Gender — Big Pill Buttons as per brief */}
          <div>
            <label className="block font-label-md text-label-md mb-3 text-on-surface">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {["Male", "Female"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBasicInfo({ gender: g })}
                  className={`py-4 rounded-xl border-2 font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                    basicInfo.gender === g
                      ? "bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/20"
                      : "bg-surface text-on-surface-variant border-outline-variant hover:border-secondary/50 hover:bg-secondary/5"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {g === "Male" ? "male" : "female"}
                  </span>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Hidden on mobile, handled by layout */}
      <div className="mt-8 hidden lg:flex justify-between items-center">
        <button
          onClick={() => router.push("/apply/purchase-details")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!basicInfo.firstName || !basicInfo.lastName || !basicInfo.gender}
          className="flex items-center gap-2 px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
