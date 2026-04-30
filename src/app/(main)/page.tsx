import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LandingPageContent from '@/components/LandingPageContent'

export default async function Page() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) {
    // Route admin/super_admin to their dashboards instead of the customer one
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role === 'super_admin') redirect('/super-admin')
    if (profile?.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  return <LandingPageContent />
}
