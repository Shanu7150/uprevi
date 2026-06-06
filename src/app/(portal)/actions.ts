"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import {
  requireUser,
  requireMembership,
  ACTIVE_RESTAURANT_COOKIE,
} from "@/lib/dal";
import { assertEntitlement, EntitlementError } from "@/lib/entitlements";

/** Switch the active restaurant (validated against membership). */
export async function switchRestaurant(restaurantId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const membership = await db.restaurantMembership.findUnique({
      where: { userId_restaurantId: { userId: user.id, restaurantId } },
    });
    if (!membership) return;
  }
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_RESTAURANT_COOKIE, restaurantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/", "layout");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

export type PromoResult =
  | { ok: true; message: string }
  | { ok: false; locked: true; message: string };

/**
 * Demo of server-side entitlement enforcement: the same `smart_promos` feature
 * the UI gates with <Gated> is independently enforced here. A SPRINT restaurant
 * gets the locked result even if it reached this action directly.
 */
export async function runSmartPromo(restaurantId: string): Promise<PromoResult> {
  await requireMembership(restaurantId);
  try {
    await assertEntitlement(restaurantId, "smart_promos");
  } catch (error) {
    if (error instanceof EntitlementError) {
      return {
        ok: false,
        locked: true,
        message: "Smart promos require the Growth plan or higher.",
      };
    }
    throw error;
  }
  // TODO(uprevi): generate a real AI promo (Phase 2+). Stubbed success for now.
  return {
    ok: true,
    message:
      "Smart promo drafted: '$5 off $30+' targeted to your Friday dinner peak.",
  };
}
