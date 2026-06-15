import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CustomersClient from '@/components/CustomersClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminCustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customers } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username, monthly_income, created_at, role, currency')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  return <CustomersClient customers={customers ?? []} showImpersonate />
}
