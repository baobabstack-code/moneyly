import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SuperAdminSidebar from '@/components/SuperAdminSidebar'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import { SuperAdminMobileNav } from '@/components/SuperAdminMobileNav'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  if (!supabase) redirect('/login')
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const displayName = profile.first_name || profile.full_name?.split(' ')[0] || user.email || ''

  return (
    <div className="min-h-screen bg-background font-manrope flex flex-col">
      <ImpersonationBanner />

      {/* ── Sticky top bar ── */}
      <header className="sticky top-0 z-40 h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md px-6 flex items-center gap-3">
        <span className="font-black text-lg text-secondary tracking-tight">Moneyly</span>
        <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
          Super Admin
        </span>
      </header>

      {/* ── Body: sidebar + page content ── */}
      <div className="flex flex-1">
        <SuperAdminSidebar
          user={{ email: user.email ?? '', displayName }}
        />
        <main className="flex-1 min-w-0 px-6 py-8 md:px-10 pb-24 lg:pb-8">{children}</main>
      </div>
      <SuperAdminMobileNav />
    </div>
  )
}
