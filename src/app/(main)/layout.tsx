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
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const profileResult = (user && supabase)
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
    : null;

  const profile = (profileResult?.data as UserProfile | null) || null;
  const initialUser = user ? {
    email: user.email!,
    displayName:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email!,
    avatarUrl:
      profile?.avatar_url ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture,
  } : null;

  return (
    <>
      <Navbar initialUser={initialUser} />
      {children}
      <Footer />
    </>
  );
}
