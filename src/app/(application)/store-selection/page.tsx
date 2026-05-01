import { createClient } from '@/utils/supabase/server'
import StoreSelectionClient from './StoreSelectionClient'

export const dynamic = 'force-dynamic'

export default async function StoreSelectionPage() {
  const supabase = await createClient()

  // Fetch stores from the DB so super-admin additions appear immediately
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, code, location, hours, logo_url')
    .order('id', { ascending: true })

  return <StoreSelectionClient stores={stores ?? []} />
}
