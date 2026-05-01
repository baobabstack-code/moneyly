'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { IMPERSONATE_COOKIE } from '@/lib/impersonate'

export async function startImpersonation(targetUserId: string, targetName: string, returnPath: string, targetRole: 'customer' | 'admin' = 'customer') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const store = await cookies()
  store.set(IMPERSONATE_COOKIE, JSON.stringify({
    targetUserId,
    targetName,
    targetRole,
    returnPath,
    startedAt: Date.now(),
  }), {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  })

  redirect(targetRole === 'admin' ? '/admin' : '/dashboard')
}

export async function stopImpersonation(returnPath: string) {
  const store = await cookies()
  store.delete(IMPERSONATE_COOKIE)
  redirect(returnPath || '/super-admin')
}
