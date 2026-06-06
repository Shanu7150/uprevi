import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { requireRole } from "@/lib/dal";
import { signOutAction } from "@/app/(portal)/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["ADMIN"]);

  return (
    <div className="min-h-screen" style={{ background: "var(--navy)" }}>
      <header
        className="flex items-center justify-between px-6 h-16"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
      >
        <Link href="/admin" className="flex items-center gap-3" aria-label="UPREVI admin">
          <Image
            src="/logo/UPREVI-logo-white-on-dark.png"
            alt="UPREVI"
            width={39}
            height={36}
            priority
          />
          <span
            className="badge"
            style={{ background: "rgba(255,255,255,0.12)", color: "var(--gold-light)" }}
          >
            ADMIN
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "rgba(245,244,240,0.7)" }}>
            {user.email}
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "rgba(245,244,240,0.85)" }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
