'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createStore(formData: FormData) {
  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Store name is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('stores').insert({ name: name.trim() })
  if (error) return { error: error.message }

  revalidatePath('/super-admin/stores')
  return { success: true }
}

export async function inviteAdmin(formData: FormData) {
  const email = formData.get('email') as string
  const storeId = Number(formData.get('storeId'))

  if (!email?.trim() || !storeId) return { error: 'Email and store are required' }

  const supabaseAdmin = createAdminClient()

  // Invite the user with role=admin in metadata
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { role: 'admin' },
  })

  if (error) return { error: error.message }

  // Assign admin to the store
  const supabase = await createClient()
  const { error: storeError } = await supabase
    .from('stores')
    .update({ admin_id: data.user.id })
    .eq('id', storeId)

  if (storeError) return { error: storeError.message }

  revalidatePath('/super-admin/stores')
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

  // Update store's admin_id
  const { error: storeError } = await supabase
    .from('stores')
    .update({ admin_id: userId })
    .eq('id', storeId)
  if (storeError) return { error: storeError.message }

  // Ensure the profile has role=admin
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)
  if (profileError) return { error: profileError.message }

  revalidatePath('/super-admin/stores')
  return { success: true }
}
