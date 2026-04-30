import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SuperAdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: stores }, { count: totalApps }, { count: pendingApps }] = await Promise.all([
    supabase.from('stores').select('id, name, code, location, admin_id, created_at').order('id', { ascending: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
  ])

  return (
    <div className="max-w-5xl space-y-8">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Stores</p>
          <p className="text-4xl font-bold mt-1">{stores?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Applications</p>
          <p className="text-4xl font-bold mt-1">{totalApps ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Pending Review</p>
          <p className="text-4xl font-bold mt-1">{pendingApps ?? 0}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Stores</h2>
          <Link
            href="/super-admin/stores"
            className="text-sm text-primary hover:underline"
          >
            Manage stores →
          </Link>
        </div>
        {!stores?.length ? (
          <p className="text-muted-foreground">No stores yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Store</th>
                  <th className="px-4 py-3 text-left">Admin Assigned</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stores.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {s.admin_id ? s.admin_id.slice(0, 8) + '...' : 'None'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/super-admin/stores/${s.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
