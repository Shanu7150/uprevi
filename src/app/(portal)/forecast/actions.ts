"use server";

import { revalidatePath } from "next/cache";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { assertEntitlement, EntitlementError } from "@/lib/entitlements";
import { generatePredictions } from "@/lib/predictions";

export type ForecastResult =
  | { ok: true; count: number }
  | { ok: false; locked?: true; error: string };

/** Regenerate the 7-day forecast. Gated: predictive_dashboard (ACCELERATOR+). */
export async function regenerateForecast(): Promise<ForecastResult> {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  try {
    await assertEntitlement(restaurant.id, "predictive_dashboard");
  } catch (e) {
    if (e instanceof EntitlementError) {
      return { ok: false, locked: true, error: "Predictive forecasting requires the Accelerator plan or higher." };
    }
    throw e;
  }
  const rows = await generatePredictions(restaurant.id, 7);
  revalidatePath("/forecast");
  revalidatePath("/dashboard");
  return { ok: true, count: rows.length };
}
