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

  let storeId: number | null = null
  let storeName: string | undefined

  const effectiveRole = impersonation ? 'admin' : profile?.role
  if (effectiveRole === 'admin') {
    const { data: store } = await supabase
      .from('stores')
      .select('id, name')
      .limit(1)
      .single()

    if (!store) {
      return <p className="text-on-surface-variant">No store assigned to your account.</p>
    }
    storeId = store.id
    storeName = store.name
  }

  let appQuery = supabase
    .from('spending_plans')
    .select('user_id')
    .order('created_at', { ascending: false })

  if (storeId !== null) {
    appQuery = appQuery.eq('store_id', storeId)
  }

  const { data: apps } = await appQuery
  const uniqueUserIds = [...new Set((apps ?? []).map(a => a.user_id).filter(Boolean))]

  const { data: customers } = uniqueUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username, monthly_income, created_at, role')
        .in('id', uniqueUserIds)
    : { data: [] }

  return <CustomersClient customers={customers ?? []} storeName={storeName} />
}
