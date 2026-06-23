import { createClient } from "@/utils/supabase/client";

/**
 * USER PROFILE - All-in-one profile table
 * Combines: Basic Info + Contact + Next of Kin + Employment
 */

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  
  // PERSONAL FINANCE DETAILS
  first_name: string | null;
  last_name: string | null;
  monthly_income: string | null;
  daily_budget?: number | null;
  weekly_budget?: number | null;
  monthly_budget?: number | null;
  starting_balance?: number | null;
  currency?: string | null;
  accent_color?: string | null;
  tts_voice?: string | null;
  onboarded?: boolean | null;
  
  // ROLE
  role: string;

  // NOTIFICATIONS
  reminder_email_enabled?: boolean;
  reminder_sms_enabled?: boolean;
  phone_number?: string | null;
  budget_alerts_sent?: string;
}

/**
 * Checks if profile has minimum required fields completed.
 * For a personal finance manager, only a name is required.
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(profile.first_name || profile.full_name);
}

/**
 * Fetches the profile for the currently authenticated user.
 */
export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Saves or updates the current user's profile.
 * Also updates auth.users metadata with name.
 */
export async function saveProfile(data: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    console.warn('[saveProfile] No authenticated user ID found');
    return null;
  }

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

  try {
    // 1. Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName, first_name: data.first_name, last_name: data.last_name },
    });
    if (authError) {
      console.error('[saveProfile] auth.updateUser warning/error:', authError);
    }

    // 2. Safely Update or Insert the database profiles row
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabase
        .from('profiles')
        .update({ full_name: fullName, ...data })
        .eq('id', userId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('profiles')
        .insert({ id: userId, full_name: fullName, ...data })
        .select()
        .single();
    }

    const { data: updated, error: dbError } = result;

    if (dbError) {
      console.error('[saveProfile] profiles save failed:', dbError);
      return null;
    }

    return updated as UserProfile;
  } catch (err) {
    console.error('[saveProfile] unexpected error:', err);
    return null;
  }
}
