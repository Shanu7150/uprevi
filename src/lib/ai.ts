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
