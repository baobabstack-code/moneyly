'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateApplicationStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('spending_plans')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/super-admin/applications')
  return { success: true }
}
