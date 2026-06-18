import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LandingPageContent from '@/components/LandingPageContent'

export default async function Page() {
  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null

  if (user && supabase) {
    // Route super_admin to their dashboard instead of the customer one
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'super_admin') redirect('/super-admin')
    redirect('/dashboard')
  }

  return <LandingPageContent />
}
