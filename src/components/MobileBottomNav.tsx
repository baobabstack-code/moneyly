'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Home", href: "/dashboard", icon: "dashboard" },
  { name: "Apply", href: "/store-selection", icon: "add_circle" },
  { name: "Applications", href: "/applications", icon: "pending_actions" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-outline-variant pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-0.5 flex-1 py-1"
            >
              <span
                className={`material-symbols-outlined text-[26px] transition-colors ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
