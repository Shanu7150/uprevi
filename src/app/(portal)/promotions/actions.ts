"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { assertEntitlement, EntitlementError } from "@/lib/entitlements";
import { draftPromo, type PromoTrigger } from "@/lib/ai";
import type { Driver } from "@/lib/predictions";
import type { FeatureKey } from "@/lib/tiers";

async function gate(feature: FeatureKey) {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  try {
    await assertEntitlement(restaurant.id, feature);
  } catch (e) {
    if (e instanceof EntitlementError) return null;
    throw e;
  }
  return restaurant;
}

function triggerFor(drivers: Driver[], liftPct: number): PromoTrigger {
  const kinds = drivers.map((d) => d.kind);
  if (kinds.includes("WEATHER")) return "WEATHER";
  if (kinds.includes("GAMEDAY")) return "GAMEDAY";
  if (kinds.includes("EVENT")) return "EVENT";
  return liftPct <= -10 ? "SLOW_DAY" : "EVENT";
}

export type GenerateResult = { ok: true; count: number } | { ok: false; locked?: true; error: string };

/** Draft smart promos from upcoming predictions. Gated: smart_promos (ACCELERATOR+). */
export async function generateSmartPromos(): Promise<GenerateResult> {
  const restaurant = await gate("smart_promos");
  if (!restaurant) return { ok: false, locked: true, error: "Smart promos require the Accelerator plan or higher." };

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const predictions = await db.revenuePrediction.findMany({
    where: { restaurantId: restaurant.id, date: { gte: today } },
    orderBy: { date: "asc" },
    take: 7,
  });

  // Notable days: a live driver, or a meaningful swing from average.
  const notable = predictions
    .map((p) => ({ p, drivers: (p.drivers as unknown as Driver[]) ?? [] }))
    .filter(({ p, drivers }) => drivers.some((d) => d.kind !== "DOW") || Math.abs(p.liftPct) >= 8)
    .sort((a, b) => Math.abs(b.p.liftPct) - Math.abs(a.p.liftPct))
    .slice(0, 3);

  const chosen = notable.length ? notable : predictions.slice(0, 1).map((p) => ({ p, drivers: (p.drivers as unknown as Driver[]) ?? [] }));
  if (chosen.length === 0) return { ok: true, count: 0 };

  // Regenerate replaces prior DRAFTs; ACTIVE promos are untouched.
  await db.promotion.deleteMany({ where: { restaurantId: restaurant.id, status: "DRAFT" } });

  let count = 0;
  for (const { p, drivers } of chosen) {
    const trigger = triggerFor(drivers, p.liftPct);
    const draft = await draftPromo({ restaurantName: restaurant.name, trigger, context: p.headline });
    await db.promotion.create({
      data: {
        restaurantId: restaurant.id,
        name: draft.name,
        description: `${draft.description} (${p.date.toISOString().slice(0, 10)})`,
        type: draft.discountType,
        triggerType: trigger,
        status: "DRAFT",
        value: draft.value,
        code: draft.code,
        isActive: false,
        aiGenerated: true,
      },
    });
    count++;
  }

  revalidatePath("/promotions");
  return { ok: true, count };
}

export async function approvePromo(id: string) {
  const restaurant = await gate("smart_promos");
  if (!restaurant) return { ok: false as const, error: "Locked." };
  await db.promotion.updateMany({
    where: { id, restaurantId: restaurant.id },
    data: { status: "ACTIVE", isActive: true, startDate: new Date() },
  });
  // TODO(uprevi): on approve, blast the promo to the customer list via GHL
  // (lib/ghl triggerWorkflow). No-ops gracefully today without GHL keys.
  revalidatePath("/promotions");
  return { ok: true as const };
}

export async function dismissPromo(id: string) {
  const restaurant = await gate("smart_promos");
  if (!restaurant) return { ok: false as const, error: "Locked." };
  await db.promotion.updateMany({
    where: { id, restaurantId: restaurant.id },
    data: { status: "DISMISSED", isActive: false },
  });
  revalidatePath("/promotions");
  return { ok: true as const };
}

const customizeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80).trim(),
  description: z.string().max(200).trim(),
  value: z.coerce.number().min(0).max(100),
});

export async function customizePromo(input: unknown) {
  const restaurant = await gate("smart_promos");
  if (!restaurant) return { ok: false as const, error: "Locked." };
  const parsed = customizeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the promo fields." };
  await db.promotion.updateMany({
    where: { id: parsed.data.id, restaurantId: restaurant.id },
    data: { name: parsed.data.name, description: parsed.data.description, value: parsed.data.value },
  });
  revalidatePath("/promotions");
  return { ok: true as const };
}

/**
 * Rebuild smart-upsell rules from order co-occurrence (frequently-bought-together).
 * Preserves existing conversion counters on upsert. Gated: smart_upsell (ACCELERATOR+).
 */
export async function rebuildUpsellRules(): Promise<GenerateResult> {
  const restaurant = await gate("smart_upsell");
  if (!restaurant) return { ok: false, locked: true, error: "Smart upsell requires the Accelerator plan or higher." };

  const orders = await db.order.findMany({
    where: { restaurantId: restaurant.id },
    select: { items: { select: { menuItemId: true } } },
  });

  // Co-occurrence: item -> (other item -> times in same order).
  const co = new Map<string, Map<string, number>>();
  for (const o of orders) {
    const ids = [...new Set(o.items.map((i) => i.menuItemId).filter((x): x is string => Boolean(x)))];
    for (const a of ids) {
      for (const b of ids) {
        if (a === b) continue;
        const m = co.get(a) ?? new Map<string, number>();
        m.set(b, (m.get(b) ?? 0) + 1);
        co.set(a, m);
      }
    }
  }

  let count = 0;
  for (const [trigger, others] of co) {
    const top = [...others.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
    for (const [suggested] of top) {
      await db.upsellRule.upsert({
        where: { restaurantId_triggerItemId_suggestedItemId: { restaurantId: restaurant.id, triggerItemId: trigger, suggestedItemId: suggested } },
        update: {},
        create: { restaurantId: restaurant.id, triggerItemId: trigger, suggestedItemId: suggested },
      });
      count++;
    }
  }

  revalidatePath("/promotions");
  return { ok: true, count };
}
