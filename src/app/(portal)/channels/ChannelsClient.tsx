"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Upload } from "lucide-react";
import { Gated } from "@/components/Gated";
import type { Tier } from "@/lib/tiers";
import { addChannelEntry, importChannelCsv, deleteChannelEntry } from "./actions";

export interface ChannelPoint { date: string; label: string; DOORDASH: number; UBEREATS: number; DIRECT: number }
export interface ChannelRow { id: string; date: string; channel: string; revenue: number; orders: number }

const COLORS = { DOORDASH: "#E24536", UBEREATS: "#1B9E5A", DIRECT: "var(--navy)" } as const;

export function ChannelsClient({
  currentTier, series, rows, totals, thirdParty, feeSaved,
}: {
  currentTier: Tier;
  series: ChannelPoint[];
  rows: ChannelRow[];
  totals: { DOORDASH: number; UBEREATS: number; DIRECT: number };
  thirdParty: number;
  feeSaved: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [channel, setChannel] = useState<"DOORDASH" | "UBEREATS" | "DIRECT">("DOORDASH");
  const [revenue, setRevenue] = useState("");
  const [orders, setOrders] = useState("");
  const [csv, setCsv] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok && r.error) alert(r.error);
      router.refresh();
    });

  return (
    <Gated feature="channel_both" currentTier={currentTier}>
      <div className="flex flex-col gap-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="DoorDash" value={totals.DOORDASH} color={COLORS.DOORDASH} />
          <Stat label="UberEats" value={totals.UBEREATS} color={COLORS.UBEREATS} />
          <Stat label="Direct" value={totals.DIRECT} color="var(--navy)" />
          <div className="card-base p-5">
            <p className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>Fees saved (direct)</p>
            <p className="font-display text-2xl font-bold mt-1.5 font-mono-price" style={{ color: "var(--green)" }}>${feeSaved.toFixed(0)}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>vs ${thirdParty.toFixed(0)} on 3rd-party</p>
          </div>
        </div>

        {/* Trend */}
        <div className="card-base p-5">
          <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--navy)" }}>Revenue by channel</h2>
          {series.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-dim)" }}>No data yet. Add an entry or import a CSV below.</p>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-dim)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-dim)" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Area type="monotone" dataKey="DOORDASH" stackId="1" stroke={COLORS.DOORDASH} fill={COLORS.DOORDASH} fillOpacity={0.18} />
                  <Area type="monotone" dataKey="UBEREATS" stackId="1" stroke={COLORS.UBEREATS} fill={COLORS.UBEREATS} fillOpacity={0.18} />
                  <Area type="monotone" dataKey="DIRECT" stackId="1" stroke="#1E3A5F" fill="#1E3A5F" fillOpacity={0.18} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Entry + import */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card-base p-5">
            <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--navy)" }}>Add entry</h2>
            <div className="flex flex-col gap-2">
              <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="input-base px-3 py-2 text-sm" />
              <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className="input-base px-3 py-2 text-sm">
                <option value="DOORDASH">DoorDash</option>
                <option value="UBEREATS">UberEats</option>
                <option value="DIRECT">Direct</option>
              </select>
              <div className="flex gap-2">
                <input value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="Revenue $" type="number" step="0.01" className="input-base px-3 py-2 text-sm font-mono-price" />
                <input value={orders} onChange={(e) => setOrders(e.target.value)} placeholder="Orders" type="number" className="input-base px-3 py-2 text-sm font-mono-price" />
              </div>
              <button type="button" disabled={pending || !date || !revenue} onClick={() => run(async () => { const r = await addChannelEntry({ date, channel, revenue: Number(revenue), orders: Number(orders || 0) }); if (r.ok) { setRevenue(""); setOrders(""); } return r; })} className="btn-accent px-4 py-2 text-sm self-start disabled:opacity-60"><Plus size={15} /> Add</button>
            </div>
          </div>

          <div className="card-base p-5">
            <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--navy)" }}>Import CSV</h2>
            <p className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>Format: date,channel,revenue,orders (one per line)</p>
            <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={4} placeholder={"2026-06-01,doordash,820.50,31\n2026-06-01,ubereats,540.00,19"} className="input-base px-3 py-2 text-xs font-mono-price resize-none" />
            <button type="button" disabled={pending || !csv.trim()} onClick={() => run(async () => { const r = await importChannelCsv(csv); if (r.ok) { alert(`Imported ${(r as { imported: number }).imported} rows.`); setCsv(""); } return r; })} className="btn-ghost px-4 py-2 text-sm mt-2 disabled:opacity-60"><Upload size={14} /> Import</button>
          </div>
        </div>

        {/* Recent rows */}
        {rows.length > 0 && (
          <div className="card-base overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left font-semibold px-4 py-2.5" style={{ color: "var(--text-muted)" }}>Date</th>
                  <th className="text-left font-semibold px-4 py-2.5" style={{ color: "var(--text-muted)" }}>Channel</th>
                  <th className="text-right font-semibold px-4 py-2.5" style={{ color: "var(--text-muted)" }}>Revenue</th>
                  <th className="text-right font-semibold px-4 py-2.5" style={{ color: "var(--text-muted)" }}>Orders</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-2.5">{r.date}</td>
                    <td className="px-4 py-2.5">{r.channel}</td>
                    <td className="px-4 py-2.5 text-right font-mono-price" style={{ color: "var(--navy)" }}>${r.revenue.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono-price">{r.orders}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" disabled={pending} onClick={() => run(() => deleteChannelEntry(r.id))} className="p-1.5 rounded-md" style={{ color: "var(--red)" }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Gated>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card-base p-5">
      <p className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>{label}</p>
      <p className="font-display text-2xl font-bold mt-1.5 font-mono-price" style={{ color }}>${value.toFixed(0)}</p>
    </div>
  );
}
