"use client";

import { useState, useEffect } from "react";
import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { getMyProfile } from "@/lib/profile";

export default function LookupPage() {
  const router = useRouter();
  const { lookup, setLookup, selectedStoreName } = useApplicationStore();
  const [nationalId, setNationalId] = useState(lookup.nationalId);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);

  // Pre-fill National ID from user's profile if available
  useEffect(() => {
    if (!lookup.nationalId) {
      getMyProfile().then(p => {
        if (p?.national_id) {
          setNationalId(p.national_id);
          setLookup({ nationalId: p.national_id });
        }
      });
    }
  }, []);

  const handleSearch = async () => {
    if (!nationalId.trim()) return;
    setIsSearching(true);
    setSearchDone(false);

    // Normalize: strip dashes and spaces for comparison
    const normalized = nationalId.toUpperCase().replace(/[\s-]/g, "");

    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();
    // Query using normalized form — Postgres strips dashes/spaces on both sides
    const { data } = await supabase.rpc("find_profile_by_national_id", {
      search_id: normalized,
    });

    const found = !!data;
    setLookup({ nationalId, customerFound: found });
    setCustomerFound(found);
    setIsSearching(false);
    setSearchDone(true);
  };

  /**
   * Routes the user based on the search result.
   * 
   * NEW CUSTOMERS: Proceed through all 8 steps.
   * EXISTING CUSTOMERS: Can potentially skip to 'Purchase Details' (Step 3).
   */
  const handleContinue = () => {
    // We currently send both to purchase-details, but existing customers
    // will have their later forms (Personal, Contact, etc.) pre-filled.
    router.push("/apply/purchase-details");
  };

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-2 block">Step 2 of 8</span>
            <h1 className="font-h1 text-primary mb-2">Verify Identity</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Enter your National ID to check if you are already registered.
            </p>
          </div>
          {selectedStoreName && (
            <div className="flex items-center gap-2 shrink-0 bg-secondary/10 border border-secondary/20 px-4 py-2 rounded-xl">
              <span className="material-symbols-outlined text-secondary text-sm">store</span>
              <span className="text-secondary font-bold text-sm">{selectedStoreName}</span>
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-6 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
          <div className="bg-secondary h-full w-[14%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
        </div>
      </div>

      {/* Search Card */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">badge</span>
            </div>
            <div>
              <h2 className="font-bold text-on-surface text-lg">National ID Search</h2>
              <p className="text-on-surface-variant text-sm">Enter your ID number below</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">
                search
              </span>
              <input
                type="text"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-lg font-mono tracking-widest placeholder:text-on-surface-variant/30 placeholder:font-sans placeholder:tracking-normal"
                placeholder="e.g. 80-123456 X 78"
                value={nationalId}
                onChange={(e) => {
                  setNationalId(e.target.value);
                  setSearchDone(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant/60 flex items-center gap-1 ml-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Enter ID exactly as it appears on the identity document
            </p>

            <button
              onClick={handleSearch}
              disabled={!nationalId.trim() || isSearching}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-base shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">search</span>
                  Verify Identity
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result States */}
        {searchDone && (
          <div className={`border-t ${customerFound ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900"} p-8`}>
            {customerFound ? (
              /* FOUND STATE — TODO: Populate with real customer data from DB */
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                  </div>
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-300">Identity Verified</p>
                    <p className="text-sm text-green-700 dark:text-green-400">Existing profile record retrieved</p>
                  </div>
                </div>
                <div className="bg-surface rounded-xl p-6 border border-green-200 dark:border-green-800 flex items-center gap-4 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-surface-container-highest border-2 border-secondary flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">account_circle</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-lg">Your Profile</p>
                    <p className="text-on-surface-variant text-sm">ID: {nationalId}</p>
                    <p className="text-secondary text-sm font-medium mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      All details pre-filled
                    </p>
                  </div>
                </div>
                <p className="text-sm text-green-950 dark:text-green-50 bg-green-50/80 dark:bg-green-900/20 p-4 rounded-2xl border-2 border-green-200 dark:border-green-800 font-bold shadow-sm">
                  <strong>Note:</strong> We found your profile in our system. You can skip directly to entering your purchase details.
                </p>
              </div>
            ) : (
              /* NOT FOUND STATE */
              <div className="space-y-4 bg-amber-50 dark:bg-transparent p-4 rounded-2xl border border-amber-200 dark:border-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-700 dark:text-amber-400">person_add</span>
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-300">Welcome to HTB</p>
                    <p className="text-sm text-amber-800 dark:text-amber-400">No record found for ID: <span className="font-mono font-bold">{nationalId}</span></p>
                  </div>
                </div>
                <div className="bg-white dark:bg-amber-900/20 p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-800 shadow-sm">
                  <p className="text-sm text-amber-900 dark:text-amber-50 leading-relaxed font-bold">
                    You&apos;re new to HTB Global. We&apos;ll need to collect some basic details to get your application started.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="mt-6 w-full py-4 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Continue
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
