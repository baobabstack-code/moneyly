'use client'

import Link from "next/link";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { getMyProfile, UserProfile } from "@/lib/profile";

export default function LandingPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use getSession for immediate client-side check
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        
        setUser(currentUser);
        if (currentUser) {
          const profileData = await getMyProfile();
          setProfile(profileData);
          
          // Fetch real application history
          const { data: apps } = await supabase
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });
          setApplications(apps || []);
        }
      } catch (error) {
        console.error('LandingPage auth check failed:', error);
        setUser(null);
      } finally {
        setCheckingAuth(false);
        setLoadingApps(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const profileData = await getMyProfile();
          setProfile(profileData);
          
          const { data: apps } = await supabase
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });
          setApplications(apps || []);
        } else {
          setProfile(null);
          setApplications([]);
        }
        setCheckingAuth(false);
        setLoadingApps(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="font-manrope min-h-screen bg-background">
        {/* Original Landing Page for Guests */}
        <section className="relative overflow-hidden pt-24 pb-32 px-6 md:px-12 bg-background">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <span className="inline-block py-1.5 px-4 rounded-full bg-secondary/10 text-secondary font-bold text-[10px] uppercase tracking-[0.2em] mb-8 border border-secondary/20">
                SMART FINANCE SOLUTIONS
              </span>
              <h1 className="font-h1 text-h1 text-primary mb-8 leading-tight">
                Simple Loans for <span className="text-secondary underline decoration-secondary/30 underline-offset-8">Civil Servants</span> & Retail Shoppers
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-xl leading-relaxed">
                Buy what you need in-store today with our instant digital loan approvals. Tailored financial solutions for customers.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <Link 
                  href={user ? "/store-selection" : "/login"} 
                  className="w-full sm:w-auto bg-secondary text-on-secondary px-10 py-4.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-2xl shadow-secondary/30 hover:opacity-90 transition-all active:scale-95 group"
                >
                  {user ? "Continue to Application" : "Get Started"}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <PWAInstallButton />
                <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-widest hidden sm:block">
                  Native App Experience
                </p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-secondary/5 rounded-[48px] -rotate-3"></div>
              <img className="relative z-10 rounded-[48px] shadow-2xl w-full h-[540px] object-cover" alt="Hero" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAs1KQv_eTiUjzwPDJ7sM0YQayKnsePXpjIy2jejveEb1_feM_gOFeesNzKGFhiHspyFqffWmi4PCBnVIPyv0o19Q3tu9nc9Z-RqXs5Rxb1Fs4tDYPZSCwGA72niqQDCYn6Xv4UU_JZiZg2l79b-RF8uy1wYEgvMl5zDK_s6GZPZg82SS-aV0HnjY002MgN6k4NF2zp6dZjZkjiUDUN_QaqZCCr_8eq3-xGHjZoOnyHG6TZi86JFBK4TXU5GK-eHnWutPZ_xHp_GNR" />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-surface-container py-32 px-6 md:px-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="font-h2 text-h2 text-primary mb-6">Why Choose HTB GLOBAL?</h2>
              <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                We've redesigned the borrowing experience from the ground up to be faster, fairer, and more focused on your needs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface p-10 rounded-[32px] border border-outline-variant shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-8 group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-300">
                  <span className="material-symbols-outlined text-4xl">bolt</span>
                </div>
                <h3 className="font-h3 text-h3 text-primary mb-4">Fast Approval</h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed">Our automated engine provides decisions in minutes, not days. Get funds exactly when you need them.</p>
              </div>
              <div className="bg-surface p-10 rounded-[32px] border border-outline-variant shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-8 group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-300">
                  <span className="material-symbols-outlined text-4xl">percent</span>
                </div>
                <h3 className="font-h3 text-h3 text-primary mb-4">Low Interest Rates</h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed">Competitive rates with transparent institutional pricing. No hidden fees or early repayment penalties.</p>
              </div>
              <div className="bg-surface p-10 rounded-[32px] border border-outline-variant shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-8 group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-300">
                  <span className="material-symbols-outlined text-4xl">verified_user</span>
                </div>
                <h3 className="font-h3 text-h3 text-primary mb-4">Secure Process</h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed">Bank-grade 256-bit encryption protecting your institutional data. We prioritize your financial security.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-32 px-6 md:px-12 bg-background relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="font-h2 text-h2 text-primary mb-6">How It Works</h2>
              <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">Three simple steps to your institutional financial freedom.</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-16 left-0 w-full h-1 bg-outline-variant/30 z-0 rounded-full"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
                <div className="text-center group">
                  <div className="w-32 h-32 bg-surface border-8 border-secondary rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-secondary/20">
                    <span className="text-4xl font-bold text-secondary">1</span>
                  </div>
                  <h4 className="font-h3 text-xl text-primary mb-3">Select Store</h4>
                  <p className="font-body-sm text-on-surface-variant px-6 leading-relaxed">Choose your preferred institutional branch or digital storefront to initiate the process.</p>
                </div>
                <div className="text-center group">
                  <div className="w-32 h-32 bg-surface border-8 border-outline-variant rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-secondary/50 group-hover:shadow-secondary/10">
                    <span className="text-4xl font-bold text-on-surface-variant/40 group-hover:text-secondary/60">2</span>
                  </div>
                  <h4 className="font-h3 text-xl text-primary mb-3">Search ID</h4>
                  <p className="font-body-sm text-on-surface-variant px-6 leading-relaxed">Quickly verify your identity using our secure digital ID verification system.</p>
                </div>
                <div className="text-center group">
                  <div className="w-32 h-32 bg-surface border-8 border-outline-variant rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-secondary/50 group-hover:shadow-secondary/10">
                    <span className="text-4xl font-bold text-on-surface-variant/40 group-hover:text-secondary/60">3</span>
                  </div>
                  <h4 className="font-h3 text-xl text-primary mb-3">Apply</h4>
                  <p className="font-body-sm text-on-surface-variant px-6 leading-relaxed">Review your personalized terms and sign digitally to receive your funds securely.</p>
                </div>
              </div>
            </div>
            <div className="mt-24 text-center">
              <Link 
                href={user ? "/store-selection" : "/login"} 
                className="inline-block bg-primary text-on-primary px-12 py-5 rounded-2xl font-bold hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all active:scale-95 shadow-xl text-lg"
              >
                {user ? "Go to My Dashboard" : "Start Application Now"}
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 md:px-12">
          <div className="max-w-6xl mx-auto bg-secondary text-on-secondary rounded-[64px] p-16 md:p-24 text-center relative overflow-hidden shadow-2xl border-4 border-surface shadow-secondary/20">
            <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[480px] h-[480px] bg-white/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
            <h2 className="font-h1 text-h1 text-on-secondary mb-8 leading-tight relative z-10">Ready to scale your dreams?</h2>
            <p className="text-body-lg mb-12 max-w-2xl mx-auto opacity-80 relative z-10 leading-relaxed">Join thousands of others who have simplified their financial journey with our modern institutional loan solutions.</p>
            <div className="flex flex-wrap justify-center gap-6 relative z-10">
              <Link 
                href={user ? "/store-selection" : "/login"} 
                className="inline-block bg-white text-secondary px-12 py-5 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl active:scale-95 text-lg"
              >
                {user ? "Resume Application" : "Apply for a Loan"}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const latestApp = applications[0];

  return (
    <main className="font-manrope min-h-screen bg-background">
      {/* Dashboard View for Logged In Users - EXCLUSIVE */}
      <section className="pt-24 pb-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
          </h1>
          <p className="text-on-surface-variant">Manage your institutional loan applications and facility details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Quick Start Card */}
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

          {/* Active Applications Card */}
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

          {/* Facility Status Card */}
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
            <button className="mt-8 text-on-surface-variant/40 text-xs font-bold uppercase tracking-widest cursor-not-allowed">
              View Statements
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface rounded-[40px] border border-outline-variant p-8 md:p-12">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-primary">Recent Activity</h2>
            <button className="text-sm font-bold text-secondary hover:underline">View All History</button>
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
                    <p className="font-bold text-primary">
                      Loan Application - {app.product_name}
                    </p>
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
            
            {/* Login Event as fallback/extra row */}
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
    </main>
  );
}
