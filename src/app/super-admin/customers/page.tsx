import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CustomersClient from '@/components/CustomersClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminCustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all unique customer IDs across every spending plan in the platform
  const { data: apps } = await supabase
    .from('spending_plans')
    .select('user_id')

  const uniqueUserIds = [...new Set((apps ?? []).map(a => a.user_id).filter(Boolean))]

  const { data: customers } = uniqueUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username, monthly_income, created_at, role')
        .in('id', uniqueUserIds)
    : { data: [] }

  return <CustomersClient customers={customers ?? []} showImpersonate />
}
