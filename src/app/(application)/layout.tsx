"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useApplicationStore } from "@/lib/store";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { getMyProfile, isProfileComplete, UserProfile } from "@/lib/profile";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const { notifications, clearNotifications } = useApplicationStore();

  const { setBasicInfo, setContactDetails, setNextOfKin, setEmploymentDetails } = useApplicationStore();

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      // Run session check and profile fetch in parallel — session is local cache, profile is DB
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        setChecking(false);
        return;
      }
      setUser(session.user);
      // Unblock UI immediately — show content while profile loads
      setChecking(false);

      const profileData = await getMyProfile();
      setProfile(profileData);

      if (!profileData || !isProfileComplete(profileData)) {
        router.push("/profile-setup");
        return;
      }

      // Pre-fill application store from completed profile
      setBasicInfo({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        dateOfBirth: profileData.date_of_birth || "",
        gender: profileData.gender || "",
        photoUrl: profileData.photo_url || "",
      });
      setContactDetails({
        physicalAddress: profileData.physical_address || "",
        mobileNumber: profileData.mobile_number || "",
        emailAddress: profileData.email_address || "",
      });
      setNextOfKin({
        fullName: profileData.nok_full_name || "",
        address: profileData.nok_address || "",
        mobileNumber: profileData.nok_mobile_number || "",
        relationship: profileData.nok_relationship || "",
      });
      setEmploymentDetails({
        employerName: profileData.employer_name || "",
        isCivilServant: profileData.is_civil_servant ?? null,
        employerNo: profileData.employer_no || "",
        ministry: profileData.ministry || "",
        phoneNumber: profileData.employment_phone || "",
      });
    };
    fetchUser();
  }, []);

  // Show loading while checking
  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userInitial = profile?.full_name?.[0] || user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U";
  const userInitials = (profile?.full_name || user?.user_metadata?.full_name || user?.email || "User")
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = profile?.avatar_url || profile?.photo_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const profileComplete = profile ? isProfileComplete(profile) : false;

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

  // If it's the success page, we might want a different layout or just hide the navigation
  if (isSuccessPage) {
    return (
      <div className="bg-background min-h-screen flex flex-col font-manrope">
        <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
          <div className="flex justify-between items-center h-16 px-8 max-w-container-max mx-auto w-full">
            <div className="flex items-center gap-4">
              <span className="text-xl font-h1 font-bold tracking-tight text-primary">HTB GLOBAL</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="pt-24 pb-12 px-6 flex-grow flex items-center justify-center">
          {children}
        </main>
      </div>
    );
  }

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
            <div className="hidden md:block text-right mr-4 border-r border-outline-variant pr-4">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-widest">Status</p>
              <p className="text-xs font-bold text-secondary">Institutional Draft</p>
            </div>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-3 relative">
              <button 
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
                <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                    <h3 className="font-bold text-sm text-primary">Notifications</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
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
                              <span className="material-symbols-outlined text-[18px]">{notif.type === 'success' ? 'check_circle' : 'info'}</span>
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
                    <button className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest hover:text-primary transition-colors">
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
            className="h-full bg-secondary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,81,213,0.5)]" 
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </header>

      <div className="flex-1 lg:grid lg:grid-cols-[288px_1fr] pt-16 min-h-screen">
        {/* SideNavBar - Grid Managed */}
        <aside className="hidden lg:flex flex-col bg-surface border-r border-outline-variant h-[calc(100vh-64px)] sticky top-16 z-40 overflow-y-auto transition-all">
          <div className="p-8 border-b border-outline-variant/30">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-primary text-on-primary rounded-lg flex items-center justify-center font-black shadow-lg shadow-primary/20">H</div>
              <div>
                <h2 className="text-base font-bold text-primary leading-none">Your Application</h2>
                <p className="text-[10px] text-on-surface-variant/80 uppercase font-bold mt-1 tracking-wider">Ref: #LN-8820</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 py-6 px-4 space-y-2">
            <div className="pb-2 px-5">
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">Application Process</p>
            </div>

            {steps.map((step) => {
              const isActive = pathname.includes(step.href);
              return (
                <Link 
                  key={step.name} 
                  href={step.href} 
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? "text-secondary bg-secondary/10 font-bold shadow-sm shadow-secondary/5 border border-secondary/20" 
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                  }`}
                >
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{step.icon}</span>
                  <span className="text-sm tracking-tight">{step.name}</span>
                </Link>
              );
            })}

            {/* Profile Sections - Editable */}
            {profileComplete && (
              <>
                <div className="pt-4 pb-2 px-5">
                  <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">Your Profile</p>
                </div>

                {profileSections.map((section) => {
                  const sectionKey = section.href.split('=')[1] || 'photo';
                  return (
                    <button 
                      key={section.name}
                      onClick={() => setEditSection(sectionKey)}
                      className="w-full flex items-center justify-between px-5 py-3.5 group text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                        <span className="text-sm tracking-tight">{section.name}</span>
                      </div>
                      <span className="text-xs text-secondary opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>
          <nav className="px-4 py-4 space-y-2 border-t border-outline-variant/30">
            <button 
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/");
              }}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/5 transition-all duration-300 group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">logout</span>
              <span className="text-sm tracking-tight font-medium">Sign Out</span>
            </button>
          </nav>
          <div className="p-8 border-t border-outline-variant/30 bg-surface-container-lowest">
            <button 
              onClick={() => {
                useApplicationStore.getState().addNotification('Application progress saved successfully.', 'success');
              }}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              Save Application
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="pb-[180px] lg:pb-12 px-4 sm:px-8 lg:px-16 pt-6 lg:pt-10 transition-all bg-surface/30">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* BottomNavBar - True Native Feel */}
      <nav className="fixed bottom-0 left-0 w-full z-50 lg:hidden flex flex-col">
        {/* Control Layer */}
        <div className="flex justify-between items-center h-20 px-6 bg-surface/90 backdrop-blur-2xl border-t border-outline-variant shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-all">
          <button 
            onClick={handleBack}
            className="flex flex-col items-center justify-center text-on-surface-variant/70 text-[10px] uppercase font-bold tracking-widest gap-1 active:scale-90 transition-all hover:text-primary"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button className="w-12 h-12 bg-surface-container border border-outline-variant rounded-xl flex items-center justify-center text-on-surface shadow-inner active:scale-90 transition-all">
              <span className="material-symbols-outlined">save</span>
            </button>
            <button 
              onClick={isSummaryPage ? () => { /* Submission is handled in SummaryPage.tsx usually, but we need consistency */ 
                const submitBtn = document.getElementById('final-submit-button');
                if (submitBtn) submitBtn.click();
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
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Apply</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-on-surface-variant/40">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Account</span>
          </Link>
        </div>
      </nav>

      {editSection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditSection(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h2 className="text-lg font-bold">{sectionTitles[editSection]?.title || 'Edit Profile'}</h2>
              <button onClick={() => setEditSection(null)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <iframe 
              src={`/profile-setup${profileSections.find(s => s.href.includes(editSection))?.href || ''}`} 
              className="w-full flex-1 min-h-[400px] border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
