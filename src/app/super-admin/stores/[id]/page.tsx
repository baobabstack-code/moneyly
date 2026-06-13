import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminApplicationsClient from '@/app/admin/applications/AdminApplicationsClient'

export const dynamic = 'force-dynamic'

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeIdStr } = await params
  const storeId = parseInt(storeIdStr, 10)
  if (isNaN(storeId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('id', storeId)
    .single()

  if (!store) notFound()

  const { data: applications } = await supabase
    .from('spending_plans')
    .select('*, profiles(full_name)')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  return (
    <div className="w-full space-y-6 font-manrope">
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/super-admin/business-partners" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
          Back to sources
        </Link>
        <span className="text-on-surface-variant/40">/</span>
        <h1 className="text-3xl font-bold text-secondary">{store.name}</h1>
      </div>

      <div className="bg-surface border border-outline-variant rounded-2xl p-5 text-sm space-y-2">
        <p className="flex gap-2">
          <span className="text-on-surface-variant/60 font-bold uppercase text-[10px] tracking-widest self-center">Plans</span>
          <span className="font-bold text-primary text-base">{applications?.length ?? 0}</span>
        </p>
      </div>

      <AdminApplicationsClient
        applications={applications ?? []}
        basePath={`/super-admin/stores/${store.id}`}
      />
    </div>
  )
}
