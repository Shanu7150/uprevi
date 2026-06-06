"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { getStripe } from "@/lib/stripe";

export type SettingsState =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

const settingsSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  description: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  cuisineType: z.string().trim().optional(),
  deliveryFee: z.coerce.number().min(0).max(100),
  minimumOrder: z.coerce.number().min(0).max(1000),
  estimatedDeliveryMin: z.coerce.number().int().min(0).max(240),
  estimatedDeliveryMax: z.coerce.number().int().min(0).max(240),
  onDoorDash: z.coerce.boolean(),
  onUberEats: z.coerce.boolean(),
});

export async function updateRestaurant(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    zip: formData.get("zip") || undefined,
    cuisineType: formData.get("cuisineType") || undefined,
    deliveryFee: formData.get("deliveryFee"),
    minimumOrder: formData.get("minimumOrder"),
    estimatedDeliveryMin: formData.get("estimatedDeliveryMin"),
    estimatedDeliveryMax: formData.get("estimatedDeliveryMax"),
    onDoorDash: formData.get("onDoorDash") === "on" || formData.get("onDoorDash") === "true",
    onUberEats: formData.get("onUberEats") === "on" || formData.get("onUberEats") === "true",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const d = parsed.data;
  await db.restaurant.update({
    where: { id: restaurant.id },
    data: {
      name: d.name,
      description: d.description ?? null,
      phone: d.phone ?? null,
      email: d.email ?? null,
      address: d.address ?? null,
      city: d.city ?? null,
      state: d.state ?? null,
      zip: d.zip ?? null,
      cuisineType: d.cuisineType ?? null,
      deliveryFee: d.deliveryFee,
      minimumOrder: d.minimumOrder,
      estimatedDeliveryMin: d.estimatedDeliveryMin,
      estimatedDeliveryMax: d.estimatedDeliveryMax,
      onDoorDash: d.onDoorDash,
      onUberEats: d.onUberEats,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export type ConnectState =
  | { ok: true; url: string }
  | { ok: false; error: string }
  | undefined;

/**
 * Stripe Connect onboarding for diner payouts. Creates (or reuses) an Express
 * account and returns an onboarding link. Degrades gracefully when Stripe is
 * not configured.
 */
export async function startConnectOnboarding(): Promise<ConnectState> {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);

  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable payouts." };
  }

  try {
    let connectId = restaurant.stripeConnectId;
    if (!connectId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: restaurant.email ?? undefined,
        metadata: { restaurantId: restaurant.id },
      });
      connectId = account.id;
      await db.restaurant.update({
        where: { id: restaurant.id },
        data: { stripeConnectId: connectId },
      });
    }

    const h = await headers();
    const host = h.get("host") ?? "app.localhost:3000";
    const proto = host.includes("localhost") ? "http" : "https";
    const base = `${proto}://${host}`;

    const link = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${base}/settings`,
      return_url: `${base}/settings`,
      type: "account_onboarding",
    });
    return { ok: true, url: link.url };
  } catch (err) {
    console.error("[stripe connect] onboarding failed:", err);
    return { ok: false, error: "Could not start Stripe onboarding. Please try again." };
  }
}
