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
  
  // BASIC INFO
  first_name: string | null;
  last_name: string | null;
  national_id: string | null;
  date_of_birth: string | null;
  gender: string | null;
  photo_url: string | null;
  
  // CONTACT
  physical_address: string | null;
  mobile_number: string | null;
  email_address: string | null;
  
  // NEXT OF KIN
  nok_full_name: string | null;
  nok_address: string | null;
  nok_mobile_number: string | null;
  nok_relationship: string | null;
  
  // EMPLOYMENT
  employer_name: string | null;
  employer_no: string | null;
  ministry: string | null;
  is_civil_servant: boolean;
  monthly_income: string | null;
  employment_phone: string | null;
  
  // STATUS
  is_profile_complete: boolean;
}

/**
 * Checks if all required profile fields are filled
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(
    profile.first_name &&
    profile.last_name &&
    profile.national_id &&
    profile.date_of_birth &&
    profile.gender &&
    profile.photo_url &&
    profile.physical_address &&
    profile.mobile_number &&
    profile.email_address &&
    profile.nok_full_name &&
    profile.nok_address &&
    profile.nok_mobile_number &&
    profile.nok_relationship &&
    profile.employer_name &&
    profile.is_civil_servant !== null &&
    profile.is_profile_complete
  );
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

/**
 * Saves or updates the current user's profile.
 */
export async function saveProfile(data: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: updated, error } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      full_name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
      ...data,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving profile:', error);
    return null;
  }

  return updated as UserProfile;
}