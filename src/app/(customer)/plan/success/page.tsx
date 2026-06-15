"use client";

import Link from "next/link";
import { useFinanceStore } from "@/lib/financeStore";
import { generatePlanPDF } from "@/utils/pdf-generator";

export default function SuccessPage() {
  const store = useFinanceStore();
  const { clearPurchaseDetails, lastReference } = store;

  const handleDownloadPDF = async () => {
    try {
      const pdfDataUri = await generatePlanPDF({
        ...store,
        customerName: 'Valued Member'
      });
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `Moneyly-Goal-${lastReference || 'Summary'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("PDF Generation failed:", error);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12">
      <div className="max-w-4xl w-full px-4">
        {/* Success Hero Section */}
        <div className="bg-surface rounded-3xl border border-outline-variant p-12 shadow-xl text-center relative overflow-hidden">
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mb-8 shadow-inner group">
              <span className="material-symbols-outlined text-secondary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            
            <h1 className="font-h1 text-4xl text-primary mb-4">Goal Saved</h1>
            <p className="text-xl text-on-surface max-w-2xl mx-auto mb-10 leading-relaxed font-body-md">
              Your goal is now part of your Moneyly dashboard, where it can shape budgets, bills, savings goals, and cash-flow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Link 
                onClick={() => clearPurchaseDetails()}
                className="bg-secondary text-on-secondary px-12 py-3 rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 transition-all active:scale-95 inline-flex items-center justify-center" 
                href="/dashboard"
              >
                Go to My Dashboard
              </Link>
              <button 
                onClick={handleDownloadPDF}
                className="border-2 border-outline-variant text-on-surface px-10 py-3 rounded-xl font-bold transition-all active:scale-95 hover:bg-surface-container flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                View Goal PDF
              </button>
            </div>
          </div>
        </div>

        {/* Bento Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Confirmation ID */}
          <div className="bg-surface p-8 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-secondary mb-4">receipt_long</span>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">Goal Reference</h3>
              <p className="text-2xl font-bold text-on-surface">{lastReference || '#PLN-XXXX'}</p>
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-4 italic">Please keep this for your records</p>
          </div>

          {/* Next Steps */}
          <div className="md:col-span-2 bg-surface p-8 rounded-2xl border border-outline-variant shadow-sm">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">timeline</span>
              Next Steps
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20 shadow-inner">
                  <span className="text-secondary font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">Review your dashboard</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Check how this goal changes your budget, savings progress, and monthly cash-flow.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/30">
                  <span className="text-on-surface-variant font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">Keep documents updated</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Use the attached documents/invoices as planning records for your goal and update the goal details as they progress.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
