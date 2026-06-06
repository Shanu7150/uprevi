import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { ReviewsClient, type ReviewT, type ReviewSummaryT } from "./ReviewsClient";

export default async function ReviewsPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Reviews appear once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const tier = await getTier(restaurant.id);
  const reviews = await db.review.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { platformCreatedAt: "desc" },
  });

  // Summary (monitoring — available from SPRINT).
  const total = reviews.length;
  const avgRating = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  const distribution = [0, 0, 0, 0, 0]; // index 0 = 1 star
  const themeCounts = new Map<string, number>();
  for (const r of reviews) {
    if (r.sentiment === "POSITIVE") sentiment.positive++;
    else if (r.sentiment === "NEGATIVE") sentiment.negative++;
    else sentiment.neutral++;
    if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++;
    for (const t of r.topThemes) themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1);
  }
  const topThemes = [...themeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);

  const summary: ReviewSummaryT = { total, avgRating, sentiment, distribution, topThemes };

  const list: ReviewT[] = reviews.map((r) => ({
    id: r.id,
    platform: r.platform,
    rating: r.rating,
    reviewerName: r.reviewerName,
    body: r.body,
    sentiment: r.sentiment,
    aiResponseDraft: r.aiResponseDraft,
    respondedAt: r.respondedAt ? r.respondedAt.toISOString() : null,
    createdAt: r.platformCreatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Reviews
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          {restaurant.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Monitor every platform in one place. AI-drafted responses on Pro and above.
        </p>
      </div>
      <ReviewsClient summary={summary} reviews={list} currentTier={tier} />
    </div>
  );
}
