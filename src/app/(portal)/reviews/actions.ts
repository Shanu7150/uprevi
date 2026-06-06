"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActiveRestaurant, requireMembership } from "@/lib/dal";
import { assertEntitlement, EntitlementError } from "@/lib/entitlements";
import { draftReviewReply } from "@/lib/ai";

export type DraftResult =
  | { ok: true; text: string; aiGenerated: boolean }
  | { ok: false; locked?: true; error: string };

/**
 * Generate an AI-drafted reply. Gated by `reviews_ai` (PRO+) and enforced
 * server-side — even a direct call from a lower tier is blocked.
 */
export async function generateReviewDraft(reviewId: string): Promise<DraftResult> {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);

  try {
    await assertEntitlement(restaurant.id, "reviews_ai");
  } catch (e) {
    if (e instanceof EntitlementError) {
      return { ok: false, locked: true, error: "AI review responses require the Pro plan or higher." };
    }
    throw e;
  }

  const review = await db.review.findFirst({
    where: { id: reviewId, restaurantId: restaurant.id },
  });
  if (!review) return { ok: false, error: "Review not found." };

  const draft = await draftReviewReply({
    restaurantName: restaurant.name,
    reviewerName: review.reviewerName,
    rating: review.rating,
    body: review.body,
    sentiment: review.sentiment,
  });

  await db.review.update({
    where: { id: review.id },
    data: { aiResponseDraft: draft.text },
  });
  revalidatePath("/reviews");
  return { ok: true, text: draft.text, aiGenerated: draft.aiGenerated };
}

const saveSchema = z.object({ reviewId: z.string().min(1), text: z.string().min(1).max(2000) });

export async function saveReviewResponse(input: unknown) {
  const restaurant = await requireActiveRestaurant();
  await requireMembership(restaurant.id);
  await assertEntitlement(restaurant.id, "reviews_ai");

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Response text required." };

  await db.review.updateMany({
    where: { id: parsed.data.reviewId, restaurantId: restaurant.id },
    data: { aiResponseDraft: parsed.data.text, respondedAt: new Date() },
  });
  revalidatePath("/reviews");
  return { ok: true as const };
}
