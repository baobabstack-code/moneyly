import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AdminApplicationsClient from './AdminApplicationsClient'
import { IMPERSONATE_COOKIE, parseImpersonationCookie } from '@/lib/impersonate'

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const impersonation = parseImpersonationCookie(cookieStore.get(IMPERSONATE_COOKIE)?.value)
  const viewUserId = impersonation?.targetUserId ?? user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', viewUserId)
    .single()

  const params = await searchParams
  const statusFilter = params.status

  let query = supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  // For admin view (impersonating or actual admin), filter by their store
  const effectiveRole = impersonation ? 'admin' : profile?.role
  if (effectiveRole === 'admin') {
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('admin_id', viewUserId)
      .single()

    if (!store) {
      return <p className="text-on-surface-variant">No store assigned.</p>
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
