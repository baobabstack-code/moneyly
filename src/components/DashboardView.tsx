'use client'

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { getMyProfile, isProfileComplete, UserProfile } from "@/lib/profile";

interface Props {
  email: string;
  displayName: string;
}

export default function DashboardView({ email, displayName }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, { data: apps }] = await Promise.all([
          getMyProfile(),
          supabase.from('applications').select('*').order('created_at', { ascending: false }),
        ]);
        setProfile(profileData);
        setApplications(apps || []);
      } finally {
        setLoadingApps(false);
      }
    };
    load();
  }, []);

  const profileComplete = profile ? isProfileComplete(profile) : false;

  const firstName = profile?.full_name?.split(' ')[0] || displayName;
  const latestApp = applications[0];

  if (!loadingApps && !profileComplete) {
    return (
      <div className="font-manrope">
        <section className="py-10 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Welcome, {firstName}
            </h1>
            <p className="text-on-surface-variant">Complete your profile to continue.</p>
          </div>

          <div className="bg-amber-500 text-white p-8 rounded-[32px] shadow-2xl shadow-amber-500/20 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-4">person_add</span>
              <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
              <p className="text-white/80 text-sm mb-8 leading-relaxed">Add your National ID and details to start applying.</p>
            </div>
            <Link
              href="/profile-setup"
              className="bg-white text-amber-500 px-6 py-3 rounded-xl font-bold text-sm text-center transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center"
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
          <p className="text-on-surface-variant">Manage your institutional loan applications and facility details.</p>
        </div>

        {!loadingApps && !profileComplete && (
          <div className="mb-10 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">person_add</span>
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">Complete Your Profile</h3>
                <p className="text-sm text-amber-700/70 dark:text-amber-200/70">Add your National ID and other details to start applying.</p>
              </div>
            </div>
            <Link
              href="/profile-setup"
              className="shrink-0 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-2"
            >
              Click Here
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-secondary text-on-secondary p-8 rounded-[32px] shadow-2xl shadow-secondary/20 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-4">add_circle</span>
              <h2 className="text-2xl font-bold mb-2">New Application</h2>
              <p className="text-on-secondary/80 text-sm mb-8 leading-relaxed">Start a new institutional loan application in minutes.</p>
            </div>
            <Link
              href="/store-selection"
              className="bg-white text-secondary px-6 py-3 rounded-xl font-bold text-sm text-center transition-all hover:scale-105 active:scale-95"
            >
              Start Now
            </Link>
          </div>

          <div className="bg-surface p-8 rounded-[32px] border border-outline-variant shadow-sm flex flex-col group">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">pending_actions</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                {latestApp?.status || "No Activity"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">
              {latestApp ? "Active Application" : "No Applications"}
            </h2>
            <p className="text-on-surface-variant text-sm mb-8">
              {latestApp
                ? `Reference ${latestApp.reference} is currently ${latestApp.status}.`
                : "You haven't started any applications yet."}
            </p>
            {latestApp ? (
              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant/40">Product</span>
                  <span className="text-xs font-bold text-primary">{latestApp.product_name}</span>
                </div>
                <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full uppercase">
                  {latestApp.status}
                </span>
              </div>
            ) : (
              <Link
                href="/store-selection"
                className="mt-auto flex items-center gap-2 text-secondary font-bold text-sm group-hover:gap-3 transition-all"
              >
                Start New Application
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            )}
          </div>

          <div className="bg-surface p-8 rounded-[32px] border border-outline-variant shadow-sm flex flex-col group">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60">Active Facility</span>
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">Credit Limit</h2>
            <p className="text-emerald-600 text-3xl font-black mb-1">$0.00</p>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">Available Balance</p>
            <button type="button" className="mt-8 text-on-surface-variant/40 text-xs font-bold uppercase tracking-widest cursor-not-allowed">
              View Statements
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-[40px] border border-outline-variant p-8 md:p-12">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-primary">Recent Activity</h2>
            <button type="button" className="text-sm font-bold text-secondary hover:underline">View All History</button>
          </div>

          <div className="space-y-6">
            {loadingApps ? (
              <div className="animate-pulse flex space-x-4 p-4">
                <div className="rounded-xl bg-surface-container h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-surface-container rounded w-3/4"></div>
                  <div className="h-4 bg-surface-container rounded w-1/2"></div>
                </div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">history</span>
                <p className="text-on-surface-variant font-medium">No recent activity found.</p>
              </div>
            ) : (
              applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-surface-container-low transition-colors group">
                  <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                    <span className="material-symbols-outlined">
                      {app.status === 'submitted' ? 'description' : app.status === 'approved' ? 'task_alt' : 'error'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-primary">Loan Application - {app.product_name}</p>
                    <p className="text-xs text-on-surface-variant">Reference: {app.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <p className={`text-[10px] uppercase font-bold tracking-widest ${app.status === 'submitted' ? 'text-secondary' : 'text-emerald-600'}`}>
                      {app.status}
                    </p>
                  </div>
                </div>
              ))
            )}

            <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-surface-container-low transition-colors group opacity-60">
              <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined">login</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-primary text-sm">Security Log: System Access</p>
                <p className="text-[10px] text-on-surface-variant">Successful authentication</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-primary">Session Active</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
