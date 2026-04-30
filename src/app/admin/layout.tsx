import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch role and basic display name in one query
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, full_name')
    .eq('id', user.id)
    .single()

  // Middleware already blocks non-admin/super_admin, but keep a server-side guard
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard')
  }

  // Show store name next to the brand mark if this admin has one
  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('admin_id', user.id)
    .single()

  const displayName = profile.first_name || profile.full_name?.split(' ')[0] || user.email

  return (
    <div className="min-h-screen bg-background font-manrope flex flex-col">

      {/* ── Top nav bar ── */}
      <header className="sticky top-0 z-40 border-b bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-primary">HTB</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            Admin
          </span>
          {/* Store name shown inline so admin always knows which store they're managing */}
          {store && (
            <span className="hidden sm:block text-on-surface-variant text-sm">— {store.name}</span>
          )}
        </div>

        {/* Nav links — hidden on very small screens, shown from sm upward */}
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/admin" className="text-on-surface-variant hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/applications" className="text-on-surface-variant hover:text-primary transition-colors">
            Applications
          </Link>
          <Link href="/admin/customers" className="text-on-surface-variant hover:text-primary transition-colors">
            Customers
          </Link>
          {/* Only super_admin sees the Super Admin link */}
          {profile.role === 'super_admin' && (
            <Link href="/super-admin" className="text-secondary font-bold hover:opacity-80 transition-opacity">
              Super Admin
            </Link>
          )}
          <span className="text-on-surface-variant/60 hidden md:block">{displayName}</span>
          <SignOutButton />
        </nav>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}
