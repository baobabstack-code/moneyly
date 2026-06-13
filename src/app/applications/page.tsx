import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isProfileComplete, UserProfile } from '@/lib/profile'
import ApplicationsView from '@/components/ApplicationsView'
import Navbar from '@/components/layout/Navbar'
import DashboardSidebar from '@/components/DashboardSidebar'
import MobileBottomNav from '@/components/MobileBottomNav'

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
      .from('spending_plans')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),
  ])

  const profile = profileResult.data as UserProfile | null
  const applications = applicationsResult.data || []
  const profileComplete = profile ? isProfileComplete(profile) : false
  const initialUser = {
    email: session.user.email!,
    displayName:
      profile?.full_name ||
      session.user.user_metadata?.full_name ||
      session.user.email!,
    avatarUrl:
      profile?.avatar_url ||
      session.user.user_metadata?.avatar_url ||
      session.user.user_metadata?.picture,
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar initialUser={initialUser} />
      <div className="flex flex-1">
        {profileComplete && (
          <DashboardSidebar initialUser={initialUser} profileComplete={profileComplete} profile={profile} />
        )}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <ApplicationsView
            applications={applications}
            profileComplete={profileComplete}
          />
        </main>
      </div>
      {profileComplete && <MobileBottomNav />}
    </div>
  )
}
