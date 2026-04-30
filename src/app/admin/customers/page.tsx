import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Resolve which store this admin owns (super_admin has no store filter)
  let storeId: number | null = null
  if (profile?.role === 'admin') {
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('admin_id', user.id)
      .single()

    if (!store) {
      return (
        <div className="font-manrope">
          <section className="w-full py-10 px-6 md:px-10 xl:px-12">
            <p className="text-on-surface-variant">No store assigned to your account.</p>
          </section>
        </div>
      )
    }
    storeId = store.id
  }

  // Collect all unique customer user_ids from applications scoped to this store
  let appQuery = supabase
    .from('applications')
    .select('user_id')
    .order('created_at', { ascending: false })

  if (storeId !== null) {
    appQuery = appQuery.eq('store_id', storeId)
  }

  const { data: apps } = await appQuery
  const uniqueUserIds = [...new Set((apps ?? []).map(a => a.user_id).filter(Boolean))]

  // Fetch the profiles for those customers
  const { data: customers } = uniqueUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, first_name, last_name, email_address, mobile_number, national_id, is_profile_complete, created_at, employer_name, ministry, is_civil_servant, physical_address')
        .in('id', uniqueUserIds)
    : { data: [] }

  return (
    <div className="font-manrope pb-20 lg:pb-0">
      <section className="w-full py-10 px-6 md:px-10 xl:px-12">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">Customers</h1>
          <p className="text-on-surface-variant">
            {customers?.length ?? 0} customer{(customers?.length ?? 0) !== 1 ? 's' : ''} who applied to this store
          </p>
        </div>

        {/* Empty state */}
        {!customers?.length ? (
          <div className="max-w-md text-center py-10 px-6 bg-surface rounded-2xl border border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">
              group
            </span>
            <p className="text-on-surface-variant font-medium text-base">No customers yet.</p>
            <p className="text-on-surface-variant/60 text-sm mt-1">
              Customers appear here once they submit an application to your store.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map(c => (
              // Each customer is a card — no table, so it works on all screen sizes
              <div
                key={c.id}
                className="rounded-2xl bg-surface border border-outline-variant p-5 sm:p-6"
              >
                {/* Top row: name + profile-complete badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar placeholder */}
                    <div className="w-11 h-11 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl text-on-surface-variant">person</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-primary leading-tight">
                        {c.first_name} {c.last_name}
                      </h3>
                      <p className="text-xs text-on-surface-variant font-mono">{c.national_id ?? '—'}</p>
                    </div>
                  </div>

                  {/* Profile-complete badge mirrors status badge from customer views */}
                  <span className={`self-start sm:self-auto inline-block px-3 py-0.5 text-xs font-bold rounded-full uppercase ${
                    c.is_profile_complete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {c.is_profile_complete ? 'Profile complete' : 'Incomplete profile'}
                  </span>
                </div>

                {/* Detail grid: 2 cols on mobile → 3 on sm → 4 on lg */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Email',    value: c.email_address },
                    { label: 'Mobile',   value: c.mobile_number },
                    { label: 'Address',  value: c.physical_address },
                    { label: 'Employer', value: c.is_civil_servant ? (c.ministry || 'Civil Servant') : c.employer_name },
                    { label: 'Joined',   value: new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  ].filter((r): r is { label: string; value: string } => Boolean(r.value)).map(r => (
                    <div key={r.label}>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">
                        {r.label}
                      </p>
                      <p className="text-sm font-medium text-on-surface wrap-break-word">{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
