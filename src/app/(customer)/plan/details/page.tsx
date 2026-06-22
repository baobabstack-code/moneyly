"use client";

import { useFinanceStore } from "@/lib/financeStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const { purchaseDetails, setPurchaseDetails, currency } = useFinanceStore();

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const handleAddCustomField = () => {
    if (!newFieldName.trim() || !newFieldValue.trim()) return;
    const updated = {
      ...(purchaseDetails.customFields || {}),
      [newFieldName.trim()]: newFieldValue.trim()
    };
    setPurchaseDetails({ customFields: updated });
    setNewFieldName("");
    setNewFieldValue("");
  };

  const handleRemoveCustomField = (key: string) => {
    const updated = { ...(purchaseDetails.customFields || {}) };
    delete updated[key];
    setPurchaseDetails({ customFields: updated });
  };

  const currencySymbol = (() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' };
    return map[currency] || '$';
  })();

  const plannedCost = parseFloat(purchaseDetails.plannedCost) || 0;
  const savedAmount = parseFloat(purchaseDetails.savedAmount) || 0;
  const balanceAmount = Math.max(0, plannedCost - savedAmount);
  const tenure = parseInt(purchaseDetails.tenureMonths) || 0;
  const installmentAmount = tenure > 0 ? balanceAmount / tenure : 0;

  const handleNext = () => router.push("/plan/documents");

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-2 block">Step 1 of 3</span>
            <h1 className="font-h1 text-primary mb-2">New Goal / Milestone</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Enter the item details, budget, saved amount, and goal timeline.
            </p>
          </div>
        </div>
        <div className="mt-6 relative w-full h-2 bg-outline-variant rounded-full overflow-hidden shadow-inner">
          <div className="absolute left-0 top-0 h-full bg-secondary w-[33%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-outline-variant shadow-lg p-6 md:p-8 space-y-6">
        <h2 className="font-h2 text-primary border-b border-outline-variant/30 pb-4">Goal Information</h2>

        {/* Product Name */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
            Item or Goal Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold placeholder:text-on-surface-variant/30"
            placeholder="e.g. New laptop, school fees, family trip"
            value={purchaseDetails.productName}
            onChange={(e) => setPurchaseDetails({ productName: e.target.value })}
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              Planned Cost <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold placeholder:text-on-surface-variant/30"
                placeholder="0.00"
                value={purchaseDetails.plannedCost}
                onChange={(e) => setPurchaseDetails({ plannedCost: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              Saved Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold placeholder:text-on-surface-variant/30"
                placeholder="0.00"
                value={purchaseDetails.savedAmount}
                onChange={(e) => setPurchaseDetails({ savedAmount: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Tenure + Balance row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Tenure input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              Goal Timeline (months) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 12"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold placeholder:text-on-surface-variant/30"
              value={purchaseDetails.tenureMonths}
              onChange={(e) => setPurchaseDetails({ tenureMonths: e.target.value })}
            />
          </div>

          {/* Balance — read only */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">Cash Needed</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
              <input
                type="text"
                readOnly
                title="Cash needed"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface outline-none cursor-default select-none font-bold"
                value={balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              />
            </div>
            {plannedCost > 0 && savedAmount > plannedCost && (
              <p className="text-red-500 text-xs mt-1">Saved amount exceeds planned cost</p>
            )}
          </div>
        </div>

        {/* Custom Fields Section */}
        <div className="border-t border-outline-variant/30 pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Additional Custom Fields</h3>
          <p className="text-xs text-on-surface-variant mb-4">
            Add custom attributes to this goal (e.g. "Priority", "Category Tag") without code changes.
          </p>

          {/* Render existing custom fields */}
          {purchaseDetails.customFields && Object.keys(purchaseDetails.customFields).length > 0 && (
            <div className="space-y-2 mb-4">
              {Object.entries(purchaseDetails.customFields).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-2 text-sm">
                  <span className="font-semibold text-primary">{key}: <span className="font-normal text-on-surface">{value}</span></span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(key)}
                    className="text-error hover:text-error/80 flex items-center justify-center p-1"
                    title="Remove field"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form to add a new custom field */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 ml-1 block mb-1">Field Name</label>
              <input
                type="text"
                placeholder="e.g. Priority"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-bold"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 ml-1 block mb-1">Field Value</label>
              <input
                type="text"
                placeholder="e.g. High"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-bold"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCustomField}
              disabled={!newFieldName.trim() || !newFieldValue.trim()}
              className="px-4 py-2 bg-secondary/15 hover:bg-secondary/25 text-secondary text-xs font-bold rounded-lg transition-all h-[36px] flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add Field
            </button>
          </div>
        </div>

        {/* Monthly bill */}
        <div className="bg-secondary/5 rounded-2xl border-2 border-dashed border-secondary/20 p-6 flex flex-col items-center justify-center text-center group relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">Monthly Commitment</span>
            <span className="material-symbols-outlined text-[16px] text-secondary/40 cursor-help">help</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-secondary text-on-secondary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl">
              Cash needed divided by goal timeline. This is your estimated monthly budget line.
            </div>
          </div>
          <p className="font-h1 text-secondary text-3xl">
            {installmentAmount > 0
              ? `${currencySymbol}${installmentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </p>
          <p className="text-[10px] text-on-surface-variant/60 mt-1">
            {tenure > 0 ? `over ${tenure} months` : "Enter goal timeline to calculate"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!purchaseDetails.productName || !purchaseDetails.plannedCost || !purchaseDetails.tenureMonths}
          className="flex items-center gap-2 px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
