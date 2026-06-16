import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import SettingsClient from '@/components/SettingsClient';
import { IMPERSONATE_COOKIE, parseImpersonationCookie } from '@/lib/impersonate';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect('/login');
  }
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const impersonation = parseImpersonationCookie(cookieStore.get(IMPERSONATE_COOKIE)?.value);
  const isImpersonating = Boolean(impersonation?.targetUserId);
  const viewUserId = impersonation?.targetUserId ?? session.user.id;

  // Fetch impersonated (or real) user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', viewUserId)
    .single();

  return (
    <SettingsClient
      profile={profile}
      userId={viewUserId}
      email={isImpersonating ? impersonation!.targetName : session.user.email!}
    />
  );
}
