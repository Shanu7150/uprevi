import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { ChannelsClient, type ChannelRow, type ChannelPoint } from "./ChannelsClient";

const THIRD_PARTY_TAKE = 0.3; // assumed DoorDash/UberEats commission

export default async function ChannelsPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Channel intelligence appears once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const tier = await getTier(restaurant.id);
  const rows = await db.channelRevenue.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { date: "asc" },
    take: 365,
  });

  const totals = { DOORDASH: 0, UBEREATS: 0, DIRECT: 0 };
  const byDate = new Map<string, ChannelPoint>();
  const list: ChannelRow[] = [];

  for (const r of rows) {
    const rev = Number(r.revenue);
    totals[r.channel] += rev;
    const key = r.date.toISOString().slice(0, 10);
    const point = byDate.get(key) ?? { date: key, label: `${r.date.getUTCMonth() + 1}/${r.date.getUTCDate()}`, DOORDASH: 0, UBEREATS: 0, DIRECT: 0 };
    point[r.channel] += rev;
    byDate.set(key, point);
    list.push({ id: r.id, date: key, channel: r.channel, revenue: rev, orders: r.orders });
  }

  const series = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const thirdParty = totals.DOORDASH + totals.UBEREATS;
  const feeSaved = totals.DIRECT * THIRD_PARTY_TAKE;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Channel intelligence
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          {restaurant.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          DoorDash, UberEats, and direct revenue in one view. Import data or add it manually.
        </p>
      </div>
      <ChannelsClient
        currentTier={tier}
        series={series}
        rows={[...list].reverse().slice(0, 30)}
        totals={totals}
        thirdParty={thirdParty}
        feeSaved={feeSaved}
      />
    </div>
  );
}
