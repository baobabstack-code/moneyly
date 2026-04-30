'use client'

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { getMyProfile, isProfileComplete, UserProfile } from "@/lib/profile";

function fmt(n: any) {
  const v = parseFloat(n);
  return isNaN(v) ? "—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ApplicationsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const profileData = await getMyProfile();
      setProfile(profileData);

      const { data: apps } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      setApplications(apps || []);
      setLoading(false);
    };
    load();
  }, []);

  const profileComplete = profile ? isProfileComplete(profile) : false;

  if (!loading && !profileComplete) {
    return (
      <div className="font-manrope">
        <div className="py-10 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="bg-amber-500 text-white p-8 rounded-[32px] shadow-2xl shadow-amber-500/20">
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-4xl">person_add</span>
              <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            </div>
            <p className="text-white/80 mb-6">Set up your profile to view applications.</p>
            <Link
              href="/profile-setup"
              className="inline-block bg-white text-amber-500 px-6 py-3 rounded-xl font-bold"
            >
              Set Up Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  return (
    <div className="font-manrope">
      <section className="py-10 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">My Applications</h1>
            <p className="text-on-surface-variant">View your loan application history.</p>
          </div>
          <Link
            href="/store-selection"
            className="hidden sm:flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            New Application
          </Link>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-6 p-6 rounded-2xl bg-surface">
                  <div className="w-12 h-12 bg-surface-container rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-surface-container rounded w-3/4"></div>
                    <div className="h-3 bg-surface-container rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-[32px] border border-outline-variant">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">description</span>
              <p className="text-on-surface-variant font-medium text-lg mb-2">No applications yet.</p>
              <p className="text-on-surface-variant/60 mb-8">Start your first loan application today.</p>
              <Link
                href="/store-selection"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold"
              >
                Apply Now
              </Link>
            </div>
          ) : (
            applications.map((app) => {
              const isOpen = expanded === app.id;
              const loanAmount = (parseFloat(app.retail_price) || 0) - (parseFloat(app.deposit_amount) || 0);
              return (
                <div
                  key={app.id}
                  className="rounded-2xl bg-surface border border-outline-variant overflow-hidden transition-colors"
                >
                  {/* Summary row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6">
                    <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                      <span className={`material-symbols-outlined text-xl ${app.status === 'approved' ? 'text-green-600' : app.status === 'rejected' ? 'text-red-500' : 'text-on-surface-variant'}`}>
                        {app.status === 'submitted' ? 'hourglass_empty' :
                         app.status === 'approved' ? 'check_circle' :
                         app.status === 'rejected' ? 'cancel' : 'pending'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-bold text-lg text-primary leading-tight">{app.product_name}</h3>
                        <span className={`inline-block px-3 py-0.5 text-xs font-bold rounded-full uppercase ${getStatusStyles(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-surface-variant">
                        <span>Ref: <span className="font-mono font-bold text-on-surface">{app.reference}</span></span>
                        <span>Submitted: <span className="font-medium text-on-surface">{new Date(app.created_at).toLocaleDateString()}</span></span>
                        {app.store_name && <span>Store: <span className="font-medium text-on-surface">{app.store_name}</span></span>}
                        <span>Loan: <span className="font-bold text-secondary">{fmt(loanAmount)}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : app.id)}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface-container transition-all"
                      >
                        {isOpen ? 'Hide' : 'View'}
                        <span className="material-symbols-outlined text-sm">{isOpen ? 'expand_less' : 'expand_more'}</span>
                      </button>
                      {app.status === 'submitted' && (
                        <button type="button" className="text-xs font-bold text-error hover:underline">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded details panel */}
                  {isOpen && (
                    <div className="border-t border-outline-variant/50 bg-surface-container-low px-5 sm:px-6 py-5">
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
                          { label: 'Employer', value: app.is_civil_servant ? `${app.ministry || ''}` : app.employer_name },
                          { label: 'Civil Servant', value: app.is_civil_servant ? 'Yes' : 'No' },
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

        {applications.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/store-selection"
              className="flex sm:hidden items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold w-full justify-center"
            >
              <span className="material-symbols-outlined">add</span>
              New Application
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}