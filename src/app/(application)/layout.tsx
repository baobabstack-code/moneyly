import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isProfileComplete, UserProfile } from "@/lib/profile";
import ApplicationLayoutShell from "@/components/ApplicationLayoutShell";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  const profile = data as UserProfile | null;

  if (!profile || !isProfileComplete(profile)) {
    redirect("/profile-setup");
  }

  return (
    <ApplicationLayoutShell user={session.user} profile={profile}>
      {children}
    </ApplicationLayoutShell>
  );
}
