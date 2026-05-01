import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { IMPERSONATE_COOKIE, parseImpersonationCookie } from '@/lib/impersonate'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const impersonation = parseImpersonationCookie(cookieStore.get(IMPERSONATE_COOKIE)?.value)
  const viewUserId = impersonation?.targetUserId ?? user.id

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('admin_id', viewUserId)
    .single()

  if (!store) {
    return (
      <div className="w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">Admin Dashboard</h1>
        <p className="text-on-surface-variant">
          No store is assigned to your account.{' '}
          <Link href="/super-admin/stores" className="text-secondary font-bold hover:underline">
            Manage stores →
          </Link>
        </p>
      </div>
    )
  }

  const [{ count: total }, { count: pending }] = await Promise.all([
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('store_id', store.id).eq('status', 'submitted'),
  ])

  return (
    <div className="w-full space-y-8">

      {/* Page heading */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-1">{store.name}</h1>
        <p className="text-on-surface-variant text-sm">Store dashboard</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/admin/applications"
          className="bg-secondary text-on-secondary p-6 rounded-2xl shadow-xl shadow-secondary/15 flex flex-col justify-between group overflow-hidden relative min-h-40 hover:opacity-95 active:scale-[.99] transition-all"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <div className="relative z-10">
            <span className="material-symbols-outlined text-3xl mb-3">description</span>
            <p className="text-on-secondary/80 text-sm">Total Applications</p>
          </div>
          <p className="relative z-10 text-5xl font-bold">{total ?? 0}</p>
        </Link>

        <Link
          href="/admin/applications?status=submitted"
          className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between group min-h-40 hover:border-primary transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
              Needs review
            </span>
          </div>
          <div>
            <p className="text-5xl font-bold text-primary mb-1">{pending ?? 0}</p>
            <p className="text-on-surface-variant text-sm">Pending review</p>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/admin/applications"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">list_alt</span>
          View Applications
        </Link>
        <Link
          href="/admin/customers"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container transition-all"
        >
          <span className="material-symbols-outlined">group</span>
          View Customers
        </Link>
      </div>
    </div>
  )
}
