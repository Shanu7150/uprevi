import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

/**
 * Append-only audit log for sensitive actions (tier changes, upgrade requests,
 * admin actions). Never throws — logging must not break the user flow.
 */
export async function audit(entry: {
  action: string;
  restaurantId?: string;
  actorId?: string;
  actorEmail?: string;
  target?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: entry.action,
        restaurantId: entry.restaurantId ?? null,
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        target: entry.target ?? null,
        metadata: (entry.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write entry:", err);
  }
}
