import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CustomersClient from '@/components/CustomersClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminCustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all unique customer IDs across every application in the platform
  const { data: apps } = await supabase
    .from('applications')
    .select('user_id')

  const uniqueUserIds = [...new Set((apps ?? []).map(a => a.user_id).filter(Boolean))]

  const { data: customers } = uniqueUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, first_name, last_name, email_address, mobile_number, national_id, is_profile_complete, created_at, employer_name, ministry, is_civil_servant, physical_address')
        .in('id', uniqueUserIds)
    : { data: [] }

  return <CustomersClient customers={customers ?? []} />
}
