"use client";

import { useEffect, useState } from "react";
import { useApplicationStore } from "@/lib/store";

export default function AutoSaveDraft() {
  const state = useApplicationStore();
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // This component simply watches the store. 
  // Since we switched to localStorage in the store definition, 
  // Zustand handles the persistence automatically.
  // This component provides the visual "Draft Saved" feedback.
  
  useEffect(() => {
    // We ignore the initial mount
    if (lastSaved === null) {
      setLastSaved(Date.now());
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(Date.now());
    }, 1000);

    return () => clearTimeout(timer);
  }, [state.lookup, state.basicInfo, state.contactDetails, state.employmentDetails, state.nextOfKin, state.purchaseDetails, state.documentUploads]);

  if (!lastSaved) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-3 py-1.5 bg-surface/80 backdrop-blur-md border border-outline-variant rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4">
      <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {isSaving ? 'Saving Draft...' : 'Draft Saved'}
      </span>
    </div>
  );
}
