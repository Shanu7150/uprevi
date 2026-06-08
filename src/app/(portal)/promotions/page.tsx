import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { PromotionsClient, type PromoT } from "./PromotionsClient";
import { UpsellPanel, type UpsellRuleT } from "./UpsellPanel";

export default async function PromotionsPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Promotions appear once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const tier = await getTier(restaurant.id);
  const [promotions, upsellRules] = await Promise.all([
    db.promotion.findMany({
      where: { restaurantId: restaurant.id, status: { in: ["DRAFT", "ACTIVE", "PAUSED"] } },
      orderBy: { createdAt: "desc" },
    }),
    db.upsellRule.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: [{ conversionRate: "desc" }, { timesConverted: "desc" }],
      include: {
        triggerItem: { select: { name: true } },
        suggestedItem: { select: { name: true } },
      },
    }),
  ]);

  const upsells: UpsellRuleT[] = upsellRules.map((r) => ({
    id: r.id,
    triggerName: r.triggerItem.name,
    suggestedName: r.suggestedItem.name,
    timesShown: r.timesShown,
    timesConverted: r.timesConverted,
    conversionRate: r.conversionRate,
  }));

  const list: PromoT[] = promotions.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    type: p.type,
    triggerType: p.triggerType,
    status: p.status,
    value: Number(p.value),
    code: p.code,
    usageCount: p.usageCount,
    revenueGenerated: Number(p.revenueGenerated),
    conversionRate: p.conversionRate,
    aiGenerated: p.aiGenerated,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Promotions
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          Smart promotions
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Promos that fire when the forecast says they&apos;ll land. One-tap approval.
        </p>
      </div>
      <PromotionsClient promotions={list} currentTier={tier} />
      <UpsellPanel rules={upsells} currentTier={tier} />
    </div>
  );
}
