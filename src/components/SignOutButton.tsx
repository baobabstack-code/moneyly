'use client'

import { createClient } from '@/utils/supabase/client'

export default function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient()
    window.location.href = '/' // Eagerly redirect to homepage
    if (supabase) {
      supabase.auth.signOut().catch(console.error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface-container transition-all"
    >
      <span className="material-symbols-outlined text-[18px]">logout</span>
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  )
}
