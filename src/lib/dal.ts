import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";

/**
 * Data Access Layer — the real authorization boundary.
 *
 * Per the Next.js 16 auth guidance, server-side checks here (not the proxy)
 * are the source of truth. `proxy.ts` only does optimistic cookie redirects.
 * Each helper is `cache()`-memoized for the duration of a single render pass.
 */

export const ACTIVE_RESTAURANT_COOKIE = "uprevi.activeRestaurant";

export const getSession = cache(async () => auth());

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});

/** Redirects to sign-in when there is no authenticated user. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Requires the user to hold one of `roles`; otherwise redirects. */
export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/sign-in");
  return user;
}

export type MembershipWithRestaurant = Awaited<
  ReturnType<typeof getMemberships>
>[number];

/** All restaurants the current user belongs to (for the switcher). */
export const getMemberships = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return [];
  return db.restaurantMembership.findMany({
    where: { userId: user.id },
    include: { restaurant: true },
    orderBy: { restaurant: { name: "asc" } },
  });
});

/**
 * Resolves the active restaurant for the current user:
 * the one named in the cookie (if the user is a member), else their first.
 * ADMINs with no membership fall through to `null`.
 */
export const getActiveRestaurant = cache(async () => {
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ACTIVE_RESTAURANT_COOKIE)?.value;

  const matched = wanted
    ? memberships.find((m) => m.restaurantId === wanted)
    : undefined;

  return (matched ?? memberships[0]).restaurant;
});

/** Like `getActiveRestaurant` but redirects to sign-in if none resolves. */
export async function requireActiveRestaurant() {
  const restaurant = await getActiveRestaurant();
  if (!restaurant) redirect("/sign-in");
  return restaurant;
}

/**
 * Ensures the current user may act on `restaurantId`.
 * ADMINs pass unconditionally; everyone else must hold a membership.
 */
export async function requireMembership(restaurantId: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;

  const membership = await db.restaurantMembership.findUnique({
    where: { userId_restaurantId: { userId: user.id, restaurantId } },
  });
  if (!membership) redirect("/sign-in");
  return user;
}
