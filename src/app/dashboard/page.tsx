import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LandingPage from "@/app/(main)/page";

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  console.log('[Dashboard] Server component rendering');
  const supabase = await createClient()
  console.log('[Dashboard] Supabase client created');
  
  const { data: { session } } = await supabase.auth.getSession()
  console.log('[Dashboard] Session check:', { hasSession: !!session, user: session?.user?.email });

  if (!session?.user) {
    console.log('[Dashboard] No session, redirecting to /login');
    redirect('/login')
  }

  console.log('[Dashboard] User authenticated, rendering LandingPage');
  return <LandingPage />
}
