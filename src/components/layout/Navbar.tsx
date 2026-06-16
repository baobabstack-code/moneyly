'use client'

import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { getMyProfile, UserProfile } from "@/lib/profile";
import { useFinanceStore } from "@/lib/financeStore";
import ProfileEditModal from "@/components/ProfileEditModal";

interface NavbarProps {
  initialUser?: { email: string; displayName: string; avatarUrl?: string } | null;
}

export default function Navbar({ initialUser }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authChanged, setAuthChanged] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();
  const [editSection, setEditSection] = useState<'personal' | null>(null);

  const pendingMutations = useFinanceStore(state => state.pendingMutations);
  const syncOfflineData = useFinanceStore(state => state.syncOfflineData);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        // Automatically trigger sync when coming back online
        syncOfflineData();
      };
      const handleOffline = () => {
        setIsOnline(false);
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [syncOfflineData]);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const profileData = await getMyProfile();
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        setAuthChanged(true);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    // Redirect to /login rather than '/' — the landing page redirects
    // authenticated users back to /dashboard which creates a redirect loop.
    window.location.href = '/login';
  };

  // Before client hydration completes, use server-provided initialUser to avoid flash
  const isLoggedIn = authChanged ? !!user : !!initialUser;
  const displayEmail = authChanged
    ? (profile?.full_name || user?.email || '')
    : (initialUser?.displayName || initialUser?.email || '');
  const avatarUrl = authChanged
    ? (profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null)
    : (initialUser?.avatarUrl || null);

  return (
    <nav className="sticky top-0 w-full border-b bg-surface/80 backdrop-blur-md border-outline-variant z-50 font-manrope">
      <div className="flex justify-between items-center h-16 px-4 sm:px-8 max-w-container-max mx-auto w-full">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Moneyly Logo" className="w-8 h-8" />
            <span className="text-xl font-black tracking-tighter text-primary">
              Moneyly
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              {/* Connection Status Pill */}
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold backdrop-blur-sm transition-all select-none ${
                  !isOnline 
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.08)]' 
                    : pendingMutations.length > 0
                      ? 'bg-blue-500/10 border-blue-500/25 text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.08)] animate-pulse'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.08)]'
                }`}
                title={
                  `Connection status showing if you are online or offline, and indicating count of pending changes synced to the cloud. Current status: ` +
                  (!isOnline 
                    ? `Offline. ${pendingMutations.length} changes queued to sync.` 
                    : pendingMutations.length > 0 
                      ? `Syncing ${pendingMutations.length} updates...` 
                      : 'Connected. Offline-first sync active.')
                }
              >
                <span className={`material-symbols-outlined text-sm leading-none ${
                  isOnline && pendingMutations.length > 0 ? 'animate-spin' : ''
                }`}>
                  {!isOnline ? 'wifi_off' : pendingMutations.length > 0 ? 'sync' : 'wifi'}
                </span>
                <span className="hidden sm:inline uppercase tracking-wider">
                  {!isOnline 
                    ? `Offline ${pendingMutations.length > 0 ? `(${pendingMutations.length})` : ''}` 
                    : pendingMutations.length > 0
                      ? `Syncing (${pendingMutations.length})`
                      : 'Online'
                  }
                </span>
              </div>

              {pathname !== '/dashboard' && (
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex bg-secondary text-on-secondary px-4 py-2 rounded-xl font-bold border border-outline-variant hover:bg-secondary/90 transition-all text-xs"
                >
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={() => setEditSection("personal")}
                className="bg-surface-container-highest text-on-surface p-2 rounded-xl font-bold border border-outline-variant hover:bg-surface-container transition-all text-xs flex items-center justify-center"
                title="Profile Settings"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-xl font-bold border border-outline-variant hover:bg-surface-container transition-all text-xs flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span className="hidden xs:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-on-surface-variant font-bold hover:text-primary transition-all text-sm px-4"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="bg-secondary text-on-secondary px-6 py-2 rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
      {editSection && (
        <ProfileEditModal
          section={editSection}
          profile={profile ?? null}
          onClose={() => setEditSection(null)}
          onSaved={() => { setEditSection(null); router.refresh(); }}
        />
      )}
    </nav>
  );
}
