"use client";

import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const { purchaseDetails, setPurchaseDetails, selectedStoreName, lookup } = useApplicationStore();

  const retailPrice = parseFloat(purchaseDetails.retailPrice) || 0;
  const depositAmount = parseFloat(purchaseDetails.depositAmount) || 0;
  const balanceAmount = Math.max(0, retailPrice - depositAmount);

  const handleNext = () => {
    router.push("/apply/basic-info");
  };

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-2 block">Step 3 of 8</span>
            <h1 className="font-h1 text-primary mb-2">Purchase Details</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Enter the details of the items being purchased on loan.
            </p>
          </div>
          {selectedStoreName && (
            <div className="flex items-center gap-2 shrink-0 bg-secondary/10 border border-secondary/20 px-4 py-2 rounded-xl">
              <span className="material-symbols-outlined text-secondary text-sm">store</span>
              <span className="text-secondary font-bold text-sm">{selectedStoreName}</span>
            </div>
          )}
        </div>
        <div className="mt-6 relative w-full h-2 bg-outline-variant rounded-full overflow-hidden shadow-inner">
          <div className="absolute left-0 top-0 h-full bg-secondary w-[28%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
        </div>
      </div>

      {lookup.nationalId && (
        <div className="mb-6 flex items-center gap-3 bg-surface border border-outline-variant px-4 py-3 rounded-xl">
          <span className="material-symbols-outlined text-secondary">badge</span>
          <span className="text-on-surface-variant text-sm">Your ID: <span className="font-mono font-bold text-on-surface">{lookup.nationalId}</span></span>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="font-h2 text-primary border-b border-outline-variant/30 pb-4">Item Information</h2>

        {/* Product Name */}
        <div>
          <label className="block font-label-md text-label-md mb-2 text-on-surface">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
            placeholder="e.g. Samsung 65-inch Smart TV"
            value={purchaseDetails.productName}
            onChange={(e) => setPurchaseDetails({ productName: e.target.value })}
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block font-label-md text-label-md mb-2 text-on-surface">
              Retail Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
                placeholder="0.00"
                value={purchaseDetails.retailPrice}
                onChange={(e) => setPurchaseDetails({ retailPrice: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block font-label-md text-label-md mb-2 text-on-surface">
              Deposit Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30"
                placeholder="0.00"
                value={purchaseDetails.depositAmount}
                onChange={(e) => setPurchaseDetails({ depositAmount: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Auto-calculated Balance */}
        <div className="md:col-span-2 pt-4">
          <div className="bg-secondary/5 rounded-2xl border-2 border-dashed border-secondary/20 p-6 flex flex-col items-center justify-center text-center group relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">Balance Amount</span>
              <span className="material-symbols-outlined text-[16px] text-secondary/40 cursor-help">help</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-secondary text-on-secondary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                Remaining amount to be financed (Retail Price minus Deposit).
              </div>
            </div>
            <p className="font-h1 text-secondary text-3xl">
              ${balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-on-surface-variant/60 mt-1">Automatically calculated</p>
            {retailPrice > 0 && depositAmount > retailPrice && (
              <p className="text-red-500 text-xs mt-1">Deposit exceeds retail price</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation - Hidden on mobile, handled by layout */}
      <div className="mt-8 hidden lg:flex justify-between items-center">
        <button
          onClick={() => router.push("/apply/lookup")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!purchaseDetails.productName || !purchaseDetails.retailPrice}
          className="flex items-center gap-2 px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
