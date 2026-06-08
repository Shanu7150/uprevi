"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, X, Pencil, CloudRain, Trophy, CalendarDays, Moon, Tag } from "lucide-react";
import { Gated } from "@/components/Gated";
import type { Tier } from "@/lib/tiers";
import { generateSmartPromos, approvePromo, dismissPromo, customizePromo } from "./actions";

export interface PromoT {
  id: string;
  name: string;
  description: string;
  type: string;
  triggerType: string;
  status: string;
  value: number;
  code: string | null;
  usageCount: number;
  revenueGenerated: number;
  conversionRate: number;
  aiGenerated: boolean;
}

const TRIGGER = {
  WEATHER: { icon: CloudRain, label: "Weather" },
  GAMEDAY: { icon: Trophy, label: "Game day" },
  EVENT: { icon: CalendarDays, label: "Event" },
  SLOW_DAY: { icon: Moon, label: "Slow day" },
  MANUAL: { icon: Tag, label: "Manual" },
} as const;

function valueLabel(p: PromoT): string {
  if (p.type === "FREE_DELIVERY") return "Free delivery";
  if (p.type === "PERCENTAGE_DISCOUNT") return `${p.value}% off`;
  return `$${p.value} off`;
}

export function PromotionsClient({ promotions, currentTier }: { promotions: PromoT[]; currentTier: Tier }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const drafts = promotions.filter((p) => p.status === "DRAFT");
  const active = promotions.filter((p) => p.status === "ACTIVE" || p.status === "PAUSED");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok && r.error) alert(r.error);
      router.refresh();
    });

  return (
    <Gated feature="smart_promos" currentTier={currentTier}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            AI drafts promos tied to what&apos;s coming. You approve, customize, or dismiss.
          </p>
          <button type="button" disabled={pending} onClick={() => run(generateSmartPromos)} className="btn-accent px-4 py-2 text-sm shrink-0 disabled:opacity-60">
            <Sparkles size={14} /> {pending ? "Drafting…" : "Generate smart promos"}
          </button>
        </div>

        {/* Drafts awaiting approval */}
        {drafts.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-bold mb-3" style={{ color: "var(--accent)" }}>Awaiting your approval</h2>
            <div className="flex flex-col gap-3">
              {drafts.map((p) => (
                <DraftCard key={p.id} promo={p} pending={pending} run={run} />
              ))}
            </div>
          </section>
        )}

        {/* Active */}
        <section>
          <h2 className="font-display text-lg font-bold mb-3" style={{ color: "var(--navy)" }}>Active promotions</h2>
          {active.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>No active promotions yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {active.map((p) => {
                const T = TRIGGER[p.triggerType as keyof typeof TRIGGER] ?? TRIGGER.MANUAL;
                return (
                  <div key={p.id} className="card-base p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{p.name}</p>
                        <span className="badge" style={{ background: "var(--green-dim)", color: "var(--green)" }}>{valueLabel(p)}</span>
                        {p.code && <span className="font-mono-price text-xs" style={{ color: "var(--text-dim)" }}>{p.code}</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs" style={{ color: "var(--text-dim)" }}>{p.usageCount} uses · ${p.revenueGenerated.toFixed(0)}</p>
                      <button type="button" disabled={pending} onClick={() => run(() => dismissPromo(p.id))} className="text-xs mt-1" style={{ color: "var(--red)" }}>End</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Gated>
  );
}

function DraftCard({ promo, pending, run }: {
  promo: PromoT; pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(promo.name);
  const [description, setDescription] = useState(promo.description);
  const [value, setValue] = useState(String(promo.value));
  const T = TRIGGER[promo.triggerType as keyof typeof TRIGGER] ?? TRIGGER.MANUAL;
  const Icon = T.icon;

  return (
    <div className="card-base p-5" style={{ borderColor: "var(--accent-border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="badge inline-flex items-center gap-1" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}><Icon size={11} /> {T.label}</span>
        {promo.aiGenerated && <span className="badge inline-flex items-center gap-1" style={{ background: "var(--cream)", color: "var(--text-muted)" }}><Sparkles size={10} /> AI</span>}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-base px-3 py-2 text-sm" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-base px-3 py-2 text-sm" />
          <input value={value} onChange={(e) => setValue(e.target.value)} type="number" className="input-base px-3 py-2 text-sm font-mono-price w-28" />
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => run(async () => { const r = await customizePromo({ id: promo.id, name, description, value: Number(value) }); if (r.ok) setEditing(false); return r; })} className="btn-accent px-3 py-1.5 text-xs">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost px-3 py-1.5 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <p className="font-semibold" style={{ color: "var(--navy)" }}>{promo.name}</p>
            <span className="badge" style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>{valueLabel(promo)}</span>
            {promo.code && <span className="font-mono-price text-xs" style={{ color: "var(--text-dim)" }}>{promo.code}</span>}
          </div>
          <p className="text-sm mt-1 mb-3" style={{ color: "var(--text-muted)" }}>{promo.description}</p>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => run(() => approvePromo(promo.id))} className="btn-accent px-4 py-1.5 text-xs disabled:opacity-60"><Check size={13} /> Approve</button>
            <button type="button" disabled={pending} onClick={() => setEditing(true)} className="btn-ghost px-3 py-1.5 text-xs"><Pencil size={12} /> Customize</button>
            <button type="button" disabled={pending} onClick={() => run(() => dismissPromo(promo.id))} className="btn-ghost px-3 py-1.5 text-xs"><X size={13} /> Dismiss</button>
          </div>
        </>
      )}
    </div>
  );
}
