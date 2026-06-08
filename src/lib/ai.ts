import "server-only";

/**
 * Thin Anthropic wrapper. Degrades gracefully: when ANTHROPIC_API_KEY is absent
 * (or the call fails), it returns a sensible templated draft instead of throwing,
 * so the review workflow keeps working without AI configured.
 *
 * TODO(uprevi): pin the model id and add prompt caching via the Anthropic SDK
 * (see the claude-api guidance) once keys are provisioned.
 */
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface ReviewDraftInput {
  restaurantName: string;
  reviewerName: string;
  rating: number;
  body: string;
  sentiment?: string | null;
}

export interface ReviewDraft {
  text: string;
  aiGenerated: boolean;
}

function templateReply(input: ReviewDraftInput): string {
  const first = input.reviewerName.split(" ")[0] || "there";
  if (input.rating >= 4) {
    return `Hi ${first}, thank you so much for the kind words and for choosing ${input.restaurantName}! We're thrilled you enjoyed your order and we can't wait to serve you again soon.`;
  }
  if (input.rating === 3) {
    return `Hi ${first}, thanks for the honest feedback. We're always working to improve at ${input.restaurantName} and we'd love the chance to make your next order a 5-star one. Please reach out so we can make it right.`;
  }
  return `Hi ${first}, we're sorry your experience with ${input.restaurantName} fell short. This isn't the standard we hold ourselves to. We'd really like to make it right, please contact us directly and we'll take care of you.`;
}

export async function draftReviewReply(input: ReviewDraftInput): Promise<ReviewDraft> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { text: templateReply(input), aiGenerated: false };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content:
              `You are the owner of "${input.restaurantName}". Write a warm, professional, concise public reply (2-3 sentences) to this ${input.rating}-star review. Address the reviewer by first name, be specific and human, never defensive, and invite them back. Reviewer: ${input.reviewerName}. Review: "${input.body}". Reply only with the response text.`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = data.content?.[0]?.text?.trim();
    return text
      ? { text, aiGenerated: true }
      : { text: templateReply(input), aiGenerated: false };
  } catch (err) {
    console.error("[ai] review draft failed, using template:", err);
    return { text: templateReply(input), aiGenerated: false };
  }
}

// ── Smart promotion drafting (§7.3) ───────────────────────────────────────────

export type PromoTrigger = "MANUAL" | "WEATHER" | "EVENT" | "GAMEDAY" | "SLOW_DAY";

export interface PromoDraftInput {
  restaurantName: string;
  trigger: PromoTrigger;
  context: string; // the prediction headline / driver text
}

export interface PromoDraft {
  name: string;
  description: string;
  code: string;
  discountType: "PERCENTAGE_DISCOUNT" | "FIXED_DISCOUNT" | "FREE_DELIVERY";
  value: number;
  aiGenerated: boolean;
}

function templatePromo(input: PromoDraftInput): PromoDraft {
  const slug = input.restaurantName.replace(/[^A-Za-z]/g, "").slice(0, 6).toUpperCase() || "PROMO";
  switch (input.trigger) {
    case "WEATHER":
      return { name: "Rainy Day Delivery Deal", description: "Free delivery when the weather turns. Stay in, we'll come to you.", code: `${slug}RAIN`, discountType: "FREE_DELIVERY", value: 0, aiGenerated: false };
    case "GAMEDAY":
      return { name: "Game Day Bundle", description: "15% off orders $40+ during the game. Feed the whole crew.", code: `${slug}GAME`, discountType: "PERCENTAGE_DISCOUNT", value: 15, aiGenerated: false };
    case "SLOW_DAY":
      return { name: "Quiet Night Perk", description: "$5 off $25+ tonight. A little nudge to order in.", code: `${slug}TONITE`, discountType: "FIXED_DISCOUNT", value: 5, aiGenerated: false };
    case "EVENT":
      return { name: "Event Night Boost", description: "10% off while the crowds are out. Skip the lines, order direct.", code: `${slug}EVENT`, discountType: "PERCENTAGE_DISCOUNT", value: 10, aiGenerated: false };
    default:
      return { name: "Limited-Time Offer", description: "10% off your next order, direct from us.", code: `${slug}10`, discountType: "PERCENTAGE_DISCOUNT", value: 10, aiGenerated: false };
  }
}

export async function draftPromo(input: PromoDraftInput): Promise<PromoDraft> {
  const key = process.env.ANTHROPIC_API_KEY;
  const fallback = templatePromo(input);
  if (!key) return fallback;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 220,
        messages: [
          {
            role: "user",
            content:
              `You run "${input.restaurantName}". Trigger: ${input.trigger}. Context: ${input.context}. Draft a single short delivery promotion as strict JSON with keys: name (<=40 chars), description (<=120 chars), code (UPPERCASE, <=12 chars), discountType (one of PERCENTAGE_DISCOUNT, FIXED_DISCOUNT, FREE_DELIVERY), value (number; percent or dollars; 0 for FREE_DELIVERY). Reply with JSON only.`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = data.content?.[0]?.text?.trim();
    if (!text) return fallback;
    const parsed = JSON.parse(text) as Partial<PromoDraft>;
    return {
      name: parsed.name ?? fallback.name,
      description: parsed.description ?? fallback.description,
      code: (parsed.code ?? fallback.code).toUpperCase(),
      discountType: parsed.discountType ?? fallback.discountType,
      value: typeof parsed.value === "number" ? parsed.value : fallback.value,
      aiGenerated: true,
    };
  } catch (err) {
    console.error("[ai] promo draft failed, using template:", err);
    return fallback;
  }
}
