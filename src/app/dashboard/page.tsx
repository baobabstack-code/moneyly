import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LandingPage from "@/app/(main)/page";

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  return <LandingPage />
}
