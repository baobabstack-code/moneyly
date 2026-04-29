import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isProfileComplete } from '@/lib/profile'
import DashboardView from '@/components/DashboardView'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Fetch profile and applications in parallel server-side
  const [profileResult, applicationsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
  ])

  const profile = profileResult.data
  const applications = applicationsResult.data || []

  const displayName =
    profile?.first_name ||
    profile?.full_name?.split(' ')[0] ||
    session.user.email?.split('@')[0] ||
    'there'

  const profileComplete = profile ? isProfileComplete(profile) : false

  return (
    <DashboardView
      email={session.user.email!}
      displayName={displayName}
      profile={profile}
      applications={applications}
      profileComplete={profileComplete}
    />
  )
}