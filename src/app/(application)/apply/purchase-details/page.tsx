"use client";

import { useApplicationStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const { purchaseDetails, setPurchaseDetails } = useApplicationStore();

  const handleNext = () => {
    router.push("/apply/basic-info");
  };

  const balance = (Number(purchaseDetails.loanAmount) || 0) - (Number(purchaseDetails.repaymentTerm) || 0); // Simplified calculation for demo

  return (
    <div className="w-full">
      {/* Stepper Progress */}
      <div className="relative pt-4">
        <div className="flex mb-4 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full text-secondary bg-secondary/10 border border-secondary/20">
              Step 2 of 7
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-secondary">
              28% Complete
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-8 text-xs flex rounded-full bg-outline-variant shadow-inner">
          <div className="shadow-none flex flex-col text-center whitespace-nowrap text-on-secondary justify-center bg-secondary w-[85%] transition-all duration-500 rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl p-6 md:p-8 border border-outline-variant shadow-sm">
            <h1 className="font-h2 text-h2 mb-2 text-primary">Purchase Details</h1>
            <p className="text-on-surface-variant mb-8 font-body-md">Finalize your purchase information and review the balance summary.</p>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-label-md text-label-md mb-2 text-on-surface">Description of Items</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30 min-h-[120px]" 
                    placeholder="Describe the items you are purchasing (e.g., Solar panels, Furniture, etc.)"
                    value={purchaseDetails.productType}
                    onChange={(e) => setPurchaseDetails({ productType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md mb-2 text-on-surface">Loan Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 font-bold">$</span>
                    <input 
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/30" 
                      placeholder="0.00" 
                      type="number"
                      value={purchaseDetails.loanAmount}
                      onChange={(e) => setPurchaseDetails({ loanAmount: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md mb-2 text-on-surface">Repayment Term (Months)</label>
                  <select 
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none appearance-none"
                    value={purchaseDetails.repaymentTerm}
                    onChange={(e) => setPurchaseDetails({ repaymentTerm: e.target.value })}
                  >
                    <option value="">Select Term...</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                    <option value="48">48 Months</option>
                    <option value="60">60 Months</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 p-6 bg-surface-container rounded-xl border border-dashed border-outline-variant shadow-inner">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Monthly Installment (Est.)</p>
                    <h2 className="text-3xl font-extrabold text-secondary mt-1">
                      ${purchaseDetails.loanAmount && purchaseDetails.repaymentTerm ? (Number(purchaseDetails.loanAmount) / Number(purchaseDetails.repaymentTerm)).toFixed(2) : "0.00"}
                    </h2>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-secondary">check_circle</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Link className="px-8 py-3 rounded-xl border-2 border-secondary text-secondary font-semibold hover:bg-secondary/5 transition-all active:scale-95 flex items-center justify-center" href="/apply/next-of-kin">
              Back
            </Link>
            <button 
              className="px-12 py-3 rounded-xl bg-secondary text-on-secondary font-bold shadow-lg shadow-secondary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center" 
              onClick={handleNext}
            >
              Review Application
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface rounded-xl overflow-hidden border border-outline-variant shadow-sm">
            <div className="h-32 bg-surface-container relative overflow-hidden">
              <img className="w-full h-full object-cover grayscale opacity-60 mix-blend-overlay" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPZQau_FYMoMEFsCabh48mKmychmn56ghqKSB4xLAvvQLn6m0mz2WjttRibk23meur912xV1NDZfyuKaqDGMi5qFouuHJjY_qBgR0jxjaZQaLyKT1XggrMvX1ZC3OVJSp3e4FMhIYIHLBoRf00yRb6HoybhHHn_96a8J-iiThKFdLKJAbPmfG3dHaj2tkm6VxyvdcpYFi-DTMQXTCgtpZJ-K5iem8EELrlcn9RtRPuRMboVs_NoLJj8jNIoZuKaskB945f1LzT1MGm" alt="Summary" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <h4 className="text-on-primary-container font-bold tracking-wide">Purchase Summary</h4>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant text-sm">Agreement ID</span>
                <span className="font-bold text-sm text-on-surface">HTB-2026-X84</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant text-sm">Processing Fee</span>
                <span className="font-bold text-sm text-on-surface">$250.00</span>
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Institutional Grade</span>
                </div>
                <p className="text-[10px] text-on-surface-variant/60 leading-relaxed italic">This purchase is subject to the standard HTB GLOBAL lending terms and conditions.</p>
              </div>
            </div>
          </div>
          <div className="bg-primary-container rounded-xl p-6 text-on-primary-container border border-outline shadow-xl relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-secondary/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined mb-2 text-secondary">support_agent</span>
              <h4 className="font-bold mb-1">Assistance</h4>
              <p className="text-sm opacity-80 mb-4 leading-relaxed">Our institutional advisors are available 24/7.</p>
              <button className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-black/20">
                Chat Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
