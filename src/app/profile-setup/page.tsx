import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { UserProfile } from "@/lib/profile";
import ProfileSetupClient from "@/components/ProfileSetupClient";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <ProfileSetupClient
      initialProfile={(data as UserProfile | null) || null}
      initialUserId={user.id}
    />
  );
}
