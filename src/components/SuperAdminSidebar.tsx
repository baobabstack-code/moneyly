'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props {
  user: { email: string; displayName: string };
}

const navItems = [
  { name: "Overview", href: "/super-admin", icon: "bar_chart", exact: true },
  { name: "Business Partners", href: "/super-admin/business-partners", icon: "handshake", exact: false },
  { name: "All Applications", href: "/super-admin/applications", icon: "pending_actions", exact: false },
  { name: "All Customers", href: "/super-admin/customers", icon: "group", exact: false },
];

export default function SuperAdminSidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = (user.displayName || user.email || "S")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (item: { href: string; exact: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-outline-variant h-[calc(100vh-64px)] sticky top-16 shrink-0 overflow-y-auto">

      {/* User info */}
      <div className="p-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-black text-sm shadow-lg shadow-secondary/20">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-secondary truncate">{user.displayName || user.email}</p>
            <p className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-widest">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        <div className="pb-2 px-4">
          <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Global Management</p>
        </div>

        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active
                  ? "bg-secondary/10 text-secondary font-bold border border-secondary/20"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${active ? "icon-filled" : "group-hover:scale-110"}`}
              >
                {item.icon}
              </span>
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}

      </nav>

      {/* Theme toggle + sign out */}
      <div className="p-4 border-t border-outline-variant/30 space-y-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <ThemeToggle />
          <span className="text-xs text-on-surface-variant/60">Toggle theme</span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/5 transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">logout</span>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
