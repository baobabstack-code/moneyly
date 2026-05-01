import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import LoginClient from "@/components/LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { next } = await searchParams;

  if (session?.user) {
    redirect(next ?? "/dashboard");
  }

  return <LoginClient next={next ?? "/dashboard"} />;
}
