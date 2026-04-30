import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import LoginClient from "@/components/LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
