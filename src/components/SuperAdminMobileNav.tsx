'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

const superAdminItems = [
  { name: "Overview",      href: "/super-admin",               icon: "bar_chart" },
  { name: "Plans",         href: "/super-admin/plans",  icon: "pending_actions" },
  { name: "Customers",     href: "/super-admin/customers",     icon: "group" },
]

export function SuperAdminMobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/')
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-outline-variant pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {superAdminItems.map((item) => {
          const isActive = item.href === "/super-admin" ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center gap-0.5 flex-1 py-1">
              <span className={`material-symbols-outlined text-[26px] transition-colors ${isActive ? 'icon-filled text-secondary' : 'text-on-surface-variant'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
        <button type="button" onClick={handleSignOut} className="flex flex-col items-center gap-0.5 flex-1 py-1">
          <span className="material-symbols-outlined text-[26px] text-on-surface-variant">logout</span>
          <span className="text-[10px] font-bold tracking-wide text-on-surface-variant">Sign Out</span>
        </button>
      </div>
    </nav>
  )
}
