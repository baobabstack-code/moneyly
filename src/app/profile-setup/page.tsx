import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { UserProfile } from "@/lib/profile";
import ProfileSetupClient from "@/components/ProfileSetupClient";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
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

  return (
    <ProfileSetupClient
      initialProfile={(data as UserProfile | null) || null}
      initialUserId={session.user.id}
    />
  );
}
