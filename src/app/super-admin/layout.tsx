import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const displayName = profile.first_name || profile.full_name?.split(' ')[0] || user.email

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">HTB</span>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
            Super Admin
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/super-admin" className="hover:underline">Overview</Link>
          <Link href="/super-admin/stores" className="hover:underline">Stores</Link>
          <Link href="/super-admin/applications" className="hover:underline">All Applications</Link>
          <span className="text-muted-foreground">{displayName}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
