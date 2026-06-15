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
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const { next } = await searchParams;

  if (session?.user) {
    redirect(next ?? "/dashboard");
  }

  return <LoginClient next={next ?? "/dashboard"} />;
}
