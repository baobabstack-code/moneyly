import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminApplicationsClient from '@/app/admin/applications/AdminApplicationsClient'

export const dynamic = 'force-dynamic'

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const storeId = Number(id)
  if (isNaN(storeId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, admin_id')
    .eq('id', storeId)
    .single()

  if (!store) notFound()

  const [{ data: applications }, { data: adminProfile }] = await Promise.all([
    supabase
      .from('applications')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false }),
    store.admin_id
      ? supabase
          .from('profiles')
          .select('first_name, last_name, email_address')
          .eq('id', store.admin_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/stores" className="text-sm text-muted-foreground hover:underline">
          ← Stores
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold">{store.name}</h1>
      </div>

      <div className="rounded-xl border bg-card p-4 text-sm space-y-1">
        <p>
          <span className="text-muted-foreground">Store Admin: </span>
          {adminProfile
            ? `${adminProfile.first_name ?? ''} ${adminProfile.last_name ?? ''} (${adminProfile.email_address ?? '—'})`
            : <span className="text-yellow-600">No admin assigned</span>}
        </p>
        <p>
          <span className="text-muted-foreground">Applications: </span>
          {applications?.length ?? 0}
        </p>
      </div>

      <AdminApplicationsClient applications={applications ?? []} />
    </div>
  )
}
