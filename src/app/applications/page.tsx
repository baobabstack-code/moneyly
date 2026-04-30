import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isProfileComplete, UserProfile } from '@/lib/profile'
import ApplicationsView from '@/components/ApplicationsView'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const [profileResult, applicationsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const profile = profileResult.data as UserProfile | null
  const applications = applicationsResult.data || []
  const profileComplete = profile ? isProfileComplete(profile) : false

  return (
    <ApplicationsView
      applications={applications}
      profileComplete={profileComplete}
    />
  )
}
