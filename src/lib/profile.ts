import { createClient } from "@/utils/supabase/client";

/**
 * USER PROFILE UTILITIES
 * 
 * These helpers handle fetching and managing extended user data 
 * stored in the public 'profiles' table.
 */

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

/**
 * Fetches the profile for the currently authenticated user.
 */
export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as UserProfile;
}
