import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminApplicationsClient from '@/app/admin/applications/AdminApplicationsClient'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function StoreDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid: storeUuid } = await params
  if (!UUID_REGEX.test(storeUuid)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('business_partners')
    .select('id, name, admin_id, uuid')
    .eq('uuid', storeUuid)
    .single()

  if (!store) notFound()

  const [{ data: applications }, { data: adminProfile }, { data: funders }] = await Promise.all([
    supabase
      .from('applications')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false }),
    store.admin_id
      ? supabase
          .from('profiles')
          .select('first_name, last_name, email_address')
          .eq('id', store.admin_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from('business_partners')
      .select('id, name, funder_type')
      .eq('partner_type', 'funder')
      .order('name', { ascending: true }),
  ])

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/super-admin/business-partners" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
          ← Business Partners
        </Link>
        <span className="text-on-surface-variant/40">/</span>
        <h1 className="text-3xl font-bold text-secondary">{store.name}</h1>
      </div>

      <div className="bg-surface border border-outline-variant rounded-2xl p-5 text-sm space-y-2">
        <p className="flex gap-2">
          <span className="text-on-surface-variant/60 font-bold uppercase text-[10px] tracking-widest self-center">Store Admin</span>
          {adminProfile
            ? <span className="font-medium text-on-surface">{adminProfile.first_name ?? ''} {adminProfile.last_name ?? ''} ({adminProfile.email_address ?? '—'})</span>
            : <span className="text-status-warning font-medium">No admin assigned</span>}
        </p>
        <p className="flex gap-2">
          <span className="text-on-surface-variant/60 font-bold uppercase text-[10px] tracking-widest self-center">Applications</span>
          <span className="font-bold text-primary text-base">{applications?.length ?? 0}</span>
        </p>
      </div>

      <AdminApplicationsClient
        applications={applications ?? []}
        basePath={`/super-admin/stores/${store.uuid}`}
        funders={funders ?? []}
        isSuperAdmin
      />
    </div>
  )
}
