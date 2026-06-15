import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SuperAdminOverviewPage() {
  const supabase = await createClient()
  if (!supabase) {
    redirect('/login')
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ count: totalUsers }, { count: totalApps }, { count: pendingApps }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('spending_plans').select('id', { count: 'exact', head: true }),
    supabase.from('spending_plans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return (
    <div className="w-full space-y-10 font-manrope">

      {/* Page heading */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-1">Overview</h1>
        <p className="text-on-surface-variant text-sm">Global platform snapshot</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">group</span>
          </div>
          <p className="text-on-surface-variant text-sm mb-1">Total Users</p>
          <p className="text-4xl font-bold text-primary">{totalUsers ?? 0}</p>
        </div>
        <div className="bg-secondary text-on-secondary rounded-2xl p-6 shadow-xl shadow-secondary/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 relative z-10">
            <span className="material-symbols-outlined">description</span>
          </div>
          <p className="text-on-secondary/80 text-sm mb-1 relative z-10">Total Plans</p>
          <p className="text-4xl font-bold relative z-10">{totalApps ?? 0}</p>
        </div>
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 bg-error/10 text-error rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">hourglass_empty</span>
          </div>
          <p className="text-on-surface-variant text-sm mb-1">Active Plans</p>
          <p className="text-4xl font-bold text-error">{pendingApps ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
