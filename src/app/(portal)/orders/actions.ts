"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Order status state machine. Transitions are validated server-side against the
 * current status; the order must belong to the active restaurant (multi-tenant).
 */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export type UpdateStatusResult = { ok: true } | { ok: false; error: string };

export async function updateOrderStatus(
  orderId: string,
  next: OrderStatus,
): Promise<UpdateStatusResult> {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);

  const order = await db.order.findFirst({
    where: { id: orderId, restaurantId: restaurant.id },
    select: { status: true },
  });
  if (!order) return { ok: false, error: "Order not found." };

  if (!ALLOWED[order.status].includes(next)) {
    return { ok: false, error: `Cannot move ${order.status} → ${next}.` };
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      status: next,
      ...(next === "DELIVERED" ? { paymentStatus: "PAID" as const } : {}),
    },
  });
  revalidatePath("/orders");
  return { ok: true };
}
