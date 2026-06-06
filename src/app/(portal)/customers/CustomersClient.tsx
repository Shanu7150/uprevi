"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Send } from "lucide-react";
import { Gated } from "@/components/Gated";
import type { Tier } from "@/lib/tiers";
import { recomputeSegments, triggerWinback } from "./actions";

export interface CustomerT {
  id: string;
  name: string;
  email: string | null;
  segment: string;
  totalOrders: number;
  clv: number;
  avgOrderValue: number;
  lastOrderAt: string | null;
}

const SEGMENT_COLOR: Record<string, { bg: string; fg: string }> = {
  VIP: { bg: "var(--accent-dim)", fg: "var(--accent)" },
  LOYAL: { bg: "var(--green-dim)", fg: "var(--green)" },
  AT_RISK: { bg: "var(--gold-dim)", fg: "var(--gold)" },
  NEW: { bg: "var(--blue-dim)", fg: "var(--blue)" },
  LAPSED: { bg: "var(--red-dim)", fg: "var(--red)" },
};

const SEGMENTS = ["VIP", "LOYAL", "AT_RISK", "NEW", "LAPSED"] as const;

export function CustomersClient({ customers, currentTier }: { customers: CustomerT[]; currentTier: Tier }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const counts = SEGMENTS.map((s) => ({ s, n: customers.filter((c) => c.segment === s).length }));

  const recompute = () =>
    startTransition(async () => {
      const res = await recomputeSegments();
      if (!res.ok) alert(res.error);
      else router.refresh();
    });

  const winback = () =>
    startTransition(async () => {
      const res = await triggerWinback();
      if (!res.ok) alert(res.error);
      else alert(`Win-back outreach queued for ${res.count} customer${res.count === 1 ? "" : "s"}.`);
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Segment summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {counts.map(({ s, n }) => {
          const c = SEGMENT_COLOR[s];
          return (
            <div key={s} className="card-base p-4">
              <span className="badge" style={{ background: c.bg, color: c.fg }}>{s.replace("_", " ")}</span>
              <p className="font-display text-2xl font-bold mt-2 font-mono-price" style={{ color: "var(--navy)" }}>{n}</p>
            </div>
          );
        })}
      </div>

      {/* Segmentation + win-back (gated ACCELERATOR+) */}
      <Gated feature="winback_automation" currentTier={currentTier}>
        <div className="card-base p-5 flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <p className="font-display text-base font-bold" style={{ color: "var(--navy)" }}>Automated segmentation</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Recompute segments from recency &amp; frequency, then win back lapsed customers.</p>
          </div>
          <button type="button" disabled={pending} onClick={recompute} className="btn-ghost px-4 py-2 text-sm disabled:opacity-60">
            <RefreshCw size={14} /> Recompute segments
          </button>
          <button type="button" disabled={pending} onClick={winback} className="btn-accent px-4 py-2 text-sm disabled:opacity-60">
            <Send size={14} /> Win back lapsed
          </button>
        </div>
      </Gated>

      {/* Customer table */}
      <div className="card-base overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
              <Th>Customer</Th><Th>Segment</Th><Th right>Orders</Th><Th right>CLV</Th><Th right>Avg</Th><Th right>Last order</Th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: "var(--text-dim)" }}>No customers yet.</td></tr>
            )}
            {customers.map((c) => {
              const sc = SEGMENT_COLOR[c.segment] ?? SEGMENT_COLOR.NEW;
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "var(--navy)" }}>{c.name}</p>
                    {c.email && <p className="text-xs" style={{ color: "var(--text-dim)" }}>{c.email}</p>}
                  </td>
                  <td className="px-4 py-3"><span className="badge" style={{ background: sc.bg, color: sc.fg }}>{c.segment.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 text-right font-mono-price">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-right font-mono-price" style={{ color: "var(--navy)" }}>${c.clv.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono-price">${c.avgOrderValue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: "var(--text-dim)" }}>{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-3 font-semibold ${right ? "text-right" : "text-left"}`} style={{ color: "var(--text-muted)" }}>
      {children}
    </th>
  );
}
