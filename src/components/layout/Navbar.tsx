'use client'

import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { getMyProfile, UserProfile } from "@/lib/profile";

interface NavbarProps {
  initialUser?: { email: string; displayName: string; avatarUrl?: string } | null;
}

export default function Navbar({ initialUser }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authChanged, setAuthChanged] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Account</span>
                <span className="text-xs font-bold text-on-surface max-w-[120px] truncate">
                  {displayEmail}
                </span>
              </div>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-xl border border-outline-variant object-cover shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-surface-container-highest border border-outline-variant flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-xl">account_circle</span>
                </div>
              )}
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
    </nav>
  );
}
