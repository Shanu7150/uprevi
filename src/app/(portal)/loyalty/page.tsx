import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { LoyaltyClient, type RewardT } from "./LoyaltyClient";

export default async function LoyaltyPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loyalty appears once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const tier = await getTier(restaurant.id);
  const [config, rewards] = await Promise.all([
    db.loyaltyConfig.findUnique({ where: { restaurantId: restaurant.id } }),
    db.loyaltyReward.findMany({ where: { restaurantId: restaurant.id }, orderBy: { pointsCost: "asc" } }),
  ]);

  const rewardList: RewardT[] = rewards.map((r) => ({
    id: r.id,
    name: r.name,
    pointsCost: r.pointsCost,
    isActive: r.isActive,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Loyalty
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          {restaurant.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Points, rewards, and repeat-customer incentives. Available on Pro and above.
        </p>
      </div>
      <LoyaltyClient
        currentTier={tier}
        initialEnabled={config?.enabled ?? true}
        initialPoints={config?.pointsPerDollar ?? 1}
        rewards={rewardList}
      />
    </div>
  );
}
