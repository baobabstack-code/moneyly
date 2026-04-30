import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StoresClient from './StoresClient'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, code, location, hours, logo_url, admin_id, created_at')
    .order('id', { ascending: true })

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary">Stores</h1>
        <Link href="/super-admin" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
          ← Overview
        </Link>
      </div>

      <StoresClient stores={stores ?? []} />
    </div>
  )
}
