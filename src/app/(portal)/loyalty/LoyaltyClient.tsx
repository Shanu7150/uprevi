"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { Gated } from "@/components/Gated";
import type { Tier } from "@/lib/tiers";
import { saveLoyaltyConfig, addReward, toggleReward, deleteReward } from "./actions";

export interface RewardT { id: string; name: string; pointsCost: number; isActive: boolean }

export function LoyaltyClient({
  currentTier,
  initialEnabled,
  initialPoints,
  rewards,
}: {
  currentTier: Tier;
  initialEnabled: boolean;
  initialPoints: number;
  rewards: RewardT[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [points, setPoints] = useState(String(initialPoints));
  const [saved, setSaved] = useState(false);
  const [rName, setRName] = useState("");
  const [rCost, setRCost] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok && r.error) alert(r.error);
      router.refresh();
    });

  return (
    <Gated feature="loyalty" currentTier={currentTier}>
      <div className="flex flex-col gap-6">
        {/* Config */}
        <div className="card-base p-6">
          <h2 className="font-display text-lg font-bold mb-4" style={{ color: "var(--navy)" }}>Program settings</h2>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: "var(--text)" }}>
              <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setSaved(false); }} className="w-4 h-4 accent-[var(--navy)]" />
              Loyalty program enabled
            </label>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Points per $1 spent</label>
              <input value={points} onChange={(e) => { setPoints(e.target.value); setSaved(false); }} type="number" min="0" className="input-base px-3 py-2.5 text-sm font-mono-price w-32" />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" disabled={pending} onClick={() => run(async () => { const r = await saveLoyaltyConfig({ enabled, pointsPerDollar: Number(points) }); if (r.ok) setSaved(true); return r; })} className="btn-accent px-5 py-2.5 text-sm disabled:opacity-60">Save</button>
              {saved && <span className="text-sm flex items-center gap-1" style={{ color: "var(--green)" }}><Check size={14} /> Saved</span>}
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="card-base p-6">
          <h2 className="font-display text-lg font-bold mb-4" style={{ color: "var(--navy)" }}>Rewards</h2>
          <div className="flex flex-col gap-2 mb-4">
            {rewards.length === 0 && <p className="text-sm" style={{ color: "var(--text-dim)" }}>No rewards yet.</p>}
            {rewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={r.isActive} disabled={pending} onChange={(e) => run(() => toggleReward(r.id, e.target.checked))} className="w-4 h-4 accent-[var(--navy)]" />
                  </label>
                  <span className="text-sm" style={{ color: r.isActive ? "var(--navy)" : "var(--text-dim)" }}>{r.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono-price" style={{ color: "var(--text-muted)" }}>{r.pointsCost.toLocaleString()} pts</span>
                  <button type="button" disabled={pending} onClick={() => run(() => deleteReward(r.id))} className="p-1.5 rounded-md" style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Reward (e.g. Free appetizer)" className="input-base px-3 py-2 text-sm" />
            <input value={rCost} onChange={(e) => setRCost(e.target.value)} placeholder="Points" type="number" min="1" className="input-base px-3 py-2 text-sm font-mono-price w-28" />
            <button type="button" disabled={pending || !rName.trim() || !rCost} onClick={() => run(async () => { const r = await addReward({ name: rName, pointsCost: Number(rCost) }); if (r.ok) { setRName(""); setRCost(""); } return r; })} className="btn-accent px-4 py-2 text-sm shrink-0 disabled:opacity-60"><Plus size={15} /></button>
          </div>
        </div>
      </div>
    </Gated>
  );
}
