import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { isProfileComplete } from '@/lib/profile'
import DashboardView from '@/components/DashboardView'
import { IMPERSONATE_COOKIE, parseImpersonationCookie } from '@/lib/impersonate'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  if (!supabase) {
    redirect('/login')
  }
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const impersonation = parseImpersonationCookie(cookieStore.get(IMPERSONATE_COOKIE)?.value)
  const isImpersonating = Boolean(impersonation?.targetUserId)
  const viewUserId = impersonation?.targetUserId ?? user.id

  // Only redirect admins/super_admins when NOT impersonating
  if (!isImpersonating) {
    const { data: roleRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleRow?.role === 'super_admin') redirect('/super-admin')
  }

  // Fetch impersonated (or real) user's profile and spending plans
  const [profileResult, spendingPlansResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', viewUserId)
      .single(),
    supabase
      .from('spending_plans')
      .select('*')
      .eq('user_id', viewUserId)
      .order('created_at', { ascending: false })
  ])

  const profile = profileResult.data
  const spendingPlans = spendingPlansResult.data || []

  const displayName =
    profile?.first_name ||
    profile?.full_name?.split(' ')[0] ||
    impersonation?.targetName ||
    user.email?.split('@')[0] ||
    'there'

  const profileComplete = profile ? isProfileComplete(profile) : false

  return (
    <DashboardView
      email={isImpersonating ? (impersonation!.targetName) : user.email!}
      displayName={displayName}
      profile={profile}
      initialSpendingPlans={spendingPlans}
      profileComplete={profileComplete}
    />
  )
}