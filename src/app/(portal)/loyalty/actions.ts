"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { assertEntitlement, EntitlementError } from "@/lib/entitlements";

async function scopeGated() {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  try {
    await assertEntitlement(restaurant.id, "loyalty");
  } catch (e) {
    if (e instanceof EntitlementError) return { restaurantId: null, locked: true as const };
    throw e;
  }
  return { restaurantId: restaurant.id, locked: false as const };
}

const configSchema = z.object({
  enabled: z.coerce.boolean(),
  pointsPerDollar: z.coerce.number().int().min(0).max(100),
});

export async function saveLoyaltyConfig(input: unknown) {
  const s = await scopeGated();
  if (!s.restaurantId) return { ok: false as const, error: "Loyalty requires the Pro plan or higher." };
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the config." };

  await db.loyaltyConfig.upsert({
    where: { restaurantId: s.restaurantId },
    update: { enabled: parsed.data.enabled, pointsPerDollar: parsed.data.pointsPerDollar },
    create: { restaurantId: s.restaurantId, enabled: parsed.data.enabled, pointsPerDollar: parsed.data.pointsPerDollar },
  });
  revalidatePath("/loyalty");
  return { ok: true as const };
}

const rewardSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  pointsCost: z.coerce.number().int().min(1).max(1_000_000),
});

export async function addReward(input: unknown) {
  const s = await scopeGated();
  if (!s.restaurantId) return { ok: false as const, error: "Loyalty requires the Pro plan or higher." };
  const parsed = rewardSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the reward fields." };

  await db.loyaltyReward.create({
    data: { restaurantId: s.restaurantId, name: parsed.data.name, pointsCost: parsed.data.pointsCost },
  });
  revalidatePath("/loyalty");
  return { ok: true as const };
}

export async function toggleReward(id: string, isActive: boolean) {
  const s = await scopeGated();
  if (!s.restaurantId) return { ok: false as const, error: "Locked." };
  await db.loyaltyReward.updateMany({ where: { id, restaurantId: s.restaurantId }, data: { isActive } });
  revalidatePath("/loyalty");
  return { ok: true as const };
}

export async function deleteReward(id: string) {
  const s = await scopeGated();
  if (!s.restaurantId) return { ok: false as const, error: "Locked." };
  await db.loyaltyReward.deleteMany({ where: { id, restaurantId: s.restaurantId } });
  revalidatePath("/loyalty");
  return { ok: true as const };
}
