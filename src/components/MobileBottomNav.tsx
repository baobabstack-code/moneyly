'use client';

/**
 * MobileBottomNav — fixed bottom tab bar shown on mobile only (hidden on lg+).
 * Highlights the active route.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useFinanceStore } from "@/lib/financeStore";
import QuickTransactionModal from "./QuickTransactionModal";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const accentColor = useFinanceStore(state => state.accentColor);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getSession().then((res: any) => {
        const session = res?.data?.session;
        if (session?.user) {
          setUserId(session.user.id);
        }
      });
    }
  }, []);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: "dashboard" },
    { name: "History", href: "/dashboard/history", icon: "history" },
    { name: "Add", isCenter: true },
    { name: "Plan", href: "/plan/details", icon: "add_circle" },
    { name: "Plans", href: "/plans", icon: "pending_actions" },
  ];

  return (
    <>
      <nav 
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-lg border-t border-outline-variant pb-safe"
        data-accent={accentColor}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1 relative">
          {navItems.map((item, idx) => {
            if (item.isCenter) {
              return (
                <div key="center-btn" className="flex flex-col items-center flex-1 py-1 relative">
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="flex h-12 w-12 -mt-6 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-lg shadow-secondary/40 transition-transform hover:scale-105 active:scale-95 z-20"
                    title="Quick Add Transaction"
                  >
                    <span className="material-symbols-outlined text-2xl font-black">add</span>
                  </button>
                  <span className="text-[10px] font-bold tracking-wide text-on-surface-variant mt-1">
                    Add
                  </span>
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href!}
                className="flex flex-col items-center gap-0.5 flex-1 py-1"
              >
                <span
                  className={`material-symbols-outlined text-[24px] transition-colors ${isActive ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {userId && (
        <QuickTransactionModal
          user_id={userId}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
