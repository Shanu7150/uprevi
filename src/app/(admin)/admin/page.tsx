import { db } from "@/lib/db";
import { tierMeta } from "@/lib/tiers";

export default async function AdminPage() {
  const restaurants = await db.restaurant.findMany({
    orderBy: { name: "asc" },
    include: {
      subscription: true,
      _count: { select: { memberships: true, orders: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: "#fff" }}>
          All restaurants
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(245,244,240,0.7)" }}>
          {restaurants.length} restaurant{restaurants.length === 1 ? "" : "s"} on
          the platform.
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
              <th className="text-left font-semibold px-4 py-3" style={{ color: "var(--text-muted)" }}>Restaurant</th>
              <th className="text-left font-semibold px-4 py-3" style={{ color: "var(--text-muted)" }}>Plan</th>
              <th className="text-right font-semibold px-4 py-3" style={{ color: "var(--text-muted)" }}>Members</th>
              <th className="text-right font-semibold px-4 py-3" style={{ color: "var(--text-muted)" }}>Orders</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-3">
                  <p className="font-medium" style={{ color: "var(--navy)" }}>{r.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>/{r.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="badge"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                  >
                    {r.subscription ? tierMeta(r.subscription.tier).name : "No plan"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono-price" style={{ color: "var(--text)" }}>
                  {r._count.memberships}
                </td>
                <td className="px-4 py-3 text-right font-mono-price" style={{ color: "var(--text)" }}>
                  {r._count.orders}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
