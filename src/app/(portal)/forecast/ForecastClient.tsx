"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CloudRain, Trophy, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Gated } from "@/components/Gated";
import type { Tier } from "@/lib/tiers";
import { regenerateForecast } from "./actions";

export interface DriverT { kind: "WEATHER" | "EVENT" | "GAMEDAY" | "DOW"; label: string; impactPct: number }
export interface PredictionT {
  date: string;
  weekday: string;
  predictedRevenue: number;
  baselineRevenue: number;
  liftPct: number;
  drivers: DriverT[];
  headline: string;
}

const DRIVER_ICON = { WEATHER: CloudRain, GAMEDAY: Trophy, EVENT: CalendarDays, DOW: CalendarDays } as const;

export function ForecastClient({ predictions, currentTier }: { predictions: PredictionT[]; currentTier: Tier }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const regen = () =>
    startTransition(async () => {
      const res = await regenerateForecast();
      if (!res.ok) alert(res.error);
      else router.refresh();
    });

  const chartData = predictions.map((p) => ({ label: p.weekday.slice(0, 3), Predicted: Math.round(p.predictedRevenue), Baseline: Math.round(p.baselineRevenue) }));

  return (
    <Gated feature="predictive_dashboard" currentTier={currentTier}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Next 7 days, modeled from your history{" "}
            <span style={{ color: "var(--text-dim)" }}>(weather &amp; game-day signals layer in when connected)</span>.
          </p>
          <button type="button" disabled={pending} onClick={regen} className="btn-ghost px-4 py-2 text-sm shrink-0 disabled:opacity-60">
            <RefreshCw size={14} /> {pending ? "Modeling…" : "Regenerate"}
          </button>
        </div>

        {predictions.length === 0 ? (
          <div className="card-base p-8 text-center">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>No forecast yet. Generate one from your channel history.</p>
            <button type="button" disabled={pending} onClick={regen} className="btn-accent px-5 py-2.5 text-sm disabled:opacity-60">
              <RefreshCw size={15} /> Generate forecast
            </button>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="card-base p-5">
              <h2 className="font-display text-base font-bold mb-3" style={{ color: "var(--navy)" }}>Predicted vs. typical day</h2>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-dim)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-dim)" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Baseline" fill="#C9C4B8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Predicted" fill="#1E3A5F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insight cards */}
            <div className="flex flex-col gap-3">
              {predictions.map((p) => {
                const up = p.liftPct >= 0;
                return (
                  <div key={p.date} className="card-base p-5 flex items-start gap-4">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-xs font-bold uppercase" style={{ color: "var(--accent)" }}>{p.weekday.slice(0, 3)}</p>
                      <p className="font-display text-xl font-bold" style={{ color: "var(--navy)" }}>{new Date(p.date).getUTCDate()}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{p.headline}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {p.drivers.map((d, i) => {
                          const Icon = DRIVER_ICON[d.kind];
                          return (
                            <span key={i} className="badge inline-flex items-center gap-1" style={{ background: "var(--cream)", color: "var(--text-muted)" }}>
                              <Icon size={11} /> {d.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-price font-bold" style={{ color: "var(--navy)" }}>${Math.round(p.predictedRevenue).toLocaleString()}</p>
                      <p className="text-xs inline-flex items-center gap-0.5" style={{ color: up ? "var(--green)" : "var(--red)" }}>
                        {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{up ? "+" : ""}{Math.round(p.liftPct)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Gated>
  );
}
