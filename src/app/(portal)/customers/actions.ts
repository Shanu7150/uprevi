"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { assertEntitlement, EntitlementError } from "@/lib/entitlements";
import { upsertContact } from "@/lib/ghl";
import type { CustomerSegment } from "@/generated/prisma/enums";

const DAY = 86_400_000;

function computeSegment(totalOrders: number, lastOrderAt: Date | null): CustomerSegment {
  const days = lastOrderAt ? (Date.now() - lastOrderAt.getTime()) / DAY : Infinity;
  if (days > 60) return "LAPSED";
  if (totalOrders >= 20 && days <= 30) return "VIP";
  if (totalOrders >= 5 && days <= 45) return "LOYAL";
  if (days > 30) return "AT_RISK";
  if (totalOrders <= 1) return "NEW";
  return "LOYAL";
}

export type RecomputeResult =
  | { ok: true; updated: number }
  | { ok: false; locked?: true; error: string };

/** Recompute segments from recency + frequency. Gated: winback_automation (ACCELERATOR+). */
export async function recomputeSegments(): Promise<RecomputeResult> {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  try {
    await assertEntitlement(restaurant.id, "winback_automation");
  } catch (e) {
    if (e instanceof EntitlementError) return { ok: false, locked: true, error: "Segmentation requires the Accelerator plan or higher." };
    throw e;
  }

  const customers = await db.customer.findMany({ where: { restaurantId: restaurant.id } });
  await Promise.all(
    customers.map((c) =>
      db.customer.update({
        where: { id: c.id },
        data: { segment: computeSegment(c.totalOrders, c.lastOrderAt) },
      }),
    ),
  );
  revalidatePath("/customers");
  return { ok: true, updated: customers.length };
}

export type WinbackResult =
  | { ok: true; count: number }
  | { ok: false; locked?: true; error: string };

/** Trigger win-back outreach for lapsed/at-risk customers via GHL (graceful). */
export async function triggerWinback(): Promise<WinbackResult> {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  try {
    await assertEntitlement(restaurant.id, "winback_automation");
  } catch (e) {
    if (e instanceof EntitlementError) return { ok: false, locked: true, error: "Win-back automation requires the Accelerator plan or higher." };
    throw e;
  }

  const targets = await db.customer.findMany({
    where: { restaurantId: restaurant.id, segment: { in: ["AT_RISK", "LAPSED"] }, email: { not: null } },
  });
  // Best-effort GHL outreach; never blocks (no-ops gracefully without GHL keys).
  await Promise.all(
    targets.map((c) =>
      upsertContact({ email: c.email!, firstName: c.name.split(" ")[0], tags: ["uprevi-winback", restaurant.slug] }),
    ),
  );
  return { ok: true, count: targets.length };
}
