import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { createClient } from "@/utils/supabase/server";
import { isProfileComplete, type UserProfile } from "@/lib/profile";
import { IMPERSONATE_COOKIE, parseImpersonationCookie } from "@/lib/impersonate";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if super admin is impersonating a customer
  const cookieStore = await cookies();
  const impersonation = parseImpersonationCookie(cookieStore.get(IMPERSONATE_COOKIE)?.value);
  const isImpersonating = Boolean(impersonation?.targetUserId);

  // Determine whose profile to display
  const viewUserId = isImpersonating ? impersonation!.targetUserId : session.user.id;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", viewUserId)
    .single();

  const profile = data as UserProfile | null;

  // When not impersonating, admins/super_admins redirect to their own views
  if (!isImpersonating) {
    const role = (profile as any)?.role ?? 'customer'
    if (role === 'super_admin') redirect('/super-admin')
  }

  if (!profile || !isProfileComplete(profile)) {
    redirect("/profile-setup");
  }

  // UI user info: show impersonated user's name/email or real user
  const initialUser = isImpersonating
    ? {
        email: (profile as any)?.email_address || impersonation!.targetName,
        displayName: impersonation!.targetName,
        avatarUrl: undefined,
      }
    : {
        email: session.user.email!,
        displayName: session.user.user_metadata?.full_name || session.user.email!,
        avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      };

  const profileComplete = isProfileComplete(profile);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ImpersonationBanner />
      <Navbar initialUser={initialUser} />
      <div className="flex flex-1">
        <DashboardSidebar initialUser={initialUser} profileComplete={profileComplete} profile={profile} />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <section className="w-full px-6 py-8 md:px-10 xl:px-12">
            {children}
          </section>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

