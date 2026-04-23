"use client";

import { useApplicationStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ApplicationSummaryPage() {
  const router = useRouter();
  const { basicInfo, contactDetails, employmentDetails, purchaseDetails } = useApplicationStore();

  const handleApprove = () => {
    router.push("/success");
  };

  return (
    <div className="w-full pb-32">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-stack-lg">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-secondary font-bold text-[10px] uppercase tracking-widest">Step 7 of 7</span>
            <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden max-w-[160px] shadow-inner">
              <div className="bg-secondary h-full w-full shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-secondary/20">Institutional Review</span>
            <span className="text-on-surface-variant/60 text-xs font-bold tracking-tight">APP-2026-X842</span>
          </div>
          <h1 className="font-h1 text-primary leading-tight">Review Application</h1>
          <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">
            Final summary for <span className="font-bold text-on-surface">{basicInfo.firstName} {basicInfo.lastName}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button className="w-full sm:w-auto px-6 py-3 border border-outline-variant text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container transition-all active:scale-95 shadow-sm">Download PDF</button>
          <button 
            className="w-full sm:w-auto px-8 py-3 bg-secondary text-on-secondary font-bold text-sm rounded-xl hover:opacity-90 shadow-lg shadow-secondary/20 transition-all active:scale-95" 
            onClick={handleApprove}
          >
            Submit Now
          </button>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Main Loan Details */}
        <div className="md:col-span-8 bg-surface border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-h3 text-h3 text-primary">Financial Overview</h3>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">payments</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1 tracking-wider">Loan Amount</p>
              <p className="text-h3 font-bold text-on-surface">${purchaseDetails.loanAmount || "0"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1 tracking-wider">Repayment Term</p>
              <p className="text-h3 font-bold text-on-surface">{purchaseDetails.repaymentTerm || "0"} Mo</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1 tracking-wider">Status</p>
              <p className="text-h3 font-bold text-secondary">Ready</p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-outline-variant grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-on-surface mb-4 uppercase tracking-wider">Personal Information</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Full Name</span>
                  <span className="font-medium text-on-surface">{basicInfo.firstName} {basicInfo.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">ID Number</span>
                  <span className="font-medium text-on-surface">{basicInfo.idNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Email</span>
                  <span className="font-medium text-on-surface">{contactDetails.email}</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container rounded-lg p-4 flex items-center gap-4 border border-outline-variant/30">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-secondary">verified</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Identity Verified</p>
                <p className="text-[10px] text-on-surface-variant">Biometric check successful</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-bl-full"></div>
            <h3 className="font-h3 text-h3 text-primary mb-6">Employment</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider">Employer</p>
                <p className="text-sm font-bold text-on-surface">{employmentDetails.employerName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider">Position</p>
                <p className="text-sm font-bold text-on-surface">{employmentDetails.jobTitle}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider">Monthly Income</p>
                <p className="text-sm font-bold text-on-surface">${employmentDetails.monthlyIncome}</p>
              </div>
            </div>
          </div>

          <div className="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-xl border border-outline relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-secondary/20 rounded-full blur-2xl"></div>
            <h4 className="font-bold mb-2 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-secondary">security</span>
              Security Guarantee
            </h4>
            <p className="text-xs opacity-80 leading-relaxed relative z-10">
              Your application is protected by HTB GLOBAL's institutional security protocols and end-to-end encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
