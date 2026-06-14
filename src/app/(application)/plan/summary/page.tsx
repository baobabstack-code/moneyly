"use client";

import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generatePlanPDF } from "@/utils/pdf-generator";
import { createClient } from "@/utils/supabase/client";

export default function SummaryPage() {
  const router = useRouter();

  const { purchaseDetails, fileUrl, setLastReference, currency } = useApplicationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencySymbol = (() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$' };
    return map[currency] || '$';
  })();

  const plannedCost = parseFloat(purchaseDetails.plannedCost) || 0;
  const savedAmount = parseFloat(purchaseDetails.savedAmount) || 0;
  const balanceAmount = Math.max(0, plannedCost - savedAmount);
  const tenureMonths = parseInt(purchaseDetails.tenureMonths) || 12;
  const monthlyCommitment = tenureMonths > 0 ? balanceAmount / tenureMonths : 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      const reference = `PLN-${Math.floor(Math.random() * 9000) + 1000}`;

      // Insert into the new spending_plans table
      const { error: dbError } = await supabase.from('spending_plans').insert({
        user_id:          user?.id ?? null,
        reference,
        status:           'active',
        store_name:       null,
        product_name:     purchaseDetails.productName,
        planned_cost:     plannedCost,
        saved_amount:     savedAmount,
        tenure_months:    tenureMonths,
        file_url:         fileUrl || null,
      });

      if (dbError) {
        console.error('Supabase save error:', dbError);
        throw new Error(`Failed to save spending plan: ${dbError.message}`);
      }

      // Generate PDF with simplified personal finance details
      const planData = {
        purchaseDetails,
        lastReference: reference,
        fileUrl,
        customerName: profile?.full_name || user?.email || 'Valued Member',
        currency,
      };
      
      const pdfDataUri = await generatePlanPDF(planData);
      const targetEmail = user?.email;

      if (targetEmail) {
        const response = await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            pdfBase64: pdfDataUri,
            customerName: profile?.full_name || user?.email || 'Valued Member',
            reference,
          })
        });

        if (!response.ok) {
          console.warn('Email delivery failed, but the spending plan was saved.');
        }
      }

      useApplicationStore.getState().addNotification(
        `Spending plan for "${purchaseDetails.productName}" (${reference}) has been saved successfully.`,
        'success'
      );

      setLastReference(reference);
      router.push("/plan/success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Submission error:', error);
      useApplicationStore.getState().addNotification(
        `Error saving spending plan: ${message}. Please try again.`,
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      title: "Spending Plan Details",
      data: [
        { label: "Planned Item", value: purchaseDetails.productName },
        { label: "Planned Cost", value: `${currencySymbol}${plannedCost.toFixed(2)}` },
        { label: "Saved Amount", value: `${currencySymbol}${savedAmount.toFixed(2)}` },
        { label: "Cash Needed", value: `${currencySymbol}${balanceAmount.toFixed(2)}` },
        { label: "Plan Length", value: `${tenureMonths} months` },
        { label: "Estimated Monthly Commitment", value: `${currencySymbol}${monthlyCommitment.toFixed(2)}` },
      ],
    },
    ...(fileUrl ? [{
      title: "Supporting Files",
      data: [
        { label: "Receipt / Invoice", value: "Attached" },
      ],
    }] : []),
  ];

  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-stack-lg">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-secondary font-bold text-[10px] uppercase tracking-widest block">Step 3 of 3</span>
              <div className="group relative">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 cursor-help">help</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-on-primary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl text-center font-body-md normal-case tracking-normal">
                  Final review before saving this spending plan.
                </div>
              </div>
            </div>
            <h1 className="font-h1 text-primary mb-2">Plan Summary</h1>
            <p className="font-body-md text-on-surface-variant max-w-xl">
              Please review the details below before saving your spending plan.
            </p>
          </div>
        </div>
        <div className="mt-6 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
          <div className="bg-green-500 h-full w-full transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="bg-surface-container px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="font-bold text-primary">{section.title}</h2>
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
            <h3 className="font-bold text-secondary mb-1">Save Spending Plan</h3>
            <p className="text-sm text-on-surface-variant">
              By saving, you confirm that these planning details are accurate and will be added to your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 hidden lg:flex justify-between items-center">
        <button
          type="button"
          onClick={() => router.push("/plan/documents")}
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
               Saving Plan...
             </>
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              Save Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
