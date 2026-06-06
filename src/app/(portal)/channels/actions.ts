"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { assertEntitlement, EntitlementError } from "@/lib/entitlements";
import type { SalesChannel } from "@/generated/prisma/enums";

async function scopeGated() {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  try {
    await assertEntitlement(restaurant.id, "channel_both");
  } catch (e) {
    if (e instanceof EntitlementError) return null;
    throw e;
  }
  return restaurant.id;
}

const CHANNELS: Record<string, SalesChannel> = {
  doordash: "DOORDASH",
  ubereats: "UBEREATS",
  "uber eats": "UBEREATS",
  direct: "DIRECT",
};

const entrySchema = z.object({
  date: z.string().min(1),
  channel: z.enum(["DOORDASH", "UBEREATS", "DIRECT"]),
  revenue: z.coerce.number().min(0).max(10_000_000),
  orders: z.coerce.number().int().min(0).max(1_000_000),
});

async function upsertRow(restaurantId: string, date: Date, channel: SalesChannel, revenue: number, orders: number) {
  await db.channelRevenue.upsert({
    where: { restaurantId_date_channel: { restaurantId, date, channel } },
    update: { revenue, orders },
    create: { restaurantId, date, channel, revenue, orders },
  });
}

export async function addChannelEntry(input: unknown) {
  const restaurantId = await scopeGated();
  if (!restaurantId) return { ok: false as const, error: "Channel intelligence requires the Pro plan or higher." };
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the entry fields." };

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) return { ok: false as const, error: "Invalid date." };

  await upsertRow(restaurantId, date, parsed.data.channel, parsed.data.revenue, parsed.data.orders);
  revalidatePath("/channels");
  return { ok: true as const };
}

export async function importChannelCsv(csv: string) {
  const restaurantId = await scopeGated();
  if (!restaurantId) return { ok: false as const, error: "Channel intelligence requires the Pro plan or higher." };

  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let imported = 0;
  let skipped = 0;

  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    // Skip a header row if present.
    if (/date/i.test(parts[0]) && /channel/i.test(parts[1] ?? "")) continue;
    const [dateStr, channelStr, revenueStr, ordersStr] = parts;
    const channel = CHANNELS[(channelStr ?? "").toLowerCase()];
    const date = new Date(dateStr ?? "");
    const revenue = Number(revenueStr);
    const orders = Number(ordersStr ?? "0");
    if (!channel || Number.isNaN(date.getTime()) || Number.isNaN(revenue)) {
      skipped++;
      continue;
    }
    await upsertRow(restaurantId, date, channel, revenue, Number.isNaN(orders) ? 0 : orders);
    imported++;
  }

  revalidatePath("/channels");
  return { ok: true as const, imported, skipped };
}

export async function deleteChannelEntry(id: string) {
  const restaurantId = await scopeGated();
  if (!restaurantId) return { ok: false as const, error: "Locked." };
  await db.channelRevenue.deleteMany({ where: { id, restaurantId } });
  revalidatePath("/channels");
  return { ok: true as const };
}
