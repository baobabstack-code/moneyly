import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import AdminSidebar from '@/components/AdminSidebar'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import { AdminMobileNav } from '@/components/AdminMobileNav'
import { IMPERSONATE_COOKIE, parseImpersonationCookie } from '@/lib/impersonate'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if super admin is impersonating a store admin
  const cookieStore = await cookies()
  const impersonation = parseImpersonationCookie(cookieStore.get(IMPERSONATE_COOKIE)?.value)
  const isImpersonating = Boolean(impersonation?.targetUserId)

  // Determine whose profile/store to show
  const viewUserId = isImpersonating ? impersonation!.targetUserId : user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, full_name')
    .eq('id', viewUserId)
    .single()

  // When not impersonating, enforce role check
  if (!isImpersonating && (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin'))) {
    redirect('/dashboard')
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('admin_id', viewUserId)
    .single()

  const displayName = isImpersonating
    ? impersonation!.targetName
    : (profile?.first_name || profile?.full_name?.split(' ')[0] || user.email || '')

  return (
    <div className="min-h-screen bg-background font-manrope flex flex-col">
      <ImpersonationBanner />

      {/* ── Sticky top bar ── */}
      <header className="sticky top-0 z-40 h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md px-6 flex items-center gap-3">
        <span className="font-black text-lg text-primary tracking-tight">HTB</span>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
          Admin
        </span>
        {store && (
          <span className="hidden sm:block text-on-surface-variant/60 text-sm">— {store.name}</span>
        )}
      </header>

      {/* ── Body: sidebar + page content ── */}
      <div className="flex flex-1">
        <AdminSidebar
          user={{ email: isImpersonating ? (impersonation!.targetName) : (user.email ?? ''), displayName }}
          role={isImpersonating ? 'admin' : (profile?.role as 'admin' | 'super_admin')}
          storeName={store?.name}
        />
        <main className="flex-1 min-w-0 px-6 py-8 md:px-10 pb-24 lg:pb-8">{children}</main>
      </div>
      <AdminMobileNav />
    </div>
  )
}
