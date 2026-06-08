"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { Tier } from "@/lib/tiers";
import { startUpgrade } from "./actions";

export function UpgradeButton({
  tier,
  isCurrent,
  isDowngrade,
}: {
  tier: Tier;
  isCurrent: boolean;
  isDowngrade: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [requested, setRequested] = useState(false);

  if (isCurrent || isDowngrade) {
    return (
      <button type="button" disabled className="btn-ghost px-3 py-2 text-sm" style={{ opacity: 0.6, cursor: "default" }}>
        {isCurrent ? "Current plan" : "Included"}
      </button>
    );
  }

  if (requested) {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium" style={{ color: "var(--green)" }}>
        <Check size={15} /> Request sent
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await startUpgrade(tier);
          if (!res.ok) { alert(res.error); return; }
          if (res.mode === "checkout") window.location.href = res.url;
          else setRequested(true);
        })
      }
      className="btn-accent px-3 py-2 text-sm disabled:opacity-60"
    >
      {pending ? "Starting…" : "Upgrade"}
    </button>
  );
}
