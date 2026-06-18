'use client'

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ProfileEditModal from "@/components/ProfileEditModal";
import type { UserProfile } from "@/lib/profile";
import QuickTransactionModal from "@/components/QuickTransactionModal";

interface Props {
  initialUser?: { email: string; displayName: string; avatarUrl?: string } | null;
  profileComplete?: boolean;
  profile?: UserProfile | null;
}

type Section = 'personal'

const navItems = [
  { name: "Dashboard",        href: "/dashboard",      icon: "dashboard",       tooltip: "View your account dashboard" },
  { name: "History",          href: "/dashboard/history", icon: "history",       tooltip: "View transaction history" },
  { name: "New Goal",         href: "/plan/details",   icon: "flag",           tooltip: "Create a new goal or milestone" },
  { name: "Goals & Milestones", href: "/plans",         icon: "track_changes",   tooltip: "View your financial goals and milestones" },
];

export default function DashboardSidebar({ initialUser, profileComplete = true, profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [txModalOpen, setTxModalOpen] = useState(false);

  const initials = (initialUser?.displayName || initialUser?.email || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    const supabase = createClient();
    window.location.href = "/"; // Eager redirect to homepage
    if (supabase) {
      supabase.auth.signOut().catch(console.error);
    }
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-outline-variant h-[calc(100vh-64px)] sticky top-16 shrink-0 overflow-y-auto">

        {/* User info */}
        <div className="px-4 py-5 border-b border-outline-variant/30" title="Signed in account">
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

        {/* Quick Add Button */}
        {profile?.id && (
          <div className="px-6 pt-4">
            <button
              type="button"
              onClick={() => setTxModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-secondary text-on-secondary font-bold text-sm shadow-md shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm font-black">add</span>
              Add Transaction
            </button>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} title={item.tooltip} aria-label={item.tooltip}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-secondary/10 text-secondary font-bold border border-secondary/20"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}>
                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isActive ? "icon-filled" : "group-hover:scale-110"}`}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-5 pb-2 px-4">
            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Settings</p>
          </div>

          <Link
            href="/dashboard/settings"
            title="Update your preferences and settings"
            aria-label="Update your preferences and settings"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left ${
              pathname === "/dashboard/settings"
                ? "bg-secondary/10 text-secondary font-bold border border-secondary/20"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
              pathname === "/dashboard/settings" ? "icon-filled text-secondary" : "group-hover:scale-110"
            }`}>
              settings
            </span>
            <span className="text-sm">Settings</span>
          </Link>
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-outline-variant/30">
          <button type="button" onClick={handleSignOut}
            title="Sign out of your account" aria-label="Sign out of your account"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/5 transition-all duration-200 group">
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Profile edit modal */}
      {editSection && (
        <ProfileEditModal
          section={editSection}
          profile={profile ?? null}
          onClose={() => setEditSection(null)}
          onSaved={() => { setEditSection(null); router.refresh(); }}
        />
      )}

      {txModalOpen && profile?.id && (
        <QuickTransactionModal
          user_id={profile.id}
          isOpen={txModalOpen}
          onClose={() => setTxModalOpen(false)}
        />
      )}
    </>
  );
}
