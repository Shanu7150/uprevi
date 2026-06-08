import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import {
  getStripe,
  tierForPriceId,
  mapStripeStatus,
  getPeriodEnd,
} from "@/lib/stripe";

/**
 * Stripe subscription webhook.
 *
 * Updates `Subscription.tier` and `status` on create/update/delete events.
 * Degrades gracefully: if STRIPE keys are not configured the endpoint simply
 * acknowledges and ignores, so the rest of the app keeps running.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.warn(
      "[stripe] webhook received but STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are not set; ignoring.",
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(
          event.data.object as Stripe.Subscription,
          event.type === "customer.subscription.deleted",
        );
        break;
      default:
        // Unhandled event types are acknowledged without action.
        break;
    }
  } catch (err) {
    console.error(`[stripe] handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(sub: Stripe.Subscription, deleted: boolean) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price.id;

  // On delete, downgrade to the base tier; otherwise resolve from the price.
  const resolvedTier = deleted ? "SPRINT" : tierForPriceId(priceId);
  const status = deleted ? "CANCELED" : mapStripeStatus(sub.status);

  const target = await db.subscription.findFirst({
    where: {
      OR: [{ stripeSubscriptionId: sub.id }, { stripeCustomerId: customerId }],
    },
  });

  if (!target) {
    console.warn(
      `[stripe] no local subscription matched customer ${customerId} / sub ${sub.id}`,
    );
    return;
  }

  await db.subscription.update({
    where: { id: target.id },
    data: {
      // Only change tier when we could resolve one (or on delete).
      ...(resolvedTier ? { tier: resolvedTier } : {}),
      status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId ?? target.stripePriceId,
      currentPeriodEnd: getPeriodEnd(sub) ?? target.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
  });

  await audit({
    action: deleted ? "subscription.canceled" : "subscription.synced",
    restaurantId: target.restaurantId,
    target: resolvedTier ?? undefined,
    metadata: { status, stripeSubscriptionId: sub.id },
  });
}
