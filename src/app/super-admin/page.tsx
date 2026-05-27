import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SuperAdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: stores }, { count: totalApps }, { count: pendingApps }] = await Promise.all([
    supabase.from('business_partners').select('id, name, code, location, admin_id, created_at').order('id', { ascending: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
  ])

  return (
    <div className="w-full space-y-10">

      {/* Page heading */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-1">Overview</h1>
        <p className="text-on-surface-variant text-sm">Global platform snapshot</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">store</span>
          </div>
          <p className="text-on-surface-variant text-sm mb-1">Stores</p>
          <p className="text-4xl font-bold text-primary">{stores?.length ?? 0}</p>
        </div>
        <div className="bg-secondary text-on-secondary rounded-2xl p-6 shadow-xl shadow-secondary/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 relative z-10">
            <span className="material-symbols-outlined">description</span>
          </div>
          <p className="text-on-secondary/80 text-sm mb-1 relative z-10">Total Applications</p>
          <p className="text-4xl font-bold relative z-10">{totalApps ?? 0}</p>
        </div>
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 bg-error/10 text-error rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">hourglass_empty</span>
          </div>
          <p className="text-on-surface-variant text-sm mb-1">Pending Review</p>
          <p className="text-4xl font-bold text-error">{pendingApps ?? 0}</p>
        </div>
      </div>

      {/* Stores table */}
      {/* <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Stores</h2>
          <Link
            href="/super-admin/stores"
            className="text-sm text-secondary font-bold hover:opacity-80 transition-opacity"
          >
            Manage stores →
          </Link>
        </div>

        {!stores?.length ? (
          <div className="bg-surface border border-outline-variant rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3 block">store_mall_directory</span>
            <p className="text-on-surface-variant">No stores yet.</p>
          </div>
        ) : (
          <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant/50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Store</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Admin</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Created</th>
                  <th className="px-5 py-3.5 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {stores.map(s => (
                  <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4 font-bold text-on-surface">{s.name}</td>
                    <td className="px-5 py-4 text-on-surface-variant/70 font-mono text-xs">
                      {s.admin_id ? s.admin_id.slice(0, 8) + '…' : <span className="text-on-surface-variant/40">None</span>}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant/60 text-xs">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/super-admin/stores`}
                        className="text-xs text-secondary font-bold hover:opacity-80 transition-opacity"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div> */}
    </div>
  )
}
