'use client';

/**
 * DashboardView — server-rendered data, client-interactive component.
 *
 * Receives profile and applications data from the dashboard server page.
 * Shows a "complete your profile" prompt if the profile is incomplete,
 * otherwise renders the welcome screen, quick-action cards, and the full
 * loan applications list with expandable detail panels.
 *
 * Each application row can be expanded to reveal all stored fields:
 * purchase details, personal info, employment, NOK, and documents.
 */

import Link from "next/link";
import { useState } from "react";
import { UserProfile } from "@/lib/profile";

type Application = {
  id: string;
  status: string | null;
  reference: string | null;
  created_at: string;
  store_name: string | null;
  product_name: string | null;
  retail_price: string | number | null;
  deposit_amount: string | number | null;
  tenure_months: number | null;
  national_id: string | null;
  mobile_number: string | null;
  email_address: string | null;
  physical_address: string | null;
  employer_name: string | null;
  employer_no: string | null;
  ministry: string | null;
  is_civil_servant: boolean | null;
  kin_full_name: string | null;
  kin_relationship: string | null;
  kin_mobile: string | null;
  kin_address: string | null;
  employer_phone: string | null;
  employer_contact_person: string | null;
  employer_email: string | null;
  employer_address: string | null;
  id_copy_url: string | null;
  payslip_url: string | null;
};

function parseAmount(n: string | number | null) {
  return typeof n === 'number' ? n : parseFloat(n ?? '');
}

function fmt(n: string | number | null) {
  const v = parseAmount(n);
  return isNaN(v) ? null : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: string | null) {
  const map: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status ?? ''] ?? 'bg-yellow-100 text-yellow-700';
}

interface Props {
  email: string;
  displayName: string;
  profile: UserProfile | null;
  applications: Application[];
  profileComplete: boolean;
}

