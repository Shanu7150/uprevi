"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowUpCircle,
  Shield,
  ShoppingBag,
  UtensilsCrossed,
  Settings,
  Star,
  Users,
  Gift,
  BarChart3,
  ListChecks,
  TrendingUp,
  BadgePercent,
  Briefcase,
} from "lucide-react";

const ICONS = {
  dashboard: LayoutDashboard,
  orders: ShoppingBag,
  menu: UtensilsCrossed,
  forecast: TrendingUp,
  promotions: BadgePercent,
  reviews: Star,
  customers: Users,
  loyalty: Gift,
  channels: BarChart3,
  tasks: ListChecks,
  services: Briefcase,
  upgrade: ArrowUpCircle,
  settings: Settings,
  admin: Shield,
} as const;

type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function PortalNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/forecast", label: "Forecast", icon: "forecast" },
    { href: "/orders", label: "Orders", icon: "orders" },
    { href: "/menu", label: "Menu", icon: "menu" },
    { href: "/promotions", label: "Promotions", icon: "promotions" },
    { href: "/reviews", label: "Reviews", icon: "reviews" },
    { href: "/customers", label: "Customers", icon: "customers" },
    { href: "/loyalty", label: "Loyalty", icon: "loyalty" },
    { href: "/channels", label: "Channels", icon: "channels" },
    { href: "/tasks", label: "Tasks", icon: "tasks" },
    { href: "/services", label: "Services", icon: "services" },
    { href: "/upgrade", label: "Plan & upgrade", icon: "upgrade" },
    { href: "/settings", label: "Settings", icon: "settings" },
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
