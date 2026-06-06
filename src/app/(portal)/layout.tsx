import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { requireUser, getMemberships, getActiveRestaurant } from "@/lib/dal";
import { RestaurantSwitcher } from "./RestaurantSwitcher";
import { PortalNav } from "./PortalNav";
import { signOutAction } from "./actions";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const memberships = await getMemberships();
  const active = await getActiveRestaurant();

  const restaurants = memberships.map((m) => ({
    id: m.restaurantId,
    name: m.restaurant.name,
  }));

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 px-4 py-6 gap-6"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <Link href="/dashboard" className="px-2" aria-label="UPREVI dashboard">
          <Image
            src="/logo/UPREVI-logo-horizontal.png"
            alt="UPREVI"
            width={140}
            height={34}
            priority
          />
        </Link>

        {restaurants.length > 0 ? (
          <RestaurantSwitcher restaurants={restaurants} activeId={active?.id} />
        ) : (
          <p className="text-xs px-2" style={{ color: "var(--text-dim)" }}>
            No restaurant connected yet.
          </p>
        )}

        <PortalNav isAdmin={user.role === "ADMIN"} />

        <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs font-medium px-2 truncate" style={{ color: "var(--text)" }}>
            {user.name ?? user.email}
          </p>
          <p className="text-xs px-2 mb-3" style={{ color: "var(--text-dim)" }}>
            {user.role}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors w-full"
              style={{ color: "var(--text-muted)" }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-5 h-14"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
        >
          <Link href="/dashboard" aria-label="UPREVI dashboard">
            <Image
              src="/logo/UPREVI-mark.png"
              alt="UPREVI"
              width={31}
              height={30}
              priority
            />
          </Link>
          {restaurants.length > 0 && (
            <RestaurantSwitcher restaurants={restaurants} activeId={active?.id} />
          )}
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
