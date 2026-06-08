import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { ForecastClient, type PredictionT, type DriverT } from "./ForecastClient";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ForecastPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          The forecast appears once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const tier = await getTier(restaurant.id);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rows = await db.revenuePrediction.findMany({
    where: { restaurantId: restaurant.id, date: { gte: today } },
    orderBy: { date: "asc" },
    take: 7,
  });

  const predictions: PredictionT[] = rows.map((p) => {
    const date = p.date.toISOString().slice(0, 10);
    return {
      date,
      weekday: WEEKDAYS[p.date.getUTCDay()],
      predictedRevenue: Number(p.predictedRevenue),
      baselineRevenue: Number(p.baselineRevenue),
      liftPct: p.liftPct,
      drivers: (p.drivers as unknown as DriverT[]) ?? [],
      headline: p.headline,
    };
  });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Forecast
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          What&apos;s coming, before it happens
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Owner.com shows you yesterday. UPREVI shows you next week.
        </p>
      </div>
      <ForecastClient predictions={predictions} currentTier={tier} />
    </div>
  );
}
