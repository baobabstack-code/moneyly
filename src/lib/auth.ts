import { createClient } from '@/utils/supabase/server'

export type UserRole = 'customer' | 'admin' | 'super_admin'

export async function getMyRole(): Promise<UserRole> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'customer'
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return (data?.role as UserRole) ?? 'customer'
}

export async function getMyStore() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('stores')
    .select('id, name')
    .limit(1)
    .single()
  return data
}
