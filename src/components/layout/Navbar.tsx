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
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
                  <span className="text-xs font-bold text-on-surface max-w-[120px] truncate">{user.email}</span>
                </div>
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
