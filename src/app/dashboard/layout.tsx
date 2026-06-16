import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import GlobalFAB from "@/components/GlobalFAB";
import { createClient } from "@/utils/supabase/server";
import { isProfileComplete, type UserProfile } from "@/lib/profile";
import { IMPERSONATE_COOKIE, parseImpersonationCookie } from "@/lib/impersonate";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if super admin is impersonating a customer
  const cookieStore = await cookies();
  const impersonation = parseImpersonationCookie(cookieStore.get(IMPERSONATE_COOKIE)?.value);
  const isImpersonating = Boolean(impersonation?.targetUserId);

  // Determine whose profile to display
  const viewUserId = isImpersonating ? impersonation!.targetUserId : session?.user?.id;

  const profileResult = viewUserId
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("id", viewUserId)
        .single()
    : null;
  const profile = (profileResult?.data as UserProfile | null) || null;

  // When not impersonating, admins/super_admins redirect to their own views
  if (!isImpersonating) {
    const role = (profile as any)?.role ?? 'customer'
    if (role === 'super_admin') redirect('/super-admin')
  }

  // UI user info: show impersonated user's name/email or real user
  const initialUser = isImpersonating
    ? {
        email: (profile as any)?.email_address || impersonation!.targetName,
        displayName: impersonation!.targetName,
        avatarUrl: undefined,
      }
    : session?.user ? {
        email: session.user.email!,
        displayName: session.user.user_metadata?.full_name || session.user.email!,
        avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      } : null;

  const profileComplete = profile ? isProfileComplete(profile) : false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ImpersonationBanner />
      <Navbar initialUser={initialUser} />
      <div className="flex flex-1">
        <DashboardSidebar initialUser={initialUser} profileComplete={profileComplete} profile={profile} />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <GlobalFAB />
    </div>
  );
}
