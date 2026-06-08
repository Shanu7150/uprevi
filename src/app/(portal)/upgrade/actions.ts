"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { tierRank, tierMeta, type Tier } from "@/lib/tiers";
import { priceIdForTier, createCheckoutSession } from "@/lib/stripe";
import { audit } from "@/lib/audit";

export type UpgradeResult =
  | { ok: true; mode: "checkout"; url: string }
  | { ok: true; mode: "requested" }
  | { ok: false; error: string };

/**
 * Self-serve upgrade (§6). When Stripe + a price for the tier are configured,
 * opens Stripe Checkout (the webhook then flips the tier). Otherwise routes an
 * upgrade-request Task to the UPREVI team. Both paths are audited.
 */
export async function startUpgrade(target: Tier): Promise<UpgradeResult> {
  const user = await requireUser();
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);

  const current = await getTier(restaurant.id);
  if (tierRank(target) <= tierRank(current)) {
    return { ok: false, error: "That isn't an upgrade." };
  }

  const origin = await absoluteOrigin();
  const priceId = priceIdForTier(target);

  if (priceId) {
    const url = await createCheckoutSession({
      priceId,
      clientReferenceId: restaurant.id,
      customerEmail: user.email ?? undefined,
      successUrl: `${origin}/dashboard?upgraded=1`,
      cancelUrl: `${origin}/upgrade`,
    });
    if (url) {
      await audit({
        action: "upgrade.checkout_started",
        restaurantId: restaurant.id,
        actorId: user.id,
        actorEmail: user.email ?? undefined,
        target,
      });
      return { ok: true, mode: "checkout", url };
    }
  }

  // Fallback: route the request to the UPREVI team.
  await db.task.create({
    data: {
      restaurantId: restaurant.id,
      owner: "UPREVI",
      type: "TODO",
      status: "OPEN",
      title: `Upgrade request: ${tierMeta(target).name}`,
      description: `${user.email ?? "A client"} requested an upgrade to the ${tierMeta(target).name} plan.`,
    },
  });
  await audit({
    action: "upgrade.requested",
    restaurantId: restaurant.id,
    actorId: user.id,
    actorEmail: user.email ?? undefined,
    target,
  });
  revalidatePath("/tasks");
  return { ok: true, mode: "requested" };
}

async function absoluteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "app.localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
