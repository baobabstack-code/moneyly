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

  const partnerType = (formData.get('partner_type') as string)?.trim() || 'store'

  const { error } = await supabase.from('business_partners').insert({
    name,
    partner_type: partnerType,
    code:          (formData.get('code')          as string)?.trim() || null,
    location:      (formData.get('location')      as string)?.trim() || null,
    hours:         (formData.get('hours')         as string)?.trim() || null,
    logo_url:      (formData.get('logo_url')      as string)?.trim() || null,
    funder_type:   (formData.get('funder_type')   as string)?.trim() || null,
    contact_email: (formData.get('contact_email') as string)?.trim() || null,
  })
  if (error) return { error: error.message }

  revalidatePath('/super-admin/business-partners')
  return { success: true }
}

// Keep old name as alias so any remaining callers still work
export const createStore = createBusinessPartner

export async function inviteAdmin(formData: FormData) {
  const email = formData.get('email') as string
  const storeId = Number(formData.get('storeId'))

  if (!email?.trim() || !storeId) return { error: 'Email and store are required' }

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { role: 'admin' },
  })

  if (error) return { error: error.message }

  const supabase = await createClient()
  const { error: partnerError } = await supabase
    .from('business_partners')
    .update({ admin_id: data.user.id })
    .eq('id', storeId)

  if (partnerError) return { error: partnerError.message }

  revalidatePath('/super-admin/business-partners')
  return { success: true }
}

export async function updateApplicationStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/super-admin/applications')
  revalidatePath('/admin/applications')
  return { success: true }
}

export async function assignAdminToStore(userId: string, storeId: number) {
  const supabase = await createClient()

  const { error: partnerError } = await supabase
    .from('business_partners')
    .update({ admin_id: userId })
    .eq('id', storeId)
  if (partnerError) return { error: partnerError.message }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)
  if (profileError) return { error: profileError.message }

  revalidatePath('/super-admin/business-partners')
  return { success: true }
}

export async function assignFunderToApplication(applicationId: string, funderId: number | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('applications')
    .update({ funder_id: funderId })
    .eq('id', applicationId)
  if (error) return { error: error.message }
  revalidatePath('/super-admin/applications')
  revalidatePath('/admin/applications')
  return { success: true }
}
