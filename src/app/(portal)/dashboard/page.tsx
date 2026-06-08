import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { tierMeta } from "@/lib/tiers";
import { db } from "@/lib/db";
import { Gated } from "@/components/Gated";
import { SmartPromoDemo } from "./SmartPromoDemo";

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card-base p-5">
      <p className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
        {label}
      </p>
      <p className="font-display text-3xl font-bold mt-1.5 font-mono-price" style={{ color: "var(--navy)" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          Your account isn&apos;t linked to a restaurant yet. Once onboarding is
          complete it will appear here.
        </p>
        <Link href="/" className="btn-ghost px-4 py-2 text-sm">
          Back to site
        </Link>
      </div>
    );
  }

  const tier = await getTier(restaurant.id);
  const meta = tierMeta(tier);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [orderAgg, customerCount, reviewCount, nextPrediction] = await Promise.all([
    db.order.aggregate({
      where: { restaurantId: restaurant.id },
      _sum: { total: true },
      _count: true,
    }),
    db.customer.count({ where: { restaurantId: restaurant.id } }),
    db.review.count({ where: { restaurantId: restaurant.id } }),
    db.revenuePrediction.findFirst({
      where: { restaurantId: restaurant.id, date: { gte: today } },
      orderBy: { date: "asc" },
    }),
  ]);

  const revenue = Number(orderAgg._sum.total ?? 0);
  const orderCount = orderAgg._count;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
            {restaurant.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {[restaurant.city, restaurant.state].filter(Boolean).join(", ")}
          </p>
        </div>
        <Link
          href="/upgrade"
          className="badge"
          style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
        >
          {meta.name} plan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Total revenue" value={`$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="All orders" />
        <StatBlock label="Orders" value={orderCount.toLocaleString()} />
        <StatBlock label="Customers" value={customerCount.toLocaleString()} />
        <StatBlock label="Reviews" value={reviewCount.toLocaleString()} />
      </div>

      {/* Predictive forecast teaser (gated ACCELERATOR+) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold" style={{ color: "var(--navy)" }}>
            Forecast
          </h2>
          <Link href="/forecast" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            View 7-day forecast →
          </Link>
        </div>
        <Gated feature="predictive_dashboard" currentTier={tier}>
          <Link href="/forecast" className="card-base p-5 flex items-center gap-4 block">
            <TrendingUp size={22} style={{ color: "var(--accent)" }} className="shrink-0" />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>
                {nextPrediction ? nextPrediction.headline : "Generate your 7-day revenue forecast."}
              </p>
              {nextPrediction && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                  Next: {nextPrediction.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          </Link>
        </Gated>
      </section>

      {/* Gated feature demo */}
      <section>
        <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--navy)" }}>
          Smart promos
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          A gated capability. On a SPRINT plan it&apos;s locked; switch to an
          ACCELERATOR restaurant (or upgrade) to unlock it. The same gate is
          enforced server-side, not just hidden in the UI.
        </p>
        <Gated feature="smart_promos" currentTier={tier}>
          <div className="card-base p-6">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Generate an AI-timed promotion for{" "}
              <span style={{ color: "var(--navy)", fontWeight: 600 }}>
                {restaurant.name}
              </span>
              .
            </p>
            <SmartPromoDemo restaurantId={restaurant.id} />
          </div>
        </Gated>
      </section>
    </div>
  );
}
