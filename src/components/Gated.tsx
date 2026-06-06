"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import {
  FEATURES,
  hasFeature,
  tierMeta,
  type FeatureKey,
  type Tier,
} from "@/lib/tiers";

/**
 * Cosmetic feature gate.
 *
 * IMPORTANT: this is presentation only. It never enforces access — the server
 * must guard the same feature via `requireEntitlement` / `assertEntitlement`
 * from `@/lib/entitlements`. `currentTier` is resolved on the server (which can
 * read the subscription) and passed down, since client code cannot query the DB.
 */
export function Gated({
  feature,
  currentTier,
  children,
}: {
  feature: FeatureKey;
  currentTier: Tier;
  children: React.ReactNode;
}) {
  if (hasFeature(currentTier, feature)) {
    return <>{children}</>;
  }

  const meta = FEATURES[feature];
  const required = tierMeta(meta.minTier);

  return (
    <div
      className="rounded-xl p-6 flex flex-col items-start gap-3"
      style={{
        background: "var(--card)",
        border: "1px dashed var(--accent-border)",
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded-lg w-9 h-9"
        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
      >
        <Lock size={16} />
      </span>
      <div>
        <p className="font-display text-lg font-bold" style={{ color: "var(--navy)" }}>
          {meta.label}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {meta.description}
        </p>
      </div>
      <p className="text-xs" style={{ color: "var(--text-dim)" }}>
        Included with{" "}
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>
          {required.name}
        </span>{" "}
        and above.
      </p>
      <Link
        href={`/upgrade?feature=${feature}`}
        className="btn-accent px-4 py-2 text-sm mt-1"
      >
        Unlock with an upgrade
      </Link>
    </div>
  );
}

export default Gated;