export default function DashboardView({ displayName, profile, applications, profileComplete }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || displayName;

  return (
    <div className="font-manrope">
      <section className="w-full py-10 px-6 md:px-10 xl:px-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            {profileComplete ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}
          </h1>
          <p className="text-on-surface-variant">
            {profileComplete ? "Manage your loan applications." : "Complete your profile to start applying."}
          </p>
        </div>

        {/* Profile completion prompt — shown when profile is incomplete, hides rest of dashboard */}
        {!profileComplete && (
          <div className="flex justify-center items-center min-h-[40vh]">
          <div className="max-w-md w-full bg-secondary text-on-secondary p-6 rounded-2xl shadow-xl shadow-secondary/15 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">person_add</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold mb-1">Complete Your Profile</h2>
                <p className="text-on-secondary/80 text-sm mb-5 leading-relaxed">Add your details to start applying.</p>
                <Link
                  href="/profile-setup"
                  className="inline-flex items-center justify-center bg-white text-secondary px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                >
                  Set Up Profile
                </Link>
              </div>
            </div>
          </div>
          </div>
        )}

        {profileComplete && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,420px)_minmax(0,420px)] gap-5 mb-8">
              {/* New Application Card */}
              <div className="bg-secondary text-on-secondary p-6 rounded-2xl shadow-xl shadow-secondary/15 flex flex-col justify-between group overflow-hidden relative min-h-52">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-3xl mb-4">add_circle</span>
                  <h2 className="text-xl font-bold mb-2">New Application</h2>
                  <p className="text-on-secondary/80 text-sm mb-6 leading-relaxed">Apply for a new loan facility.</p>
                </div>
                <Link
                  href="/store-selection"
                  className="bg-white text-secondary px-5 py-2.5 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90 active:scale-95"
                >
                  Start Now
                </Link>
              </div>

              {/* My Applications Card */}
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col group min-h-52">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined">folder_open</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                    {applications.length} Total
                  </span>
                </div>
                <h2 className="text-lg font-bold text-primary mb-2">My Applications</h2>
                <p className="text-on-surface-variant text-sm mb-6">
                  {applications.length > 0
                    ? `${applications.length} application(s) on record`
                    : "No applications yet."}
                </p>
                <Link
                  href="/applications"
                  className="mt-auto flex items-center gap-2 text-secondary font-bold text-sm group-hover:gap-3 transition-all"
                >
                  View All
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Application History */}
            <div className="bg-surface rounded-2xl border border-outline-variant p-5 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary">Loan Applications</h2>
              </div>

              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">description</span>
                    <p className="text-on-surface-variant font-medium mb-4">No applications yet.</p>
                    <Link
                      href="/store-selection"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold text-sm"
                    >
                      Apply Now
                    </Link>
                  </div>
                ) : (
                  applications.map((app) => {
                    const isOpen = expanded === app.id;
                    const loanAmount = (parseAmount(app.retail_price) || 0) - (parseAmount(app.deposit_amount) || 0);
                    const monthlyInstallment = app.tenure_months && loanAmount > 0 ? loanAmount / app.tenure_months : null;
                    return (
                      <div key={app.id} className="rounded-2xl border border-outline-variant overflow-hidden bg-surface">
                        {/* Summary row */}
                        <div className="flex items-center gap-4 p-4">
                          <div className="w-11 h-11 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant shrink-0">
                            <span className="material-symbols-outlined text-xl">
                              {app.status === 'submitted' ? 'hourglass_empty' : app.status === 'approved' ? 'check_circle' : app.status === 'rejected' ? 'cancel' : 'pending'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <p className="font-bold text-primary truncate">{app.product_name}</p>
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${statusBadge(app.status)}`}>{app.status}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-on-surface-variant">
                              <span>Ref: <span className="font-mono font-bold">{app.reference}</span></span>
                              {app.store_name && <span>{app.store_name}</span>}
                              {loanAmount > 0 && <span className="font-bold text-secondary">{fmt(loanAmount)}</span>}
                              <span>{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : app.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm">{isOpen ? 'expand_less' : 'expand_more'}</span>
                          </button>
                        </div>

                        {/* Expanded detail panel */}
                        {isOpen && (
                          <div className="border-t border-outline-variant/50 bg-surface-container-low px-4 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                { label: 'Store', value: app.store_name },
                                { label: 'Product', value: app.product_name },
                                { label: 'Retail Price', value: fmt(app.retail_price) },
                                { label: 'Deposit', value: fmt(app.deposit_amount) },
                                { label: 'Loan Amount', value: fmt(loanAmount) },
                                { label: 'Tenure', value: app.tenure_months ? `${app.tenure_months} months` : null },
                                { label: 'Monthly Instalment', value: monthlyInstallment ? fmt(monthlyInstallment) : null },
                                { label: 'National ID', value: app.national_id },
                                { label: 'Mobile', value: app.mobile_number },
                                { label: 'Email', value: app.email_address },
                                { label: 'Address', value: app.physical_address },
                                { label: 'Civil Servant', value: app.is_civil_servant ? 'Yes' : 'No' },
                                { label: 'Employer', value: app.is_civil_servant ? (app.ministry || '') : app.employer_name },
                                ...(app.is_civil_servant && app.employer_no ? [{ label: 'EC Number', value: app.employer_no }] : []),
                                { label: 'Next of Kin', value: app.kin_full_name },
                                { label: 'Relationship', value: app.kin_relationship },
                                { label: 'NOK Mobile', value: app.kin_mobile },
                                { label: 'NOK Address', value: app.kin_address },
                                { label: 'Employer Phone', value: app.employer_phone },
                                { label: 'Employer Contact', value: app.employer_contact_person },
                                { label: 'Employer Email', value: app.employer_email },
                                { label: 'Employer Address', value: app.employer_address },
                                { label: 'ID Copy', value: app.id_copy_url ? '✅ Uploaded' : '❌ Not uploaded' },
                                { label: 'Payslip', value: app.payslip_url ? '✅ Uploaded' : '❌ Not uploaded' },
                              ].filter((r): r is { label: string; value: string } => Boolean(r.value)).map(r => (
                                <div key={r.label}>
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">{r.label}</p>
                                  <p className="text-sm font-medium text-on-surface wrap-break-word">{r.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
