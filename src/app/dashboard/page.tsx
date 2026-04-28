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

  // Check if profile is complete
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Redirect to profile-setup if not complete
  if (!isProfileComplete(profile)) {
    redirect('/profile-setup')
  }

  const displayName =
    session.user.user_metadata?.full_name?.split(' ')[0] ||
    session.user.email?.split('@')[0] ||
    'there'

  return <DashboardView email={session.user.email!} displayName={displayName} />
}