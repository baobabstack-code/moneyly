import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LandingPageContent from '@/components/LandingPageContent'

export default async function Page() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) {
    redirect('/dashboard')
  }

  return <LandingPageContent />
}
