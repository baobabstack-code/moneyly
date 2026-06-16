'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useFinanceStore } from '@/lib/financeStore';
import QuickTransactionModal from './QuickTransactionModal';

export default function GlobalFAB() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
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

  if (!userId) return null;

  return (
    <>
      <div 
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 hidden md:flex items-center group"
        data-accent={accentColor}
      >
        {/* Premium Tooltip */}
        <div className="absolute right-16 bg-slate-900/90 border border-outline-variant/65 text-on-primary text-xs font-bold px-3 py-2 rounded-xl shadow-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap backdrop-blur-md">
          Quick Add Transaction
        </div>

        {/* Floating Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-lg shadow-secondary/40 shadow-glow transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer relative overflow-hidden"
          title="Quick Add Transaction"
          aria-label="Quick Add Transaction"
        >
          {/* Subtle shine effect on hover */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          
          <span className="material-symbols-outlined text-2xl font-black transition-transform duration-300 group-hover:rotate-90">
            add
          </span>
        </button>
      </div>

      {isOpen && (
        <QuickTransactionModal
          user_id={userId}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
