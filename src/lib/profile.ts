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
  
  // ROLE
  role: string;
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
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

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
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  if (!userId) return null;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

  // Run auth metadata update and DB upsert in parallel
  const [, { data: updated, error }] = await Promise.all([
    supabase.auth.updateUser({
      data: { full_name: fullName, first_name: data.first_name, last_name: data.last_name },
    }),
    supabase
      .from('profiles')
      .upsert({ id: userId, full_name: fullName, ...data })
      .select()
      .single(),
  ]);

  if (error) {
    console.error('Error saving profile:', error);
    return null;
  }

  return updated as UserProfile;
}
