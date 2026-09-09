"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { ACTIVE_RESTAURANT_COOKIE, requireUser } from "@/lib/dal";

export type OnboardingState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

const schema = z.object({
  name: z.string().trim().min(2, { error: "Enter the restaurant name." }).max(100),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(2, { error: "Use the two-letter state code." }).optional(),
  phone: z.string().trim().max(30).optional(),
  onDoorDash: z.boolean(),
  onUberEats: z.boolean(),
});

export async function createRestaurant(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    phone: formData.get("phone") || undefined,
    onDoorDash: formData.get("onDoorDash") === "on",
    onUberEats: formData.get("onUberEats") === "on",
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const existing = await db.restaurantMembership.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");

  const baseSlug = parsed.data.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "restaurant";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  let restaurant;
  try {
    restaurant = await db.restaurant.create({
      data: {
        name: parsed.data.name,
        slug,
        email: user.email ?? undefined,
        city: parsed.data.city,
        state: parsed.data.state?.toUpperCase(),
        phone: parsed.data.phone,
        onDoorDash: parsed.data.onDoorDash,
        onUberEats: parsed.data.onUberEats,
        memberships: { create: { userId: user.id, role: "OWNER" } },
        subscription: { create: { tier: "SPRINT", status: "ACTIVE" } },
      },
    });
  } catch (error) {
    console.error("[onboarding] restaurant creation failed:", error);
    return { error: "We could not connect your restaurant. Please try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_RESTAURANT_COOKIE, restaurant.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  redirect("/dashboard");
}
