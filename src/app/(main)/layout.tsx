import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/server";
import type { UserProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const profileResult = session?.user
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
    : null;

  const profile = (profileResult?.data as UserProfile | null) || null;
  const initialUser = session?.user ? {
    email: session.user.email!,
    displayName:
      profile?.full_name ||
      session.user.user_metadata?.full_name ||
      session.user.email!,
    avatarUrl:
      profile?.avatar_url ||
      profile?.photo_url ||
      session.user.user_metadata?.avatar_url ||
      session.user.user_metadata?.picture,
  } : null;

  return (
    <>
      <Navbar initialUser={initialUser} />
      {children}
      <Footer />
    </>
  );
}
