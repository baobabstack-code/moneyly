import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BusinessPartnersClient from './BusinessPartnersClient'

export const dynamic = 'force-dynamic'

export default async function BusinessPartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: partners } = await supabase
    .from('stores')
    .select('id, name, code, location, hours, logo_url, created_at')
    .order('id', { ascending: true })

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary">Plan Sources</h1>
        <Link href="/super-admin" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
          ← Overview
        </Link>
      </div>

      <BusinessPartnersClient partners={partners ?? []} />
    </div>
  )
}
