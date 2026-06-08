"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { posConfigured } from "@/lib/pos";
import { audit } from "@/lib/audit";
import type { PosProvider } from "@/generated/prisma/enums";

export async function connectPos(provider: PosProvider) {
  const user = await requireUser();
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);

  // Real OAuth handshake is a TODO; without credentials we record a PENDING request.
  const status = posConfigured(provider) ? "CONNECTED" : "PENDING";
  await db.posConnection.upsert({
    where: { restaurantId: restaurant.id },
    update: { provider, status, connectedAt: status === "CONNECTED" ? new Date() : null },
    create: { restaurantId: restaurant.id, provider, status, connectedAt: status === "CONNECTED" ? new Date() : null },
  });
  await audit({
    action: "pos.connect_requested",
    restaurantId: restaurant.id,
    actorId: user.id,
    actorEmail: user.email ?? undefined,
    target: provider,
  });
  revalidatePath("/settings");
  return { ok: true as const, status };
}

export async function disconnectPos() {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  await db.posConnection.deleteMany({ where: { restaurantId: restaurant.id } });
  revalidatePath("/settings");
  return { ok: true as const };
}
