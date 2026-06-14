import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import CustomersClient from '@/components/CustomersClient'
import { IMPERSONATE_COOKIE, parseImpersonationCookie } from '@/lib/impersonate'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
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

  let appQuery = supabase
    .from('spending_plans')
    .select('user_id')
    .order('created_at', { ascending: false })

  const { data: apps } = await appQuery
  const uniqueUserIds = [...new Set((apps ?? []).map((a: any) => a.user_id).filter(Boolean))]

  const { data: customers } = uniqueUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username, monthly_income, created_at, role')
        .in('id', uniqueUserIds)
    : { data: [] }

  return <CustomersClient customers={customers ?? []} />
}
