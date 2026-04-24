import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardView from '@/components/DashboardView'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const displayName =
    session.user.user_metadata?.full_name?.split(' ')[0] ||
    session.user.email?.split('@')[0] ||
    'there'

  return <DashboardView email={session.user.email!} displayName={displayName} />
}
