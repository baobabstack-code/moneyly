"use client";

import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateLoanPDF } from "@/utils/pdf-generator";
import { createClient } from "@/utils/supabase/client";

export default function SummaryPage() {
  const router = useRouter();
  const { basicInfo, contactDetails, employmentDetails, nextOfKin, purchaseDetails, selectedStoreName, selectedStoreId, lookup, documentUploads } = useApplicationStore();
  const setLastReference = useApplicationStore((s) => s.setLastReference);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const retailPrice = parseFloat(purchaseDetails.retailPrice) || 0;
  const depositAmount = parseFloat(purchaseDetails.depositAmount) || 0;
  const balanceAmount = Math.max(0, retailPrice - depositAmount);

  /**
   * Finalizes the application by gathering all collected data and pushing it to the backend.
   * 
   * CORE GOAL: This function is the primary integration point. 
   * It should take the state from 'useApplicationStore' and POST it to:
   * 1. Supabase (Initial phase - Postgres DB)
   * 2. Microsoft 365 APIs (Future phase - as per product brief)
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const retailPrice = parseFloat(purchaseDetails.retailPrice) || 0;
      const depositAmount = parseFloat(purchaseDetails.depositAmount) || 0;
      const balance = Math.max(0, retailPrice - depositAmount);
      const reference = `LN-${Math.floor(Math.random() * 9000) + 1000}`;

      // 1. Save application to Supabase
      const { error: dbError } = await supabase.from('applications').insert({
        user_id:         user?.id ?? null,
        reference,
        status:          'submitted',
        store_id:        selectedStoreId,
        store_name:      selectedStoreName,
        national_id:     lookup.nationalId,
        product_name:    purchaseDetails.productName,
        retail_price:    retailPrice,
        deposit_amount:  depositAmount,
        balance_amount:  balance,
        first_name:      basicInfo.firstName,
        last_name:       basicInfo.lastName,
        date_of_birth:   basicInfo.dateOfBirth,
        gender:          basicInfo.gender,
        photo_url:       basicInfo.photoUrl || null,
        physical_address: contactDetails.physicalAddress,
        mobile_number:   contactDetails.mobileNumber,
        email_address:   contactDetails.emailAddress || user?.email,
        employer_name:   employmentDetails.employerName,
        is_civil_servant: employmentDetails.isCivilServant ?? false,
        employer_no:     employmentDetails.employerNo || null,
        ministry:        employmentDetails.ministry || null,
        employer_phone:  employmentDetails.phoneNumber,
        kin_full_name:   nextOfKin.fullName,
        kin_relationship: nextOfKin.relationship,
        kin_mobile:      nextOfKin.mobileNumber,
        kin_address:     nextOfKin.address,
        // NEW: Document Uploads
        id_copy_url:     documentUploads.idCopyUrl || null,
        payslip_url:     documentUploads.payslipUrl || null,
      });

      if (dbError) {
        console.error('Supabase save error:', dbError);
        throw new Error(`Failed to save application: ${dbError.message}`);
      }

      // 2. Generate PDF and email it
      const applicationData = {
        lookup, basicInfo, contactDetails, employmentDetails,
        nextOfKin, purchaseDetails, selectedStoreName,
        lastReference: reference,
        documentUploads, // Pass docs to PDF
      };
      const pdfDataUri = await generateLoanPDF(applicationData);
      const targetEmail = contactDetails.emailAddress || user?.email;

      const response = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          pdfBase64: pdfDataUri,
          customerName: `${basicInfo.firstName} ${basicInfo.lastName}`,
          reference,
        })
      });

      if (!response.ok) {
        // Don't block the user — DB save already succeeded
        console.warn('Email delivery failed, but application was saved.');
      }

      useApplicationStore.getState().addNotification(
        `Loan application for ${basicInfo.firstName || 'you'} (${reference}) has been submitted successfully.`,
        'success'
      );

      setLastReference(reference);
      router.push("/success");
    } catch (error: any) {
      console.error('Submission error:', error);
      useApplicationStore.getState().addNotification(
        `Error submitting application: ${error.message}. Please try again.`,
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      title: "Store & Profile",
      data: [
        { label: "Store", value: selectedStoreName },
        { label: "National ID", value: lookup.nationalId },
      ]
    },
    {
      title: "Purchase Details",
      data: [
        { label: "Product Name", value: purchaseDetails.productName },
        { label: "Retail Price", value: `$${retailPrice.toFixed(2)}` },
        { label: "Deposit Amount", value: `$${depositAmount.toFixed(2)}` },
        { label: "Balance Amount", value: `$${balanceAmount.toFixed(2)}` },
      ],
    },
    {
      title: "Personal Information",
      data: [
        { label: "Name", value: `${basicInfo.firstName} ${basicInfo.lastName}` },
        { label: "Date of Birth", value: basicInfo.dateOfBirth },
        { label: "Gender", value: basicInfo.gender },
      ],
    },
    {
      title: "Contact Details",
      data: [
        { label: "Mobile Number", value: contactDetails.mobileNumber },
        { label: "Email Address", value: contactDetails.emailAddress },
        { label: "Physical Address", value: contactDetails.physicalAddress },
      ],
    },
    {
      title: "Employment Details",
      data: [
        { label: "Employer Name", value: employmentDetails.employerName },
        { label: "Civil Servant?", value: employmentDetails.isCivilServant ? "Yes" : "No" },
        ...(employmentDetails.isCivilServant
          ? [
              { label: "Employer No.", value: employmentDetails.employerNo },
              { label: "Ministry", value: employmentDetails.ministry },
            ]
          : []),
        { label: "Employer Phone", value: employmentDetails.phoneNumber },
      ],
    },
    {
      title: "Next of Kin",
      data: [
        { label: "Full Name", value: nextOfKin.fullName },
        { label: "Relationship", value: nextOfKin.relationship },
        { label: "Mobile Number", value: nextOfKin.mobileNumber },
        { label: "Address", value: nextOfKin.address },
      ],
    },
    {
      title: "Documents Provided",
      data: [
        { label: "National ID Copy", value: documentUploads.idCopyUrl ? "✅ Uploaded" : "❌ Missing" },
        { label: "Latest Payslip", value: documentUploads.payslipUrl ? "✅ Uploaded" : "❌ Missing" },
      ],
    },
  ];

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-secondary font-bold text-[10px] uppercase tracking-widest block">Step 7 of 7</span>
              <div className="group relative">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 cursor-help">help</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-on-primary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl text-center font-body-md normal-case tracking-normal">
                  Final review of all information provided before submission.
                </div>
              </div>
            </div>
            <h1 className="font-h1 text-primary mb-2">Application Summary</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Please review the details below before submitting the application.
            </p>
          </div>
        </div>
        <div className="mt-6 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
          <div className="bg-green-500 h-full w-full transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
        </div>
      </div>

      <div className="space-y-6">
        {basicInfo.photoUrl && (
          <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-outline-variant">
              <img src={basicInfo.photoUrl} alt="Your profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-on-surface">Photo Verified</p>
              <p className="text-sm text-on-surface-variant">Selfie captured during application</p>
            </div>
            {/* Displaying Document status in a compact way */}
            <div className="flex gap-2">
              {documentUploads.idCopyUrl && <span className="material-symbols-outlined text-secondary" title="ID Provided">badge</span>}
              {documentUploads.payslipUrl && <span className="material-symbols-outlined text-secondary" title="Payslip Provided">payments</span>}
            </div>
          </div>
        )}

        {sections.map((section, idx) => (
          <div key={idx} className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="bg-surface-container px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="font-bold text-primary">{section.title}</h2>
              {/* Optional Edit button could go here */}
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.data.map((item, i) => (
                  <div key={i}>
                    <dt className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant/60 mb-1">
                      {item.label}
                    </dt>
                    <dd className="text-sm font-medium text-on-surface break-words">
                      {item.value || <span className="text-on-surface-variant/40 italic">Not provided</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}

        <div className="bg-secondary/5 rounded-2xl border border-secondary/20 p-6 flex items-start gap-4">
          <span className="material-symbols-outlined text-secondary mt-1">info</span>
          <div>
            <h3 className="font-bold text-secondary mb-1">Final Submission</h3>
            <p className="text-sm text-on-surface-variant">
              By clicking submit, you confirm that all provided information is accurate and correct to the best of your knowledge.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Hidden on mobile, handled by layout */}
      <div className="mt-8 hidden lg:flex justify-between items-center">
        <button
          onClick={() => router.push("/apply/next-of-kin")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium text-sm"
          disabled={isSubmitting}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          id="final-submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-3 px-8 py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-600/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
             <>
               <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
               </svg>
               Submitting Application...
             </>
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  );
}
