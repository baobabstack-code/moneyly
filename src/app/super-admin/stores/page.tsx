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
    .select('id, name, admin_id, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stores</h1>
        <Link href="/super-admin" className="text-sm text-muted-foreground hover:underline">
          ← Overview
        </Link>
      </div>

      <StoresClient stores={stores ?? []} />
    </div>
  )
}
