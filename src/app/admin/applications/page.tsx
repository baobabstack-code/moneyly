import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminApplicationsClient from './AdminApplicationsClient'

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const params = await searchParams
  const statusFilter = params.status

  let query = supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  // For admin (not super_admin), filter by their store
  if (profile?.role === 'admin') {
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('admin_id', user.id)
      .single()

    if (!store) {
      return <p className="text-muted-foreground">No store assigned.</p>
    }
    query = query.eq('store_id', store.id)
  }

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: applications } = await query

  return (
    <AdminApplicationsClient
      applications={applications ?? []}
      statusFilter={statusFilter}
    />
  )
}
