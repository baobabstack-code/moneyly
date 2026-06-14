import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminApplicationsClient from './AdminApplicationsClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  let query = supabase
    .from('spending_plans')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: applications } = await query

  return (
    <div className="w-full">
      <AdminApplicationsClient
        applications={applications ?? []}
        statusFilter={params.status}
        basePath="/super-admin/applications"
      />
    </div>
  )
}
