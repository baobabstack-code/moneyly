'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createBusinessPartner(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('stores').insert({
    name,
    code:          (formData.get('code')          as string)?.trim() || null,
    location:      (formData.get('location')      as string)?.trim() || null,
    hours:         (formData.get('hours')         as string)?.trim() || null,
    logo_url:      (formData.get('logo_url')      as string)?.trim() || null,
  })
  if (error) return { error: error.message }

  revalidatePath('/super-admin/business-partners')
  revalidatePath('/super-admin/stores')
  return { success: true }
}

export async function inviteAdmin(formData: FormData) {
  const email = formData.get('email') as string
  const storeId = Number(formData.get('storeId'))

  if (!email?.trim() || !storeId) return { error: 'Email and source are required' }

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { role: 'admin' },
  })

  if (error) return { error: error.message }

  // stores table no longer has admin_id, so we just invite the user with admin metadata.
  revalidatePath('/super-admin/business-partners')
  revalidatePath('/super-admin/stores')
  return { success: true }
}

export async function updateApplicationStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('spending_plans')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/super-admin/applications')
  revalidatePath('/admin/applications')
  return { success: true }
}
