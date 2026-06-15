'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePlanStatus(id: string, status: string) {
  const supabase = await createClient()
  if (!supabase) {
    return { error: "Database connection not available" }
  }
  const { error } = await supabase
    .from('spending_plans')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/super-admin/plans')
  return { success: true }
}
