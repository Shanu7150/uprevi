import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasFeature, type FeatureKey, type Tier } from "@/lib/tiers";

/**
 * Entitlements spine — server-side enforcement.
 *
 * This is the real lock. `<Gated>` in the UI is cosmetic only; every gated
 * capability must also be guarded here (or via `assertEntitlement`) on the
 * server before doing work or returning data.
 *
 * Pure tier/feature metadata lives in `src/lib/tiers.ts` (client-safe).
 */

// Re-export the pure helpers/metadata for server consumers' convenience.
export * from "@/lib/tiers";

export class EntitlementError extends Error {
  constructor(public readonly feature: FeatureKey) {
    super(`Entitlement required for feature: ${feature}`);
    this.name = "EntitlementError";
  }
}

/** Current tier for a restaurant; defaults to SPRINT when no subscription. */
export async function getTier(restaurantId: string): Promise<Tier> {
  const sub = await db.subscription.findUnique({ where: { restaurantId } });
  return sub?.tier ?? "SPRINT";
}

export async function hasEntitlement(
  restaurantId: string,
  feature: FeatureKey,
): Promise<boolean> {
  return hasFeature(await getTier(restaurantId), feature);
}

/**
 * Throws `EntitlementError` when the restaurant's tier does not include the
 * feature. Use in Server Actions / Route Handlers that want to handle the
 * denial (e.g. return an upsell payload).
 */
export async function assertEntitlement(
  restaurantId: string,
  feature: FeatureKey,
): Promise<void> {
  if (!(await hasEntitlement(restaurantId, feature))) {
    throw new EntitlementError(feature);
  }
}

/**
 * Redirects to the upgrade page when the feature is not entitled. Use in
 * Server Components / pages that gate a whole route.
 */
export async function requireEntitlement(
  restaurantId: string,
  feature: FeatureKey,
): Promise<void> {
  if (!(await hasEntitlement(restaurantId, feature))) {
    redirect(`/upgrade?feature=${feature}`);
  }
}
