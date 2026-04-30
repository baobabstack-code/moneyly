import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { createClient } from "@/utils/supabase/server";
import { isProfileComplete, type UserProfile } from "@/lib/profile";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const initialUser = session?.user ? {
    email: session.user.email!,
    displayName: session.user.user_metadata?.full_name || session.user.email!,
    avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
  } : null;
  const profileResult = session?.user
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
    : null;
  const profile = (profileResult?.data as UserProfile | null) || null;
  const profileComplete = profile ? isProfileComplete(profile) : false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar initialUser={initialUser} />
      <div className="flex flex-1">
        {profileComplete && (
          <DashboardSidebar initialUser={initialUser} profileComplete={profileComplete} />
        )}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      {profileComplete && <MobileBottomNav />}
    </div>
  );
}
