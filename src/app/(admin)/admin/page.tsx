import { db } from "@/lib/db";
import { tierMeta, monthlyPriceFor, TIER_ORDER, type Tier } from "@/lib/tiers";

function sprintLabel(start: Date | null): { text: string; pct: number } {
  if (!start) return { text: "—", pct: 0 };
  const day = Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1;
  if (day > 90) return { text: "Complete", pct: 100 };
  return { text: `Day ${Math.max(1, day)} of 90`, pct: Math.min(100, Math.max(1, day) / 90 * 100) };
}

export default async function AdminPage() {
  const restaurants = await db.restaurant.findMany({
    orderBy: { name: "asc" },
    include: {
      subscription: true,
      _count: { select: { memberships: true, orders: true } },
    },
  });

  // MRR + tier distribution (active subscriptions only).
  let mrr = 0;
  let activeSubs = 0;
  const dist = new Map<Tier, number>();
  for (const r of restaurants) {
    const sub = r.subscription;
    if (!sub) continue;
    dist.set(sub.tier, (dist.get(sub.tier) ?? 0) + 1);
    if (sub.status === "ACTIVE" || sub.status === "TRIALING") {
      mrr += monthlyPriceFor(sub.tier);
      if (monthlyPriceFor(sub.tier) > 0) activeSubs += 1;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: "#fff" }}>Platform</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(245,244,240,0.7)" }}>
          {restaurants.length} restaurant{restaurants.length === 1 ? "" : "s"} · {activeSubs} paying
        </p>
      </div>

      {/* MRR + tier distribution */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DarkStat label="MRR" value={`$${mrr.toLocaleString()}`} sub="recurring / mo" highlight />
        <DarkStat label="ARR (run-rate)" value={`$${(mrr * 12).toLocaleString()}`} />
        <DarkStat label="Paying accounts" value={String(activeSubs)} />
        <DarkStat label="Avg / account" value={activeSubs ? `$${Math.round(mrr / activeSubs).toLocaleString()}` : "$0"} />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--gold-light)" }}>Tier distribution</p>
        <div className="flex flex-wrap gap-2">
          {TIER_ORDER.map((t) => (
            <span key={t} className="badge" style={{ background: "rgba(255,255,255,0.10)", color: "var(--cream)" }}>
              {tierMeta(t).name}: {dist.get(t) ?? 0}
            </span>
          ))}
        </div>
      </div>

      {/* Client management table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
              <Th>Restaurant</Th><Th>Plan</Th><Th>Status</Th><Th>Sprint</Th>
              <Th right>MRR</Th><Th right>Members</Th><Th right>Orders</Th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => {
              const sub = r.subscription;
              const sprint = sprintLabel(r.sprintStartDate);
              const rowMrr = sub ? monthlyPriceFor(sub.tier) : 0;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "var(--navy)" }}>{r.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>/{r.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                      {sub ? tierMeta(sub.tier).name : "No plan"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: sub?.status === "ACTIVE" ? "var(--green)" : "var(--text-dim)" }}>
                      {sub?.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-28">
                      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{sprint.text}</p>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--cream)" }}>
                        <div style={{ width: `${sprint.pct}%`, height: "100%", background: "var(--navy)" }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-price" style={{ color: "var(--navy)" }}>${rowMrr.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono-price" style={{ color: "var(--text)" }}>{r._count.memberships}</td>
                  <td className="px-4 py-3 text-right font-mono-price" style={{ color: "var(--text)" }}>{r._count.orders}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DarkStat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-5" style={{ background: highlight ? "rgba(154,115,34,0.18)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
      <p className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: "rgba(245,244,240,0.6)" }}>{label}</p>
      <p className="font-display text-3xl font-bold mt-1.5 font-mono-price" style={{ color: "#fff" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "rgba(245,244,240,0.5)" }}>{sub}</p>}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-3 font-semibold ${right ? "text-right" : "text-left"}`} style={{ color: "var(--text-muted)" }}>{children}</th>;
}
