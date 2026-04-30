'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Props {
  initialUser?: { email: string; displayName: string; avatarUrl?: string } | null;
  profileComplete?: boolean;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard", tooltip: "View your account dashboard" },
  { name: "New Application", href: "/store-selection", icon: "add_circle", tooltip: "Start a new loan application" },
  { name: "My Applications", href: "/applications", icon: "pending_actions", tooltip: "View your submitted loan applications" },
];

const applicationProcessItems = [
  { name: "Purchase", href: "/apply/purchase-details", icon: "receipt_long", tooltip: "Enter product and purchase details" },
  { name: "Documents", href: "/apply/document-uploads", icon: "upload_file", tooltip: "Upload ID and payslip documents" },
  { name: "Summary", href: "/apply/summary", icon: "fact_check", tooltip: "Review and submit your application" },
];

const profileItems = [
  { name: "Photo", href: "/profile-setup?section=photo", icon: "photo_camera", tooltip: "Update your profile photo" },
  { name: "Personal Info", href: "/profile-setup?section=personal", icon: "person", tooltip: "Update your personal information" },
  { name: "Contact", href: "/profile-setup?section=contact", icon: "contact_page", tooltip: "Update your contact details" },
  { name: "Employment", href: "/profile-setup?section=employment", icon: "business_center", tooltip: "Update employment information" },
  { name: "Next of Kin", href: "/profile-setup?section=nok", icon: "family_restroom", tooltip: "Update next of kin details" },
];

export default function DashboardSidebar({ initialUser, profileComplete = true }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = (initialUser?.displayName || initialUser?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-outline-variant h-[calc(100vh-64px)] sticky top-16 shrink-0 overflow-y-auto">
      {/* User info */}
      <div className="p-6 border-b border-outline-variant/30" title="Signed in account">
        <div className="flex items-center gap-3">
          {initialUser?.avatarUrl ? (
            <img src={initialUser.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-outline-variant" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary truncate">
              {initialUser?.displayName || initialUser?.email}
            </p>
            <p className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-widest">My Account</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const locked = !profileComplete && item.href !== "/dashboard";
          if (locked) {
            return (
              <span
                key={item.name}
                title="Complete your profile to unlock"
                className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-35 cursor-not-allowed select-none"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{item.icon}</span>
                <span className="text-sm text-on-surface-variant">{item.name}</span>
              </span>
            );
          }
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
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}

        {/* Application Process section — grayed out if profile incomplete */}
        <div className={`pt-5 pb-2 px-4 ${!profileComplete ? "opacity-35" : ""}`}>
          <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Application Process</p>
        </div>

        {applicationProcessItems.map((item) => {
          const isActive = pathname === item.href;
          if (!profileComplete) {
            return (
              <span
                key={item.name}
                title="Complete your profile to unlock"
                className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-35 cursor-not-allowed select-none"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{item.icon}</span>
                <span className="text-sm text-on-surface-variant">{item.name}</span>
              </span>
            );
          }
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

        {/* Your Profile section — always shown, always clickable */}
        <div className="pt-5 pb-2 px-4">
          <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Your Profile</p>
        </div>

        {profileItems.map((item) => {
          const isActive = pathname === "/profile-setup";
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
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-outline-variant/30">
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out of your account"
          aria-label="Sign out of your account"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/5 transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">logout</span>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
