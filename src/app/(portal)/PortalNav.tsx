"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowUpCircle, Shield } from "lucide-react";

const ICONS = {
  dashboard: LayoutDashboard,
  upgrade: ArrowUpCircle,
  admin: Shield,
} as const;

type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function PortalNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/upgrade", label: "Plan & upgrade", icon: "upgrade" },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: "admin" as const }]
      : []),
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: active ? "var(--accent-dim)" : "transparent",
              color: active ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
