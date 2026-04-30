'use client';

import Link from "next/link";
import { useState } from "react";
import { UserProfile } from "@/lib/profile";

function fmt(n: any) {
  const v = parseFloat(n);
  return isNaN(v) ? null : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-yellow-100 text-yellow-700';
}

interface Props {
  email: string;
  displayName: string;
  profile: UserProfile | null;
  applications: any[];
  profileComplete: boolean;
}

export default function DashboardView({ email, displayName, profile, applications, profileComplete }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || displayName;

  if (!profileComplete) {
    return (
      <div className="font-manrope">
        <section className="py-10 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Welcome, {firstName}
            </h1>
            <p className="text-on-surface-variant">Complete your profile to continue.</p>
          </div>

          <div className="bg-secondary text-on-secondary p-8 rounded-[32px] shadow-2xl shadow-secondary/20 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-4">person_add</span>
              <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
              <p className="text-on-secondary/80 text-sm mb-8 leading-relaxed">Add your National ID and details to start applying.</p>
            </div>
            <Link
              href="/profile-setup"
              className="bg-white text-secondary px-6 py-3 rounded-xl font-bold text-sm text-center transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center"
            >
              Set Up Profile
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="font-manrope">
      <section className="py-10 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-on-surface-variant">Manage your loan applications.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* New Application Card */}
          <div className="bg-secondary text-on-secondary p-8 rounded-[32px] shadow-2xl shadow-secondary/20 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-4">add_circle</span>
              <h2 className="text-2xl font-bold mb-2">New Application</h2>
              <p className="text-on-secondary/80 text-sm mb-8 leading-relaxed">Apply for a new loan facility.</p>
            </div>
            <Link
              href="/store-selection"
              className="bg-white text-secondary px-6 py-3 rounded-xl font-bold text-sm text-center transition-all hover:scale-105 active:scale-95"
            >
              Start Now
            </Link>
          </div>

          {/* My Applications Card */}
          <div className="bg-surface p-8 rounded-[32px] border border-outline-variant shadow-sm flex flex-col group">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">folder_open</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                {applications.length} Total
              </span>
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">My Applications</h2>
            <p className="text-on-surface-variant text-sm mb-8">
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
        <div className="bg-surface rounded-[40px] border border-outline-variant p-8 md:p-12">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-primary">Loan Applications</h2>
          </div>

          <div className="space-y-6">
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
                const loanAmount = (parseFloat(app.retail_price) || 0) - (parseFloat(app.deposit_amount) || 0);
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
                          <span>{new Date(app.created_at).toLocaleDateString()}</span>
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
                            { label: 'ID Copy', value: app.id_copy_url ? '✅ Uploaded' : '❌ Not uploaded' },
                            { label: 'Payslip', value: app.payslip_url ? '✅ Uploaded' : '❌ Not uploaded' },
                          ].filter(r => r.value).map(r => (
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
      </section>
    </div>
  );
}
