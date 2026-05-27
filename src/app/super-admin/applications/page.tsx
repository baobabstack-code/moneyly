import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminApplicationsClient from '@/app/admin/applications/AdminApplicationsClient'

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
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const [{ data: applications }, { data: funders }] = await Promise.all([
    query,
    supabase
      .from('business_partners')
      .select('id, name, funder_type')
      .eq('partner_type', 'funder')
      .order('name', { ascending: true }),
  ])

  return (
    <div className="w-full">
      <AdminApplicationsClient
        applications={applications ?? []}
        statusFilter={params.status}
        basePath="/super-admin/applications"
        funders={funders ?? []}
        isSuperAdmin
      />
    </div>
  )
}
