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
  }, [state.purchaseDetails, state.fileUrl]);

  if (!lastSaved) return null;

  return (
    <div className="fixed top-20 right-6 z-[100] flex items-center gap-2 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl animate-in fade-in slide-in-from-right-4">
      <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white">
        {isSaving ? 'Saving Draft...' : 'Draft Saved'}
      </span>
    </div>
  );
}
