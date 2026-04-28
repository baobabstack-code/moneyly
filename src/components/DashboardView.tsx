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
              applications.map((app) => (
                <div key={app.id} className="flex items-center gap-6 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors group">
                  <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                    <span className="material-symbols-outlined">
                      {app.status === 'submitted' ? 'hourglass_empty' : app.status === 'approved' ? 'check_circle' : app.status === 'rejected' ? 'cancel' : 'pending'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-primary">{app.product_name}</p>
                    <p className="text-xs text-on-surface-variant">Ref: {app.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <span className={`inline-block px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                      app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'approved' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}