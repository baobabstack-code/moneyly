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
  employer_contact_person?: string | null;
  employer_email?: string | null;
  employer_address?: string | null;
  
  // STATUS
  is_profile_complete: boolean;
}

/**
 * Checks if profile has minimum required fields completed.
 * New users will see the profile completion card until they fill in basics.
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  const hasName = profile.first_name || profile.full_name;
  const hasBasic = profile.national_id && profile.date_of_birth && profile.gender;
  const hasContact = profile.physical_address && profile.mobile_number && profile.email_address;
  const hasNextOfKin = profile.nok_full_name && profile.nok_address && profile.nok_mobile_number && profile.nok_relationship;
  const hasEmployment =
    profile.employment_phone &&
    profile.employer_contact_person &&
    profile.employer_address &&
    (profile.is_civil_servant ? profile.employer_no && profile.ministry : profile.employer_name);
  return !!(hasName && hasBasic && hasContact && hasNextOfKin && hasEmployment && profile.is_profile_complete);
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
