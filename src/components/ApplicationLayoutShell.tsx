"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useApplicationStore } from "@/lib/store";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/profile";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ApplicationLayoutShell({
  children,
  user,
  profile,
}: {
  children: React.ReactNode;
  user: User;
  profile: UserProfile;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const { notifications, clearNotifications } = useApplicationStore();

  const { setBasicInfo, setContactDetails, setNextOfKin, setEmploymentDetails } = useApplicationStore();

  useEffect(() => {
    setBasicInfo({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      dateOfBirth: profile.date_of_birth || "",
      gender: profile.gender || "",
      photoUrl: profile.photo_url || "",
    });
    setContactDetails({
      physicalAddress: profile.physical_address || "",
      mobileNumber: profile.mobile_number || "",
      emailAddress: profile.email_address || "",
    });
    setNextOfKin({
      fullName: profile.nok_full_name || "",
      address: profile.nok_address || "",
      mobileNumber: profile.nok_mobile_number || "",
      relationship: profile.nok_relationship || "",
    });
    setEmploymentDetails({
      employerName: profile.employer_name || "",
      isCivilServant: profile.is_civil_servant ?? null,
      employerNo: profile.employer_no || "",
      ministry: profile.ministry || "",
      phoneNumber: profile.employment_phone || "",
    });
  }, [profile, setBasicInfo, setContactDetails, setEmploymentDetails, setNextOfKin]);

  const userInitials = (profile.full_name || user.user_metadata?.full_name || user.email || "User")
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = profile.avatar_url || profile.photo_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;

  const profileComplete = true;

  const sectionTitles: Record<string, {title: string, icon: string}> = {
    photo: {title: "Profile Photo", icon: "photo_camera"},
    personal: {title: "Personal Info", icon: "person"},
    contact: {title: "Contact Details", icon: "contact_page"},
    nok: {title: "Next of Kin", icon: "family_restroom"},
    employment: {title: "Employment", icon: "business_center"},
  };

  const profileSections = [
    { name: "Photo", href: "?section=photo", icon: "photo_camera" },
    { name: "Personal Info", href: "?section=personal", icon: "person" },
    { name: "Contact", href: "?section=contact", icon: "contact_page" },
    { name: "Employment", href: "?section=employment", icon: "business_center" },
    { name: "Next of Kin", href: "?section=nok", icon: "family_restroom" },
  ];

  const steps = [
    { name: "Purchase", href: "/apply/purchase-details", icon: "receipt_long" },
    { name: "Documents", href: "/apply/document-uploads", icon: "upload_file" },
    { name: "Summary", href: "/apply/summary", icon: "fact_check" },
  ];

  const currentStepIndex = steps.findIndex(step => pathname.includes(step.href));
  const isSummaryPage = pathname.includes("/summary");
  const isSuccessPage = pathname.includes("/success");
  const primaryNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard", tooltip: "View your account dashboard" },
    { name: "New Application", href: "/store-selection", icon: "add_circle", tooltip: "Start a new loan application" },
    { name: "My Applications", href: "/applications", icon: "pending_actions", tooltip: "View your submitted loan applications" },
  ];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      router.push(steps[currentStepIndex + 1].href);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      router.push(steps[currentStepIndex - 1].href);
    } else {
      router.push("/store-selection");
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col font-manrope selection:bg-secondary/20">
      {/* TopAppBar - Refined for PWA */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant antialiased transition-all duration-300">
        <div className="flex justify-between items-center h-16 px-4 sm:px-8 max-w-container-max mx-auto w-full">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="p-2 text-on-surface hover:bg-surface-container transition-all rounded-lg group">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">home</span>
            </Link>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-h1 font-bold tracking-tight text-primary">HTB GLOBAL</span>
              <span className="lg:hidden text-[10px] font-bold text-secondary uppercase tracking-widest leading-none">
                {steps[currentStepIndex]?.name || "Application"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-3 relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-all relative ${showNotifications ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-surface animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-2xl shadow-2xl z-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                    <h3 className="font-bold text-sm text-primary">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearNotifications}
                        className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-on-surface-variant/20 text-4xl mb-2">notifications_off</span>
                        <p className="text-xs text-on-surface-variant/60 font-medium">No new notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-outline-variant/30">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="p-4 hover:bg-surface-container-lowest transition-colors flex gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                              <span className="material-symbols-outlined text-body-lg">{notif.type === 'success' ? 'check_circle' : 'info'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-on-surface leading-normal line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-on-surface-variant/40 mt-1 font-medium">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 text-center">
                    <button type="button" className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest hover:text-primary transition-colors">
                      View All Activity
                    </button>
                  </div>
                </div>
              )}

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-outline-variant shadow-sm shrink-0 flex items-center justify-center bg-secondary text-on-secondary">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-xs uppercase">{userInitials}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Progress Bar */}
        <div className="lg:hidden h-1 w-full bg-surface-container-highest overflow-hidden">
          <div
            className="h-full bg-secondary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,81,213,0.5)] progress-bar-width"
            data-progress={`${((currentStepIndex + 1) / steps.length) * 100}`}
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </header>

      <div className="flex-1 lg:grid lg:grid-cols-[256px_1fr] pt-16 min-h-screen">
        <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-outline-variant h-[calc(100vh-64px)] sticky top-16 shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-outline-variant/30">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-outline-variant" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                  {userInitials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary truncate">
                  {profile.full_name || user.email}
                </p>
                <p className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-widest">My Account</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-1">
            {primaryNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.tooltip}
                  aria-label={item.tooltip}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-secondary/10 text-secondary font-bold border border-secondary/20"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-5 pb-2 px-4">
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Application Process</p>
            </div>

            {steps.map((step) => {
              const isActive = pathname.includes(step.href);
              return (
                <Link 
                  key={step.name} 
                  href={step.href} 
                  title={`${step.name} step`}
                  aria-label={`${step.name} step`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? "bg-secondary/10 text-secondary font-bold border border-secondary/20" 
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {step.icon}
                  </span>
                  <span className="text-sm">{step.name}</span>
                </Link>
              );
            })}

            {profileComplete && (
              <>
                <div className="pt-5 pb-2 px-4">
                  <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Your Profile</p>
                </div>

                {profileSections.map((section) => {
                  const sectionKey = section.href.split('=')[1] || 'photo';
                  return (
                    <button
                      type="button"
                      key={section.name}
                      onClick={() => setEditSection(sectionKey)}
                      title={`Edit ${section.name}`}
                      aria-label={`Edit ${section.name}`}
                      className="w-full flex items-center justify-between px-4 py-3 group text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                        <span className="text-sm">{section.name}</span>
                      </div>
                      <span className="text-xs text-secondary opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>

          <div className="p-4 border-t border-outline-variant/30 space-y-1">
            {!isSuccessPage && (
              <button
                type="button"
                onClick={() => {
                  useApplicationStore.getState().addNotification('Application progress saved successfully.', 'success');
                }}
                title="Save application progress"
                aria-label="Save application progress"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-200 group"
              >
                <span className="material-symbols-outlined text-[20px]">save</span>
                <span className="text-sm font-medium">Save Application</span>
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/");
              }}
              title="Sign out of your account"
              aria-label="Sign out of your account"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/5 transition-all duration-200 group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">logout</span>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="pb-45 lg:pb-12 px-4 sm:px-8 lg:px-10 xl:px-12 pt-6 lg:pt-10 transition-all bg-surface/30">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

      {/* BottomNavBar - True Native Feel */}
      <nav className="fixed bottom-0 left-0 w-full z-50 lg:hidden flex flex-col">
        {/* Control Layer */}
        <div className="flex justify-between items-center h-20 px-6 bg-surface/90 backdrop-blur-2xl border-t border-outline-variant shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-all">
          <button
            type="button"
            onClick={handleBack}
            className="flex flex-col items-center justify-center text-on-surface-variant/70 text-[10px] uppercase font-bold tracking-widest gap-1 active:scale-90 transition-all hover:text-primary"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button type="button" className="w-12 h-12 bg-surface-container border border-outline-variant rounded-xl flex items-center justify-center text-on-surface shadow-inner active:scale-90 transition-all">
              <span className="material-symbols-outlined">save</span>
            </button>
            <button
              type="button"
              onClick={isSummaryPage ? () => {
                const submitBtn = document.getElementById('final-submit-button');
                if (submitBtn) (submitBtn as HTMLButtonElement).click();
              } : handleNext}
              className="h-12 px-8 bg-secondary text-on-secondary rounded-xl font-bold text-sm shadow-lg shadow-secondary/20 flex items-center gap-2 active:scale-95 transition-all"
            >
              {isSummaryPage ? "Submit" : "Next"}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
        
        {/* Native Tab Bar Simulation */}
        <div className="flex justify-around items-center h-16 px-4 bg-surface-container-low border-t border-outline-variant/30">
          <Link href="/" className="flex flex-col items-center gap-1 text-on-surface-variant/40">
            <span className="material-symbols-outlined">home</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
          </Link>
          <Link href="/store-selection" className="flex flex-col items-center gap-1 text-secondary">
            <span className="material-symbols-outlined filled">add_circle</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Apply</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-on-surface-variant/40">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Account</span>
          </Link>
        </div>
      </nav>

      {editSection && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditSection(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h2 className="text-lg font-bold">{sectionTitles[editSection]?.title || 'Edit Profile'}</h2>
              <button type="button" onClick={() => setEditSection(null)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <iframe
              title={`Edit ${sectionTitles[editSection]?.title || 'Profile'}`}
              src={`/profile-setup${profileSections.find(s => s.href.includes(editSection))?.href || ''}`}
              className="w-full flex-1 min-h-100 border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
