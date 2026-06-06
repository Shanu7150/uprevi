import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--bg)" }}
    >
      <Link href="/" aria-label="UPREVI home" className="mb-8">
        <Image
          src="/logo/UPREVI-logo-stacked.png"
          alt="UPREVI"
          width={91}
          height={80}
          priority
        />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-xs" style={{ color: "var(--text-dim)" }}>
        Restaurant delivery revenue growth. Guaranteed.
      </p>
    </div>
  );
}
