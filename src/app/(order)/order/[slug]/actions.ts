"use server";

import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Server-side order pricing + creation.
 *
 * SECURITY: the client sends only menuItemId / quantity / modifierIds. Every
 * price is recomputed from the database here — client-sent amounts are never
 * trusted. Items and modifiers are validated against the restaurant's own menu.
 */

const TAX_RATE = 0.0875;

const checkoutSchema = z.object({
  slug: z.string().min(1),
  orderType: z.enum(["DELIVERY", "PICKUP"]),
  customer: z.object({
    name: z.string().min(1, { error: "Name is required." }).trim(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
  }),
  tip: z.coerce.number().min(0).max(10000).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(99),
        modifierIds: z.array(z.string()).default([]),
      }),
    )
    .min(1, { error: "Your cart is empty." }),
});

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function placeOrder(payload: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    const first =
      z.flattenError(parsed.error).formErrors[0] ??
      Object.values(z.flattenError(parsed.error).fieldErrors)[0]?.[0] ??
      "Invalid order.";
    return { ok: false, error: first };
  }
  const data = parsed.data;

  const restaurant = await db.restaurant.findUnique({
    where: { slug: data.slug },
    select: {
      id: true,
      deliveryFee: true,
      minimumOrder: true,
      isActive: true,
    },
  });
  if (!restaurant || !restaurant.isActive) {
    return { ok: false, error: "This restaurant is not accepting orders." };
  }

  // Load every referenced item (scoped to this restaurant + available) with its
  // modifiers, so we can re-price authoritatively.
  const itemIds = data.items.map((i) => i.menuItemId);
  const dbItems = await db.menuItem.findMany({
    where: { id: { in: itemIds }, restaurantId: restaurant.id, isAvailable: true },
    include: { modifierGroups: { include: { modifiers: true } } },
  });
  const itemMap = new Map(dbItems.map((i) => [i.id, i]));

  type LineCreate = {
    menuItemId: string;
    name: string;
    price: number; // unit price incl. modifiers
    quantity: number;
    subtotal: number;
    modifiers: { modifierId: string; name: string; price: number }[];
  };

  const lines: LineCreate[] = [];
  let subtotal = 0;

  for (const line of data.items) {
    const item = itemMap.get(line.menuItemId);
    if (!item) {
      return { ok: false, error: "An item in your cart is no longer available." };
    }
    // Valid modifiers for this item.
    const validModifiers = new Map(
      item.modifierGroups.flatMap((g) => g.modifiers.map((m) => [m.id, m])),
    );
    const selected = line.modifierIds.map((id) => validModifiers.get(id)).filter(Boolean);
    if (selected.length !== line.modifierIds.length) {
      return { ok: false, error: "An invalid option was selected." };
    }

    const modifiersTotal = selected.reduce((s, m) => s + Number(m!.price), 0);
    const unit = round2(Number(item.price) + modifiersTotal);
    const lineSubtotal = round2(unit * line.quantity);
    subtotal = round2(subtotal + lineSubtotal);

    lines.push({
      menuItemId: item.id,
      name: item.name,
      price: unit,
      quantity: line.quantity,
      subtotal: lineSubtotal,
      modifiers: selected.map((m) => ({ modifierId: m!.id, name: m!.name, price: Number(m!.price) })),
    });
  }

  const minimum = Number(restaurant.minimumOrder);
  if (data.orderType === "DELIVERY" && subtotal < minimum) {
    return { ok: false, error: `Minimum delivery order is $${minimum.toFixed(2)}.` };
  }

  const deliveryFee = data.orderType === "DELIVERY" ? Number(restaurant.deliveryFee) : 0;
  const tax = round2(subtotal * TAX_RATE);
  const tip = round2(data.tip ?? 0);
  const total = round2(subtotal + deliveryFee + tax + tip);

  const order = await db.order.create({
    data: {
      restaurantId: restaurant.id,
      channel: "DIRECT",
      customerName: data.customer.name,
      customerEmail: data.customer.email ?? null,
      customerPhone: data.customer.phone ?? null,
      deliveryAddress: data.orderType === "DELIVERY" ? data.customer.address ?? null : null,
      orderType: data.orderType,
      status: "PENDING",
      // TODO(uprevi: phase 2 stripe): when Stripe Connect is live, create a
      // Checkout Session (destination charge) and set PAID on webhook. Convert
      // these Decimal dollars to integer cents at that boundary.
      paymentStatus: "PENDING",
      subtotal,
      deliveryFee,
      tax,
      tip,
      discount: 0,
      total,
      items: {
        create: lines.map((l) => ({
          menuItemId: l.menuItemId,
          name: l.name,
          price: l.price,
          quantity: l.quantity,
          subtotal: l.subtotal,
          modifiers: {
            create: l.modifiers.map((m) => ({
              modifierId: m.modifierId,
              name: m.name,
              price: m.price,
            })),
          },
        })),
      },
    },
  });

  return { ok: true, orderId: order.id };
}

export type OrderStatusResult =
  | { ok: true; status: string; total: number; orderType: string }
  | { ok: false };

/** Lightweight status lookup for the order tracker (polled client-side). */
export async function getOrderStatus(orderId: string): Promise<OrderStatusResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, total: true, orderType: true },
  });
  if (!order) return { ok: false };
  return {
    ok: true,
    status: order.status,
    total: Number(order.total),
    orderType: order.orderType,
  };
}
