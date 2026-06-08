"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { Gated } from "@/components/Gated";
import type { Tier } from "@/lib/tiers";
import { rebuildUpsellRules } from "./actions";

export interface UpsellRuleT {
  id: string;
  triggerName: string;
  suggestedName: string;
  timesShown: number;
  timesConverted: number;
  conversionRate: number;
}

export function UpsellPanel({ rules, currentTier }: { rules: UpsellRuleT[]; currentTier: Tier }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const rebuild = () =>
    startTransition(async () => {
      const res = await rebuildUpsellRules();
      if (!res.ok) alert(res.error);
      else router.refresh();
    });

  return (
    <Gated feature="smart_upsell" currentTier={currentTier}>
      <div className="card-base p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: "var(--navy)" }}>
              <Sparkles size={16} style={{ color: "var(--accent)" }} /> Smart upsell
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Frequently-bought-together suggestions shown at checkout. Winners get promoted automatically.
            </p>
          </div>
          <button type="button" disabled={pending} onClick={rebuild} className="btn-ghost px-3 py-2 text-sm shrink-0 disabled:opacity-60">
            <RefreshCw size={14} /> {pending ? "Learning…" : "Rebuild"}
          </button>
        </div>

        {rules.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            No rules yet. Rebuild once you have orders with multiple items.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <span className="truncate" style={{ color: "var(--navy)" }}>{r.triggerName}</span>
                  <ArrowRight size={13} className="shrink-0" style={{ color: "var(--text-dim)" }} />
                  <span className="truncate" style={{ color: "var(--accent)" }}>{r.suggestedName}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono-price text-sm" style={{ color: "var(--navy)" }}>{Math.round(r.conversionRate * 100)}%</span>
                  <span className="text-xs ml-2" style={{ color: "var(--text-dim)" }}>{r.timesConverted}/{r.timesShown}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Gated>
  );
}
