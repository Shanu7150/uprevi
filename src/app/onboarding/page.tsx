import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, getMemberships } from "@/lib/dal";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  await requireUser();
  const memberships = await getMemberships();
  if (memberships.length > 0) redirect("/dashboard");

  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--bg)" }}>
      <div className="max-w-xl mx-auto">
        <Link href="/" aria-label="UPREVI home" className="inline-flex mb-8">
          <Image src="/logo/UPREVI-logo-horizontal.png" alt="UPREVI" width={140} height={34} priority />
        </Link>
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--accent)" }}>Restaurant setup</p>
          <h1 className="font-display text-4xl font-bold mb-3" style={{ color: "var(--navy)" }}>Connect your restaurant</h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Add the restaurant this account will manage. You can complete the remaining business details later in Settings.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
