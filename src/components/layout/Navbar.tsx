/**
 * GLOBAL NAVIGATION BAR
 * 
 * Features:
 * - Real-time authentication state handling via Supabase Auth.
 * - Dynamic Profile/Sign-In display.
 * - Glassmorphism design (backdrop-blur) for a premium feel.
 * - Responsive layout with mobile-optimized menu/actions.
 */
'use client'

import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { getMyProfile, UserProfile } from "@/lib/profile";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    console.log('[Navbar] useEffect mounted');
    const getUserData = async () => {
      console.log('[Navbar] Fetching user data');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[Navbar] User fetched:', user?.email);
      setUser(user);
      if (user) {
        console.log('[Navbar] Fetching profile');
        const profileData = await getMyProfile();
        console.log('[Navbar] Profile fetched:', profileData?.full_name);
        setProfile(profileData);
      }
    };

    getUserData();

    console.log('[Navbar] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[Navbar] Auth state changed:', { event: _event, hasSession: !!session });
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          console.log('[Navbar] User logged in, fetching profile');
          const profileData = await getMyProfile();
          setProfile(profileData);
        } else {
          console.log('[Navbar] User logged out');
          setProfile(null);
        }
      }
    );

    return () => {
      console.log('[Navbar] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  console.log('[Navbar] Rendering with user:', user?.email);

  const handleLogout = async () => {
    console.log('[Navbar] Logout clicked');
    await supabase.auth.signOut();
    console.log('[Navbar] Signed out, refreshing');
    router.refresh();
  };

  return (
    <>
      <nav className="sticky top-0 w-full border-b bg-surface/80 backdrop-blur-md border-outline-variant z-50 font-manrope">
        <div className="flex justify-between items-center h-16 px-4 sm:px-8 max-w-container-max mx-auto w-full">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="text-xl font-black tracking-tighter text-primary">
              HTB GLOBAL
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Account</span>
                  <span className="text-xs font-bold text-on-surface max-w-[120px] truncate">
                    {profile?.full_name || user.email}
                  </span>
                </div>
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-9 h-9 rounded-xl border border-outline-variant object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-surface-container-highest border border-outline-variant flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-xl">account_circle</span>
                  </div>
                )}
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex bg-secondary text-on-secondary px-4 py-2 rounded-xl font-bold border border-outline-variant hover:bg-secondary/90 transition-all text-xs"
                >
                  Dashboard
                </Link>
                <button 
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
                  Login
                </Link>
                <Link 
                  href="/store-selection" 
                  className="bg-secondary text-on-secondary px-6 py-2 rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
                >
                  Apply Now
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
