import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminPlansClient from './AdminPlansClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  if (!supabase) {
    redirect('/login')
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  let query = supabase
    .from('spending_plans')
    .select('*, profiles(full_name, currency)')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: plans } = await query

  return (
    <div className="w-full">
      <AdminPlansClient
        plans={plans ?? []}
        statusFilter={params.status}
        basePath="/super-admin/plans"
      />
    </div>
  )
}
