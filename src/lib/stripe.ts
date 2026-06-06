import "server-only";
import Stripe from "stripe";
import type { Tier } from "@/lib/tiers";
import type { SubscriptionStatus } from "@/generated/prisma/enums";

/**
 * Stripe helpers. Everything degrades gracefully when STRIPE keys are absent:
 * `getStripe()` returns null and callers no-op, so the rest of the app keeps
 * running without billing configured.
 *
 * TODO(uprevi: phase 2): money is stored as Prisma Decimal (dollars). At the
 * Stripe Connect checkout boundary, convert to integer minor units with
 * Math.round(Number(decimal) * 100) (re-priced server-side from the DB, never
 * trusting client-sent amounts) to avoid float drift.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}

/** Map a Stripe price id to a UPREVI tier via env configuration. */
export function tierForPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  const entries: [string | undefined, Tier][] = [
    [process.env.STRIPE_PRICE_STARTER, "STARTER"],
    [process.env.STRIPE_PRICE_PRO, "PRO"],
    [process.env.STRIPE_PRICE_ACCELERATOR, "ACCELERATOR"],
    [process.env.STRIPE_PRICE_PARTNER, "PARTNER"],
  ];
  for (const [envPrice, tier] of entries) {
    if (envPrice && envPrice === priceId) return tier;
  }
  return null;
}

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "INCOMPLETE";
    default:
      return "ACTIVE";
  }
}

/**
 * Period-end is exposed differently across Stripe API versions (top-level vs.
 * per-item). Read whichever is present without coupling to one shape.
 */
export function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const loose = sub as unknown as {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  const seconds =
    loose.current_period_end ?? loose.items?.data?.[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000) : null;
}
